# SocialHomes.Ai — Dev Fix List
## Updated: 2026-02-16 from Comprehensive Selenium Test Suite V5

**Test Summary:** 329 tests | 326 PASS | 0 FAIL | 3 WARN | 99.1% pass rate

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

## REMAINING WARNINGS (3 active)

### WARN-001: Explore Map - Marker Popups Not Working
- **Page:** `/explore`
- **Severity:** P3 - Medium
- **Issue:** 3 markers visible but clicking doesn't show popup
- **Action:** Verify Leaflet marker click handlers are bound and popup content is configured

### WARN-002: Tenancies Search Not Filtering
- **Page:** `/tenancies`
- **Severity:** P3 - Medium
- **Issue:** Typing "Mitchell" in search doesn't reduce row count from 68
- **Action:** Check search input is wired to filter logic; may be server-side search needing Enter key

### WARN-003: API Cases Endpoint - Large Response
- **Page:** `/api/v1/cases`
- **Severity:** P4 - Low
- **Issue:** Large response (131KB) flagged as warning
- **Action:** Consider adding pagination or default limit. Endpoint returns clean JSON.

---

## WHAT'S WORKING WELL (326/329 tests passing)

- Login/Authentication: Flawless (Firebase email + Google sign-in)
- All 14 sidebar navigation links: Present and clickable
- Header: Logo, persona, search, notifications all present
- Dashboard: All KPIs (Properties, Tenancies, Repairs, Compliance, Arrears, Void), charts, activity, compliance overview
- Tenancies: 68 rows, all headers, row click → detail works, all tabs work
- Properties: 75 rows, detail page with EPC/rent/type/beds/AI, tabs work
- Repairs: 200 rows, all stats, detail with full workflow, action buttons
- Complaints: 34 complaints, detail page with timeline, AI actions, deadlines
- ASB: 12 cases, detail page with workflow elements
- Rent & Income: Financial data, charts, worklist, UC tracking, sub-routes
- Compliance: All Big 6 types, percentages, detail pages, Awaab's Law
- Communications: 5 messages, AI analysis, actions (Reply/Forward/Archive)
- Reports: All 27 reports load with data, TSM report works
- AI Centre: Insights, Predictions, Assistant — all sub-routes work
- Admin: All 7 sub-pages load with content
- Tenant Portal: Self-service landing with action buttons
- Mobile responsive: Dashboard renders on mobile viewport
- **Firestore Database:** All data served from live Firestore (15 collections, 460+ documents)

---

## PRIORITY ORDER FOR REMAINING WORK

1. **WARN-002** - Tenancies search not filtering (usability issue for 68 rows)
2. **WARN-001** - Explore map popups (interactivity issue)
3. **WARN-003** - Cases API large response (consider pagination)
