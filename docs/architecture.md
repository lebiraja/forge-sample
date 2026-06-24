# Architecture

## Technical Stack
- **Framework**: Next.js (App Router)
- **Authentication**: NextAuth.js (JWT-based credentials auth)
- **Database**: MongoDB (via Mongoose)
- **Styling**: Tailwind CSS & CSS Variables
- **AI Integrations**: Groq API (GPT-OSS 20B model) for writing assistance

## Key Components

### Writing Assistant (ChatBubble)
- **File**: `src/components/ChatBubble.tsx`
- **UI Style**: Floating Action Button (FAB) toggles a floating chat panel styled with premium dark/light mode surface tokens (`var(--surface)`, `var(--border)`, `var(--accent)`).
- **Backend API**: Communicates with `/api/chat` via HTTP POST request.
- **Features**: Autosizing text area, Enter-to-send shortcut, loading/thinking spinner indicator, fallback message on failure, session/user restriction.
