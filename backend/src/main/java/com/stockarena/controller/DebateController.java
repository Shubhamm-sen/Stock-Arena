package com.stockarena.controller;

import com.stockarena.dto.DebateDTO;
import com.stockarena.service.DebateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DebateController - REST API endpoints for Stock Arena.
 * 
 * Spring Boot REST Controller uses:
 * 
 * @RestController - Returns JSON directly (no views/templates)
 * @RequestMapping - Base URL path for all endpoints
 * @PostMapping - Handles HTTP POST requests
 * @GetMapping - Handles HTTP GET requests
 * @RequestBody - Parses JSON request body into Java object
 * @PathVariable - Extracts URL path segments
 * @RequestParam - Extracts query parameters (?param=value)
 */
@RestController
@RequestMapping("/api/debates")
@RequiredArgsConstructor
@Slf4j
public class DebateController {

    private final DebateService debateService;

    /**
     * POST /api/debates/start
     * Starts a new stock debate session.
     * Returns a sessionId for the client to subscribe to via WebSocket.
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startDebate(@RequestBody DebateDTO.DebateRequest request) {
        log.info("Received debate request: {} on {}", request.getTicker(), request.getExchange());

        // Validate request
        if (request.getTicker() == null || request.getTicker().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ticker symbol is required"));
        }
        if (request.getExchange() == null)
            request.setExchange("NSE");
        if (request.getHoldingPeriod() == null)
            request.setHoldingPeriod("medium");
        if (request.getDebateRounds() <= 0)
            request.setDebateRounds(1);

        // Generate a unique session ID for WebSocket subscription
        String sessionId = UUID.randomUUID().toString();

        // Start debate asynchronously (returns immediately, results via WebSocket)
        debateService.startDebate(request, sessionId);

        return ResponseEntity.ok(Map.of(
                "sessionId", sessionId,
                "message", "Debate started! Connect to WebSocket topic: /topic/debate/" + sessionId,
                "ticker", request.getTicker().toUpperCase()));
    }

    /**
     * GET /api/debates/history
     * Returns all past debates from the database.
     */
    @GetMapping("/history")
    public ResponseEntity<List<DebateDTO.DebateSummary>> getHistory() {
        return ResponseEntity.ok(debateService.getAllDebates());
    }

    /**
     * GET /api/debates/ticker/{ticker}
     * Returns debates for a specific stock ticker.
     */
    @GetMapping("/ticker/{ticker}")
    public ResponseEntity<List<DebateDTO.DebateSummary>> getByTicker(@PathVariable String ticker) {
        return ResponseEntity.ok(debateService.getDebatesByTicker(ticker));
    }

    /**
     * GET /api/debates/market-indices
     * Returns major market indices for the overview panel.
     */
    @GetMapping("/market-indices")
    public ResponseEntity<List<DebateDTO.MarketIndex>> getMarketIndices() {
        return ResponseEntity.ok(debateService.getMarketIndices());
    }

    /**
     * GET /api/debates/health
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "StockArena Backend",
                "version", "1.0.0"));
    }
}
