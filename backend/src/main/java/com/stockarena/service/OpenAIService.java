package com.stockarena.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockarena.dto.DebateDTO;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;

/**
 * OpenAIService - Communicates with OpenAI GPT-4o API.
 * 
 * Uses streaming Server-Sent Events (SSE) to get token-by-token responses.
 * Each token is forwarded over WebSocket to the frontend in real-time.
 * 
 * The Three Agents:
 * 🐂 BULL Agent - Optimistic analyst, finds reasons to BUY
 * 🐻 BEAR Agent - Pessimistic analyst, finds reasons to AVOID
 * ⚖️ JUDGE Agent - Balanced arbiter, gives final verdict
 */
@Service
@Slf4j
public class OpenAIService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    // OkHttp client for streaming HTTP
    private final OkHttpClient httpClient;

    public OpenAIService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = new ObjectMapper();
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(120, java.util.concurrent.TimeUnit.SECONDS)
                .build();
    }

    /**
     * Runs the Bull Agent - argues WHY to buy the stock.
     * Streams response token by token over WebSocket.
     */
    public String runBullAgent(DebateDTO.StockData stockData, String holdingPeriod, String sessionId, long debateId) {
        String systemPrompt = """
                You are a sophisticated Institutional Investment Analyst (BULL). Your goal is to construct a rigorous,
                data-driven case for acquiring this stock. Use the provided metrics to identify hidden strengths.

                AGENTIC ANALYTICAL FRAMEWORK:
                - **Relative Valuation**: Compare the P/E and P/B ratios to typical sector averages.
                - **Efficiency & Growth**: Link ROE and Revenue Growth to management's capital allocation ability.
                - **Risk Masking**: Explain why the Debt-to-Equity is either healthy or manageable given the Profit Margins.
                - **Technical Sentiment**: Use the 52-week High/Low range to identify accumulation zones.

                Format:
                1. ## BULLISH THESIS: A high-level qualitative summary.
                2. ## KEY CATALYSTS: 3 deep-dive arguments. Each must cite at least two specific metrics (e.g., "The 25% ROE combined with low Beta...").
                3. ## VALUATION UPSIDE: Target price justification based on metrics.
                4. ## ALPHA SUMMARY: Final persuasive closing.

                Tone: Assertive, data-heavy, professional. Use Markdown for formatting.
                """;

        String userPrompt = buildStockPrompt(stockData, holdingPeriod, "BULL");

        return streamAgentResponse(systemPrompt, userPrompt, "BULL", sessionId, debateId);
    }

    /**
     * Runs the Bear Agent - argues WHY to avoid the stock.
     */
    public String runBearAgent(DebateDTO.StockData stockData, String bullArgument, String holdingPeriod,
            String sessionId, long debateId) {
        String systemPrompt = """
                You are a skeptical Hedge Fund Shortseller (BEAR). Your goal is to dissect the provided data
                to find vulnerabilities, overvaluation, and operational risks. Scrutinize the Bull's narrative.

                AGENTIC ANALYTICAL FRAMEWORK:
                - **Overvaluation Trap**: Is the P/E ratio too high for the current Revenue Growth?
                - **Debt Vulnerability**: Is the Debt-to-Equity ratio a "ticking time bomb" in the current sector?
                - **Margin Erosion**: Scrutinize the Profit Margin vs. Sector peers.
                - **Technical Fragility**: Is the current price too close to the 52-week high, suggesting limited upside and high rejection risk?

                Format:
                1. ## BEARISH COUNTER-THESIS: Direct rebuttal to optimism.
                2. ## RISK VULNERABILITIES: 3 rigorous critiques. Each MUST cite specific metrics to prove a "weak link".
                3. ## VALUATION DANGER: Explain why the current price is a "Value Trap".
                4. ## CAUTIONARY CONCLUSION: Final warning.

                Tone: Skeptical, critical, evidence-based. Use Markdown for formatting.
                """;

        String userPrompt = buildStockPrompt(stockData, holdingPeriod, "BEAR") +
                "\n\nBull's argument to counter:\n" + bullArgument;

        return streamAgentResponse(systemPrompt, userPrompt, "BEAR", sessionId, debateId);
    }

    /**
     * Runs the Judge Agent - gives the balanced final verdict.
     */
    public String runJudgeAgent(DebateDTO.StockData stockData, String bullArgument, String bearArgument,
            String holdingPeriod, String sessionId, long debateId) {
        String systemPrompt = """
                You are a master market arbiter. You've heard from two top-tier analysts.
                Your role is to weigh the quantitative metrics against the qualitative sentiment.

                AGENTIC GUIDELINES:
                - Look for the "Truth" between the Bull and Bear cases.
                - Reference specific metrics like ROE, Target Price, and P/B to anchor your verdict.
                - Provide a clear, actionable synthesis.

                Format:
                1. Synthesis of Debate
                2. Final Verdict: Start with exactly one of [BUY], [AVOID], or [NEUTRAL]
                3. Critical Factors for the Decision
                4. Ideal Entry/Exit Strategy based on 52w High/Low
                """;

        String userPrompt = buildStockPrompt(stockData, holdingPeriod, "JUDGE") +
                "\n\nBull's Case:\n" + bullArgument +
                "\n\nBear's Case:\n" + bearArgument;

        return streamAgentResponse(systemPrompt, userPrompt, "JUDGE", sessionId, debateId);
    }

    /**
     * Streams AI response token-by-token and broadcasts each chunk over WebSocket.
     */
    private String streamAgentResponse(String systemPrompt, String userPrompt, String agentType, String sessionId,
            long debateId) {
        StringBuilder fullResponse = new StringBuilder();

        try {
            // Build OpenAI API request body
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "stream", true,
                    "max_tokens", 1000,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)));

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            // Build HTTP request
            Request request = new Request.Builder()
                    .url("https://api.openai.com/v1/chat/completions")
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
                    .build();

            // Notify frontend: agent is starting
            sendWebSocketMessage(sessionId, agentType + "_START", "", null, debateId);

            // Execute streaming request
            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                    log.error("OpenAI API error: {} - {}", response.code(), errorBody);
                    throw new RuntimeException("OpenAI API error: " + response.code());
                }

                BufferedReader reader = new BufferedReader(new InputStreamReader(response.body().byteStream()));
                String line;

                // Read SSE stream line by line
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("data: ")) {
                        String data = line.substring(6).trim();

                        if (data.equals("[DONE]")) {
                            break; // Stream finished
                        }

                        try {
                            JsonNode chunk = objectMapper.readTree(data);
                            String deltaContent = chunk
                                    .path("choices").get(0)
                                    .path("delta")
                                    .path("content")
                                    .asText("");

                            if (!deltaContent.isEmpty()) {
                                fullResponse.append(deltaContent);
                                // Stream each token to WebSocket
                                sendWebSocketMessage(sessionId, agentType + "_CHUNK", deltaContent, null, debateId);
                            }
                        } catch (Exception parseEx) {
                            // Skip malformed chunks
                        }
                    }
                }
            }

            // Notify frontend: agent is done
            sendWebSocketMessage(sessionId, agentType + "_DONE", fullResponse.toString(), null, debateId);
            log.info("{} agent completed for session {}", agentType, sessionId);

        } catch (Exception e) {
            log.error("Error running {} agent: {}", agentType, e.getMessage());
            // Send a fallback response so the debate can continue
            String fallback = generateFallbackResponse(agentType);
            sendWebSocketMessage(sessionId, agentType + "_DONE", fallback, null, debateId);
            return fallback;
        }

        return fullResponse.toString();
    }

    /** Sends a message to all WebSocket subscribers of a session's topic */
    private void sendWebSocketMessage(String sessionId, String type, String content, Object data, long debateId) {
        DebateDTO.StreamMessage message = DebateDTO.StreamMessage.builder()
                .type(type)
                .content(content)
                .data(data)
                .sessionId(sessionId)
                .debateId(debateId)
                .build();

        messagingTemplate.convertAndSend("/topic/debate/" + sessionId, message);
    }

    /** Builds a context-rich prompt including all stock metrics */
    private String buildStockPrompt(DebateDTO.StockData stock, String holdingPeriod, String agentType) {
        return String.format("""
                Stock: %s (%s)
                Current Price: ₹%.2f
                P/E Ratio: %.2f
                Debt-to-Equity: %.2f
                Return on Equity: %.2f%%
                Revenue Growth: %.2f%%
                Profit Margin: %.2f%%
                Market Cap: ₹%.0f Cr
                52-Week High: ₹%.2f
                52-Week Low: ₹%.2f
                Dividend Yield: %.2f%%
                Sector: %s
                Industry: %s
                Holding Period: %s

                Recent News:
                %s

                As the %s analyst, analyze this stock for a %s holding period.
                """,
                stock.getCompanyName(), stock.getTicker(),
                stock.getCurrentPrice(),
                stock.getPeRatio(),
                stock.getDebtToEquity(),
                stock.getReturnOnEquity(),
                stock.getRevenueGrowth(),
                stock.getProfitMargin(),
                stock.getMarketCap() / 10_000_000,
                stock.getFiftyTwoWeekHigh(),
                stock.getFiftyTwoWeekLow(),
                stock.getDividendYield(),
                stock.getSector(),
                stock.getIndustry(),
                holdingPeriod,
                String.join("\n- ", stock.getRecentNews()),
                agentType,
                holdingPeriod);
    }

    private String generateFallbackResponse(String agentType) {
        return switch (agentType) {
            case "BULL" ->
                """
                        BULL CASE:

                        This stock shows promising fundamentals with potential for significant upside.

                        1. Sector Momentum [CONFIDENCE: 72%] - The sector shows strong tailwinds driven by government spending and infrastructure push.

                        2. Valuation Opportunity [CONFIDENCE: 68%] - Trading at reasonable valuations relative to sector peers with room for re-rating.

                        3. Management Quality [CONFIDENCE: 75%] - Strong management track record of capital allocation and operational efficiency.

                        Bull Verdict: Accumulate on dips for medium to long-term gains.
                        """;
            case "BEAR" ->
                """
                        BEAR CASE:

                        Significant risks cloud the outlook for this stock.

                        1. Valuation Concern [CONFIDENCE: 70%] - Trading at premium multiples that may not be justified by near-term earnings growth.

                        2. Debt Levels [CONFIDENCE: 65%] - Elevated debt-to-equity ratio poses risk in a rising interest rate environment.

                        3. Global Headwinds [CONFIDENCE: 78%] - International competition and commodity price volatility create earnings uncertainty.

                        Bear Verdict: Avoid or reduce exposure until clarity emerges.
                        """;
            default ->
                """
                        JUDGE'S VERDICT:

                        After weighing both arguments carefully:

                        The bull makes valid points about long-term growth potential. However, the bear's concerns about near-term headwinds are equally valid.

                        Key Deciding Factors:
                        - Risk tolerance of the investor
                        - Holding period alignment
                        - Portfolio diversification needs

                        [NEUTRAL] Final Verdict:
                        This is a stock for selective investors with high conviction and long-term horizon. Invest only what you can afford to hold through volatility.
                        """;
        };
    }
}
