package com.stockarena.service;

import com.stockarena.dto.DebateDTO;
import com.stockarena.model.Debate;
import com.stockarena.model.DebateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DebateService - The main orchestrator of the debate workflow.
 * 
 * This is the heart of the application. It:
 * 1. Creates a Debate record in the database
 * 2. Fetches live stock data
 * 3. Runs Bull → Bear → Judge agents sequentially
 * 4. Streams results over WebSocket
 * 5. Saves the final debate to the database
 * 
 * Uses @Async so the debate runs in a background thread,
 * allowing the HTTP response to return immediately.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DebateService {

    private final StockDataService stockDataService;
    private final OpenAIService openAIService;
    private final DebateRepository debateRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Starts a debate asynchronously.
     * Returns a sessionId immediately; results stream via WebSocket.
     * 
     * @Async - runs in a separate thread from Spring's task executor pool
     */
    @Async
    public void startDebate(DebateDTO.DebateRequest request, String sessionId) {
        log.info("Starting debate for ticker: {} ({}), session: {}", request.getTicker(), request.getExchange(),
                sessionId);

        // Step 1: Create debate record in database (status = PENDING)
        Debate debate = new Debate();
        debate.setTicker(request.getTicker().toUpperCase());
        debate.setExchange(request.getExchange().toUpperCase());
        debate.setHoldingPeriod(request.getHoldingPeriod());
        debate.setCurrentPrice(0.0);
        debate.setStatus("IN_PROGRESS");
        debate = debateRepository.save(debate); // Hibernate saves to DB
        long debateId = debate.getId();

        try {
            // Step 2: Fetch live stock data from Yahoo Finance
            sendMessage(sessionId, "FETCHING_DATA", "Fetching live stock data...", null, debateId);
            DebateDTO.StockData stockData = stockDataService.fetchStockData(request.getTicker(), request.getExchange());

            // Update debate with current price
            debate.setCurrentPrice(stockData.getCurrentPrice());
            debate = debateRepository.save(debate);

            // Send stock data to frontend
            sendMessage(sessionId, "STOCK_DATA", "Stock data loaded", stockData, debateId);

            // Step 3: Run Bull Agent 🐂
            log.info("Running Bull Agent for session {}", sessionId);
            String bullArgument = openAIService.runBullAgent(stockData, request.getHoldingPeriod(), sessionId,
                    debateId);

            // Step 4: Run Bear Agent 🐻
            log.info("Running Bear Agent for session {}", sessionId);
            String bearArgument = openAIService.runBearAgent(stockData, bullArgument, request.getHoldingPeriod(),
                    sessionId, debateId);

            // Step 5: Optional additional debate rounds
            if (request.getDebateRounds() > 1) {
                for (int round = 2; round <= Math.min(request.getDebateRounds(), 3); round++) {
                    sendMessage(sessionId, "ROUND_START", "Round " + round + " begins...", null, debateId);
                    bullArgument = openAIService.runBullAgent(stockData, request.getHoldingPeriod(), sessionId,
                            debateId);
                    bearArgument = openAIService.runBearAgent(stockData, bullArgument, request.getHoldingPeriod(),
                            sessionId, debateId);
                }
            }

            // Step 6: Run Judge Agent ⚖️
            log.info("Running Judge Agent for session {}", sessionId);
            String judgeVerdict = openAIService.runJudgeAgent(stockData, bullArgument, bearArgument,
                    request.getHoldingPeriod(), sessionId, debateId);

            // Step 7: Determine final outcome from Judge's verdict
            String outcome = extractOutcome(judgeVerdict);

            // Step 8: Save completed debate to database via Hibernate
            debate.setBullArgument(bullArgument);
            debate.setBearArgument(bearArgument);
            debate.setJudgeVerdict(judgeVerdict);
            debate.setVerdictOutcome(outcome);
            debate.setStatus("COMPLETED");
            debateRepository.save(debate); // UPDATE in database

            // Step 9: Notify frontend debate is complete
            DebateDTO.DebateResult result = DebateDTO.DebateResult.builder()
                    .debateId(debateId)
                    .stockData(stockData)
                    .finalOutcome(outcome)
                    .build();

            sendMessage(sessionId, "DEBATE_COMPLETE", "Debate completed!", result, debateId);
            log.info("Debate {} completed with outcome: {}", debateId, outcome);

        } catch (Exception e) {
            log.error("Debate failed for session {}: {}", sessionId, e.getMessage(), e);
            debate.setStatus("FAILED");
            debateRepository.save(debate);
            sendMessage(sessionId, "ERROR", "Debate failed: " + e.getMessage(), null, debateId);
        }
    }

    private void sendMessage(String sessionId, String type, String content, Object data, long debateId) {
        DebateDTO.StreamMessage message = DebateDTO.StreamMessage.builder()
                .type(type)
                .content(content)
                .data(data)
                .sessionId(sessionId)
                .debateId(debateId)
                .build();
        messagingTemplate.convertAndSend("/topic/debate/" + sessionId, message);
    }

    private String extractOutcome(String verdict) {
        if (verdict == null)
            return "NEUTRAL";
        verdict = verdict.toUpperCase();
        if (verdict.contains("BUY") || verdict.contains("[BUY]"))
            return "BUY";
        if (verdict.contains("AVOID") || verdict.contains("[AVOID]"))
            return "AVOID";
        return "NEUTRAL";
    }

    /** Get all debates from the database (using Hibernate/JPA) */
    public List<DebateDTO.DebateSummary> getAllDebates() {
        return debateRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    /** Get debates for a specific ticker */
    public List<DebateDTO.DebateSummary> getDebatesByTicker(String ticker) {
        return debateRepository.findByTickerOrderByCreatedAtDesc(ticker.toUpperCase())
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    public List<DebateDTO.MarketIndex> getMarketIndices() {
        return stockDataService.fetchMarketIndices();
    }

    private DebateDTO.DebateSummary toSummary(Debate d) {
        return DebateDTO.DebateSummary.builder()
                .id(d.getId())
                .ticker(d.getTicker())
                .exchange(d.getExchange())
                .currentPrice(d.getCurrentPrice())
                .verdictOutcome(d.getVerdictOutcome())
                .createdAt(d.getCreatedAt() != null ? d.getCreatedAt().toString() : "")
                .build();
    }
}
