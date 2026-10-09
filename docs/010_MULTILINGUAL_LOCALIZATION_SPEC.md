# Complete Multilingual System Specification (English + Hindi)

## 1. Executive Summary

This document specifies the complete, production-ready multilingual localization system implemented across the **Help A Mission Welfare Society** stack:
- **Database**: PostgreSQL composite schema (`cms_sections`)
- **Backend API**: Express v5 REST API with explicit language parameters & fallback resolution
- **Admin CMS**: Redux Toolkit (RTK) & RTK Query with language state, section translation status indicators, and targeted cache tag invalidation
- **Public Website**: Language-aware React router (`/en/`, `/hi/`), static UI translations (`en.json`, `hi.json`), fallback protection, and SEO localized meta tags (`hreflang`).

---

## 2. Supported Languages & Typing

System-wide, supported languages are strictly typed:

```typescript
export const SUPPORTED_LANGUAGES = ['en', 'hi'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
```

Default language is `en` (English).

---

## 3. Database & Content Model

Translatable CMS content is stored in the PostgreSQL database using a composite unique constraint:

```text
CMS Page
    └── CMS Section (language = 'en' | 'hi')
```

### Table: `cms_sections`
- `page_id`: UUID (Foreign Key -> `cms_pages.id`)
- `section_key`: VARCHAR(64) (`hero`, `about`, `initiatives`, `gallery`, `donation_settings`, `mission_cta`, `seo`)
- `section_type`: VARCHAR(64)
- `language`: VARCHAR(10) NOT NULL DEFAULT `'en'`
- `sort_order`: INT DEFAULT 0
- `content_json`: JSONB
- **Unique Constraint**: `(page_id, section_key, language)`

---

## 4. API Endpoints & Protocol

### Admin API Endpoints
- **GET `/api/v1/admin/cms/pages/:slug?language=hi`**
  - Header: `Accept-Language: hi`
  - Response: Returns exact sections for `hi` and `translationStatus` completeness matrix.
- **PUT `/api/v1/admin/cms/pages/:slug/sections?language=hi`**
  - Body: `{ sections: [...] }`
  - Saves/updates Hindi content for specified page sections.

### Public API Endpoints
- **GET `/api/v1/public/home?language=hi`**
- **GET `/api/v1/public/cms/pages/:slug?language=hi`**
  - Header: `Accept-Language: hi`
  - Fallback logic: If a section is missing in Hindi (`hi`), the API automatically returns the English (`en`) section content as fallback.

---

## 5. Admin CMS UI & Redux Integration

- **State Management**: `cmsSlice.language` maintains current admin editing language (`'en'` or `'hi'`).
- **Language Selector**: Top-bar toggle allows immediate switching between `English (EN)` and `Hindi (HI)`.
- **RTK Query Caching**: Cache keys are tagged by language (`{ type: 'CMS', id: `${slug}_${language}` }`). Updating Hindi invalidates `home_hi` without busting `home_en`.
- **Translation Status Matrix**:
  - `✓` Complete (All text fields populated)
  - `⚠` Incomplete (Partial text fields populated)
  - `✕` Missing (No translation record present)

---

## 6. Public Website & Routing

- **URL Structure**:
  - `/en/` -> Home (English)
  - `/hi/` -> Home (Hindi)
  - `/en/about` -> About Us (English)
  - `/hi/about` -> About Us (Hindi)
  - `/en/campaigns` -> Campaigns (English)
  - `/hi/campaigns` -> Campaigns (Hindi)
- **Language Switcher**: `EN | HI` toggle in Navbar and Mobile Menu preserves the current sub-path when toggling languages.
- **Static UI Localization**: `src/locales/en.json` and `src/locales/hi.json` provide localized labels for static UI text ("Donate Now", "Read More", "Submit", etc.).
- **SEO Localization**: Dynamic setting of `<html lang="...">`, `<title>`, `<meta name="description">`, and `<link rel="alternate" hreflang="..." />` head tags.

---

## 7. Verification & Compliance

- **Backend Unit & Integration Tests**: 30/30 Test Suites Passed (`npm test`).
- **Admin Panel Typecheck**: 0 errors (`npx tsc --noEmit`).
- **Public Website Typecheck**: 0 errors (`npx tsc --noEmit`).
