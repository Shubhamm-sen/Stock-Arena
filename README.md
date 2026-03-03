# 📈 Stock Arena — AI Bull vs Bear Debate Analyzer

> **Watch two AI traders argue about your stock. A judge decides who's right.**

Pick any Indian stock, and three AI agents powered by GPT-4o will debate it in real-time — a Bull (optimistic), a Bear (pessimistic), and a Judge who gives the final verdict.

---

## 🎮 What It Does

1. **You enter a stock ticker** (e.g., `TATASTEEL`, `RELIANCE`)
2. **Live data is fetched** from Yahoo Finance (price, P/E, ROE, debt, etc.)
3. **🐂 Bull Agent** argues: *"Here's why you SHOULD buy this stock"*
4. **🐻 Bear Agent** counters: *"Here's why you SHOULDN'T buy it"*
5. **⚖️ Judge Agent** decides: *"Here's my balanced take — BUY / AVOID / NEUTRAL"*
6. All three stream in **real-time** via WebSocket as they're generated

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  DebateForm → REST POST → get sessionId                  │
│  WebSocket subscribe → receive streaming tokens          │
│  AgentPanels update live as GPT streams response         │
└─────────────────────────────────────────────────────────┘
           │ HTTP POST /api/debates/start
           ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Spring Boot)                   │
│                                                           │
│  DebateController → DebateService (@Async)               │
│       │                                                   │
│       ├─ StockDataService → Yahoo Finance API            │
│       ├─ OpenAIService (Bull) → streams via WebSocket    │
│       ├─ OpenAIService (Bear) → streams via WebSocket    │
│       ├─ OpenAIService (Judge) → streams via WebSocket   │
│       └─ DebateRepository → H2 Database (Hibernate)     │
└─────────────────────────────────────────────────────────┘
```

---

## 🧰 Tech Stack & Concepts Explained

### Backend: Spring Boot + Hibernate

#### 1. Spring Boot
Spring Boot is a framework that makes building Java web applications fast and convention-over-configuration.

**Key annotations used:**
| Annotation | What it does |
|---|---|
| `@SpringBootApplication` | Marks the entry point; enables auto-configuration |
| `@RestController` | Marks a class as a REST API controller (returns JSON) |
| `@RequestMapping` | Maps URL paths to controller methods |
| `@PostMapping` / `@GetMapping` | Maps HTTP POST/GET to a method |
| `@RequestBody` | Parses incoming JSON into a Java object |
| `@PathVariable` | Extracts a segment from the URL path |
| `@Service` | Marks a class as a business logic service |
| `@Async` | Runs a method in a background thread |
| `@Value` | Injects a value from `application.properties` |

#### 2. Hibernate & JPA (Java Persistence API)
Hibernate is an **ORM (Object-Relational Mapper)** — it automatically maps Java classes to database tables. You write Java, Hibernate writes SQL.

**Key annotations:**
| Annotation | What it does |
|---|---|
| `@Entity` | Marks a Java class as a database table |
| `@Table(name="debates")` | Specifies the table name |
| `@Id` | Marks the primary key field |
| `@GeneratedValue(strategy = GenerationType.IDENTITY)` | Auto-increments the ID |
| `@Column(nullable = false)` | Maps to a column with constraints |
| `@Lob` | Stores large text (TEXT type in DB) |
| `@CreationTimestamp` | Auto-sets the timestamp when a record is created |

**Example — Hibernate in action:**
```java
// This Java class:
@Entity
@Table(name = "debates")
public class Debate {
    @Id @GeneratedValue
    private Long id;
    private String ticker;
}

// Becomes this SQL table automatically:
// CREATE TABLE debates (id BIGINT AUTO_INCREMENT, ticker VARCHAR(255));
```

#### 3. Spring Data JPA (Repository Pattern)
Instead of writing SQL queries manually, Spring Data JPA generates them from method names:

```java
// This method signature:
List<Debate> findByTickerOrderByCreatedAtDesc(String ticker);

// Generates this SQL:
// SELECT * FROM debates WHERE ticker = ? ORDER BY created_at DESC
```

#### 4. WebSocket + STOMP Protocol
WebSocket enables **bidirectional, real-time communication** between browser and server.

**STOMP** (Simple Text Oriented Messaging Protocol) is layered on top:
- Client subscribes to `/topic/debate/{sessionId}`
- Backend publishes messages to that topic
- Each GPT token gets pushed to the browser as it's generated

```
Browser ──────── SockJS/STOMP ──────── Spring Message Broker
         connect()                      
         subscribe("/topic/debate/xyz")  
                           ←──────────── publish(token)
                           ←──────────── publish(token)
                           ←──────────── publish("DONE")
```

**Spring configuration:**
```java
@EnableWebSocketMessageBroker
// enables /app prefix for client → server
// enables /topic prefix for server → client broadcasts
```

#### 5. @Async (Asynchronous Processing)
When you POST to start a debate, the response returns **immediately** (within milliseconds). The actual debate runs in a **background thread**.

```
Client → POST /api/debates/start
         ← 200 OK { sessionId: "abc-123" }   ← returns immediately
         
         [Background Thread]
         → fetch Yahoo Finance data
         → call Bull GPT (streaming)
         → call Bear GPT (streaming)  
         → call Judge GPT (streaming)
         → save to database
```

#### 6. WebFlux (Reactive HTTP Client)
`WebClient` is Spring's non-blocking HTTP client used to call Yahoo Finance API. It's reactive (doesn't block threads while waiting for HTTP responses).

```java
webClient.get().uri("/v10/finance/quoteSummary/TATASTEEL.NS")
    .retrieve()
    .bodyToMono(String.class)  // Mono = single async value
    .block();                   // Wait for result
```

#### 7. OkHttp (Streaming HTTP)
Used to call OpenAI's streaming API. OpenAI sends responses as **Server-Sent Events (SSE)** — one token at a time. OkHttp reads this stream line by line:

```
data: {"choices":[{"delta":{"content":"This"}}]}
data: {"choices":[{"delta":{"content":" stock"}}]}
data: {"choices":[{"delta":{"content":" looks"}}]}
data: [DONE]
```

Each token is extracted and immediately sent to the frontend via WebSocket.

#### 8. DTO Pattern (Data Transfer Objects)
DTOs are plain Java objects used to transfer data between layers. They're NOT Hibernate entities.

```
Frontend JSON → DebateRequest DTO → Controller → Service → Debate Entity → Database
Database → Debate Entity → Service → DebateSummary DTO → Controller → Frontend JSON
```

---

### Frontend: React + TypeScript

#### 1. React Hooks Used
| Hook | Where | Purpose |
|---|---|---|
| `useState` | `App.tsx` | Stores debate state (text, phase, etc.) |
| `useCallback` | `App.tsx` | Memoizes the WebSocket message handler |
| `useEffect` | `App.tsx` | Loads history on component mount |
| `useRef` | `useWebSocket.ts` | Stores STOMP client reference |

#### 2. Custom Hook: `useWebSocket`
Encapsulates all WebSocket logic (connect, disconnect, STOMP subscription) into a reusable hook. The component just calls `connect(sessionId, onMessage)`.

#### 3. STOMP Client (@stomp/stompjs)
```typescript
const client = new Client({
  webSocketFactory: () => new SockJS('/ws'),
  onConnect: () => {
    client.subscribe(`/topic/debate/${sessionId}`, (msg) => {
      const data = JSON.parse(msg.body);
      // Update React state with streaming content
    });
  }
});
client.activate();
```

#### 4. Real-time Text Streaming
Each `BULL_CHUNK` message appends one token to the text:
```typescript
case 'BULL_CHUNK':
  setBullText(prev => prev + msg.content);  // "This" → "This stock" → "This stock looks..."
  break;
```

#### 5. Vite + Proxy
Vite proxies `/api` and `/ws` requests to the backend during development, so you don't need CORS headers in dev:
```typescript
proxy: {
  '/api': 'http://localhost:8080',
  '/ws': { target: 'http://localhost:8080', ws: true }
}
```

---

## 🗄️ Database Schema

H2 (in-memory) stores debate history. Hibernate auto-creates this table:

```sql
CREATE TABLE debates (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticker          VARCHAR(20)   NOT NULL,
  exchange        VARCHAR(10)   NOT NULL,
  holding_period  VARCHAR(20)   NOT NULL,
  current_price   DOUBLE,
  bull_argument   TEXT,
  bear_argument   TEXT,
  judge_verdict   TEXT,
  verdict_outcome VARCHAR(20),
  status          VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Setup & Running

### Prerequisites
- **Java 17+** — [Download Adoptium JDK](https://adoptium.net/)
- **Maven 3.8+** — [Install Maven](https://maven.apache.org/install.html)
- **Node.js 18+** — [Download Node.js](https://nodejs.org/)
- **OpenAI API Key** — [Get one here](https://platform.openai.com/api-keys)

### 1. Clone & Navigate
```bash
git clone <your-repo-url>
cd stockarena
```

### 2. Backend Setup
```bash
cd backend

# Create .env with your OpenAI key
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# Run the backend
OPENAI_API_KEY=sk-your-key-here mvn spring-boot:run
```

The backend starts at **http://localhost:8080**

> **Verify it's running:** http://localhost:8080/api/debates/health

> **H2 Database Console:** http://localhost:8080/h2-console  
> JDBC URL: `jdbc:h2:mem:stockarenadb` | User: `sa` | No password

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend starts at **http://localhost:5173**

### 4. Use It!
1. Open **http://localhost:5173**
2. Type `TATASTEEL` in the ticker box
3. Select **NSE**, **Medium** holding period, **1** round
4. Click **START THE DEBATE**
5. Watch the Bull 🐂, Bear 🐻, and Judge ⚖️ argue in real-time!

---

## 📁 Project Structure

```
stockarena/
├── backend/
│   ├── src/main/java/com/stockarena/
│   │   ├── StockArenaApplication.java     ← Entry point
│   │   ├── config/
│   │   │   ├── WebSocketConfig.java       ← STOMP/WebSocket setup
│   │   │   ├── CorsConfig.java            ← CORS for frontend
│   │   │   └── AsyncConfig.java           ← @Async thread pool
│   │   ├── controller/
│   │   │   └── DebateController.java      ← REST endpoints
│   │   ├── model/
│   │   │   ├── Debate.java                ← Hibernate entity
│   │   │   └── DebateRepository.java      ← Spring Data JPA repo
│   │   ├── service/
│   │   │   ├── DebateService.java         ← Orchestrator
│   │   │   ├── StockDataService.java      ← Yahoo Finance
│   │   │   └── OpenAIService.java         ← GPT-4o streaming
│   │   └── dto/
│   │       └── DebateDTO.java             ← Request/Response DTOs
│   └── src/main/resources/
│       └── application.properties         ← Config
│
└── frontend/
    └── src/
        ├── App.tsx                        ← Main component + state
        ├── components/
        │   ├── DebateForm.tsx             ← Ticker input form
        │   ├── AgentPanel.tsx             ← Bull/Bear/Judge panel
        │   ├── StockCard.tsx              ← Stock metrics display
        │   └── HistoryPanel.tsx           ← Past debates
        ├── hooks/
        │   └── useWebSocket.ts            ← STOMP WebSocket hook
        ├── services/
        │   └── api.ts                     ← Axios REST client
        └── types/
            └── index.ts                   ← TypeScript interfaces
```

---

## 🔧 Key Concepts Reference

| Concept | Technology | Purpose in this project |
|---|---|---|
| ORM | Hibernate | Maps `Debate.java` → `debates` table automatically |
| JPA Repository | Spring Data | CRUD + custom queries without SQL boilerplate |
| REST API | Spring MVC | `/api/debates/start`, `/history` endpoints |
| Real-time push | WebSocket + STOMP | Stream GPT tokens to browser live |
| Async threads | `@Async` | Run AI debate in background, API responds instantly |
| Reactive HTTP | WebFlux WebClient | Non-blocking call to Yahoo Finance |
| SSE Streaming | OkHttp | Read OpenAI's token-by-token response stream |
| State management | React useState | Update UI as each token arrives |
| Custom hooks | React useWebSocket | Encapsulate WebSocket connection logic |
| DTO pattern | Java records/classes | Clean separation of API ↔ DB concerns |

---

## ⚠️ Troubleshooting

**Backend won't start?**
- Check Java version: `java -version` (needs 17+)
- Ensure `OPENAI_API_KEY` is set
- Check port 8080 is free: `lsof -ti:8080 | xargs kill -9`

**No stock data?**
- Yahoo Finance may rate-limit. The app falls back to mock data.
- Try with `.NS` suffix: `TATASTEEL.NS`

**WebSocket not connecting?**
- Ensure backend is running first
- Check browser console (F12) for errors
- Vite proxy requires both servers running

**OpenAI errors?**
- Verify your API key at https://platform.openai.com/
- Check you have GPT-4o access on your plan

---

## 📜 License

MIT — use freely for learning and personal projects.
