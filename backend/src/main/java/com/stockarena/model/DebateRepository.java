package com.stockarena.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * DebateRepository - Spring Data JPA Repository
 * 
 * Spring Data JPA automatically generates SQL queries from method names.
 * No need to write boilerplate DAO code!
 * 
 * JpaRepository<Debate, Long> gives us built-in methods:
 *   - save()       → INSERT or UPDATE
 *   - findById()   → SELECT by ID
 *   - findAll()    → SELECT *
 *   - delete()     → DELETE
 * 
 * Custom queries are derived from method names (Spring Data magic):
 *   findByTicker() → SELECT * FROM debates WHERE ticker = ?
 */
@Repository
public interface DebateRepository extends JpaRepository<Debate, Long> {

    // Spring Data generates: SELECT * FROM debates WHERE ticker = ?
    List<Debate> findByTickerOrderByCreatedAtDesc(String ticker);

    // Spring Data generates: SELECT * FROM debates WHERE status = ?
    List<Debate> findByStatusOrderByCreatedAtDesc(String status);

    // Custom JPQL query (Java Persistence Query Language - like SQL but uses entity names)
    @Query("SELECT d FROM Debate d ORDER BY d.createdAt DESC")
    List<Debate> findRecentDebates(org.springframework.data.domain.Pageable pageable);

    // Count by verdict
    long countByVerdictOutcome(String verdictOutcome);
}
