# Vi-SlideS

Vi-SlideS is an AI-powered, question-driven classroom platform that helps teachers adapt live teaching based on student questions, sentiment, and cognitive understanding.

## 🚀 Phase 1 Features: Authentication & Setup

The project is currently in Phase 1, offering a fully functional MERN stack foundation with:

- **Authentication System**: Secure JWT-based login and registration.
- **Role-Based Access**: Specialized dashboards for Teachers and Students.
- **Premium UI**: Modern, responsive interface with glassmorphism design.
- **Backend Architecture**: Scalable Express.js + TypeScript server.
- **Database**: MongoDB Atlas integration for cloud data storage.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Vanilla CSS (Premium Design)
- **Backend**: Node.js, Express, TypeScript, JWT
- **Database**: MongoDB Atlas

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- VS Code
- MongoDB Atlas Account

### 1. Clone & Setup

```bash
# Clone the repository
git clone <repository-url>
cd vi-slides
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory (copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/vi-slides?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
NODE_ENV=development
```
*Note: You must replace `MONGODB_URI` with your actual MongoDB Atlas connection string.*

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5001/api
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Verification

- Open your browser to `http://localhost:5173`
- Register a new account (Select Teacher or Student role)
- You should be redirected to the secure dashboard
- Check MongoDB Atlas to see the created user document

## 📝 Roadmap

- [x] **Phase 1: Project Setup & Authentication**
- [ ] Phase 2: Class Session Management
- [ ] Phase 3: Question Submission System
- [ ] Phase 4: AI Analysis & Integration
- [ ] Phase 5: Teacher Insights Dashboard
- [ ] Phase 6: History & Reports

## License

MIT License
