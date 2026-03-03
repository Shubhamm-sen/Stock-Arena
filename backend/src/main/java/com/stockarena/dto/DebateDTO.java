package com.stockarena.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO (Data Transfer Objects) - Plain Java objects used to transfer data
 * between the frontend and backend. They are NOT Hibernate entities.
 * They don't map to database tables - they just carry data.
 */
public class DebateDTO {

    /** Request from frontend to start a debate */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebateRequest {
        private String ticker; // e.g. "TATASTEEL"
        private String exchange; // "NSE" or "BSE"
        private String holdingPeriod; // "short", "medium", "long"
        private int debateRounds; // 1, 2, or 3
    }

    /** Stock data fetched from Yahoo Finance */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockData {
        private String ticker;
        private String companyName;
        private double currentPrice;
        private double changePercent;
        private double peRatio;
        private double debtToEquity;
        private double returnOnEquity;
        private double revenueGrowth;
        private double profitMargin;
        private double marketCap;
        private double fiftyTwoWeekHigh;
        private double fiftyTwoWeekLow;
        private double dividendYield;
        private double eps;
        private double pbRatio;
        private double bookValue;
        private double beta;
        private String sector;
        private String industry;
        private double targetPrice;
        private Map<String, Integer> analystRecommendations;
        private Map<String, Double> shareholdingPattern;
        private List<PricePoint> priceHistory;
        private List<String> recentNews;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricePoint {
        private String date;
        private double price;
        private long volume;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarketIndex {
        private String name;
        private double value;
        private double changePercent;
    }

    /** One argument point from Bull or Bear */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArgumentPoint {
        private String point;
        private double confidence; // 0.0 to 1.0
        private String category; // "valuation", "growth", "risk", "macro"
    }

    /** Full agent response */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentResponse {
        private String agentType; // "BULL", "BEAR", "JUDGE"
        private String summary;
        private List<ArgumentPoint> arguments;
        private String rawText;
        private double overallConfidence;
    }

    /** WebSocket streaming message */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StreamMessage {
        private String type; // "STOCK_DATA", "BULL_START", "BULL_CHUNK", "BULL_DONE",
                             // "BEAR_START", "BEAR_CHUNK", "BEAR_DONE",
                             // "JUDGE_START", "JUDGE_CHUNK", "JUDGE_DONE",
                             // "DEBATE_COMPLETE", "ERROR"
        private String content; // Text chunk being streamed
        private Object data; // Full structured data (for non-chunk messages)
        private String sessionId; // Debate session ID
        private long debateId; // Database ID
    }

    /** Final debate result returned from API */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebateResult {
        private long debateId;
        private StockData stockData;
        private AgentResponse bullCase;
        private AgentResponse bearCase;
        private AgentResponse judgeVerdict;
        private String finalOutcome; // "BUY", "AVOID", "NEUTRAL"
        private List<Map<String, Object>> debateHistory;
    }

    /** Summary item for history list */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebateSummary {
        private long id;
        private String ticker;
        private String exchange;
        private double currentPrice;
        private String verdictOutcome;
        private String createdAt;
    }
}
