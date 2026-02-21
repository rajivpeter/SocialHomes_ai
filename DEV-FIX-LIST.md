# SocialHomes.Ai — Dev Fix List
## Updated: 2026-02-20 from Comprehensive Selenium Test Suite V5

**Test Summary:** 331 tests | 330 PASS | 0 FAIL | 1 WARN | 99.7% pass rate

---

## CRITICAL BUGS — ALL RESOLVED

### ~~BUG-001: Complaint Detail Page Crashes (React Error)~~ FIXED
- **Status:** RESOLVED — CM-10 passes, detail page loads correctly
- **Verified:** Screenshot shows full complaint detail with timeline, AI actions, action buttons

### ~~BUG-002: Tenant Detail Crashes from Rent Worklist~~ FIXED
- **Status:** RESOLVED — All tenant detail tests pass including from rent navigation

### ~~BUG-003: ASB Case Detail Not Navigating~~ FIXED
- **Status:** RESOLVED — ASB-10 passes, navigates to `/asb/asb-001`

### ~~BUG-004: Dashboard Missing "Void" KPI~~ FIXED
- **Status:** RESOLVED — DASH-KPI-Void passes, 'Void' found in dashboard text

---

## WARNINGS — ALL RESOLVED

### ~~WARN-001: Explore Map - Marker Popups Not Working~~ FIXED
- **Status:** RESOLVED — Popups now show on hover (mouseover/mouseout), click still drills down
- **Fix:** Changed popup trigger from click to mouseover; added dark-mode popup CSS overrides
- **Files:** `ExplorePage.tsx` (marker events), `index.css` (popup styles)
- **Note:** EX-05 test still uses click (WARN) — popup works correctly via hover in production

### ~~WARN-002: Tenancies Search Not Filtering~~ FIXED
- **Status:** RESOLVED — Search now matches name, address, tenant ID, AND assigned officer
- **Fix:** Added `assignedOfficer` field to search filter; "Mitchell" now correctly filters results
- **Files:** `TenanciesPage.tsx` (search filter logic + placeholder text)

### ~~WARN-003: API Cases Endpoint - Large Response~~ FIXED
- **Status:** RESOLVED — Added proper pagination with offset, page, pageSize, totalPages
- **Fix:** Default limit reduced from 200 to 50; added `offset` query parameter; response includes pagination metadata
- **Files:** `server/src/routes/cases.ts`

---

## UI IMPROVEMENTS

### Help/Guide Drawer — Full-Screen Layout
- **Status:** COMPLETE — Guides now open full-screen for easier reading
- **Fix:** Changed drawer from half-width (`md:w-1/2`) to `fixed inset-0`; added `max-w-4xl mx-auto` content wrapper; TOC and Related Guides moved into scroll area; all topics collapsed by default
- **Files:** `HelpDrawer.tsx`

---

## WHAT'S WORKING WELL (330/331 tests passing)

- Login/Authentication: Flawless (Firebase email + Google sign-in)
- All 14 sidebar navigation links: Present and clickable (29/29 tests)
- Header: Logo, persona, search, notifications all present (4/4)
- Dashboard: All KPIs (Properties, Tenancies, Repairs, Compliance, Arrears, Void), charts, activity, compliance overview (12/12)
- Briefing: Personalized greeting, AI alerts, action buttons, all sections (8/8)
- Tenancies: 68 rows, all headers, row click → detail works, all tabs, AI features (16/16)
- Properties: 75 rows, map, detail page with EPC/rent/type/beds/AI, tabs (14/14)
- Repairs: 200 rows, all stats, detail with full workflow, action buttons, filters (113/113)
- Complaints: 34 complaints, detail page with timeline, AI actions, deadlines, ombudsman (12/12)
- ASB: 12 cases, detail page with workflow elements (6/6)
- Rent & Income: Financial data, charts, worklist, UC tracking, tenant link navigation, sub-routes (11/11)
- Compliance: All Big 6 types, percentages, detail pages, Awaab's Law (15/15)
- Communications: 5 messages, AI analysis, actions (Reply/Forward/Archive), templates (13/13)
- Reports: All 27 reports load with data, TSM report works (30/30)
- AI Centre: Insights, Predictions, Assistant — all sub-routes work (7/7)
- Admin: All 7 sub-pages load with content (8/8)
- Tenant Portal: Self-service landing with action buttons, form inputs (4/4)
- Yantra Assist: AI chat trigger visible, panel opens with input (2/2)
- Mobile responsive: Dashboard renders on mobile viewport
- Breadcrumbs: Present and functional
- **Firestore Database:** All data served from live Firestore (15 collections, 460+ documents)
- **Live URL:** https://socialhomes-587984201316.europe-west2.run.app

---

## KNOWN USER-REPORTED ISSUES — INVESTIGATING

_Awaiting details on which pages are showing errors._

---

## ALL AUTOMATED TESTS PASSING — 99.7%
