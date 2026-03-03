package com.stockarena.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Debate entity - Hibernate maps this Java class to the "debates" table.
 * Each Debate record stores a complete stock debate session.
 * 
 * JPA/Hibernate Annotations:
 * 
 * @Entity - Marks this class as a database table
 * @Table - Specifies the table name
 * @Id - Marks the primary key field
 * @GeneratedValue - Auto-generates the ID value
 * @Column - Maps field to a column (with constraints)
 * @Lob - Stores large text (TEXT type in DB)
 */
@Entity
@Table(name = "debates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Debate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String ticker;

    @Column(nullable = false, length = 10)
    private String exchange; // NSE or BSE

    @Column(nullable = false, length = 100)
    private String holdingPeriod; // short, medium, long

    @Column(nullable = false)
    private Double currentPrice;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String bullArgument;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String bearArgument;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String judgeVerdict;

    @Column(length = 20)
    private String verdictOutcome; // BUY, AVOID, NEUTRAL

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 50)
    private String status; // PENDING, IN_PROGRESS, COMPLETED, FAILED
}
