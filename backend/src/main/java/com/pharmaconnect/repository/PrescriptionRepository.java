package com.pharmaconnect.repository;
import com.pharmaconnect.entity.Prescription;
import com.pharmaconnect.entity.PrescriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    Page<Prescription> findByStatus(PrescriptionStatus status, Pageable pageable);
    Page<Prescription> findByDoctorId(Long doctorId, Pageable pageable);
    Page<Prescription> findByMedicationNameContainingIgnoreCaseOrDoctor_NameContainingIgnoreCase(String name, String doctorName, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.status = 'PENDING' AND p.daysRemaining <= 3")
    long countUrgent();

    @Query("SELECT AVG(p.daysRemaining) FROM Prescription p WHERE p.daysRemaining IS NOT NULL")
    Double avgDaysRemaining();

    @Query("SELECT p.doctor.name, COUNT(p) FROM Prescription p GROUP BY p.doctor.name")
    List<Object[]> countByDoctor();

    long countByStatus(PrescriptionStatus status);
}
