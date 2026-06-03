package com.pharmaconnect.repository;
import com.pharmaconnect.entity.ActionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;

@Repository
public interface ActionLogRepository extends JpaRepository<ActionLog, Long> {
    List<ActionLog> findByUserId(Long userId);
    List<ActionLog> findByTimestampAfter(Instant since);

    @Query("SELECT a.userId, COUNT(a) FROM ActionLog a WHERE a.timestamp > :since GROUP BY a.userId")
    List<Object[]> countActionsByUserSince(@Param("since") Instant since);

    @Query("SELECT a FROM ActionLog a WHERE a.action LIKE '%DELETE%' AND a.timestamp > :since")
    List<ActionLog> findDeleteActionsSince(@Param("since") Instant since);

    Page<ActionLog> findAllByOrderByTimestampDesc(Pageable pageable);
}
