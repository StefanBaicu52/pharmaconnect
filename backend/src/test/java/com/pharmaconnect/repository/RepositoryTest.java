package com.pharmaconnect.repository;

import com.pharmaconnect.entity.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class RepositoryTest {

    @Autowired AppUserRepository userRepo;
    @Autowired RoleRepository roleRepo;
    @Autowired PermissionRepository permRepo;
    @Autowired DoctorRepository doctorRepo;
    @Autowired PrescriptionRepository prescriptionRepo;
    @Autowired ActionLogRepository logRepo;

    private Doctor savedDoctor;
    private Role savedRole;

    @BeforeEach
    void setup() {
        prescriptionRepo.deleteAll();
        doctorRepo.deleteAll();
        userRepo.deleteAll();
        roleRepo.deleteAll();
        permRepo.deleteAll();
        logRepo.deleteAll();

        savedDoctor = doctorRepo.save(buildDoctor("Dr. Ion Popescu", "Cardiologie", "+40712345678"));

        Permission p = permRepo.save(new Permission("PRESCRIPTION_READ"));
        savedRole = roleRepo.save(new Role("USER"));
        savedRole.setPermissions(Set.of(p));
        roleRepo.save(savedRole);
    }

    // ── Doctor ────────────────────────────────────────────────────────────────

    @Test void saveAndFindDoctor() {
        Doctor found = doctorRepo.findById(savedDoctor.getId()).orElseThrow();
        assertThat(found.getName()).isEqualTo("Dr. Ion Popescu");
        assertThat(found.getSpecialty()).isEqualTo("Cardiologie");
    }

    @Test void findDoctorByNameContaining() {
        doctorRepo.save(buildDoctor("Dr. Ana Ionescu", "Pediatrie", "+40712345679"));
        Page<Doctor> result = doctorRepo.findByNameContainingIgnoreCase("ion", PageRequest.of(0, 10));
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(2);
    }

    @Test void deleteDoctorCascadesPrescriptions() {
        Prescription p = prescriptionRepo.save(buildPrescription(savedDoctor));
        assertThat(prescriptionRepo.existsById(p.getId())).isTrue();
        doctorRepo.deleteById(savedDoctor.getId());
        assertThat(prescriptionRepo.existsById(p.getId())).isFalse();
    }

    // ── Prescription ──────────────────────────────────────────────────────────

    @Test void savePrescription() {
        Prescription p = prescriptionRepo.save(buildPrescription(savedDoctor));
        assertThat(p.getId()).isNotNull();
        assertThat(p.getMedicationName()).isEqualTo("Aspirin 100mg");
        assertThat(p.getDoctor().getId()).isEqualTo(savedDoctor.getId());
    }

    @Test void findByStatus() {
        prescriptionRepo.save(buildPrescription(savedDoctor));
        Prescription delivered = buildPrescription(savedDoctor);
        delivered.setStatus(PrescriptionStatus.DELIVERED);
        prescriptionRepo.save(delivered);

        Page<Prescription> pending = prescriptionRepo.findByStatus(PrescriptionStatus.PENDING, PageRequest.of(0, 10));
        assertThat(pending.getTotalElements()).isGreaterThanOrEqualTo(1);
        assertThat(pending.getContent()).allMatch(pr -> pr.getStatus() == PrescriptionStatus.PENDING);
    }

    @Test void findByDoctorId() {
        prescriptionRepo.save(buildPrescription(savedDoctor));
        prescriptionRepo.save(buildPrescription(savedDoctor));
        Page<Prescription> result = prescriptionRepo.findByDoctorId(savedDoctor.getId(), PageRequest.of(0, 10));
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test void countByStatus() {
        prescriptionRepo.save(buildPrescription(savedDoctor));
        long count = prescriptionRepo.countByStatus(PrescriptionStatus.PENDING);
        assertThat(count).isGreaterThanOrEqualTo(1);
    }

    @Test void countUrgent() {
        Prescription urgent = buildPrescription(savedDoctor);
        urgent.setDaysRemaining(2);
        prescriptionRepo.save(urgent);
        long count = prescriptionRepo.countUrgent();
        assertThat(count).isGreaterThanOrEqualTo(1);
    }

    @Test void avgDaysRemaining() {
        Prescription p1 = buildPrescription(savedDoctor); p1.setDaysRemaining(10);
        Prescription p2 = buildPrescription(savedDoctor); p2.setDaysRemaining(20);
        prescriptionRepo.save(p1);
        prescriptionRepo.save(p2);
        Double avg = prescriptionRepo.avgDaysRemaining();
        assertThat(avg).isNotNull();
        assertThat(avg).isBetween(10.0, 20.0);
    }

    // ── User + Role + Permission ──────────────────────────────────────────────

    @Test void saveUserWithRole() {
        AppUser user = new AppUser();
        user.setEmail("test@test.com");
        user.setUsername("testuser");
        user.setPasswordHash("hash");
        user.setRoles(Set.of(savedRole));
        AppUser saved = userRepo.save(user);

        AppUser found = userRepo.findByEmail("test@test.com").orElseThrow();
        assertThat(found.getRoles()).hasSize(1);
        assertThat(found.getRoles().iterator().next().getName()).isEqualTo("USER");
    }

    @Test void findByEmailNotFound() {
        assertThat(userRepo.findByEmail("nobody@test.com")).isEmpty();
    }

    @Test void suspiciousUsersQuery() {
        AppUser user = new AppUser();
        user.setEmail("bad@test.com");
        user.setUsername("baduser");
        user.setPasswordHash("hash");
        user.setSuspicious(true);
        user.setSuspiciousReason("Too many deletes");
        userRepo.save(user);

        assertThat(userRepo.findBySuspiciousTrue()).hasSize(1);
    }

    // ── ActionLog ─────────────────────────────────────────────────────────────

    @Test void saveAndQueryActionLog() {
        ActionLog log = new ActionLog(1L, "admin", "ADMIN", "DELETE_PRESCRIPTION", "id=5", "127.0.0.1");
        logRepo.save(log);

        assertThat(logRepo.findByUserId(1L)).hasSize(1);
        assertThat(logRepo.findByUserId(1L).get(0).getAction()).isEqualTo("DELETE_PRESCRIPTION");
    }

    @Test void findDeleteActions() {
        logRepo.save(new ActionLog(1L, "admin", "ADMIN", "DELETE_PRESCRIPTION", "id=1", "127.0.0.1"));
        logRepo.save(new ActionLog(1L, "admin", "ADMIN", "CREATE_PRESCRIPTION", "id=2", "127.0.0.1"));

        var deletes = logRepo.findDeleteActionsSince(java.time.Instant.now().minusSeconds(60));
        assertThat(deletes).hasSize(1);
        assertThat(deletes.get(0).getAction()).contains("DELETE");
    }

    @Test void paginatedLogs() {
        for (int i = 0; i < 5; i++) {
            logRepo.save(new ActionLog(1L, "admin", "ADMIN", "ACTION_" + i, "detail", "127.0.0.1"));
        }
        Page<ActionLog> page = logRepo.findAllByOrderByTimestampDesc(PageRequest.of(0, 3));
        assertThat(page.getContent()).hasSize(3);
        assertThat(page.getTotalElements()).isEqualTo(5);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Doctor buildDoctor(String name, String specialty, String phone) {
        Doctor d = new Doctor();
        d.setName(name);
        d.setSpecialty(specialty);
        d.setPhone(phone);
        return d;
    }

    private Prescription buildPrescription(Doctor doctor) {
        Prescription p = new Prescription();
        p.setMedicationName("Aspirin 100mg");
        p.setDate("01/01/2026");
        p.setStatus(PrescriptionStatus.PENDING);
        p.setDaysRemaining(10);
        p.setDoctor(doctor);
        return p;
    }
}
