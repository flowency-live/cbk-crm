# Domain Setup for Multi-Brand Portal

## Current Configuration

| Brand | Domain | Primary Color | Portal Name |
|-------|--------|---------------|-------------|
| Hi-Vis | `hivisbooks.co.uk` | `#E3A22E` (yellow) | The Hi Vis Bookkeeper |
| Cheshire | `cheshirebookkeeping.co.uk` | `#5FC2B4` (teal) | Cheshire Bookkeeping Client Portal |

## How It Works

The portal reads the `Host` header and looks up the tenant by domain:

```
portal.hivisbooks.co.uk → hivisbooks.co.uk → Hi-Vis tenant → Yellow branding
portal.cheshirebookkeeping.co.uk → cheshirebookkeeping.co.uk → Cheshire tenant → Teal branding
```

Both domains point to the **same Vercel deployment** — branding is resolved dynamically.

## Setup Steps

### 1. Vercel Domains

In Vercel dashboard → CBKCRM project → Settings → Domains:

```
Add: portal.hivisbooks.co.uk
Add: portal.cheshirebookkeeping.co.uk
```

### 2. DNS Records

At your domain registrar, add CNAME records:

```
portal.hivisbooks.co.uk          CNAME  cname.vercel-dns.com
portal.cheshirebookkeeping.co.uk CNAME  cname.vercel-dns.com
```

### 3. Update Public Websites

**Hi-Vis website** (`C:\VSProjects\_Websites\hvbk-website\src\partials\login-modal.html`):
```html
<a href="https://portal.hivisbooks.co.uk/portal/login" ...>
```

**Cheshire website** (when built):
```html
<a href="https://portal.cheshirebookkeeping.co.uk/portal/login" ...>
```

## Testing

### Current Test URL (Default/Cheshire)
```
https://cbk-crm.vercel.app/portal/login
```

### Local Testing
```bash
npm run dev
# Visit http://localhost:3000/portal/login
```

To test different brands locally, the domain resolver checks for keywords:
- URL containing "hivisbooks" or "hi-vis" → Hi-Vis branding
- URL containing "cheshire" → Cheshire branding
- Default fallback → Hi-Vis branding

## Database

Tenants are stored in the `tenants` table with a `domain` column:

```sql
SELECT slug, name, domain FROM tenants;
-- hi-vis    | The Hi Vis Bookkeeper | hivisbooks.co.uk
-- cheshire  | Cheshire Bookkeeping  | cheshirebookkeeping.co.uk
```

## Files

| File | Purpose |
|------|---------|
| `src/lib/portal/tenant.ts` | Domain resolver (reads Host header) |
| `src/lib/data/portal.ts` | `getTenantByDomain()` query |
| `src/app/(portal)/layout.tsx` | Injects CSS vars from tenant theme |
| `public/brand/hi-vis/logo.png` | Hi-Vis logo |
| `public/brand/cheshire/logo.png` | Cheshire logo |
| `supabase/migrations/0017_tenant_domains.sql` | Domain column + tenant seeds |
