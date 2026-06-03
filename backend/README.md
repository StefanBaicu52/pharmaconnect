# PharmaConnect — Spring Boot Backend

REST API backend pentru aplicația PharmaConnect.  
**Date stocate exclusiv în RAM — fără bază de date, fără fișiere, fără persistență.**

## Tech Stack (relevant pentru CV / internship Cluj)

| Tehnologie | Rol |
|------------|-----|
| **Java 21** | Limbaj principal |
| **Spring Boot 3.2** | Framework web |
| **Spring Web** | `@RestController`, routing, JSON |
| **Spring Validation** | `@Valid`, `@NotBlank`, `@Pattern`, `@Size`, `@Min`, `@Max` |
| **JUnit 5 + MockMvc** | Teste unitare + integrare |
| **JaCoCo** | Raport de coverage |
| **Maven** | Build tool |

---

## Setup rapid

```bash
# Cerințe: Java 21 + Maven 3.8+
mvn spring-boot:run          # pornește serverul pe :3001
mvn test                     # rulează toate testele
mvn test jacoco:report       # teste + coverage (target/site/jacoco/index.html)
```

---

## Structura proiectului

```
src/main/java/com/pharmaconnect/
├── PharmaConnectApplication.java     # Entry point (@SpringBootApplication)
├── controller/
│   ├── PrescriptionController.java   # Endpoints /prescriptions — DOAR routing
│   └── OrderController.java          # Endpoints /orders — DOAR routing
├── service/
│   ├── PrescriptionService.java      # Business logic + store in-memory
│   └── OrderService.java             # Business logic + store in-memory
├── model/
│   ├── Prescription.java             # Model cu adnotări Bean Validation
│   ├── PrescriptionStatus.java       # Enum PENDING / DELIVERED
│   ├── Order.java                    # Model cu adnotări Bean Validation
│   └── PagedResponse.java            # Wrapper generic pentru paginare
├── exception/
│   ├── ResourceNotFoundException.java
│   └── GlobalExceptionHandler.java   # @RestControllerAdvice — mapează excepții la HTTP
└── validation/
    └── DateValidator.java            # Validare calendar DD/MM/YYYY (ex: respinge 30/02)

src/test/java/com/pharmaconnect/
├── validation/DateValidatorTest.java            # 10 teste unitare pure
├── service/PrescriptionServiceTest.java         # 35 teste unitare pe service
└── controller/
    ├── PrescriptionControllerTest.java          # 27 teste integrare MockMvc
    └── OrderControllerTest.java                 # 16 teste integrare MockMvc
```

---

## Arhitectura (layered — standard enterprise)

```
Request HTTP
     │
     ▼
@RestController          ← primește request, validează cu @Valid, returnează JSON
     │
     ▼
@Service                 ← business logic, in-memory store (ConcurrentHashMap)
     │
     ▼
ConcurrentHashMap        ← RAM only, zero persistență
```

**De ce ConcurrentHashMap?**  
Thread-safe fără synchronized explicit. Arată că știi concurrency — un plus la interviu.

---

## API Reference

### Prescriptions

| Method | Path | Descriere |
|--------|------|-----------|
| GET | `/prescriptions` | Listă paginată |
| GET | `/prescriptions/stats` | Statistici agregate |
| GET | `/prescriptions/{id}` | O singură prescripție |
| POST | `/prescriptions` | Creare |
| PUT | `/prescriptions/{id}` | Update complet |
| PATCH | `/prescriptions/{id}` | Update parțial |
| DELETE | `/prescriptions/{id}` | Ștergere |
| DELETE | `/prescriptions` | Ștergere bulk — body: `{"ids": [1,2,3]}` |

**Query params pentru GET /prescriptions:**

| Param | Default | Note |
|-------|---------|------|
| `page` | 1 | 1-indexed |
| `pageSize` | 5 | max 50 |
| `status` | — | `PENDING` sau `DELIVERED` |
| `search` | — | substring în nume/doctor |

**Răspuns paginat:**
```json
{
  "data": [...],
  "page": 1,
  "pageSize": 5,
  "total": 7,
  "totalPages": 2
}
```

**Răspuns stats:**
```json
{
  "total": 7,
  "delivered": 3,
  "pending": 4,
  "urgentCount": 1,
  "avgDaysRemaining": 6,
  "byDoctor": { "Dr. Ion Popescu": 2 }
}
```

### Orders

| Method | Path | Descriere |
|--------|------|-----------|
| GET | `/orders` | Listă paginată |
| GET | `/orders/stats` | Statistici |
| GET | `/orders/{id}` | Un singur order |
| POST | `/orders` | Creare |
| PATCH | `/orders/{id}/step` | Avansare pas livrare (1-4) |
| DELETE | `/orders/{id}` | Ștergere |

---

## Validări (Bean Validation)

**Prescription:**
```java
@NotBlank @Size(min=3, max=100)  medicationName
@NotBlank @Size(min=5, max=100)  doctor
@NotBlank @Pattern(DD/MM/YYYY)   date
@NotNull                          status (PENDING | DELIVERED)
@Min(0)                           daysRemaining (opțional)
@Pattern(10-15 digits)            phone (opțional)
```

**Order:**
```java
@NotBlank @Size(min=5, max=200)   address
@NotBlank @Pattern(10-15 digits)  phone
@Min(1) @Max(4)                   step
```

**Răspuns 422 Validation Failed:**
```json
{
  "error": "Validation failed.",
  "details": {
    "medicationName": "Medication name must be between 3 and 100 characters.",
    "date": "Date must be in DD/MM/YYYY format."
  }
}
```

---

## Teste

| Fișier | Teste | Ce acoperă |
|--------|-------|-----------|
| `DateValidatorTest` | 10 | Validare calendar: feb 30, an bisect, null, format greșit |
| `PrescriptionServiceTest` | 35 | Toate operațiile CRUD + statistici + edge cases |
| `PrescriptionControllerTest` | 27 | HTTP status codes, JSON responses, validare via MockMvc |
| `OrderControllerTest` | 16 | CRUD orders, step update, validare |
| **Total** | **88** | |

```bash
mvn test
# Coverage report: target/site/jacoco/index.html
```

---

## De ce Spring Boot e mai bun pentru CV în Cluj

- **Bosch, Emerson, Continental, Endava** — toate folosesc Java/Spring
- `@Valid` + `@RestControllerAdvice` = pattern standard enterprise pe care îl vor vedea în producție
- Layered architecture (Controller → Service) e exact ce se cere la interviuri
- `ConcurrentHashMap` + `AtomicInteger` arată că înțelegi thread safety
