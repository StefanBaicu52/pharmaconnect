package com.pharmaconnect.controller;

import com.pharmaconnect.entity.Doctor;
import com.pharmaconnect.entity.Prescription;
import com.pharmaconnect.entity.PrescriptionStatus;
import com.pharmaconnect.exception.ResourceNotFoundException;
import com.pharmaconnect.repository.DoctorRepository;
import com.pharmaconnect.repository.PrescriptionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class GraphQLController {

    private final PrescriptionRepository prescriptionRepo;
    private final DoctorRepository doctorRepo;

    public GraphQLController(PrescriptionRepository prescriptionRepo,
                             DoctorRepository doctorRepo) {
        this.prescriptionRepo = prescriptionRepo;
        this.doctorRepo = doctorRepo;
    }

    @QueryMapping
    public Map<String, Object> prescriptions(
            @Argument Integer page,
            @Argument Integer pageSize,
            @Argument String status,
            @Argument String search) {

        int p = page != null ? Math.max(1, page) : 1;
        int ps = pageSize != null ? Math.min(50, pageSize) : 5;
        PageRequest pageable = PageRequest.of(p - 1, ps, Sort.by("id").descending());

        Page<Prescription> result;
        if (status != null && !status.isBlank()) {
            result = prescriptionRepo.findByStatus(PrescriptionStatus.valueOf(status), pageable);
        } else if (search != null && !search.isBlank()) {
            result = prescriptionRepo.findByMedicationNameContainingIgnoreCaseOrDoctor_NameContainingIgnoreCase(search, search, pageable);
        } else {
            result = prescriptionRepo.findAll(pageable);
        }

        List<Map<String, Object>> data = result.getContent().stream().map(pr -> {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", pr.getId());
            dto.put("medicationName", pr.getMedicationName());
            dto.put("doctor", pr.getDoctor() != null ? pr.getDoctor().getName() : "");
            dto.put("date", pr.getDate());
            dto.put("status", pr.getStatus().name());
            dto.put("daysRemaining", pr.getDaysRemaining());
            dto.put("note", pr.getNote());
            return dto;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("data", data);
        response.put("page", p);
        response.put("pageSize", ps);
        response.put("total", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        return response;
    }

    @QueryMapping
    public Map<String, Object> prescription(@Argument int id) {
        Prescription p = prescriptionRepo.findById((long) id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription " + id + " not found."));
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", p.getId());
        dto.put("medicationName", p.getMedicationName());
        dto.put("doctor", p.getDoctor() != null ? p.getDoctor().getName() : "");
        dto.put("date", p.getDate());
        dto.put("status", p.getStatus().name());
        dto.put("daysRemaining", p.getDaysRemaining());
        dto.put("note", p.getNote());
        return dto;
    }

    @QueryMapping
    public Map<String, Object> doctors(@Argument Integer page, @Argument Integer pageSize) {
        int p = page != null ? Math.max(1, page) : 1;
        int ps = pageSize != null ? Math.min(50, pageSize) : 5;
        Page<Doctor> result = doctorRepo.findAll(PageRequest.of(p - 1, ps, Sort.by("name")));

        List<Map<String, Object>> data = result.getContent().stream().map(d -> {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", d.getId());
            dto.put("name", d.getName());
            dto.put("specialty", d.getSpecialty());
            dto.put("phone", d.getPhone());
            dto.put("address", d.getAddress());
            return dto;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("data", data);
        response.put("page", p);
        response.put("pageSize", ps);
        response.put("total", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        return response;
    }

    @QueryMapping
    public Map<String, Object> doctor(@Argument int id) {
        Doctor d = doctorRepo.findById((long) id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor " + id + " not found."));
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", d.getId());
        dto.put("name", d.getName());
        dto.put("specialty", d.getSpecialty());
        dto.put("phone", d.getPhone());
        dto.put("address", d.getAddress());
        return dto;
    }
}