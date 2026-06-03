package com.pharmaconnect.service;

import com.pharmaconnect.entity.*;
import com.pharmaconnect.exception.ResourceNotFoundException;
import com.pharmaconnect.repository.DoctorRepository;
import com.pharmaconnect.repository.PrescriptionRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepo;
    private final DoctorRepository doctorRepo;

    public PrescriptionService(PrescriptionRepository prescriptionRepo, DoctorRepository doctorRepo) {
        this.prescriptionRepo = prescriptionRepo;
        this.doctorRepo = doctorRepo;
    }

    public Page<Prescription> getAll(int page, int size, String status, String search) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());

        if (status != null && !status.isBlank()) {
            return prescriptionRepo.findByStatus(PrescriptionStatus.valueOf(status), pageable);
        }
        if (search != null && !search.isBlank()) {
            return prescriptionRepo.findByMedicationNameContainingIgnoreCaseOrDoctor_NameContainingIgnoreCase(
                    search, search, pageable);
        }
        return prescriptionRepo.findAll(pageable);
    }

    public Prescription getById(Long id) {
        return prescriptionRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription " + id + " not found."));
    }

    public Prescription create(Prescription req, Long doctorId) {
        Doctor doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor " + doctorId + " not found."));
        req.setDoctor(doctor);
        return prescriptionRepo.save(req);
    }

    public Prescription update(Long id, Prescription req, Long doctorId) {
        Prescription existing = getById(id);
        Doctor doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor " + doctorId + " not found."));
        existing.setMedicationName(req.getMedicationName());
        existing.setDate(req.getDate());
        existing.setStatus(req.getStatus());
        existing.setDaysRemaining(req.getDaysRemaining());
        existing.setDoctor(doctor);
        existing.setNote(req.getNote());
        return prescriptionRepo.save(existing);
    }

    public void delete(Long id) {
        if (!prescriptionRepo.existsById(id))
            throw new ResourceNotFoundException("Prescription " + id + " not found.");
        prescriptionRepo.deleteById(id);
    }

    public Map<String, Object> getStats() {
        long total     = prescriptionRepo.count();
        long delivered = prescriptionRepo.countByStatus(PrescriptionStatus.DELIVERED);
        long pending   = prescriptionRepo.countByStatus(PrescriptionStatus.PENDING);
        long urgent    = prescriptionRepo.countUrgent();
        Double avg     = prescriptionRepo.avgDaysRemaining();

        Map<String, Long> byDoctor = new LinkedHashMap<>();
        prescriptionRepo.countByDoctor()
                .forEach(row -> byDoctor.put((String) row[0], (Long) row[1]));

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("delivered", delivered);
        stats.put("pending", pending);
        stats.put("urgentCount", urgent);
        stats.put("avgDaysRemaining", avg != null ? Math.round(avg) : null);
        stats.put("byDoctor", byDoctor);
        return stats;
    }

    public Page<Prescription> getByDoctorId(Long doctorId, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return prescriptionRepo.findByDoctorId(doctorId, pageable);
    }
}
