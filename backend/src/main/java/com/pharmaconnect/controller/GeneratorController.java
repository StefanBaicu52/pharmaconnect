package com.pharmaconnect.controller;

import com.pharmaconnect.entity.Doctor;
import com.pharmaconnect.entity.Prescription;
import com.pharmaconnect.entity.PrescriptionStatus;
import com.pharmaconnect.repository.DoctorRepository;
import com.pharmaconnect.repository.PrescriptionRepository;
import net.datafaker.Faker;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/generator")
@CrossOrigin(origins = "*")
public class GeneratorController {

    private final Faker faker = new Faker();
    private final PrescriptionRepository prescriptionRepo;
    private final DoctorRepository doctorRepo;
    private final SimpMessagingTemplate messagingTemplate;

    private ScheduledFuture<?> scheduledTask;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private boolean running = false;

    public GeneratorController(PrescriptionRepository prescriptionRepo,
                               DoctorRepository doctorRepo,
                               SimpMessagingTemplate messagingTemplate) {
        this.prescriptionRepo = prescriptionRepo;
        this.doctorRepo = doctorRepo;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/start")
    public Map<String, Object> start(@RequestBody(required = false) Map<String, Object> body) {
        if (running) return Map.of("running", true, "message", "Already running");

        int interval  = body != null && body.containsKey("intervalSeconds") ? (int) body.get("intervalSeconds") : 3;
        int batchSize = body != null && body.containsKey("batchSize") ? (int) body.get("batchSize") : 2;

        scheduledTask = scheduler.scheduleAtFixedRate(() -> {
            try {
                // Get or create a doctor
                List<Doctor> doctors = doctorRepo.findAll();
                Doctor doctor;
                if (doctors.isEmpty()) {
                    doctor = new Doctor();
                    doctor.setName("Dr. " + faker.name().fullName());
                    doctor.setSpecialty(faker.medical().diseaseName());
                    doctor.setPhone("+40" + faker.number().numberBetween(700000000, 799999999));
                    doctor = doctorRepo.save(doctor);
                } else {
                    doctor = doctors.get((int)(Math.random() * doctors.size()));
                }

                List<Prescription> batch = new ArrayList<>();
                final Doctor finalDoctor = doctor;
                for (int i = 0; i < batchSize; i++) {
                    Prescription p = new Prescription();
                    p.setMedicationName(faker.medical().medicineName() + " " + faker.number().numberBetween(5, 500) + "mg");
                    p.setDate(String.format("%02d/%02d/%d",
                            faker.number().numberBetween(1, 28),
                            faker.number().numberBetween(1, 12),
                            2026));
                    p.setStatus(Math.random() > 0.5 ? PrescriptionStatus.PENDING : PrescriptionStatus.DELIVERED);
                    p.setDaysRemaining(faker.number().numberBetween(1, 30));
                    p.setDoctor(finalDoctor);
                    batch.add(prescriptionRepo.save(p));
                }

                // Convert to simple DTOs to avoid JPA lazy loading issues
                List<java.util.Map<String, Object>> dtos = batch.stream().map(p -> {
                    java.util.Map<String, Object> dto = new java.util.LinkedHashMap<>();
                    dto.put("id", p.getId());
                    dto.put("medicationName", p.getMedicationName());
                    dto.put("doctor", p.getDoctor() != null ? p.getDoctor().getName() : "");
                    dto.put("date", p.getDate());
                    dto.put("status", p.getStatus());
                    dto.put("daysRemaining", p.getDaysRemaining());
                    return dto;
                }).collect(java.util.stream.Collectors.toList());
                messagingTemplate.convertAndSend("/topic/prescriptions", dtos);
            } catch (Exception e) {
                System.err.println("Generator error: " + e.getMessage());
            }
        }, 0, interval, TimeUnit.SECONDS);

        running = true;
        return Map.of("running", true, "message", "Generator started");
    }

    @PostMapping("/stop")
    public Map<String, Object> stop() {
        if (scheduledTask != null) scheduledTask.cancel(false);
        running = false;
        return Map.of("running", false, "message", "Generator stopped");
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("running", running);
    }
}