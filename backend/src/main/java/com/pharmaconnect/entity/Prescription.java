package com.pharmaconnect.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    @NotBlank @Size(min = 3, max = 100)
    private String medicationName;

    @Column(nullable = false, length = 10)
    @NotBlank
    @Pattern(regexp = "^\\d{2}/\\d{2}/\\d{4}$", message = "Date must be DD/MM/YYYY")
    private String date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PrescriptionStatus status = PrescriptionStatus.PENDING;

    @Min(0)
    private Integer daysRemaining;

    @Column(length = 200)
    private String address;

    @Pattern(regexp = "^\\+?[\\d\\s\\-]{10,15}$")
    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String note;

    // FK → doctors (Bronze: 3NF — doctor info e în tabela separată)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    public Prescription() {}

    public Long getId() { return id; }
    public String getMedicationName() { return medicationName; }
    public void setMedicationName(String medicationName) { this.medicationName = medicationName; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public PrescriptionStatus getStatus() { return status; }
    public void setStatus(PrescriptionStatus status) { this.status = status; }
    public Integer getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(Integer daysRemaining) { this.daysRemaining = daysRemaining; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    // Convenience getter for doctor name
    public String getDoctorName() { return doctor != null ? doctor.getName() : null; }
}