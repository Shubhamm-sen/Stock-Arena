---
description: how to run the Stock Arena application (backend and frontend)
---

To run the Stock Arena application, you need to start both the backend and the frontend.

### Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 18+
- OpenAI API Key

### 1. Run Backend
Navigate to the `backend` directory and run the Spring Boot application.
You must have the `OPENAI_API_KEY` set in your environment or in a `.env` file in the `backend` directory.

// turbo
```bash
cd backend && mvn spring-boot:run
```

### 2. Run Frontend
Navigate to the `frontend` directory, install dependencies (if not already done), and start the development server.

// turbo
```bash
cd frontend && npm install && npm run dev
```

The application will be available at:
- Backend: http://localhost:8080
- Frontend: http://localhost:5173
