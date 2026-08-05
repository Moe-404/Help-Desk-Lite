# HelpDesk Lite

HelpDesk Lite is a responsive front-end prototype for an internal support workspace. It gives support agents a live operations dashboard, searchable ticket queue, ticket conversation view, and a guided request form.

## Features

- Support dashboard with ticket trends, queue metrics, and SLA controls
- Searchable and filterable ticket list
- Ticket detail view with replies, internal notes, assignment, and resolution actions
- Support request form with priority selection and file upload preview
- Responsive layouts for desktop and mobile screens
- CSV export for the currently filtered ticket queue

## Tech stack

- React
- React Router
- Vite
- Lucide React
- Plain CSS

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run preview  # Preview the production build
npm run lint     # Run ESLint
```

## Project structure

```text
src/
├── components/  # Shared interface components
├── pages/       # Dashboard, ticket details, and submission views
├── App.jsx      # Application routes
├── data.js      # Demo ticket and chart data
├── main.jsx     # React entry point
└── styles.css   # Application styles
```

## Current scope

This repository contains a UI prototype backed by in-memory demo data. Ticket updates reset when the page reloads; authentication, persistence, and external help-desk integrations are not included yet.
