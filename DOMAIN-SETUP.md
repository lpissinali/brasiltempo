# Custom domain — brasiltempo.com.br (apex canonical, www redirects)

Goal: serve the site on **`brasiltempo.com.br`** and have **`www.brasiltempo.com.br`**
301-redirect to it. `.com.br` domains are registered through **Registro.br**; DNS is
edited either in Registro.br's own DNS panel ("DNS > Editar Zona") or wherever your
nameservers point (e.g. Cloudflare).

> The exact record **values** (A record IPs, the `_custom-domain…` CNAME target, the
> `fah-claim=…` TXT, the `_acme-challenge…` CNAME) are generated per-domain by the
> Firebase wizard. Copy them from the console — don't guess. The steps below tell you
> where each one goes.

---

## 1. Add the domains in Firebase

Console → **Hosting & Serverless → App Hosting** → your `brasiltempo` backend →
**View Dashboard** → **Settings** tab → **Add custom domain**.

**a) Apex (canonical):**
- Domain: `brasiltempo.com.br`
- Leave the "redirect to another domain" box **unchecked** (this one serves content).
- Continue to setup → the wizard shows the DNS records to add (see step 2).

**b) www (redirect):**
- **Add custom domain** again → `www.brasiltempo.com.br`
- **Check** the redirect box and point it at **`brasiltempo.com.br`**.
- Continue → it shows its own DNS records.

---

## 2. Add the DNS records at your provider

The wizard will ask for **1–5 records per domain**. Typical set:

| For | Type | Host / Name | Value (copy from wizard) | Notes |
|-----|------|-------------|--------------------------|-------|
| apex | **A** | `@` (or blank) | the IPv4(s) the wizard shows | apex can't be a CNAME — must be A |
| apex | **TXT** | `@` (or blank) | `fah-claim=…` | ownership/serving claim, if shown |
| www | **CNAME** | `www` | `_custom-domain…` target | the wizard's onboarding CNAME |
| both | **CNAME** | `_acme-challenge…` | value the wizard shows | **SSL cert — never delete this later** |

Provider field mapping:
- **Registro.br DNS panel:** host for apex = leave the subdomain field **blank**;
  host for www = `www`; for the challenge use the `_acme-challenge` label exactly as
  shown. Save the zone.
- **Cloudflare / Namecheap / Squarespace:** apex host = `@`, www host = `www`.
  On **Cloudflare**, set those records to **DNS only (grey cloud)** during setup so
  Firebase can mint the certificate — you can re-enable proxy later if desired.

**Critical:** remove any **existing A or CNAME** on the apex/www that point elsewhere
(old parking page, previous host). If a stray A/CNAME remains, Firebase **cannot issue
the SSL certificate**. (`AAAA` records must also be removed if present.)

---

## 3. Verify + wait for SSL

- Back in each wizard, click **Verify records**. Use
  [Google Dig](https://toolbox.googleapps.com/apps/dig/#A/) to confirm propagation.
- SSL provisioning takes anywhere from a few minutes to ~24h. Until it's done you may
  see a cert warning — that's expected.
- If it stalls on "Pending", make sure no restrictive **CAA** record blocks
  `letsencrypt.org` and `pki.goog` (add a CAA allowing both, or remove the CAA).

---

## 4. App config (already done) + redeploy

`apphosting.yaml` → `NEXT_PUBLIC_SITE_URL` is now `https://brasiltempo.com.br`, so
canonical/OG tags point at the real domain. Redeploy to apply:

```bash
firebase deploy --only apphosting
```

Do this **after** the certificate is live, so the canonical URL you advertise is
actually serving over HTTPS.

---

## Result
- `https://brasiltempo.com.br` → serves the app.
- `https://www.brasiltempo.com.br` → 301 → `https://brasiltempo.com.br`.
- `http://…` both → HTTPS automatically.
- The old `…hosted.app` URL keeps working as a fallback.
