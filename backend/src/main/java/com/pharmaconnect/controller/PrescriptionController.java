package com.pharmaconnect.controller;

import com.pharmaconnect.entity.Doctor;
import com.pharmaconnect.entity.Prescription;
import com.pharmaconnect.entity.PrescriptionStatus;
import com.pharmaconnect.exception.ResourceNotFoundException;
import com.pharmaconnect.repository.AppUserRepository;
import com.pharmaconnect.repository.DoctorRepository;
import com.pharmaconnect.repository.PrescriptionRepository;
import com.pharmaconnect.service.LoggingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Assignment 4 Silver: @PreAuthorize annotations enforce role permissions.
 * - READ: both ADMIN and USER
 * - WRITE (create/update): both ADMIN and USER
 * - DELETE: ADMIN only
 */
@RestController
@RequestMapping("/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionController {

    private final PrescriptionRepository prescriptionRepo;
    private final DoctorRepository doctorRepo;
    private final LoggingService loggingService;
    private final AppUserRepository userRepo;

    public PrescriptionController(PrescriptionRepository prescriptionRepo,
                                  DoctorRepository doctorRepo,
                                  LoggingService loggingService,
                                  AppUserRepository userRepo) {
        this.prescriptionRepo = prescriptionRepo;
        this.doctorRepo = doctorRepo;
        this.loggingService = loggingService;
        this.userRepo = userRepo;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Map<String, Object> getAll(
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "5")  int pageSize,
            @RequestParam(required = false)    String status,
            @RequestParam(required = false)    String search) {

        page = Math.max(1, page);
        pageSize = Math.min(50, Math.max(1, pageSize));
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("id").descending());

        Page<Prescription> result;
        if (status != null && !status.isBlank()) {
            result = prescriptionRepo.findByStatus(PrescriptionStatus.valueOf(status), pageable);
        } else if (search != null && !search.isBlank()) {
            result = prescriptionRepo.findByMedicationNameContainingIgnoreCaseOrDoctor_NameContainingIgnoreCase(search, search, pageable);
        } else {
            result = prescriptionRepo.findAll(pageable);
        }

        return Map.of(
                "data",       result.getContent().stream().map(this::toDto).toList(),
                "page",       result.getNumber() + 1,
                "pageSize",   result.getSize(),
                "total",      result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Map<String, Object> getStats() {
        long total     = prescriptionRepo.count();
        long delivered = prescriptionRepo.countByStatus(PrescriptionStatus.DELIVERED);
        long pending   = prescriptionRepo.countByStatus(PrescriptionStatus.PENDING);
        long urgent    = prescriptionRepo.countUrgent();
        Double avg     = prescriptionRepo.avgDaysRemaining();

        Map<String, Long> byDoctor = new LinkedHashMap<>();
        prescriptionRepo.countByDoctor().forEach(row -> byDoctor.put((String) row[0], (Long) row[1]));

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("delivered", delivered);
        stats.put("pending", pending);
        stats.put("urgentCount", urgent);
        stats.put("avgDaysRemaining", avg != null ? Math.round(avg) : null);
        stats.put("byDoctor", byDoctor);
        return stats;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Map<String, Object> getById(@PathVariable Long id) {
        Prescription p = prescriptionRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription " + id + " not found."));
        return toDto(p);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<Map<String, Object>> create(
            @RequestBody PrescriptionRequest req,
            Authentication auth, HttpServletRequest request) {

        Doctor doctor = resolveDoctor(req.doctorId(), req.doctor());
        Prescription p = new Prescription();
        p.setMedicationName(req.medicationName());
        p.setDate(req.date());
        p.setStatus(req.status() != null ? req.status() : PrescriptionStatus.PENDING);
        p.setDaysRemaining(req.daysRemaining());
        p.setNote(req.note());
        p.setDoctor(doctor);
        Prescription saved = prescriptionRepo.save(p);

        logAction(auth, "CREATE_PRESCRIPTION", "id=" + saved.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Map<String, Object> update(
            @PathVariable Long id,
            @RequestBody PrescriptionRequest req,
            Authentication auth, HttpServletRequest request) {

        Prescription existing = prescriptionRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription " + id + " not found."));

        Doctor doctor = resolveDoctor(req.doctorId(), req.doctor());
        existing.setMedicationName(req.medicationName());
        existing.setDate(req.date());
        existing.setStatus(req.status() != null ? req.status() : existing.getStatus());
        existing.setDaysRemaining(req.daysRemaining());
        existing.setNote(req.note());
        existing.setDoctor(doctor);
        Prescription saved = prescriptionRepo.save(existing);

        logAction(auth, "UPDATE_PRESCRIPTION", "id=" + id, request);
        return toDto(saved);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Map<String, Object> patch(
            @PathVariable Long id,
            @RequestBody PrescriptionRequest req,
            Authentication auth, HttpServletRequest request) {

        Prescription existing = prescriptionRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription " + id + " not found."));

        if (req.medicationName() != null) existing.setMedicationName(req.medicationName());
        if (req.date() != null) existing.setDate(req.date());
        if (req.status() != null) existing.setStatus(req.status());
        if (req.daysRemaining() != null) existing.setDaysRemaining(req.daysRemaining());
        if (req.note() != null) existing.setNote(req.note());
        if (req.doctor() != null || req.doctorId() != null) {
            existing.setDoctor(resolveDoctor(req.doctorId(), req.doctor()));
        }
        Prescription saved = prescriptionRepo.save(existing);
        logAction(auth, "PATCH_PRESCRIPTION", "id=" + id, request);
        return toDto(saved);
    }

    /** Silver: DELETE only allowed for ADMIN */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth, HttpServletRequest request) {
        if (!prescriptionRepo.existsById(id))
            throw new ResourceNotFoundException("Prescription " + id + " not found.");
        prescriptionRepo.deleteById(id);
        logAction(auth, "DELETE_PRESCRIPTION", "id=" + id, request);
    }

    /** Silver: Bulk DELETE only allowed for ADMIN */
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Integer> deleteBulk(@RequestBody Map<String, List<Long>> body,
                                           Authentication auth, HttpServletRequest request) {
        List<Long> ids = body.get("ids");
        if (ids == null) throw new IllegalArgumentException("Body must contain { \"ids\": [...] }");
        int count = 0;
        for (Long id : ids) {
            if (prescriptionRepo.existsById(id)) {
                prescriptionRepo.deleteById(id);
                count++;
            }
        }
        logAction(auth, "DELETE_PRESCRIPTION_BULK", "count=" + count + " ids=" + ids, request);
        return Map.of("deleted", count);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Doctor resolveDoctor(Long doctorId, String doctorName) {
        if (doctorId != null) {
            return doctorRepo.findById(doctorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor " + doctorId + " not found."));
        }
        if (doctorName != null && !doctorName.isBlank()) {
            return doctorRepo.findByNameContainingIgnoreCase(doctorName, PageRequest.of(0, 1))
                    .stream().findFirst()
                    .orElseGet(() -> {
                        Doctor d = new Doctor();
                        d.setName(doctorName.trim());
                        d.setSpecialty("General");
                        d.setPhone("+40700000000");
                        return doctorRepo.save(d);
                    });
        }
        throw new IllegalArgumentException("Either doctorId or doctor name must be provided.");
    }

    private Map<String, Object> toDto(Prescription p) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", p.getId());
        dto.put("medicationName", p.getMedicationName());
        dto.put("doctor", p.getDoctor() != null ? p.getDoctor().getName() : "");
        dto.put("doctorId", p.getDoctor() != null ? p.getDoctor().getId() : null);
        dto.put("date", p.getDate());
        dto.put("status", p.getStatus());
        dto.put("daysRemaining", p.getDaysRemaining());
        dto.put("note", p.getNote());
        return dto;
    }

    private void logAction(Authentication auth, String action, String details, HttpServletRequest req) {
        if (auth == null) return;
        String username = auth.getName();
        String role = auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "")).orElse("USER");
        Long userId = userRepo.findByUsername(username)
                .map(u -> u.getId())
                .orElse(0L);
        loggingService.log(userId, username, role, action, details, req.getRemoteAddr());
    }

    record PrescriptionRequest(
            String medicationName, String date, PrescriptionStatus status,
            Integer daysRemaining, String note, Long doctorId, String doctor
    ) {}
}
