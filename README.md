# 🌱 Aveno — Banking App

**Live Preview:** https://mjcal-fintech-one.vercel.app/sign-in

Aveno is a modern banking platform built with provision, growth, care, and stability in mind.

---

## 🚀 Vision

This project is an early-stage fintech MVP exploring the foundations of a secure, scalable, and intuitive digital banking platform. The focus is on real-world financial UX patterns, type-safe APIs, resilient error handling, and a clean architecture suitable for future production-grade expansion.

---

## ✨ Core Features

- 🔐 Secure authentication + guest preview mode  
- 💵 Transaction workflows & account dashboard  
- 👤 Session and user management  
- 🧾 Type-safe forms and defensive error handling  
- 📱 Responsive, mobile-first UI  
- 🧑‍💼 Architecture designed for future fintech integrations  

---

## 🧩 Architecture Overview

Built around:

- Separation of UI, domain logic, and services  
- Strong compile-time + runtime type safety  
- Predictable and testable module boundaries  
- Error-resilient async workflows  
- Real-world fintech UX conventions  

The codebase is structured with maintainability and scalability as first-class priorities.

---

## 🛠️ Tech Stack

### **Frontend**
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

### **Backend / Platform**
- Serverless API routes  
- Appwrite — auth, users, documents  
- Zod — runtime validation  
- Strongly typed request/response contracts  

### **Fintech & Payments (sandbox / planned)**
- **Plaid** — bank account linking & sandbox transaction data  
- **Dwolla** — ACH transfers & customer wallet flows  
- Webhook-based transaction event handling  

### **Monitoring & Reliability**
- **Sentry** — error monitoring, performance tracing, release insights  

### **Infrastructure & Deployment**
- Vercel — hosting & preview environments  
- Environment-based configuration  
- Secrets managed outside client runtime  

---

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Required for Appwrite
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=your_appwrite_endpoint
NEXT_PUBLIC_APPWRITE_PROJECT=your_appwrite_project_id
NEXT_APPWRITE_KEY=your_appwrite_api_key
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_USER_COLLECTION_ID=your_user_collection_id
APPWRITE_BANK_COLLECTION_ID=your_bank_collection_id
APPWRITE_TRANSACTION_COLLECTION_ID=your_transaction_collection_id
```

### Required for Plaid
```
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
```

### Required for Dwolla
```
DWOLLA_ENV=sandbox  # or "production" for production
DWOLLA_KEY=your_dwolla_key
DWOLLA_SECRET=your_dwolla_secret
```

**Note:** If `DWOLLA_ENV` is not set, it will default to `sandbox` in development mode. In production, it must be explicitly set to either `sandbox` or `production`.

### Optional for Sentry
```
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
# Skip Sentry upload during builds (prevents blocking)
SENTRY_SKIP_UPLOAD=false  # Set to "true" to skip uploads in CI/builds
```

**Important:** Sentry is configured to be **non-blocking** - it will never prevent builds or deployments from completing. This follows the production principle: "Observability must never block delivery" (as practiced by AWS, Stripe, Plaid, etc.).

---

## 🔒 Security (MVP Posture)

This project is an engineering prototype and does **not** process real financial data. Current security priorities include:

- Minimal client-side data persistence  
- Input validation and sanitization across forms and APIs  
- Principle-of-least-privilege service design  
- Avoidance of sensitive credential exposure  
- Early monitoring + observability via Sentry  

Future iterations will introduce:

- audit/event logging  
- hardened API gateway patterns  
- encryption guarantees  
- formal compliance alignment (PCI / SOC-style controls)