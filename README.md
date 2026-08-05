# HelpDesk Lite

HelpDesk Lite is a responsive front-end prototype for an internal support workspace. It gives support agents a live operations dashboard, searchable ticket queue, ticket conversation view, and a guided request form.

## Features

- Support dashboard with ticket trends, queue metrics, and SLA controls
- Searchable and filterable ticket list
- Ticket detail view with replies, internal notes, assignment, and resolution actions
- Support request form with priority selection and file upload preview
- Responsive layouts for desktop and mobile screens
- CSV export for the currently filtered ticket queue
- Supabase Auth with database-enforced role-based access
- Supabase persistence for tickets, replies, internal notes, assignments, and attachments
- Realtime dashboard refresh when tickets change

## Tech stack

- React
- React Router
- Vite
- Lucide React
- Plain CSS
- Supabase (Postgres, Realtime, and Storage)

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Without Supabase credentials, the app remains usable with its bundled demo data.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL Editor and run these migrations in order:
   - [`supabase/migrations/202608050001_create_helpdesk.sql`](supabase/migrations/202608050001_create_helpdesk.sql)
   - [`supabase/migrations/202608050002_auth_and_rbac.sql`](supabase/migrations/202608050002_auth_and_rbac.sql)
3. Copy the environment template and add the values from the project's **Connect** panel:

```bash
cp .env.example .env.local
```

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

4. Restart the development server.

Only use a Supabase publishable/anon key in the browser. Never expose a service-role key in a `VITE_` variable.

### Roles and permissions

| Role | Ticket access | Staff actions | Reports | Manage roles |
| --- | --- | --- | --- | --- |
| Administrator | All tickets | Yes | Yes | Yes |
| Manager | All tickets | Yes | Yes | No |
| Agent | All tickets | Yes | No | No |
| Requester | Own tickets only | Public replies only | No | No |

The first/oldest account becomes the initial administrator. New accounts default to requester. Administrators can change roles from **Access Control** in the sidebar.

### Security note

The RBAC migration removes anonymous table access. Postgres RLS restricts requesters to their own tickets and hides internal notes from them, while a protected database function limits role changes to administrators. For a multi-company deployment, add organization membership and organization-scoped policies as the next authorization boundary.

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

The app uses Supabase when configured and falls back to an administrator-flavored demo session with in-memory data otherwise. External help-desk integrations are not included yet.
