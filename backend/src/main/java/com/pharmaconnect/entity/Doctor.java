package com.pharmaconnect.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    @NotBlank @Size(min = 5, max = 100)
    private String name;

    @Column(nullable = false, length = 100)
    @NotBlank @Size(min = 3, max = 100)
    private String specialty;

    @Column(nullable = false, length = 20)
    @NotBlank
    @Pattern(regexp = "^\\+?[\\d\\s\\-]{10,15}$")
    private String phone;

    @Column(length = 200)
    private String address;

    // 1-to-many: un doctor are multe prescripții
    @JsonIgnore
    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Prescription> prescriptions = new ArrayList<>();

    public Doctor() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public List<Prescription> getPrescriptions() { return prescriptions; }
}