# Shakya Labs

A beautiful, modern website built with React, Tailwind CSS, and Vite. Featuring a professional portfolio, services showcase, and a special birthday celebration page.

## Features

- ✨ **Responsive Design** - Works perfectly on all devices
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 🌐 **Bilingual** - English and Hindi language support
- 💌 **Contact Form** - Email integration with backend
- 🎂 **Birthday Page** - Special countdown and celebration page
- ⚡ **Fast Performance** - Built with Vite for optimal speed
- 🎨 **Modern UI** - Beautiful gradient designs and animations

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Email**: Nodemailer
- **Language**: JavaScript/JSX

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/Sauravkumardotcom/Shakya-Labs.git
cd shakya-labs
```

2. Install dependencies
```bash
npm install
```

3. Create environment variables
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Start the frontend development server
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

6. In a second terminal, start the JSON-backed CMS API
```bash
npm run server
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=5000
VITE_API_URL=
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@shakyalabs.com
ADMIN_PASSWORD=choose-a-strong-password
JWT_SECRET=use-a-long-random-secret
```

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_SECRET` are required when initializing the production store. Never commit `.env` or other local environment files.

### WhatsApp job intake

Phase 3 selects Meta WhatsApp Cloud API as the sole provider adapter. It accepts
Meta-signed JSON text events at `POST /api/webhooks/whatsapp/meta`, stores the
original message in the admin-only intake record, extracts a draft, and leaves
approval to the existing admin review workflow. Webhook events never publish
jobs.

Configure these server-only variables before connecting a real provider:

```env
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_REPLAY_WINDOW_SECONDS=300
WHATSAPP_FUTURE_SKEW_SECONDS=60
WHATSAPP_RATE_LIMIT_MAX_REQUESTS=60
WHATSAPP_RATE_LIMIT_WINDOW_SECONDS=60
```

`WHATSAPP_APP_SECRET` validates Meta's `X-Hub-Signature-256` header over the raw
request body. `WHATSAPP_WEBHOOK_VERIFY_TOKEN` validates Meta's GET verification
challenge. The access token, phone number ID, and business account ID remain
server-only configuration; the access token is not used by the inbound webhook.
Keep all values out of the client bundle and logs, and do not send placeholder
credentials to Meta.

Before enabling an account, create a Meta developer app with WhatsApp Cloud API,
connect a WhatsApp Business account and phone number, and obtain the App Secret,
Business Account ID, phone number ID, and an appropriate server-side access token.
Use a Meta test number and test recipient during development. Configure the
Meta webhook callback as:

```text
GET/POST https://<server-host>/api/webhooks/whatsapp/meta
```

Meta first sends the GET verification request. The server checks
`hub.mode=subscribe` and the configured verify token, then returns
`hub.challenge`. Event POST requests must contain the exact raw JSON body and
the `X-Hub-Signature-256: sha256=...` header generated with the App Secret.
Only incoming `messages` events with `type=text` are accepted; status events are
acknowledged without creating intakes and other message types are rejected.

For a local fixture test, generate the HMAC over the exact JSON bytes, send the
fixture to the route with the signature header, and inspect the authenticated
Admin WhatsApp inbox. Do not use a real provider account or real credentials in
local tests. Every accepted message remains in Admin Review until an admin
approves it as a Jobs Portal draft; no WhatsApp webhook can publish a job.

Official references: [Meta webhook getting started](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/), [Meta WhatsApp webhook components](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components/), and [Meta Cloud API getting started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/).

Events with timestamps older than `WHATSAPP_REPLAY_WINDOW_SECONDS` or more than
`WHATSAPP_FUTURE_SKEW_SECONDS` ahead of server time are rejected. Providers that
do not send timestamps remain supported, but rely on durable provider/event ID
idempotency and have no timestamp-based replay protection.

Approved and rejected intake records are terminal. They cannot be reprocessed,
edited, rejected again, or approved again through the repository/API.

The webhook rate limiter uses the configured values above and evicts inactive
local entries. It is intentionally exposed behind a small limiter interface, but
it is still process-local and is not sufficient as the sole protection for
horizontally scaled or serverless production traffic. Use an edge or shared
limiter before enabling a real provider.

### Local WhatsApp group listener

Phase 1 adds a separate, receive-only local worker for an existing personal
WhatsApp group. It uses `whatsapp-web.js` with a persistent `LocalAuth` session.
It does not use the Meta webhook, fetch URLs, parse job pages, send messages,
reply to messages, or modify groups. When configured with the internal ingest
secret, it can hand off messages containing trusted HTTP/HTTPS links to the
existing Admin Review intake workflow.

Configure the group allowlist in `.env`:

```env
WHATSAPP_SOURCE_GROUP_ID=
WHATSAPP_SESSION_DATA_PATH=.wwebjs_auth
WHATSAPP_SESSION_CLIENT_ID=shakya-labs-group-listener
WHATSAPP_LISTENER_RECONNECT_DELAY_MS=10000
WHATSAPP_LISTENER_INGEST_SECRET=
WHATSAPP_LISTENER_INGEST_URL=
```

Start it locally with:

```bash
npm run listener:whatsapp
```

On the first run, scan the terminal QR code with the personal WhatsApp account.
The LocalAuth session is stored under `WHATSAPP_SESSION_DATA_PATH`, which is
ignored by Git. After authentication the worker reports `ready`.

If `WHATSAPP_SOURCE_GROUP_ID` is empty, discovery mode lists only group names
and group IDs. It does not print message bodies, phone numbers, or private-chat
content. Set the exact group ID and restart the worker. It will then ignore
private chats and every other group.

For matching incoming messages, the worker logs only the event type, group ID,
message ID, timestamp, and whether an HTTP/HTTPS URL was detected. A message
without a URL is ignored. URL fetching and job extraction are intentionally
reserved for later phases.

This worker requires a continuously running local machine or dedicated server.
It must not run on Vercel or inside the Express/Vercel HTTP server. The
`whatsapp-web.js` account session is unofficial WhatsApp Web automation and may
carry account, privacy, and service-compatibility risks. Use only with an
account and group where this monitoring is permitted.

When a trusted HTTP/HTTPS URL is detected for the configured source chat, the
worker sends the event to the local Express endpoint
`POST /api/internal/whatsapp-intakes`. Configure the same randomly generated
`WHATSAPP_LISTENER_INGEST_SECRET` in the worker and local server environment;
keep the value out of Git and logs. The endpoint accepts loopback requests only,
checks the configured source chat and URL protocols, and creates an Admin Review
intake through the existing durable repository. Repeated WhatsApp event IDs are
idempotent. New records start as `draft`, include `sourceUrls`, and do not create
or publish Jobs Portal jobs. `WHATSAPP_LISTENER_INGEST_URL` can override the
default local URL when the server uses a non-default port.

## Gmail Setup

To send emails through Gmail:

1. Enable 2-Step Verification on your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for Mail
4. Copy the 16-character password to `EMAIL_PASS` in `.env.local`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
shakya-labs/
├── src/
│   ├── App.jsx           # Main application component
│   ├── App.css           # Application styles
│   ├── index.css         # Global styles with Tailwind
│   ├── main.jsx          # Entry point
│   └── pages/
│       └── api/
│           └── sendMail.js  # Email API endpoint
├── public/               # Static assets
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
├── vite.config.js        # Vite configuration
├── .env.example          # Environment variables template
└── package.json          # Project dependencies

```

## Admin CMS

Open `/admin/login` after starting the frontend and API. The CMS uses the JSON file at `site-content.json` for local persistence and provides authenticated content management for the public website, including:

- Role-based access for Viewer, Editor, Admin, and Super Admin
- Draft, review, published workflow with version history and restore
- Dashboard metrics, collection pagination, messages, activity logs, users, media, and SEO
- Draft preview using the public website composition

The API enforces authorization server-side. Passwords are hashed and are never returned by admin API responses. Use `npm run build` to validate the production frontend bundle.

### Vercel deployment

Vercel runs the existing Express app through `api/index.js`. `vercel.json` rewrites `/api/*` requests to that function and rewrites direct SPA routes such as `/admin/login` to the Vite `index.html`.

The current JSON/filesystem persistence is not durable on Vercel. The bundled `site-content.json` is used as a read-only seed, while runtime JSON writes and uploaded media use the function's temporary `/tmp` filesystem and can disappear between cold starts or instances. Move CMS data to a database or durable storage, and media to object storage such as Vercel Blob or S3-compatible storage, before relying on CMS writes in production.

## Features

### Home Page
- Hero section with call-to-action
- Philosophy and services showcase
- Why Choose Us section
- Contact form with email integration
- Footer with links and special birthday button

### Birthday Page
- Countdown timer to special date
- Animated love story timeline
- Beautiful typography and animations
- Dark/Light mode support
- Bilingual content (English/Hindi)
- Confetti celebration button

### Contact Form
- Email validation
- Backend integration with Nodemailer
- Success/error messages
- Loading states

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.

## Author

Built with ❤️ by [Saurav](https://github.com/Sauravkumardotcom)

## Support

If you have any questions or need help, please open an issue on GitHub.

---

**Built with love and dedication to inspire excellence** 💝
