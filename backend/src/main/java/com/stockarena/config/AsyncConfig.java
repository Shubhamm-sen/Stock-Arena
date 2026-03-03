package com.stockarena.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {
    // Basic async configuration.
    // Thread pool properties are managed via application.properties
    // (spring.task.execution.*)
}
