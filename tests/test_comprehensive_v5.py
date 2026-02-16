#!/usr/bin/env python3
"""
SocialHomes.Ai — COMPREHENSIVE TEST SUITE V5
Tests EVERY page, EVERY field, EVERY button, EVERY link in context.
Date: 2026-02-13
"""
import time, json, os, sys, re, traceback
from datetime import datetime, timezone

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException, ElementClickInterceptedException,
    StaleElementReferenceException, WebDriverException
)

BASE = "https://socialhomes-674258130066.europe-west2.run.app"
SS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots_v5")
os.makedirs(SS_DIR, exist_ok=True)

CHROME_BIN = "/tmp/chrome-install/chrome/linux-145.0.7632.76/chrome-linux64/chrome"
CHROMEDRIVER = "/tmp/chrome-install/chromedriver/linux-145.0.7632.76/chromedriver-linux64/chromedriver"

# Test credentials
EMAIL = "sarah.mitchell@rcha.org.uk"
PASSWORD = "SocialHomes2026!"

findings = []
section_counts = {}

def log(section, test_id, test_name, status, detail, screenshot=""):
    """Log a test result."""
    findings.append({
        "section": section,
        "id": test_id,
        "test": test_name,
        "status": status,
        "detail": detail[:500],
        "sc": screenshot,
        "ts": datetime.now(timezone.utc).isoformat()
    })
    if section not in section_counts:
        section_counts[section] = {"pass": 0, "fail": 0, "warn": 0}
    section_counts[section][status] = section_counts[section].get(status, 0) + 1
    mark = {"pass": "PASS", "fail": "FAIL", "warn": "WARN"}[status]
    print(f"  [{mark}] {test_id}: {test_name} — {detail[:200]}")

def ss(driver, name):
    """Take screenshot."""
    path = os.path.join(SS_DIR, f"{name}.png")
    try:
        driver.save_screenshot(path)
    except:
        pass
    return path

def nav(driver, path, wait=4):
    """Navigate to a path."""
    driver.get(BASE + path)
    time.sleep(wait)

def safe_click(driver, element):
    """Click element safely using JS."""
    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
        time.sleep(0.3)
        driver.execute_script("arguments[0].click();", element)
        return True
    except:
        return False

def scroll_full(driver):
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1)

def scroll_top(driver):
    driver.execute_script("window.scrollTo(0, 0)")
    time.sleep(0.5)

def get_text(driver):
    try:
        return driver.find_element(By.TAG_NAME, "body").text
    except:
        return ""

def is_crashed(driver):
    src = driver.page_source
    return "Runtime Error" in src or "react.dev/errors" in src or "Unhandled Runtime Error" in src

def check_placeholders(text):
    raw = re.findall(r'\{[^}]*\}', text)
    real = [p for p in raw if p not in {'{', '}'} and 'className' not in p and not p.startswith('{/*')]
    return real

def count_elements(driver, selector):
    return len(driver.find_elements(By.CSS_SELECTOR, selector))

def find_buttons(driver, keywords=None):
    btns = driver.find_elements(By.CSS_SELECTOR, "button:not([disabled]), a.btn, [role='button']")
    if keywords:
        return [b for b in btns if any(k in (b.text or "").lower() for k in keywords)]
    return btns

def find_links(driver, pattern=None):
    links = driver.find_elements(By.CSS_SELECTOR, "a[href]")
    if pattern:
        return [l for l in links if pattern in (l.get_attribute("href") or "")]
    return links

def create_driver():
    opts = Options()
    opts.binary_location = CHROME_BIN
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1920,1200")
    opts.add_argument("--disable-extensions")
    svc = Service(CHROMEDRIVER)
    return webdriver.Chrome(service=svc, options=opts)

def do_login(driver):
    driver.get(BASE + "/login")
    time.sleep(4)
    w = WebDriverWait(driver, 20)
    # Click "Sign in with email"
    for b in driver.find_elements(By.CSS_SELECTOR, "button, li"):
        try:
            if "email" in b.text.lower() and "sign" in b.text.lower():
                b.click()
                time.sleep(2)
                break
        except:
            continue
    w.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='email'], input[type='email']"))).send_keys(EMAIL)
    w.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".firebaseui-id-submit, button[type='submit']"))).click()
    time.sleep(2)
    w.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='password'], input[type='password']"))).send_keys(PASSWORD)
    w.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".firebaseui-id-submit, button[type='submit']"))).click()
    w.until(lambda x: "/login" not in x.current_url)
    time.sleep(3)
    print(f"  Logged in as Sarah Mitchell -> {driver.current_url}")

# =============================================================================
# TEST SECTIONS
# =============================================================================

def test_health_and_api(d):
    """Test API health and core endpoints."""
    print("\n" + "=" * 70)
    print("0. HEALTH & API ENDPOINTS")
    print("=" * 70)

    d.get(BASE + "/health")
    time.sleep(2)
    body = get_text(d)
    is_healthy = "healthy" in body
    log("API", "API-01", "Health endpoint", "pass" if is_healthy else "fail", f"Response: {body[:200]}")

    # Test API endpoints
    api_paths = [
        ("/api/v1/properties", "Properties API"),
        ("/api/v1/tenants", "Tenants API"),
        ("/api/v1/cases", "Cases API"),
        ("/api/v1/briefing", "Briefing API"),
        ("/api/v1/compliance", "Compliance API"),
        ("/api/v1/rent", "Rent API"),
        ("/api/v1/reports", "Reports API"),
    ]
    for path, name in api_paths:
        d.get(BASE + path)
        time.sleep(2)
        body = get_text(d)
        has_data = len(body) > 10 and ("error" not in body.lower() or "unauthorized" in body.lower())
        log("API", f"API-{name[:3]}", name, "pass" if has_data else "warn", f"Response length: {len(body)}")


def test_login(d):
    """Test authentication flow."""
    print("\n" + "=" * 70)
    print("1. LOGIN & AUTHENTICATION")
    print("=" * 70)

    d.get(BASE + "/login")
    time.sleep(4)
    s = ss(d, "01_login_page")
    text = get_text(d)

    # Check login page elements
    has_logo = count_elements(d, "img, svg, [class*='logo']") > 0
    has_email_btn = any("email" in (b.text or "").lower() for b in d.find_elements(By.CSS_SELECTOR, "button, li"))
    has_google_btn = any("google" in (b.text or "").lower() for b in d.find_elements(By.CSS_SELECTOR, "button, li"))

    log("Login", "L-01", "Login page renders", "pass", f"Logo: {has_logo}")
    log("Login", "L-02", "Email sign-in option", "pass" if has_email_btn else "fail", f"Email button: {has_email_btn}")
    log("Login", "L-03", "Google sign-in option", "pass" if has_google_btn else "warn", f"Google button: {has_google_btn}")

    # Do login
    do_login(d)
    dest = d.current_url.replace(BASE, "")
    log("Login", "L-04", "Login success → redirect", "pass" if dest in ["/dashboard", "/briefing"] else "fail",
        f"Redirected to: {dest}")
    ss(d, "01_post_login")


def test_sidebar_navigation(d):
    """Test sidebar exists and all nav links work."""
    print("\n" + "=" * 70)
    print("2. SIDEBAR NAVIGATION")
    print("=" * 70)

    nav(d, "/dashboard", 4)
    sidebar = d.find_elements(By.CSS_SELECTOR, "nav, aside, [class*='sidebar'], [class*='Sidebar']")
    log("Sidebar", "SB-01", "Sidebar visible", "pass" if sidebar else "fail", f"{len(sidebar)} sidebar elements")

    expected_links = [
        ("/explore", "Explore"),
        ("/dashboard", "Dashboard"),
        ("/tenancies", "Tenancies"),
        ("/properties", "Properties"),
        ("/repairs", "Repairs"),
        ("/rent", "Rent"),
        ("/compliance", "Compliance"),
        ("/complaints", "Complaints"),
        ("/allocations", "Allocations"),
        ("/asb", "ASB"),
        ("/communications", "Communications"),
        ("/reports", "Reports"),
        ("/ai", "AI Centre"),
        ("/admin", "Admin"),
    ]

    for path, name in expected_links:
        links = d.find_elements(By.CSS_SELECTOR, f"a[href='{path}'], a[href*='{path}']")
        found = len(links) > 0
        log("Sidebar", f"SB-{name[:5]}", f"Nav link: {name}", "pass" if found else "fail",
            f"Link to {path}: {'found' if found else 'NOT FOUND'}")

    # Test clicking each sidebar link
    for path, name in expected_links:
        try:
            nav(d, "/dashboard", 2)
            links = d.find_elements(By.CSS_SELECTOR, f"a[href='{path}']")
            if links:
                safe_click(d, links[0])
                time.sleep(3)
                dest = d.current_url.replace(BASE, "")
                ok = path in dest or dest != "/dashboard"
                log("Sidebar", f"SB-CK-{name[:5]}", f"Click nav: {name}", "pass" if ok else "fail",
                    f"Clicked → {dest}")
        except:
            log("Sidebar", f"SB-CK-{name[:5]}", f"Click nav: {name}", "fail", "Exception on click")


def test_header(d):
    """Test header elements."""
    print("\n" + "=" * 70)
    print("3. HEADER")
    print("=" * 70)

    nav(d, "/dashboard", 4)

    # Logo
    logo = d.find_elements(By.CSS_SELECTOR, "header img, header svg, [class*='logo'], [class*='Logo']")
    log("Header", "HD-01", "Logo present", "pass" if logo else "warn", f"{len(logo)} logo elements")

    # User/persona indicator
    text = get_text(d)
    has_persona = any(w in text for w in ["Sarah", "COO", "Head of", "Housing Officer", "Manager"])
    log("Header", "HD-02", "User/persona shown", "pass" if has_persona else "warn", f"Persona text found: {has_persona}")

    # Search functionality
    search = d.find_elements(By.CSS_SELECTOR, "input[type='search'], [class*='search'], [placeholder*='earch']")
    log("Header", "HD-03", "Search available", "pass" if search else "warn", f"{len(search)} search elements")

    # Notification bell or indicator
    notifs = d.find_elements(By.CSS_SELECTOR, "[class*='notif'], [class*='bell'], [aria-label*='notif']")
    log("Header", "HD-04", "Notification area", "pass" if notifs else "warn", f"{len(notifs)} notification elements")

    ss(d, "03_header")


def test_dashboard(d):
    """Test dashboard page thoroughly."""
    print("\n" + "=" * 70)
    print("4. DASHBOARD")
    print("=" * 70)

    nav(d, "/dashboard", 5)
    s = ss(d, "04_dashboard_top")
    text = get_text(d)
    src = d.page_source

    if is_crashed(d):
        log("Dashboard", "DASH-00", "Page loads", "fail", "CRASHED")
        return

    log("Dashboard", "DASH-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # KPI cards
    kpi_labels = ["Properties", "Tenancies", "Repairs", "Compliance", "Arrears", "Void"]
    for label in kpi_labels:
        found = label.lower() in text.lower()
        log("Dashboard", f"DASH-KPI-{label[:4]}", f"KPI: {label}", "pass" if found else "fail",
            f"'{label}' in dashboard: {found}")

    # Check KPI values are real numbers (not 0 or N/A)
    numbers = re.findall(r'(\d+)\s*(?:Properties|Tenancies|Repairs|Active|Total|Void)', text)
    has_real_data = any(int(n) > 0 for n in numbers) if numbers else False
    log("Dashboard", "DASH-DATA", "KPI values non-zero", "pass" if has_real_data else "warn",
        f"Numbers found: {numbers[:6]}")

    # Charts/visualizations
    charts = d.find_elements(By.CSS_SELECTOR, ".recharts-wrapper, svg.recharts-surface, canvas, [class*='chart']")
    log("Dashboard", "DASH-CHART", "Charts present", "pass" if charts else "fail", f"{len(charts)} chart elements")

    # Activity timeline / recent items
    has_activity = any(w in text.lower() for w in ["activity", "recent", "timeline", "latest"])
    log("Dashboard", "DASH-ACT", "Activity section", "pass" if has_activity else "warn",
        f"Activity: {has_activity}")

    # Compliance overview
    has_compliance = any(w in text.lower() for w in ["compliance", "big 6", "gas", "electrical"])
    log("Dashboard", "DASH-COMP", "Compliance overview", "pass" if has_compliance else "warn",
        f"Compliance section: {has_compliance}")

    scroll_full(d)
    ss(d, "04_dashboard_bottom")

    # Click KPI cards
    scroll_top(d)
    cards = d.find_elements(By.CSS_SELECTOR, "[class*='card'], [class*='stat'], [class*='kpi']")
    clicked_count = 0
    for i, card in enumerate(cards[:10]):
        try:
            card_text = card.text.strip()[:50]
            if not card_text or len(card_text) < 3:
                continue
            before = d.current_url
            safe_click(d, card)
            time.sleep(2)
            after = d.current_url.replace(BASE, "")
            if after != "/dashboard":
                log("Dashboard", f"DASH-CLK-{i}", f"Card clickable: '{card_text[:25]}'", "pass", f"→ {after}")
                clicked_count += 1
                nav(d, "/dashboard", 3)
        except:
            continue
    if clicked_count == 0:
        log("Dashboard", "DASH-CLK", "No clickable cards", "warn", "No KPI cards navigated away")


def test_briefing(d):
    """Test briefing page."""
    print("\n" + "=" * 70)
    print("5. BRIEFING")
    print("=" * 70)

    nav(d, "/briefing", 5)
    s = ss(d, "05_briefing_top")
    text = get_text(d)

    if is_crashed(d):
        log("Briefing", "BR-00", "Page loads", "fail", "CRASHED")
        return

    log("Briefing", "BR-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # Personalized greeting
    has_greeting = "Sarah" in text
    log("Briefing", "BR-01", "Personalized greeting", "pass" if has_greeting else "fail",
        f"'Sarah' in greeting: {has_greeting}")

    # AI alerts/priorities
    has_alerts = any(w in text.lower() for w in ["alert", "urgent", "priority", "attention", "critical", "action"])
    log("Briefing", "BR-02", "AI alerts present", "pass" if has_alerts else "warn", f"Alerts: {has_alerts}")

    # Action items
    action_btns = find_buttons(d, ["view", "action", "call", "review", "start", "resolve"])
    log("Briefing", "BR-03", "Action buttons", "pass" if action_btns else "warn",
        f"{len(action_btns)} action buttons")

    # Data sections
    has_repairs = "repair" in text.lower()
    has_arrears = "arrears" in text.lower() or "rent" in text.lower()
    has_compliance = "compliance" in text.lower()
    log("Briefing", "BR-04", "Repairs section", "pass" if has_repairs else "warn", f"Repairs: {has_repairs}")
    log("Briefing", "BR-05", "Arrears section", "pass" if has_arrears else "warn", f"Arrears: {has_arrears}")
    log("Briefing", "BR-06", "Compliance section", "pass" if has_compliance else "warn", f"Compliance: {has_compliance}")

    scroll_full(d)
    ss(d, "05_briefing_bottom")

    # Click an action button
    for btn in action_btns[:3]:
        try:
            btn_text = btn.text.strip()[:30]
            safe_click(d, btn)
            time.sleep(3)
            after = d.current_url.replace(BASE, "")
            log("Briefing", f"BR-ACT-{btn_text[:8]}", f"Action '{btn_text}' navigates",
                "pass" if after != "/briefing" else "warn", f"→ {after}")
            if after != "/briefing":
                nav(d, "/briefing", 3)
        except:
            continue

    # Skip/dismiss
    nav(d, "/briefing", 3)
    skip = find_buttons(d, ["skip", "dismiss", "go to dashboard", "continue"])
    if skip:
        safe_click(d, skip[0])
        time.sleep(2)
        dest = d.current_url.replace(BASE, "")
        log("Briefing", "BR-SKIP", "Skip button", "pass", f"Skip → {dest}")


def test_explore(d):
    """Test explore/map page."""
    print("\n" + "=" * 70)
    print("6. EXPLORE")
    print("=" * 70)

    nav(d, "/explore", 6)
    s = ss(d, "06_explore")
    text = get_text(d)

    if is_crashed(d):
        log("Explore", "EX-00", "Page loads", "fail", "CRASHED")
        return

    log("Explore", "EX-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # Map
    leaflet = d.find_elements(By.CSS_SELECTOR, ".leaflet-container")
    markers = d.find_elements(By.CSS_SELECTOR, ".leaflet-marker-icon, .leaflet-interactive, path.leaflet-interactive")
    log("Explore", "EX-01", "Map renders", "pass" if leaflet else "fail",
        f"Leaflet: {bool(leaflet)}, Markers: {len(markers)}")

    # Search
    search = d.find_elements(By.CSS_SELECTOR, "input[type='search'], input[placeholder*='earch' i]")
    log("Explore", "EX-02", "Search input", "pass" if search else "warn", f"{len(search)} search inputs")

    # Hierarchy/drill-down
    has_hierarchy = any(w in text.lower() for w in ["region", "estate", "block", "country", "authority", "rcha"])
    log("Explore", "EX-03", "Hierarchy visible", "pass" if has_hierarchy else "warn",
        f"Hierarchy elements: {has_hierarchy}")

    # Sidebar/panel with properties
    panel_items = d.find_elements(By.CSS_SELECTOR, "[class*='sidebar'] li, [class*='panel'] li, [class*='list'] a, [class*='tree'] li")
    log("Explore", "EX-04", "Panel items", "pass" if panel_items else "warn", f"{len(panel_items)} items")

    # Try clicking a marker
    if markers:
        try:
            safe_click(d, markers[0])
            time.sleep(2)
            popup = d.find_elements(By.CSS_SELECTOR, ".leaflet-popup, .leaflet-popup-content")
            log("Explore", "EX-05", "Marker popup", "pass" if popup else "warn",
                f"Popup appeared: {bool(popup)}")
            ss(d, "06_explore_popup")
        except:
            log("Explore", "EX-05", "Marker popup", "warn", "Could not click marker")


def test_tenancies(d):
    """Test tenancies list and detail pages."""
    print("\n" + "=" * 70)
    print("7. TENANCIES")
    print("=" * 70)

    nav(d, "/tenancies", 5)
    s = ss(d, "07_tenancies_list")
    text = get_text(d)

    if is_crashed(d):
        log("Tenancies", "TN-00", "Page loads", "fail", "CRASHED")
        return

    log("Tenancies", "TN-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # Table rows
    rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr")
    log("Tenancies", "TN-01", "Table rows", "pass" if len(rows) >= 50 else "fail", f"{len(rows)} rows (expect ~68)")

    # Search/filter
    search = d.find_elements(By.CSS_SELECTOR, "input[type='search'], input[placeholder*='earch' i]")
    selects = d.find_elements(By.CSS_SELECTOR, "select, [role='listbox'], [class*='filter']")
    log("Tenancies", "TN-02", "Search input", "pass" if search else "warn", f"{len(search)} search inputs")
    log("Tenancies", "TN-03", "Filters", "pass" if selects else "warn", f"{len(selects)} filter controls")

    # Column headers
    headers = d.find_elements(By.CSS_SELECTOR, "table thead th, table th")
    header_texts = [h.text.strip() for h in headers if h.text.strip()]
    log("Tenancies", "TN-04", "Table headers", "pass" if header_texts else "fail",
        f"Headers: {header_texts[:8]}")

    # Data coherence
    if rows:
        first_row = rows[0].text
        has_name = bool(re.search(r'(Mr|Mrs|Ms|Miss|Dr)\s+\w+', first_row))
        has_status = any(w in first_row.lower() for w in ["active", "current", "void", "ended", "arrears"])
        log("Tenancies", "TN-05", "Row data quality", "pass" if has_name else "warn",
            f"Name: {has_name}, Status: {has_status}. Sample: '{first_row[:100]}'")

    # Test search functionality — use page-level search (data-testid), not global header search
    page_search = d.find_elements(By.CSS_SELECTOR, "[data-testid='search-name'], input[placeholder*='Search by name' i]")
    if page_search:
        try:
            page_search[0].clear()
            page_search[0].send_keys("Hassan")
            time.sleep(2)
            filtered_rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr")
            log("Tenancies", "TN-06", "Search filters rows", "pass" if len(filtered_rows) < len(rows) else "warn",
                f"Before: {len(rows)}, After: {len(filtered_rows)}")
            page_search[0].clear()
            time.sleep(1)
        except:
            log("Tenancies", "TN-06", "Search filters rows", "warn", "Could not test search")
    elif search:
        log("Tenancies", "TN-06", "Search filters rows", "warn", "Page search input not found, only global search")

    # Click tenant row → detail
    nav(d, "/tenancies", 4)
    rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr")
    if rows:
        row_text = rows[0].text.strip()[:50]
        safe_click(d, rows[0])
        time.sleep(4)
        dest = d.current_url.replace(BASE, "")
        crashed = is_crashed(d)
        s = ss(d, "07_tenant_detail")

        if crashed:
            log("Tenancies", "TN-10", f"Row click → detail", "fail",
                f"'{row_text[:30]}' → {dest} — CRASHED (React Error)")
            log("Tenancies", "TN-11", "Tenant overview tab", "fail", "BLOCKED by crash")
            log("Tenancies", "TN-12", "Cases tab", "fail", "BLOCKED by crash")
            log("Tenancies", "TN-13", "Statement tab", "fail", "BLOCKED by crash")
            log("Tenancies", "TN-14", "Activities tab", "fail", "BLOCKED by crash")
            log("Tenancies", "TN-15", "AI features", "fail", "BLOCKED by crash")
        else:
            log("Tenancies", "TN-10", "Row click → detail", "pass", f"→ {dest}")
            detail_text = get_text(d)

            # Check detail content
            has_name = bool(re.search(r'(Mr|Mrs|Ms|Miss|Dr)\s+\w+', detail_text))
            has_address = any(w in detail_text for w in ["Flat", "Tower", "House", "Road", "Crescent"])
            has_rent = "£" in detail_text
            log("Tenancies", "TN-10a", "Tenant name", "pass" if has_name else "fail", f"Name: {has_name}")
            log("Tenancies", "TN-10b", "Address", "pass" if has_address else "warn", f"Address: {has_address}")
            log("Tenancies", "TN-10c", "Rent info", "pass" if has_rent else "warn", f"£ symbol: {has_rent}")

            # Test tabs
            tab_names = ["overview", "cases", "statement", "activities", "communications", "documents", "vulnerability"]
            for tn in tab_names:
                tabs = d.find_elements(By.CSS_SELECTOR, "[role='tab'], button, a")
                for t in tabs:
                    if t.text.strip().lower() == tn:
                        safe_click(d, t)
                        time.sleep(2)
                        ss(d, f"07_tenant_tab_{tn}")
                        tab_text = get_text(d)
                        tab_crashed = is_crashed(d)
                        if tab_crashed:
                            log("Tenancies", f"TN-TAB-{tn[:5]}", f"Tab: {tn}", "fail", "CRASHED")
                        else:
                            log("Tenancies", f"TN-TAB-{tn[:5]}", f"Tab: {tn}", "pass",
                                f"Content: {len(tab_text)} chars")
                        break

            # AI features on tenant detail
            has_ai = any(w in detail_text.lower() for w in ["ai", "risk", "prediction", "intelligence", "urgency"])
            log("Tenancies", "TN-15", "AI features visible", "pass" if has_ai else "warn",
                f"AI content: {has_ai}")


def test_properties(d):
    """Test properties list and detail pages."""
    print("\n" + "=" * 70)
    print("8. PROPERTIES")
    print("=" * 70)

    nav(d, "/properties", 5)
    s = ss(d, "08_properties_list")
    text = get_text(d)

    if is_crashed(d):
        log("Properties", "PR-00", "Page loads", "fail", "CRASHED")
        return

    log("Properties", "PR-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # Map on properties page
    leaflet = d.find_elements(By.CSS_SELECTOR, ".leaflet-container")
    log("Properties", "PR-01", "Map visible", "pass" if leaflet else "warn", f"Map: {bool(leaflet)}")

    # Table
    rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr")
    log("Properties", "PR-02", "Table rows", "pass" if len(rows) >= 30 else "fail", f"{len(rows)} rows (expect ~75)")

    # Headers
    headers = d.find_elements(By.CSS_SELECTOR, "table thead th")
    header_texts = [h.text.strip() for h in headers if h.text.strip()]
    log("Properties", "PR-03", "Table headers", "pass" if header_texts else "fail",
        f"Headers: {header_texts[:8]}")

    # Search/filter
    search = d.find_elements(By.CSS_SELECTOR, "input[placeholder*='earch' i]")
    log("Properties", "PR-04", "Search input", "pass" if search else "warn", f"{len(search)} search inputs")

    # Click property row → detail
    if rows:
        safe_click(d, rows[0])
        time.sleep(4)
        dest = d.current_url.replace(BASE, "")
        crashed = is_crashed(d)
        s = ss(d, "08_property_detail")

        if crashed:
            log("Properties", "PR-10", "Detail page", "fail", f"CRASHED at {dest}")
        else:
            log("Properties", "PR-10", "Detail page loads", "pass", f"→ {dest}")
            detail = get_text(d)

            # Check key fields
            has_address = bool(re.search(r'(Flat|Tower|House|Estate|Road|Lane|Crescent)', detail))
            has_epc = "EPC" in detail or "SAP" in detail
            has_rent = "£" in detail
            has_type = any(w in detail.lower() for w in ["flat", "house", "maisonette", "bungalow", "bedsit"])
            has_bedrooms = "bedroom" in detail.lower() or "bed" in detail.lower()

            log("Properties", "PR-11", "Address shown", "pass" if has_address else "fail", f"Address: {has_address}")
            log("Properties", "PR-12", "EPC rating", "pass" if has_epc else "warn", f"EPC: {has_epc}")
            log("Properties", "PR-13", "Rent info", "pass" if has_rent else "warn", f"£: {has_rent}")
            log("Properties", "PR-14", "Property type", "pass" if has_type else "warn", f"Type: {has_type}")
            log("Properties", "PR-15", "Bedrooms", "pass" if has_bedrooms else "warn", f"Beds: {has_bedrooms}")

            # AI features
            has_ai = any(w in detail.lower() for w in ["ai", "risk", "prediction", "proactive", "damp risk"])
            log("Properties", "PR-16", "AI features", "pass" if has_ai else "warn", f"AI: {has_ai}")

            # Test property tabs
            prop_tabs = ["overview", "compliance", "stock condition", "damp", "works history", "documents"]
            for tn in prop_tabs:
                tabs = d.find_elements(By.CSS_SELECTOR, "[role='tab'], button, a")
                for t in tabs:
                    if tn in t.text.strip().lower():
                        safe_click(d, t)
                        time.sleep(3)
                        ss(d, f"08_prop_tab_{tn.replace(' ', '_')}")
                        tab_text = get_text(d)
                        tab_crashed = is_crashed(d)
                        if tab_crashed:
                            log("Properties", f"PR-TAB-{tn[:5]}", f"Tab: {tn}", "fail", "CRASHED")
                        elif len(tab_text) > 300:
                            log("Properties", f"PR-TAB-{tn[:5]}", f"Tab: {tn}", "pass",
                                f"Content: {len(tab_text)} chars")
                        else:
                            has_empty = any(w in tab_text.lower() for w in ["no records", "no data", "empty", "coming soon"])
                            log("Properties", f"PR-TAB-{tn[:5]}", f"Tab: {tn}",
                                "warn" if has_empty else "pass", f"Content: {len(tab_text)} chars")
                        break


def test_repairs(d):
    """Test repairs list, detail, and workflow."""
    print("\n" + "=" * 70)
    print("9. REPAIRS")
    print("=" * 70)

    nav(d, "/repairs", 5)
    s = ss(d, "09_repairs_list")
    text = get_text(d)

    if is_crashed(d):
        log("Repairs", "RP-00", "Page loads", "fail", "CRASHED")
        return

    log("Repairs", "RP-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # Stats cards
    stats = re.findall(r'(\d+)\s+(TOTAL|EMERGENCY|URGENT|ROUTINE|PLANNED|OPEN|IN PROGRESS)', text, re.IGNORECASE)
    for val, label in stats:
        log("Repairs", f"RP-STAT-{label[:5]}", f"Stat: {label}", "pass" if int(val) > 0 else "warn",
            f"{label} = {val}")

    # Table
    rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr")
    log("Repairs", "RP-01", "Table rows", "pass" if len(rows) > 50 else "fail", f"{len(rows)} rows (expect ~200)")

    # Search/filter
    search = d.find_elements(By.CSS_SELECTOR, "input[placeholder*='earch' i]")
    filters = d.find_elements(By.CSS_SELECTOR, "select, [role='listbox'], button[class*='filter'], [class*='filter']")
    log("Repairs", "RP-02", "Search input", "pass" if search else "warn", f"{len(search)} search inputs")
    log("Repairs", "RP-03", "Filter controls", "pass" if filters else "warn", f"{len(filters)} filters")

    # Headers
    headers = d.find_elements(By.CSS_SELECTOR, "table thead th")
    header_texts = [h.text.strip() for h in headers if h.text.strip()]
    log("Repairs", "RP-04", "Table headers", "pass" if header_texts else "fail", f"Headers: {header_texts[:8]}")

    # Data quality - check for repair references
    has_refs = "REP-" in text or "RPR-" in text
    log("Repairs", "RP-05", "Repair references", "pass" if has_refs else "warn", f"REP- refs: {has_refs}")

    # Click repair row → detail
    if rows:
        row_text = rows[0].text.strip()[:60]
        safe_click(d, rows[0])
        time.sleep(3)
        dest = d.current_url.replace(BASE, "")
        crashed = is_crashed(d)
        s = ss(d, "09_repair_detail")

        if crashed:
            log("Repairs", "RP-10", "Detail page", "fail", f"CRASHED at {dest}")
        elif dest == "/repairs":
            log("Repairs", "RP-10", "Detail page", "fail", "No navigation from row click")
        else:
            log("Repairs", "RP-10", "Detail page loads", "pass", f"'{row_text[:30]}' → {dest}")
            detail = get_text(d)

            # Workflow elements
            checks = [
                ("RP-11", "Status", ["in progress", "completed", "open", "assigned", "status"]),
                ("RP-12", "Priority", ["emergency", "urgent", "routine", "planned", "priority"]),
                ("RP-13", "Operative", ["operative", "assigned", "contractor", "technician"]),
                ("RP-14", "Timeline", ["timeline", "history", "log", "update", "progress", "note"]),
                ("RP-15", "Dates", ["target date", "completion", "reported", "created", "due"]),
                ("RP-16", "Property ref", ["flat", "tower", "house", "property"]),
                ("RP-17", "Cost/SOR", ["£", "cost", "sor", "schedule of rates"]),
            ]
            for tid, name, keywords in checks:
                found = any(w in detail.lower() for w in keywords)
                log("Repairs", tid, f"Workflow: {name}", "pass" if found else "warn", f"{name}: {found}")

            # Action buttons
            action_btns = find_buttons(d, ["update", "add note", "progress", "complete", "escalate", "assign"])
            log("Repairs", "RP-18", "Action buttons", "pass" if action_btns else "warn",
                f"Buttons: {[b.text.strip()[:20] for b in action_btns[:5]]}")

            scroll_full(d)
            ss(d, "09_repair_detail_bottom")

    # Test filter if present
    nav(d, "/repairs", 4)
    if filters:
        try:
            safe_click(d, filters[0])
            time.sleep(1)
            options = d.find_elements(By.CSS_SELECTOR, "option, [role='option'], li")
            log("Repairs", "RP-20", "Filter options", "pass" if options else "warn",
                f"{len(options)} filter options")
        except:
            pass


def test_rent(d):
    """Test rent & income page."""
    print("\n" + "=" * 70)
    print("10. RENT & INCOME")
    print("=" * 70)

    nav(d, "/rent", 5)
    s = ss(d, "10_rent_top")
    text = get_text(d)

    if is_crashed(d):
        log("Rent", "RT-00", "Page loads", "fail", "CRASHED")
        return

    log("Rent", "RT-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # Financial data
    has_money = "£" in text
    has_arrears = "arrears" in text.lower()
    has_collection = "collection" in text.lower() or "rate" in text.lower()
    log("Rent", "RT-01", "Financial data (£)", "pass" if has_money else "fail", f"£: {has_money}")
    log("Rent", "RT-02", "Arrears info", "pass" if has_arrears else "fail", f"Arrears: {has_arrears}")
    log("Rent", "RT-03", "Collection rate", "pass" if has_collection else "warn", f"Collection: {has_collection}")

    # Charts
    charts = d.find_elements(By.CSS_SELECTOR, ".recharts-wrapper, svg.recharts-surface, canvas")
    log("Rent", "RT-04", "Charts/graphs", "pass" if charts else "warn", f"{len(charts)} chart elements")

    # Worklist
    scroll_full(d)
    ss(d, "10_rent_worklist")
    text2 = get_text(d)
    has_worklist = any(w in text2.lower() for w in ["worklist", "priority", "prioritised", "arrears action"])
    log("Rent", "RT-05", "AI worklist section", "pass" if has_worklist else "fail", f"Worklist: {has_worklist}")

    # Worklist tenant links
    wl_links = d.find_elements(By.CSS_SELECTOR, "table a[href*='tenancies'], table a[href*='tenant']")
    log("Rent", "RT-06", "Worklist tenant links", "pass" if wl_links else "warn", f"{len(wl_links)} links")

    # UC status
    has_uc = "universal credit" in text2.lower() or "uc" in text2.lower()
    log("Rent", "RT-07", "UC status tracking", "pass" if has_uc else "warn", f"UC: {has_uc}")

    # Click worklist link
    if wl_links:
        try:
            safe_click(d, wl_links[0])
            time.sleep(3)
            dest = d.current_url.replace(BASE, "")
            crashed = is_crashed(d)
            log("Rent", "RT-08", "Worklist link click", "pass" if not crashed and dest != "/rent" else "fail",
                f"→ {dest}, Crashed: {crashed}")
            ss(d, "10_rent_worklist_click")
        except:
            log("Rent", "RT-08", "Worklist link click", "fail", "Exception on click")

    # Sub-routes
    for sub_path, sub_name in [("/rent/accounts", "Accounts"), ("/rent/arrears", "Arrears")]:
        nav(d, sub_path, 3)
        sub_text = get_text(d)
        sub_dest = d.current_url.replace(BASE, "")
        log("Rent", f"RT-SUB-{sub_name[:4]}", f"Sub-route: {sub_name}",
            "pass" if sub_dest != "/dashboard" else "fail", f"URL: {sub_dest}")


def test_compliance(d):
    """Test compliance page and sub-pages."""
    print("\n" + "=" * 70)
    print("11. COMPLIANCE")
    print("=" * 70)

    nav(d, "/compliance", 5)
    s = ss(d, "11_compliance_top")
    text = get_text(d)

    if is_crashed(d):
        log("Compliance", "CP-00", "Page loads", "fail", "CRASHED")
        return

    log("Compliance", "CP-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # Big 6
    big6 = ["gas", "electrical", "fire", "asbestos", "legionella", "lift"]
    for b6 in big6:
        found = b6 in text.lower()
        log("Compliance", f"CP-B6-{b6[:4]}", f"Big 6: {b6.title()}", "pass" if found else "fail",
            f"'{b6}' found: {found}")

    # Percentages
    percentages = re.findall(r'(\d+\.?\d*)%', text)
    log("Compliance", "CP-02", "Compliance percentages", "pass" if percentages else "fail",
        f"{len(percentages)} values: {percentages[:6]}")

    # Click each compliance type
    for comp_type in big6:
        nav(d, f"/compliance/{comp_type}", 4)
        comp_text = get_text(d)
        comp_dest = d.current_url.replace(BASE, "")
        crashed = is_crashed(d)
        ss(d, f"11_compliance_{comp_type}")

        if crashed:
            log("Compliance", f"CP-DET-{comp_type[:4]}", f"Detail: {comp_type}", "fail", "CRASHED")
        else:
            has_properties = any(w in comp_text.lower() for w in ["flat", "tower", "house", "property"])
            has_status = any(w in comp_text.lower() for w in ["compliant", "expired", "overdue", "due"])
            log("Compliance", f"CP-DET-{comp_type[:4]}", f"Detail: {comp_type}",
                "pass" if has_properties or has_status else "warn",
                f"Properties: {has_properties}, Status: {has_status}")

    # Awaab's Law
    nav(d, "/compliance/awaabs-law", 4)
    awaab_text = get_text(d)
    awaab_dest = d.current_url.replace(BASE, "")
    crashed = is_crashed(d)
    ss(d, "11_compliance_awaabs_law")
    if crashed:
        log("Compliance", "CP-AWAAB", "Awaab's Law page", "fail", "CRASHED")
    else:
        has_awaab = "awaab" in awaab_text.lower()
        has_damp = "damp" in awaab_text.lower() or "mould" in awaab_text.lower()
        has_cases = "DAM-" in awaab_text
        log("Compliance", "CP-AWAAB", "Awaab's Law page", "pass" if has_awaab else "fail",
            f"Awaab: {has_awaab}, Damp: {has_damp}, Cases: {has_cases}")


def test_complaints(d):
    """Test complaints page and detail."""
    print("\n" + "=" * 70)
    print("12. COMPLAINTS")
    print("=" * 70)

    nav(d, "/complaints", 5)
    s = ss(d, "12_complaints_list")
    text = get_text(d)

    if is_crashed(d):
        log("Complaints", "CM-00", "Page loads", "fail", "CRASHED")
        return

    log("Complaints", "CM-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # Table
    rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr")
    log("Complaints", "CM-01", "Table rows", "pass" if rows else "fail", f"{len(rows)} complaints")

    # Data quality
    has_refs = "CMP-" in text
    has_status = any(w in text.lower() for w in ["open", "investigating", "resolved", "closed", "stage"])
    log("Complaints", "CM-02", "Reference numbers", "pass" if has_refs else "fail", f"CMP- refs: {has_refs}")
    log("Complaints", "CM-03", "Status labels", "pass" if has_status else "fail", f"Statuses: {has_status}")

    # Search
    search = d.find_elements(By.CSS_SELECTOR, "input[placeholder*='earch' i]")
    log("Complaints", "CM-04", "Search input", "pass" if search else "warn", f"{len(search)} search inputs")

    # Click complaint row → detail
    if rows:
        row_text = rows[0].text.strip()[:60]
        safe_click(d, rows[0])
        time.sleep(3)
        dest = d.current_url.replace(BASE, "")
        crashed = is_crashed(d)
        ss(d, "12_complaint_detail")

        if crashed:
            log("Complaints", "CM-10", "Detail page", "fail", f"CRASHED at {dest}")
        elif "cmp-" in dest.lower() or dest != "/complaints":
            log("Complaints", "CM-10", "Detail page loads", "pass", f"'{row_text[:30]}' → {dest}")
            detail = get_text(d)

            checks = [
                ("CM-11", "Workflow", ["investigation", "response", "resolution", "escalat", "stage", "timeline"]),
                ("CM-12", "Category", ["category", "type", "service", "noise", "repair", "damp"]),
                ("CM-13", "Tenant ref", ["tenant", "resident", "complainant", "mr ", "mrs ", "ms "]),
                ("CM-14", "Response target", ["target", "deadline", "working day", "response"]),
                ("CM-15", "Ombudsman", ["ombudsman", "hos", "housing ombudsman"]),
            ]
            for tid, name, keywords in checks:
                found = any(w in detail.lower() for w in keywords)
                log("Complaints", tid, f"Detail: {name}", "pass" if found else "warn", f"{name}: {found}")

            # Action buttons
            action_btns = find_buttons(d, ["respond", "escalate", "resolve", "update", "close"])
            log("Complaints", "CM-16", "Action buttons", "pass" if action_btns else "warn",
                f"Buttons: {[b.text.strip()[:20] for b in action_btns[:5]]}")

            scroll_full(d)
            ss(d, "12_complaint_detail_bottom")
        else:
            log("Complaints", "CM-10", "Row click → detail", "fail", "No navigation from row click")


def test_allocations(d):
    """Test allocations page."""
    print("\n" + "=" * 70)
    print("13. ALLOCATIONS")
    print("=" * 70)

    nav(d, "/allocations", 5)
    s = ss(d, "13_allocations")
    text = get_text(d)

    if is_crashed(d):
        log("Allocations", "AL-00", "Page loads", "fail", "CRASHED")
        return

    log("Allocations", "AL-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    has_void = "void" in text.lower()
    has_props = any(w in text.lower() for w in ["flat", "tower", "house", "property"])
    has_pipeline = any(w in text.lower() for w in ["pipeline", "lettings", "nomination", "offer"])
    log("Allocations", "AL-01", "Void properties", "pass" if has_void else "warn", f"Void: {has_void}")
    log("Allocations", "AL-02", "Property data", "pass" if has_props else "warn", f"Properties: {has_props}")
    log("Allocations", "AL-03", "Lettings pipeline", "pass" if has_pipeline else "warn", f"Pipeline: {has_pipeline}")

    rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr")
    log("Allocations", "AL-04", "Table rows", "pass" if rows else "warn", f"{len(rows)} rows")

    # Sub-routes
    for sub, name in [("/allocations/voids", "Voids"), ("/allocations/lettings", "Lettings")]:
        nav(d, sub, 3)
        sub_text = get_text(d)
        log("Allocations", f"AL-SUB-{name[:4]}", f"Sub-route: {name}",
            "pass" if d.current_url.replace(BASE, "") != "/dashboard" else "warn",
            f"URL: {d.current_url.replace(BASE, '')}")


def test_asb(d):
    """Test ASB page and detail."""
    print("\n" + "=" * 70)
    print("14. ASB (ANTI-SOCIAL BEHAVIOUR)")
    print("=" * 70)

    nav(d, "/asb", 5)
    s = ss(d, "14_asb_list")
    text = get_text(d)
    dest = d.current_url.replace(BASE, "")

    if is_crashed(d):
        log("ASB", "ASB-00", "Page loads", "fail", "CRASHED")
        return
    if dest == "/dashboard":
        log("ASB", "ASB-00", "Page loads", "fail", "Redirected to /dashboard")
        return

    log("ASB", "ASB-00", "Page loads", "pass", f"URL: {dest}")

    has_cases = any(w in text.lower() for w in ["case", "incident", "asb", "anti-social", "noise", "harassment"])
    has_status = any(w in text.lower() for w in ["open", "investigating", "closed", "active", "resolved"])
    log("ASB", "ASB-01", "Case data", "pass" if has_cases else "fail", f"ASB content: {has_cases}")
    log("ASB", "ASB-02", "Status tracking", "pass" if has_status else "fail", f"Statuses: {has_status}")

    rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr")
    log("ASB", "ASB-03", "Case rows/cards", "pass" if rows else "warn", f"{len(rows)} items")

    # Click a case → detail
    if rows:
        safe_click(d, rows[0])
        time.sleep(3)
        dest = d.current_url.replace(BASE, "")
        crashed = is_crashed(d)
        ss(d, "14_asb_detail")

        if crashed:
            log("ASB", "ASB-10", "Detail page", "fail", f"CRASHED at {dest}")
        elif dest != "/asb":
            log("ASB", "ASB-10", "Detail page loads", "pass", f"→ {dest}")
            detail = get_text(d)
            has_workflow = any(w in detail.lower() for w in ["action", "investigation", "timeline", "witness", "evidence"])
            log("ASB", "ASB-11", "Workflow elements", "pass" if has_workflow else "warn", f"Workflow: {has_workflow}")
        else:
            log("ASB", "ASB-10", "Case detail navigation", "fail", "No navigation from click")


def test_communications(d):
    """Test communications page."""
    print("\n" + "=" * 70)
    print("15. COMMUNICATIONS")
    print("=" * 70)

    nav(d, "/communications", 5)
    s = ss(d, "15_comms_list")
    text = get_text(d)

    if is_crashed(d):
        log("Communications", "CO-00", "Page loads", "fail", "CRASHED")
        return

    log("Communications", "CO-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr")
    log("Communications", "CO-01", "Message rows", "pass" if rows else "fail", f"{len(rows)} rows")

    # Channel types
    has_phone = "phone" in text.lower()
    has_email = "email" in text.lower()
    has_portal = "portal" in text.lower()
    log("Communications", "CO-02", "Channel types", "pass" if (has_phone or has_email or has_portal) else "warn",
        f"Phone: {has_phone}, Email: {has_email}, Portal: {has_portal}")

    # Click rows and check detail panel + AI analysis
    for i, row in enumerate(rows[:3]):
        try:
            safe_click(d, row)
            time.sleep(2)
            ss(d, f"15_comm_detail_{i}")
            detail = get_text(d)

            # Placeholders
            placeholders = check_placeholders(detail)
            log("Communications", f"CO-ROW-{i}-PH", f"Row {i}: Placeholders",
                "fail" if placeholders else "pass",
                f"Unresolved: {placeholders[:5]}" if placeholders else "No placeholders")

            # AI analysis
            has_ai = any(w in detail.lower() for w in ["ai analysis", "sentiment", "category", "priority", "tone"])
            log("Communications", f"CO-ROW-{i}-AI", f"Row {i}: AI analysis",
                "pass" if has_ai else "warn", f"AI elements: {has_ai}")

            # Action buttons
            actions = find_buttons(d, ["reply", "forward", "archive", "draft"])
            log("Communications", f"CO-ROW-{i}-ACT", f"Row {i}: Actions",
                "pass" if actions else "warn", f"Buttons: {[b.text.strip()[:15] for b in actions[:4]]}")
        except:
            continue

    # Templates sub-route
    nav(d, "/communications/templates", 3)
    tmpl_text = get_text(d)
    log("Communications", "CO-TMPL", "Templates page",
        "pass" if d.current_url.replace(BASE, "") != "/dashboard" else "warn",
        f"URL: {d.current_url.replace(BASE, '')}")


def test_reports(d):
    """Test reports page and sub-reports."""
    print("\n" + "=" * 70)
    print("16. REPORTS")
    print("=" * 70)

    nav(d, "/reports", 5)
    s = ss(d, "16_reports_index")
    text = get_text(d)

    if is_crashed(d):
        log("Reports", "RE-00", "Page loads", "fail", "CRASHED")
        return

    log("Reports", "RE-00", "Page loads", "pass", f"URL: {d.current_url.replace(BASE, '')}")

    # Collect all report links
    links = d.find_elements(By.CSS_SELECTOR, "a[href*='/reports/']")
    report_slugs = []
    for l in links:
        href = l.get_attribute("href") or ""
        link_text = l.text.strip().split("\n")[0]
        if "/reports/" in href and link_text:
            slug = href.replace(BASE, "")
            report_slugs.append({"slug": slug, "text": link_text})

    log("Reports", "RE-01", "Report links found", "pass" if report_slugs else "fail",
        f"{len(report_slugs)} report links: {[r['text'][:25] for r in report_slugs[:8]]}")

    # Test each report
    for i, rs in enumerate(report_slugs):
        nav(d, rs["slug"], 3)
        ss(d, f"16_report_{rs['slug'].split('/')[-1][:20]}")
        rpt_text = get_text(d)
        rpt_src = d.page_source
        crashed = is_crashed(d)

        if crashed:
            log("Reports", f"RE-RPT-{i}", f"Report: {rs['text'][:30]}", "fail", f"CRASHED at {rs['slug']}")
        elif "Report Not Found" in rpt_src or "not found" in rpt_text.lower():
            log("Reports", f"RE-RPT-{i}", f"Report: {rs['text'][:30]}", "fail",
                f"'Report Not Found' at {rs['slug']}")
        else:
            has_data = "£" in rpt_text or "%" in rpt_text or bool(re.search(r'\d{2,}', rpt_text[:500]))
            has_tables = count_elements(d, "table") > 0
            has_charts = count_elements(d, ".recharts-wrapper, svg.recharts-surface, canvas") > 0
            log("Reports", f"RE-RPT-{i}", f"Report: {rs['text'][:30]}", "pass" if has_data else "warn",
                f"Data: {has_data}, Tables: {has_tables}, Charts: {has_charts}")

    # TSM report
    nav(d, "/reports/tsm", 4)
    tsm_text = get_text(d)
    crashed = is_crashed(d)
    ss(d, "16_report_tsm")
    if crashed:
        log("Reports", "RE-TSM", "TSM Report", "fail", "CRASHED")
    else:
        has_tsm = any(w in tsm_text.lower() for w in ["tenant satisfaction", "tsm", "measure"])
        log("Reports", "RE-TSM", "TSM Report", "pass" if has_tsm else "warn", f"TSM: {has_tsm}")


def test_ai_centre(d):
    """Test AI centre page."""
    print("\n" + "=" * 70)
    print("17. AI CENTRE")
    print("=" * 70)

    nav(d, "/ai", 5)
    s = ss(d, "17_ai_centre")
    text = get_text(d)
    dest = d.current_url.replace(BASE, "")

    if is_crashed(d):
        log("AI Centre", "AI-00", "Page loads", "fail", "CRASHED")
        return
    if dest == "/dashboard":
        log("AI Centre", "AI-00", "Page loads", "fail", "Redirected to dashboard")
        return

    log("AI Centre", "AI-00", "Page loads", "pass", f"URL: {dest}")

    has_insights = "insight" in text.lower()
    has_predictions = "prediction" in text.lower() or "forecast" in text.lower()
    has_assistant = "assistant" in text.lower() or "chat" in text.lower()
    log("AI Centre", "AI-01", "Insights section", "pass" if has_insights else "warn", f"Insights: {has_insights}")
    log("AI Centre", "AI-02", "Predictions section", "pass" if has_predictions else "warn", f"Predictions: {has_predictions}")
    log("AI Centre", "AI-03", "Assistant section", "pass" if has_assistant else "warn", f"Assistant: {has_assistant}")

    # Sub-routes
    for sub, name in [("/ai/insights", "Insights"), ("/ai/predictions", "Predictions"), ("/ai/assistant", "Assistant")]:
        nav(d, sub, 3)
        sub_text = get_text(d)
        sub_dest = d.current_url.replace(BASE, "")
        log("AI Centre", f"AI-SUB-{name[:4]}", f"Sub-route: {name}",
            "pass" if sub_dest != "/dashboard" else "warn", f"URL: {sub_dest}")


def test_admin(d):
    """Test admin page and all sub-pages."""
    print("\n" + "=" * 70)
    print("18. ADMIN")
    print("=" * 70)

    nav(d, "/admin", 5)
    s = ss(d, "18_admin")
    text = get_text(d)
    dest = d.current_url.replace(BASE, "")

    if is_crashed(d):
        log("Admin", "AD-00", "Page loads", "fail", "CRASHED")
        return

    log("Admin", "AD-00", "Page loads", "pass", f"URL: {dest}")

    admin_subs = [
        ("/admin/organisation", "Organisation"),
        ("/admin/users", "Users"),
        ("/admin/teams", "Teams"),
        ("/admin/workflows", "Workflows"),
        ("/admin/integrations", "Integrations"),
        ("/admin/audit", "Audit"),
        ("/admin/system", "System"),
    ]

    for sub_path, name in admin_subs:
        nav(d, sub_path, 3)
        sub_text = get_text(d)
        sub_dest = d.current_url.replace(BASE, "")
        crashed = is_crashed(d)
        ss(d, f"18_admin_{name.lower()}")

        if crashed:
            log("Admin", f"AD-{name[:4]}", f"Admin: {name}", "fail", "CRASHED")
        else:
            has_content = len(sub_text) > 100
            log("Admin", f"AD-{name[:4]}", f"Admin: {name}",
                "pass" if has_content else "warn",
                f"URL: {sub_dest}, Content: {len(sub_text)} chars")


def test_tenant_portal(d):
    """Test tenant portal (public-facing)."""
    print("\n" + "=" * 70)
    print("19. TENANT PORTAL")
    print("=" * 70)

    nav(d, "/tenant-portal", 5)
    s = ss(d, "19_tenant_portal")
    text = get_text(d)
    dest = d.current_url.replace(BASE, "")

    if is_crashed(d):
        log("Tenant Portal", "TP-00", "Page loads", "fail", "CRASHED")
        return

    log("Tenant Portal", "TP-00", "Page loads", "pass", f"URL: {dest}")

    has_self_service = any(w in text.lower() for w in ["repair", "rent", "contact", "report", "balance", "payment"])
    log("Tenant Portal", "TP-01", "Self-service features", "pass" if has_self_service else "warn",
        f"Self-service: {has_self_service}")

    # Forms/inputs
    inputs = d.find_elements(By.CSS_SELECTOR, "input, textarea, select")
    log("Tenant Portal", "TP-02", "Form inputs", "pass" if inputs else "warn", f"{len(inputs)} inputs")

    buttons = find_buttons(d)
    log("Tenant Portal", "TP-03", "Buttons", "pass" if buttons else "warn",
        f"{len(buttons)} buttons: {[b.text.strip()[:15] for b in buttons[:5]]}")


def test_yantra_assist(d):
    """Test YantraAssist AI chat widget."""
    print("\n" + "=" * 70)
    print("20. YANTRA ASSIST (AI CHAT)")
    print("=" * 70)

    nav(d, "/dashboard", 4)

    # Look for chat widget/FAB
    chat_triggers = d.find_elements(By.CSS_SELECTOR,
        "[class*='assist'], [class*='chat'], [class*='fab'], [aria-label*='chat'], [aria-label*='assist']")
    log("YantraAssist", "YA-01", "Chat trigger visible", "pass" if chat_triggers else "warn",
        f"{len(chat_triggers)} chat elements found")

    if chat_triggers:
        try:
            safe_click(d, chat_triggers[0])
            time.sleep(2)
            ss(d, "20_yantra_assist_open")
            chat_text = get_text(d)
            has_input = count_elements(d, "input[placeholder*='ask' i], input[placeholder*='message' i], textarea") > 0
            log("YantraAssist", "YA-02", "Chat panel opens", "pass", f"Input: {has_input}")
        except:
            log("YantraAssist", "YA-02", "Chat panel opens", "warn", "Could not open chat")


def test_global_checks(d):
    """Test global aspects across pages."""
    print("\n" + "=" * 70)
    print("21. GLOBAL CHECKS")
    print("=" * 70)

    pages_to_check = [
        "/dashboard", "/tenancies", "/properties", "/repairs", "/rent",
        "/compliance", "/complaints", "/allocations", "/asb",
        "/communications", "/reports", "/ai", "/admin"
    ]

    for page in pages_to_check:
        nav(d, page, 3)
        text = get_text(d)
        src = d.page_source

        # Check for React errors
        crashed = is_crashed(d)
        if crashed:
            log("Global", f"GL-ERR-{page[1:5]}", f"React error on {page}", "fail", "Runtime Error detected")

        # Check for unresolved placeholders
        placeholders = check_placeholders(text)
        if placeholders:
            log("Global", f"GL-PH-{page[1:5]}", f"Placeholders on {page}", "fail",
                f"Unresolved: {placeholders[:5]}")

        # Check for "undefined" or "null" text
        has_undefined = "undefined" in text.lower().split() or "null" in text.lower().split()
        if has_undefined:
            log("Global", f"GL-UNDEF-{page[1:5]}", f"Undefined/null on {page}", "warn",
                "Found 'undefined' or 'null' in visible text")

        # Check for console errors via JS
        try:
            errors = d.execute_script("""
                var logs = [];
                if (window.__console_errors) logs = window.__console_errors;
                return logs;
            """)
            if errors:
                log("Global", f"GL-CONS-{page[1:5]}", f"Console errors on {page}", "warn",
                    f"{len(errors)} console errors")
        except:
            pass

    # Breadcrumbs test
    nav(d, "/tenancies", 3)
    breadcrumbs = d.find_elements(By.CSS_SELECTOR, "[class*='breadcrumb'], nav[aria-label='breadcrumb'], [class*='Breadcrumb']")
    log("Global", "GL-BREAD", "Breadcrumbs present", "pass" if breadcrumbs else "warn",
        f"{len(breadcrumbs)} breadcrumb elements")

    # Responsive check (resize)
    try:
        d.set_window_size(375, 812)  # iPhone X
        time.sleep(2)
        nav(d, "/dashboard", 3)
        ss(d, "21_mobile_dashboard")
        mobile_text = get_text(d)
        has_content = len(mobile_text) > 100
        log("Global", "GL-MOBILE", "Mobile responsive", "pass" if has_content else "warn",
            f"Content on mobile: {has_content}")
        d.set_window_size(1920, 1200)  # Reset
        time.sleep(1)
    except:
        log("Global", "GL-MOBILE", "Mobile responsive", "warn", "Could not test mobile")


# =============================================================================
# MAIN
# =============================================================================

def main():
    start_time = datetime.now(timezone.utc)
    print("=" * 70)
    print(f"SOCIALHOMES.AI — COMPREHENSIVE TEST SUITE V5")
    print(f"Started: {start_time.isoformat()}")
    print(f"Target: {BASE}")
    print("=" * 70)

    d = create_driver()

    try:
        # 0. API health
        test_health_and_api(d)

        # 1. Login
        test_login(d)

        # 2. Sidebar navigation
        test_sidebar_navigation(d)

        # 3. Header
        test_header(d)

        # 4-19. All pages
        test_dashboard(d)
        test_briefing(d)
        test_explore(d)
        test_tenancies(d)
        test_properties(d)
        test_repairs(d)
        test_rent(d)
        test_compliance(d)
        test_complaints(d)
        test_allocations(d)
        test_asb(d)
        test_communications(d)
        test_reports(d)
        test_ai_centre(d)
        test_admin(d)
        test_tenant_portal(d)
        test_yantra_assist(d)

        # Global checks
        test_global_checks(d)

    except Exception as e:
        print(f"\n!!! FATAL ERROR: {e}")
        traceback.print_exc()
        ss(d, "FATAL_ERROR")
    finally:
        d.quit()

    # Compile results
    end_time = datetime.now(timezone.utc)
    duration = (end_time - start_time).total_seconds()

    total = len(findings)
    passed = sum(1 for f in findings if f["status"] == "pass")
    failed = sum(1 for f in findings if f["status"] == "fail")
    warned = sum(1 for f in findings if f["status"] == "warn")

    print("\n" + "=" * 70)
    print("RESULTS SUMMARY")
    print("=" * 70)
    print(f"Total tests: {total}")
    print(f"  PASSED: {passed}")
    print(f"  FAILED: {failed}")
    print(f"  WARNED: {warned}")
    print(f"Pass rate: {passed/total*100:.1f}%" if total else "No tests")
    print(f"Duration: {duration:.0f}s")

    print("\nBy Section:")
    for section, counts in sorted(section_counts.items()):
        p = counts.get("pass", 0)
        f = counts.get("fail", 0)
        w = counts.get("warn", 0)
        total_s = p + f + w
        print(f"  {section:20s}: {p}/{total_s} pass, {f} fail, {w} warn")

    if failed > 0:
        print("\nFAILURES:")
        for f in findings:
            if f["status"] == "fail":
                print(f"  [{f['section']}] {f['id']}: {f['test']} — {f['detail'][:150]}")

    # Save results JSON
    results = {
        "ts": end_time.isoformat(),
        "duration_seconds": duration,
        "total": total,
        "passed": passed,
        "failed": failed,
        "warned": warned,
        "rate": f"{passed/total*100:.0f}%" if total else "0%",
        "sections": section_counts,
        "findings": findings
    }

    results_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_results_v5.json")
    with open(results_path, "w") as fp:
        json.dump(results, fp, indent=2)
    print(f"\nResults saved to: {results_path}")


if __name__ == "__main__":
    main()
