# BPOReady - AI Speech Coaching & Assessment System

BPOReady is a full-stack platform designed to prepare call center job applicants through AI-driven voice coaching, interactive call simulations, paragraph reading evaluations, and mock interviews.

---

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS / Vanilla CSS, React Router DOM
- **Backend:** Laravel 11 (PHP 8.2+)
- **Database:** PostgreSQL (`bpoready`)
- **AI Integrations:** Google Gemini API (Speech & Feedback analysis), Web Speech API

---

## 🚀 Getting Started

### 1. Database Setup (PostgreSQL)

1. Open **pgAdmin** (or terminal) and create a database named `bpoready`:
   ```sql
   CREATE DATABASE bpoready;
   ```
2. Import the schema file located in [`docs/BPOReady-postgresql-schema.sql`](docs/BPOReady-postgresql-schema.sql):
   - In pgAdmin: Right-click `bpoready` > **Query Tool** > Open `docs/BPOReady-postgresql-schema.sql` > Click **Execute (F5)**.
   - Or via command line:
     ```powershell
     psql -U postgres -d bpoready -f "docs/BPOReady-postgresql-schema.sql"
     ```

*(For detailed database documentation, see [`docs/PostgreSQL-setup.md`](docs/PostgreSQL-setup.md)).*

---

### 2. Backend Setup (Laravel)

1. Open a terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Install dependencies:
   ```powershell
   composer install
   ```
3. Create your `.env` file from the template:
   ```powershell
   cp .env.example .env
   php artisan key:generate
   ```
4. Verify your PostgreSQL database settings in `backend/.env`:
   ```dotenv
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=bpoready
   DB_USERNAME=postgres
   DB_PASSWORD=your_postgres_password
   ```
5. Seed initial demo accounts and exercise questions:
   ```powershell
   php artisan db:seed
   ```
   *Default Demo Accounts created:*
   - **Super Admin:** `superadmin@bpoready.com` / `Password123!`
   - **Admin:** `admin@bpoready.com` / `Password123!`
   - **Applicant:** `applicant@bpoready.com` / `Password123!`

6. Start the Laravel backend server:
   ```powershell
   php artisan serve --port=8000
   ```

---

### 3. Frontend Setup (React + Vite)

1. In a new terminal, navigate to the root directory:
   ```powershell
   cd ..
   ```
2. Install frontend dependencies:
   ```powershell
   npm install
   ```
3. Create your `.env` file from `.env.example`:
   ```powershell
   cp .env.example .env
   ```
   Add your Gemini API Key in `.env` if you plan to use AI feedback features:
   ```dotenv
   VITE_API_URL=http://127.0.0.1:8000
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
4. Start the frontend development server:
   ```powershell
   npm run dev
   ```
5. Open your browser and navigate to:
   `http://localhost:5173`
