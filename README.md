# Forge Docs

An aesthetic, full-stack Markdown and document editor powered by Next.js, MongoDB, NextAuth, and Groq API. Forge Docs features real-time formatting, inline AI writing assistance, a persistent companion chat, and exporting to multiple formats.

## Features

- **Rich Markdown Editing**: Real-time editing with live markdown compilation, tag management, and slug generation.
- **Inline AI Assistant**: Instantly rewrite, expand, summarize, or fix grammar on highlighted text inside the editor.
- **Companion AI Chat**: Floating Chat FAB for writing ideas, outlines, and general workspace query resolution via Groq's GPT-OSS models.
- **Document Exporting**: Direct download capabilities supporting standard Markdown (`.md`) and rich Microsoft Word (`.docx`) formatting.
- **Custom Theme Engine**: Seamless toggle between responsive, curated dark and light mode palettes utilizing HSL CSS variable mapping.
- **Secure Authentication**: Session-based credentials auth handled securely via NextAuth.js JWT provider.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB & Mongoose ORM
- **Authentication**: NextAuth.js (v5 Beta)
- **AI Service**: Groq API
- **Styling**: Tailwind CSS & CSS Variables

## Project Structure

```
.
├── docs/                 # Extended system documentation
│   ├── API.md            # API endpoint specifications
│   └── architecture.md   # Architectural design details
├── src/
│   ├── app/              # Routes, API endpoints, and page layouts
│   ├── components/       # UI elements (editor, sidebar, chat widgets)
│   ├── lib/              # Auth configuration, DB connections, and helpers
│   ├── models/           # Mongoose schemas for persistence
│   └── types/            # TypeScript interface definitions
├── tailwind.config.ts    # Tailwind styling system options
├── tsconfig.json         # Strict TypeScript compiler options
└── package.json          # Dependency and script registry
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- A running MongoDB instance (or Atlas cluster URL)
- A Groq API Key

### Configuration

Copy the example environment file and populate it with your local configurations:

```bash
cp .env.example .env.local
```

Modify the following keys inside `.env.local`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/forge-docs
NEXTAUTH_SECRET=your-32-byte-base64-secret
NEXTAUTH_URL=http://localhost:3000
GROQ_API_KEY=gsk_...
```

### Installation

Install the required project dependencies:

```bash
npm install
```

### Development

Run the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Production

To build the production bundle and spin up the optimized server:

```bash
npm run build
npm run start
```
