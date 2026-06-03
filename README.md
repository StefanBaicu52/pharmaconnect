# PharmaConnect — Monorepo

```
pharmaconnect/
├── backend/    ← Spring Boot 3 + Java 21
└── frontend/   ← React + Vite + TypeScript
```

---

## Cerințe

- **Java 21** — https://adoptium.net (descarcă "Temurin 21")
- **Maven** — vine inclus dacă folosești IntelliJ, altfel https://maven.apache.org/download.cgi
- **Node.js 18+** — https://nodejs.org

---

## Pornire

Deschide **două terminale** în VS Code (`Ctrl+\`\`\``):

### Terminal 1 — Backend
```bash
cd backend
mvn spring-boot:run
```
✅ Gata când vezi: `Started PharmaConnectApplication on port 3001`

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm run dev
```
✅ Deschide http://localhost:5173

---

## Ce face aplicația

### Bronze
- CRUD prescripții și orders cu validare completă
- Paginare server-side
- Teste JUnit + MockMvc

### Silver
- **Offline support** — dacă cade serverul, operațiile se salvează local și se sincronizează automat când revine conexiunea
- **Faker Generator** — buton "Start" în dashboard generează prescripții fake la fiecare 3 secunde
- **WebSocket** — dashboardul se actualizează live când apar prescripții noi

### Gold
- **GraphQL** — toate endpointurile sunt disponibile și prin `/graphql`
- **Infinite scroll** — lista de prescripții se încarcă automat la scroll, cu prefetch
- **Doctori → Prescripții** (1-to-many) — pagina `/doctors`, click pe un doctor îi vede prescripțiile

---

## Endpoints backend (port 3001)

| Method | Path | Descriere |
|--------|------|-----------|
| GET | `/prescriptions?page=1&pageSize=5` | Listă paginată |
| GET | `/prescriptions/stats` | Statistici |
| POST | `/prescriptions` | Creare |
| PUT | `/prescriptions/{id}` | Update complet |
| PATCH | `/prescriptions/{id}` | Update parțial |
| DELETE | `/prescriptions/{id}` | Ștergere |
| GET | `/doctors` | Listă doctori |
| GET | `/doctors/{id}/prescriptions` | Prescripțiile unui doctor |
| POST | `/generator/start` | Pornește Faker generator |
| POST | `/generator/stop` | Oprește generator |
| GET | `/graphql` | GraphQL endpoint |
| WS | `/ws` | WebSocket STOMP |
