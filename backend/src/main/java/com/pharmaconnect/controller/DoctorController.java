package com.pharmaconnect.controller;

import com.pharmaconnect.entity.Doctor;
import com.pharmaconnect.entity.Prescription;
import com.pharmaconnect.service.DoctorService;
import com.pharmaconnect.service.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Assignment 4 Silver: Doctor endpoints secured by role.
 * - Read: ADMIN and USER
 * - Create/Update/Delete: ADMIN only
 */
@RestController
@RequestMapping("/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService doctorService;
    private final PrescriptionService prescriptionService;

    public DoctorController(DoctorService doctorService, PrescriptionService prescriptionService) {
        this.doctorService = doctorService;
        this.prescriptionService = prescriptionService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Map<String, Object> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int pageSize,
            @RequestParam(required = false) String search) {
        page = Math.max(1, page);
        pageSize = Math.min(50, Math.max(1, pageSize));
        Page<Doctor> result = doctorService.getAll(page, pageSize, search);
        return Map.of(
                "data", result.getContent(),
                "page", result.getNumber() + 1,
                "pageSize", result.getSize(),
                "total", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Doctor getById(@PathVariable Long id) {
        return doctorService.getById(id);
    }

    @GetMapping("/{id}/prescriptions")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Map<String, Object> getPrescriptions(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        Doctor doctor = doctorService.getById(id);
        Page<Prescription> result = prescriptionService.getByDoctorId(id, page, pageSize);
        java.util.List<java.util.Map<String, Object>> dtos = result.getContent().stream().map(p -> {
            java.util.Map<String, Object> dto = new java.util.LinkedHashMap<>();
            dto.put("id", p.getId());
            dto.put("medicationName", p.getMedicationName());
            dto.put("doctor", doctor.getName());
            dto.put("doctorId", doctor.getId());
            dto.put("date", p.getDate());
            dto.put("status", p.getStatus());
            dto.put("daysRemaining", p.getDaysRemaining());
            dto.put("note", p.getNote());
            return dto;
        }).collect(java.util.stream.Collectors.toList());
        return Map.of(
                "data", dtos,
                "total", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Doctor> create(@Valid @RequestBody Doctor req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Doctor update(@PathVariable Long id, @Valid @RequestBody Doctor req) {
        return doctorService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        doctorService.delete(id);
    }
}
