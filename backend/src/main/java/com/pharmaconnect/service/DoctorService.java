package com.pharmaconnect.service;

import com.pharmaconnect.entity.Doctor;
import com.pharmaconnect.exception.ResourceNotFoundException;
import com.pharmaconnect.repository.DoctorRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepo;

    public DoctorService(DoctorRepository doctorRepo) {
        this.doctorRepo = doctorRepo;
    }

    public Page<Doctor> getAll(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("name").ascending());
        if (search != null && !search.isBlank()) {
            return doctorRepo.findByNameContainingIgnoreCase(search, pageable);
        }
        return doctorRepo.findAll(pageable);
    }

    public Doctor getById(Long id) {
        return doctorRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor " + id + " not found."));
    }

    public Doctor create(Doctor req) {
        return doctorRepo.save(req);
    }

    public Doctor update(Long id, Doctor req) {
        Doctor existing = getById(id);
        existing.setName(req.getName());
        existing.setSpecialty(req.getSpecialty());
        existing.setPhone(req.getPhone());
        existing.setAddress(req.getAddress());
        return doctorRepo.save(existing);
    }

    public void delete(Long id) {
        if (!doctorRepo.existsById(id))
            throw new ResourceNotFoundException("Doctor " + id + " not found.");
        doctorRepo.deleteById(id);
    }
}
