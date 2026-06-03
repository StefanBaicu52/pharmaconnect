package com.pharmaconnect.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(nullable = false, length = 200)
    @NotBlank @Size(min = 5, max = 200)
    private String address;

    @Column(nullable = false, length = 20)
    @NotBlank
    @Pattern(regexp = "^\\+?[\\d\\s\\-]{10,15}$")
    private String phone;

    @Column(length = 500)
    private String note;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    @Min(1) @Max(4)
    private int step = 1;

    public Order() {}

    public Long getId() { return id; }
    public Prescription getPrescription() { return prescription; }
    public void setPrescription(Prescription prescription) { this.prescription = prescription; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Instant getCreatedAt() { return createdAt; }
    public int getStep() { return step; }
    public void setStep(int step) { this.step = step; }
}
