package com.stockarena;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class StockArenaApplication {
    public static void main(String[] args) {
        SpringApplication.run(StockArenaApplication.class, args);
    }
}
