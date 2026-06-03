# Assignment 4 — PharmaConnect

## ✅ BRONZE — Complet

### 1. Comunicare criptată (HTTPS)
**Cum activezi HTTPS:**
```bash
cd backend
chmod +x generate-ssl.sh
./generate-ssl.sh
```
Apoi decomentează în `application.properties`:
```properties
server.ssl.enabled=true
server.ssl.key-store=classpath:pharmaconnect.p12
server.ssl.key-store-password=pharmaconnect
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=pharmaconnect
```
Și în frontend `src/app/api.ts`:
```ts
export const API_BASE = 'https://<IP_SERVER>:3001';
```

### 2. Conexiuni via HTTPS + Server pe altă mașină (LAN)
- Rulezi backend pe server: `./mvnw spring-boot:run`
- Actualizezi `API_BASE` în frontend cu IP-ul LAN al serverului
- Rulezi frontend pe client: `npm run dev`

### 3. Login/Register securizat (JWT)
- `POST /auth/login` → returnează JWT token
- `POST /auth/register` → creează user cu rol USER
- Token stocat în `localStorage`

### 4. Token + Session cu inactivitate
- JWT expiră după **30 minute de inactivitate** (sliding window)
- Backend refreshează tokenul la **fiecare request** în header `X-Refreshed-Token`
- Frontend interceptează headerul și actualizează tokenul stocat
- Frontend ascultă activitate (mouse, taste, click) și face logout după 30 min inactivitate

### 5. Teste
```bash
# Backend (JUnit/MockMvc):
cd backend && ./mvnw test

# Frontend E2E (Playwright):
cd frontend
npx playwright install chromium
npx playwright test tests/e2e/auth.spec.ts
```

---

## ✅ SILVER — Complet

### 1. Autentificare și autorizare pentru TOATE rolurile

**SecurityConfig** (`SecurityConfig.java`) — reguli la nivel de URL:
```
/auth/**          → public (oricine)
/admin/**         → doar ADMIN
/prescriptions/** → autentificat (ADMIN + USER)
/doctors/**       → autentificat (ADMIN + USER)
```

**@PreAuthorize** pe metode — reguli fine-grained:
| Endpoint | ADMIN | USER |
|----------|-------|------|
| GET /prescriptions | ✅ | ✅ |
| POST /prescriptions | ✅ | ✅ |
| PUT/PATCH /prescriptions | ✅ | ✅ |
| DELETE /prescriptions | ✅ | ❌ 403 |
| GET /admin/** | ✅ | ❌ 403 |
| GET /users/me | ✅ | ✅ |
| GET /users (all) | ✅ | ❌ 403 |

**Frontend:**
- Buton Delete ascuns pentru USER
- Link Admin Panel ascuns pentru USER
- `/admin` route redirecționează USER înapoi la dashboard

### 2. Tokeni cu scheme diferite de permisiuni
JWT-ul conține:
```json
{
  "sub": "stefan",
  "role": "USER",
  "permissions": ["PRESCRIPTION_READ", "PRESCRIPTION_WRITE"],
  "exp": ...
}
```
vs Admin:
```json
{
  "sub": "admin",
  "role": "ADMIN",
  "permissions": ["PRESCRIPTION_READ", "PRESCRIPTION_WRITE", "PRESCRIPTION_DELETE", "USER_MANAGE"],
  "exp": ...
}
```
Poți vedea asta live la `GET /users/me` cu tokenul respectiv.

### 3. Session management
- Tokens generate la login, refresh la fiecare request
- `POST /auth/refresh` — endpoint explicit pentru refresh
- `RequireAuth` + `RequireAdmin` guards în frontend

### 4. Password recovery (3-way auth)
Flow complet:
1. `POST /auth/forgot-password` `{"email": "..."}` → returnează cod 6 cifre
2. `POST /auth/reset-password` `{"email": "...", "resetCode": "...", "newPassword": "..."}` → resetează parola
3. Pagina `/forgot-password` în frontend cu UI complet

---

## Credentials demo
| Email | Parolă | Rol |
|-------|--------|-----|
| admin@pharmaconnect.ro | admin123 | ADMIN |
| user@pharmaconnect.ro | user123 | USER |

## Demonstrație live la lab

```bash
# 1. Arată că USER nu poate șterge (403):
TOKEN=$(curl -s -X POST localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@pharmaconnect.ro","password":"user123"}' | jq -r .token)

curl -X DELETE localhost:3001/prescriptions/1 \
  -H "Authorization: Bearer $TOKEN"
# → 403 Forbidden

# 2. Arată că ADMIN poate șterge:
ADMIN_TOKEN=$(curl -s -X POST localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pharmaconnect.ro","password":"admin123"}' | jq -r .token)

curl -X DELETE localhost:3001/prescriptions/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# → 204 No Content

# 3. Arată permisiunile din token:
curl localhost:3001/users/me \
  -H "Authorization: Bearer $TOKEN"
# → {"role":"USER","permissions":["PRESCRIPTION_READ","PRESCRIPTION_WRITE"]}

# 4. Arată că USER nu poate accesa /admin:
curl localhost:3001/admin/logs \
  -H "Authorization: Bearer $TOKEN"
# → 403 Forbidden
```
