# SocialHomes.Ai — Dev Fix List
## Generated: 2026-02-13 from Comprehensive Selenium Test Suite V5

**Test Summary:** 320 tests | 305 PASS | 4 FAIL | 11 WARN | 95.3% pass rate

---

## CRITICAL BUGS (Must Fix)

### BUG-001: Complaint Detail Page Crashes (React Error)
- **Page:** `/complaints/cmp-002`
- **Severity:** P1 - Critical
- **Steps:** Navigate to Complaints → Click any complaint row
- **Expected:** Complaint detail page with workflow, category, tenant info
- **Actual:** React Runtime Error (crash) at `/complaints/cmp-002`
- **Impact:** Cannot view ANY complaint details - entire complaints workflow blocked
- **Screenshot:** `tests/screenshots_v5/12_complaint_detail.png`
- **Notes:** This was also failing in v4 tests (C01 tenant detail was crashing). Likely a data rendering issue in ComplaintDetailPage component.

### BUG-002: Tenant Detail Crashes from Rent Worklist
- **Page:** `/tenancies/ten-039` (navigated from Rent worklist)
- **Severity:** P1 - Critical
- **Steps:** Navigate to Rent → Scroll to AI worklist → Click tenant link
- **Expected:** Tenant detail page loads
- **Actual:** Page loads at correct URL but React Runtime Error detected
- **Impact:** Rent worklist links are broken — key workflow for arrears management
- **Screenshot:** `tests/screenshots_v5/10_rent_worklist_click.png`
- **Notes:** Direct navigation to /tenancies and clicking rows works fine (TN-10 passes). The crash may be specific to certain tenant IDs (ten-039) or the navigation path from the rent page.

### BUG-003: ASB Case Detail Not Navigating
- **Page:** `/asb`
- **Severity:** P2 - High
- **Steps:** Navigate to ASB → Click any case row/card
- **Expected:** Navigate to ASB detail page (e.g. `/asb/asb-001`)
- **Actual:** Click does not navigate — stays on `/asb`
- **Impact:** Cannot view ASB case details or manage ASB workflows
- **Screenshot:** `tests/screenshots_v5/14_asb_detail.png`
- **Notes:** The ASB list page loads correctly with 11 case items. Row click handler is missing or broken.

### BUG-004: Dashboard Missing "Void" KPI
- **Page:** `/dashboard`
- **Severity:** P3 - Medium
- **Steps:** Navigate to Dashboard → Check KPI cards
- **Expected:** KPI card showing void property count
- **Actual:** "Void" not found in dashboard text
- **Impact:** COO/management dashboard missing key operational metric
- **Screenshot:** `tests/screenshots_v5/04_dashboard_top.png`

---

## WARNINGS (Should Fix)

### WARN-001: YantraAssist Chat Widget Not Found
- **Page:** All pages (tested on `/dashboard`)
- **Severity:** P3 - Medium
- **Issue:** No chat trigger element found with expected class names (assist, chat, fab)
- **Action:** Verify YantraAssist component is rendered and has identifiable CSS classes or aria-labels

### WARN-002: Breadcrumb Navigation Missing
- **Page:** All pages (tested on `/tenancies`)
- **Severity:** P3 - Medium
- **Issue:** No breadcrumb elements detected
- **Action:** Check if breadcrumbs are rendered with standard classes/aria-labels

### WARN-003: Explore Map - Marker Popups Not Working
- **Page:** `/explore`
- **Severity:** P3 - Medium
- **Issue:** 3 markers visible but clicking doesn't show popup
- **Action:** Verify Leaflet marker click handlers are bound and popup content is configured

### WARN-004: Explore - No Panel/Sidebar Items
- **Page:** `/explore`
- **Severity:** P4 - Low
- **Issue:** No items found in sidebar/panel area
- **Action:** May need specific interaction (drill-down) to populate

### WARN-005: Briefing - No Action Buttons
- **Page:** `/briefing`
- **Severity:** P4 - Low
- **Issue:** No buttons matching "view/action/call/review/start" keywords found
- **Action:** Check if briefing actions use different button text or are links instead

### WARN-006: Briefing - No Compliance Section
- **Page:** `/briefing`
- **Severity:** P4 - Low
- **Issue:** "Compliance" not found in briefing text
- **Action:** May be persona-dependent; verify COO persona includes compliance briefing

### WARN-007: Properties List - No Map
- **Page:** `/properties`
- **Severity:** P4 - Low
- **Issue:** No Leaflet map container found on properties list page
- **Action:** Map may have been removed or is conditionally rendered

### WARN-008: Tenancies Search Not Filtering
- **Page:** `/tenancies`
- **Severity:** P3 - Medium
- **Issue:** Typing "Mitchell" in search doesn't reduce row count from 68
- **Action:** Check search input is wired to filter logic; may be server-side search needing Enter key

### WARN-009: Tenant Portal - No Form Inputs
- **Page:** `/tenant-portal`
- **Severity:** P4 - Low
- **Issue:** No input/textarea/select elements found; has 3 buttons (Report Repair, Make Payment, Contact Us)
- **Action:** Portal may be a landing page with buttons leading to forms

### WARN-010: Allocations - No Property Names
- **Page:** `/allocations`
- **Severity:** P4 - Low
- **Issue:** Property names (Flat/Tower/House) not found in allocations text
- **Action:** May use different property identifier format

### WARN-011: API Cases Endpoint Behavior
- **Page:** `/api/v1/cases`
- **Severity:** P4 - Low
- **Issue:** Large response (131KB) flagged as warning due to potential error text
- **Action:** Verify endpoint returns clean JSON

---

## WHAT'S WORKING WELL (305/320 tests passing)

- Login/Authentication: Flawless (Firebase email + Google sign-in)
- All 14 sidebar navigation links: Present and clickable
- Header: Logo, persona, search, notifications all present
- Dashboard: KPIs (except Void), charts, activity, compliance overview
- Tenancies: 68 rows, all headers, row click → detail works, all tabs work
- Properties: 75 rows, detail page with EPC/rent/type/beds/AI, tabs work
- Repairs: 200 rows, all stats, detail with full workflow, action buttons
- Rent & Income: Financial data, charts, worklist, UC tracking, sub-routes
- Compliance: All Big 6 types, percentages, detail pages, Awaab's Law
- Communications: 5 messages, AI analysis, actions (Reply/Forward/Archive)
- Reports: All 27 reports load with data, TSM report works
- AI Centre: Insights, Predictions, Assistant — all sub-routes work
- Admin: All 7 sub-pages load with content
- Tenant Portal: Self-service landing with action buttons
- Mobile responsive: Dashboard renders on mobile viewport

---

## PRIORITY ORDER FOR FIXES

1. **BUG-001** - Complaint detail crash (blocks entire complaints workflow)
2. **BUG-002** - Tenant detail crash from rent worklist (blocks arrears management)
3. **BUG-003** - ASB case detail navigation (blocks ASB workflow)
4. **WARN-008** - Tenancies search not filtering (usability issue for 68 rows)
5. **BUG-004** - Dashboard void KPI missing (data gap)
6. **WARN-001** - YantraAssist chat widget (AI feature visibility)
7. **WARN-003** - Explore map popups (interactivity issue)
8. Remaining warnings (lower priority)
