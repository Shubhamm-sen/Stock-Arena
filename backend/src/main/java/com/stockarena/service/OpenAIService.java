package com.stockarena.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockarena.dto.DebateDTO;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OpenAIService - Refactored to delegate multi-agent debate to the LangGraph
 * Python service.
 */
@Service
@Slf4j
public class OpenAIService {

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final OkHttpClient httpClient;

    // Cache to store LangGraph results per session
    private final Map<String, DebateResponse> debateCache = new ConcurrentHashMap<>();

    public OpenAIService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = new ObjectMapper();
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(180, java.util.concurrent.TimeUnit.SECONDS)
                .build();
    }

    // Helper DTO for AI Service communication
    private static class DebateResponse {
        public String bull;
        public String bear;
        public String verdict;
    }

    /**
     * Triggers the entire LangGraph debate and returns the BULL part.
     */
    public String runBullAgent(DebateDTO.StockData stockData, String holdingPeriod, String sessionId, long debateId) {
        log.info("Triggering LangGraph multi-agent debate for ticker: {} (Session: {})", stockData.getTicker(),
                sessionId);

        try {
            // 1. Prepare request for the LangGraph microservice
            Map<String, String> requestBody = Map.of(
                    "ticker", stockData.getTicker(),
                    "metadata", buildStockPrompt(stockData, holdingPeriod, "ORCHESTRATOR"));

            String jsonRequest = objectMapper.writeValueAsString(requestBody);

            Request request = new Request.Builder()
                    .url(aiServiceUrl + "/debate")
                    .post(RequestBody.create(jsonRequest, MediaType.parse("application/json")))
                    .build();

            // 2. Execute the debate call
            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.error("AI Service returned error: {}", response.code());
                    throw new RuntimeException("AI Service failed with status " + response.code());
                }

                String responseBody = response.body() != null ? response.body().string() : "";
                DebateResponse aiResult = objectMapper.readValue(responseBody, DebateResponse.class);

                // 3. Cache the full debate for subsequent agent calls in the same session
                debateCache.put(sessionId, aiResult);

                // 4. Stream the BULL part to the frontend as if it's being generated live
                return streamStaticResponse(aiResult.bull, "BULL", sessionId, debateId);
            }
        } catch (Exception e) {
            log.error("Failed to execute LangGraph debate: {}", e.getMessage());
            String fallback = generateFallbackResponse("BULL");
            sendWebSocketMessage(sessionId, "BULL_DONE", fallback, null, debateId);
            return fallback;
        }
    }

    /**
     * Returns the cached BEAR part of the debate.
     */
    public String runBearAgent(DebateDTO.StockData stockData, String bullArgument, String holdingPeriod,
            String sessionId, long debateId) {
        DebateResponse cached = debateCache.get(sessionId);
        if (cached != null && cached.bear != null) {
            return streamStaticResponse(cached.bear, "BEAR", sessionId, debateId);
        }
        log.warn("No cached BEAR analysis found for session {}", sessionId);
        return generateFallbackResponse("BEAR");
    }

    /**
     * Returns the cached JUDGE part of the debate and clears the cache.
     */
    public String runJudgeAgent(DebateDTO.StockData stockData, String bullArgument, String bearArgument,
            String holdingPeriod, String sessionId, long debateId) {
        DebateResponse cached = debateCache.remove(sessionId); // Clean up cache
        if (cached != null && cached.verdict != null) {
            return streamStaticResponse(cached.verdict, "JUDGE", sessionId, debateId);
        }
        log.warn("No cached JUDGE analysis found for session {}", sessionId);
        return generateFallbackResponse("JUDGE");
    }

    /**
     * Simulates live streaming for the UI to match the expected WebSocket flow.
     */
    private String streamStaticResponse(String text, String agentType, String sessionId, long debateId) {
        sendWebSocketMessage(sessionId, agentType + "_START", "", null, debateId);

        // Split into words/chunks to simulate "typing" speed
        String[] chunks = text.split("(?<=\\s)");
        StringBuilder cumulative = new StringBuilder();

        for (String chunk : chunks) {
            cumulative.append(chunk);
            sendWebSocketMessage(sessionId, agentType + "_CHUNK", chunk, null, debateId);
            try {
                // Subtle delay to make it feel "agentic" and live
                Thread.sleep(15);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        sendWebSocketMessage(sessionId, agentType + "_DONE", cumulative.toString(), null, debateId);
        return cumulative.toString();
    }

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

    private String buildStockPrompt(DebateDTO.StockData stock, String holdingPeriod, String analystType) {
        return String.format("""
                Ticker: %s
                Price: ₹%.2f
                P/E: %.2f | P/B: %.2f
                Revenue Growth: %.2f%% | Profit Margin: %.2f%%
                ROE: %.2f%% | Debt/Equity: %.2f
                Sector: %s
                Holding Period: %s
                News: %s
                """,
                stock.getTicker(), stock.getCurrentPrice(),
                stock.getPeRatio(), stock.getPbRatio(),
                stock.getRevenueGrowth(), stock.getProfitMargin(),
                stock.getReturnOnEquity(), stock.getDebtToEquity(),
                stock.getSector(), holdingPeriod,
                String.join("; ", stock.getRecentNews()));
    }

    private String generateFallbackResponse(String agentType) {
        return "The analysis for " + agentType
                + " is currently unavailable. Please check the system logs or your API quota.";
    }
}
