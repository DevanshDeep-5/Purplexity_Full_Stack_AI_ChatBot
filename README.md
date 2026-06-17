# Purplexity AI

Purplexity is a modern, full-stack AI search engine and chatbot application inspired by Perplexity AI. It delivers real-time web search capabilities combined with streaming LLM answers, wrapped in a premium dark-themed interface.

---

## 🚀 Key Features

- **Real-Time Web Search**: Integrated with the Tavily Search API to pull up-to-date web results and sources.
- **Streaming Responses**: Clean text streaming directly from OpenRouter LLM models.
- **Interactive Follow-Up Questions**: Generated follow-ups can be clicked to query in the same conversation thread instantly.
- **Always-Visible Sources**: Easily inspect references and browse sources via a clean, premium horizontal scroll component.
- **OAuth Authentication**: Built with Supabase Auth supporting secure authentication.
- **Conversation Management**: Collapsible sidebar displaying a history of active chats, with options to create new chats or log out.
- **Premium Glassmorphic Design**: Curated dark purple palette, smooth transitions, and responsive styling.

---

## 🛠 Tech Stack

### Frontend
- **Runtime**: [Bun](https://bun.sh/) (Fast all-in-one JavaScript runtime)
- **Framework**: React 19 & React Router 7
- **Styling**: Tailwind CSS & Custom Glassmorphic Dark CSS
- **Authentication**: Supabase Auth (Client SDK)

### Backend
- **Framework**: Node.js & Express
- **Database**: PostgreSQL (Hosted on Supabase)
- **ORM**: Prisma 7
- **Search Engine**: Tavily API
- **LLM Provider**: OpenRouter API (Gemini/Claude models)

---

## 📁 Project Structure

```
Purplexity/
├── backend/
│   ├── index.ts             # Express Server entry & API routes
│   ├── middleware.ts        # Supabase JWT Auth verification middleware
│   ├── db.ts                # Prisma Client instance
│   ├── prompt.ts            # LLM Prompt templates for structured outputs
│   ├── prisma/
│   │   ├── schema.prisma    # Database models (User, Conversation, Message)
│   │   └── migrations/      # Prisma migration files
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI Components (ChatMessage, SearchBar, Sidebar)
│   │   ├── pages/           # Route Pages (Auth, Dashboard)
│   │   ├── lib/             # Supabase client configurations
│   │   ├── App.tsx          # Router configuration
│   │   └── index.ts         # Bun web server entry point
│   ├── styles/
│   │   └── globals.css      # Core design tokens, gradients, and scrollbars
│   └── package.json
│
└── .gitignore               # Root gitignore file
```

---

## ⚙️ Environment Configuration

You need to set up `.env` files in both the `backend` and `frontend` folders.

### 1. Backend (`backend/.env`)
Create `backend/.env` containing:
```env
PORT=3001
DATABASE_URL="postgres://your_pg_bouncer_connection_string"
DIRECT_DATABASE_URL="postgres://your_direct_connection_string"
TAVILY_API_KEY="your_tavily_key"
OPENROUTER_API_KEY="your_openrouter_key"
SUPABASE_JWT_SECRET="your_supabase_jwt_secret"
```
> **Note:** Use `DIRECT_DATABASE_URL` in `prisma.config.ts` for database migrations to bypass PgBouncer transaction-mode limits.

### 2. Frontend (`frontend/.env`)
Create `frontend/.env` containing:
```env
BUN_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
```

---

## 📦 Getting Started

### Prerequisites
Make sure you have [Bun](https://bun.sh/) installed:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DevanshDeep-5/Purplexity_Full_Stack_AI_ChatBot.git
   cd Purplexity_Full_Stack_AI_ChatBot
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   bun install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   bun install
   ```

### Database Setup & Migration

Run database migrations to initialize tables on your Supabase PostgreSQL instance:
```bash
cd ../backend
bun --env-file=.env --bun run prisma migrate dev
```

---

## 🚦 Running the Application

### 1. Start the Backend Server
From the `backend` folder:
```bash
bun --env-file=.env run index.ts
```
The server will run on `http://localhost:3001`.

### 2. Start the Frontend Server
From the `frontend` folder:
```bash
bun dev
```
The application will be accessible at `http://localhost:3000`.

---

## 🔗 API Endpoints

The backend exposes the following REST API endpoints (authenticated via Bearer JWT):

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/conversations` | `GET` | Fetch all conversations of the authenticated user |
| `/conversation/:id` | `GET` | Fetch messages of a specific conversation |
| `/purplexity_ask` | `POST` | Execute a new search query (Streams LLM output and search results) |
| `/purplexity_ask/follow_up` | `POST` | Execute a follow-up query within an existing conversation |
