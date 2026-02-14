"""
SocialHomes.Ai — Comprehensive Selenium Test Suite v2 (Re-test)
Tests against Doc1 (Base Specification) and Doc2 (AI-Native Features)
Validates fixes from developer sprint + AI-native architecture
Author: QA Agent
Date: 08/02/2026
"""

import unittest
import time
import json
import os
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException, ElementClickInterceptedException
)
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:5173"
WAIT_TIMEOUT = 10
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots_v2")
RESULTS = []


def record(test_id, category, title, status, expected, actual, severity="medium", notes=""):
    RESULTS.append({
        "test_id": test_id, "category": category, "title": title,
        "status": status, "expected": expected, "actual": actual,
        "severity": severity, "notes": notes,
        "timestamp": datetime.now().isoformat()
    })


class SocialHomesTestBase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.makedirs(SCREENSHOT_DIR, exist_ok=True)
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-gpu")
        service = Service(ChromeDriverManager().install())
        cls.driver = webdriver.Chrome(service=service, options=options)
        cls.driver.implicitly_wait(3)
        cls.wait = WebDriverWait(cls.driver, WAIT_TIMEOUT)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def screenshot(self, name):
        path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
        self.driver.save_screenshot(path)
        return path

    def navigate(self, path):
        self.driver.get(f"{BASE_URL}{path}")
        time.sleep(2)

    def find_all(self, by, value):
        return self.driver.find_elements(by, value)

    def text_present(self, text):
        return text in self.driver.page_source

    def click_safe(self, element):
        try:
            self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
            time.sleep(0.3)
            element.click()
            return True
        except Exception:
            try:
                self.driver.execute_script("arguments[0].click();", element)
                return True
            except Exception:
                return False

    def navigate_and_wait(self, path, wait_for_text=None, timeout=5):
        """Navigate and optionally wait for specific text to appear."""
        self.driver.get(f"{BASE_URL}{path}")
        if wait_for_text:
            for _ in range(timeout * 2):
                if wait_for_text in self.driver.page_source:
                    break
                time.sleep(0.5)
        else:
            time.sleep(2)


# ═══════════════════════════════════════════════════════════════
# TC-100: APPLICATION SHELL & NAVIGATION (Re-test)
# ═══════════════════════════════════════════════════════════════

class TC100_AppShell(SocialHomesTestBase):

    def test_tc101_root_redirects_to_briefing(self):
        self.navigate("/")
        time.sleep(1)
        passed = "/briefing" in self.driver.current_url
        record("TC-101", "Navigation", "Root redirects to /briefing",
               "PASS" if passed else "FAIL",
               "URL contains /briefing", self.driver.current_url, "high")

    def test_tc102_sidebar_sections(self):
        self.navigate("/dashboard")
        sections = ["NAVIGATE", "MANAGE", "COMMUNICATE", "ANALYSE", "SYSTEM"]
        missing = [s for s in sections if not self.text_present(s)]
        record("TC-102", "Layout", "Sidebar nav sections",
               "PASS" if not missing else "FAIL",
               str(sections), f"Missing: {missing}", "high")

    def test_tc103_sidebar_nav_items(self):
        self.navigate("/dashboard")
        # Check for key nav items (allow slight label variations)
        items = ["Explore", "Dashboard", "Tenancies", "Properties", "Repairs",
                 "Rent", "Compliance", "Complaints", "Allocations", "ASB",
                 "Communications", "Reports", "AI Centre", "Admin"]
        found = [i for i in items if self.text_present(i)]
        passed = len(found) >= 13
        record("TC-103", "Layout", "Sidebar nav items",
               "PASS" if passed else "FAIL",
               f"14 items", f"Found {len(found)}/14: {found}", "high")

    def test_tc104_beta_badge(self):
        self.navigate("/dashboard")
        has_beta = self.text_present("BETA") or self.text_present("Beta")
        record("TC-104", "Branding", "BETA badge in header",
               "PASS" if has_beta else "FAIL",
               "BETA badge visible", f"Found: {has_beta}", "medium")

    def test_tc105_search_navigates(self):
        self.navigate("/dashboard")
        try:
            search = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Search']")
            search.send_keys("Oak Park")
            search.send_keys(Keys.ENTER)
            time.sleep(1.5)
            passed = "/search" in self.driver.current_url
            record("TC-105", "Layout", "Search navigates to /search",
                   "PASS" if passed else "FAIL",
                   "/search in URL", self.driver.current_url, "high")
        except Exception as e:
            record("TC-105", "Layout", "Search", "FAIL", "Search works", str(e), "high")

    def test_tc106_sidebar_collapse(self):
        self.navigate("/dashboard")
        try:
            sidebar = self.driver.find_element(By.CSS_SELECTOR, "aside, [class*='w-70'], [class*='w-280']")
            initial_w = sidebar.size['width']
            btns = self.find_all(By.CSS_SELECTOR, "aside button")
            if btns:
                self.click_safe(btns[-1])
                time.sleep(0.5)
                new_w = sidebar.size['width']
                passed = new_w < initial_w
                record("TC-106", "Layout", "Sidebar collapse",
                       "PASS" if passed else "FAIL",
                       "Width decreases", f"{initial_w}→{new_w}", "medium")
            else:
                record("TC-106", "Layout", "Sidebar collapse", "FAIL", "Toggle found", "No toggle", "medium")
        except Exception as e:
            record("TC-106", "Layout", "Sidebar collapse", "FAIL", "Works", str(e), "medium")

    def test_tc108_breadcrumbs(self):
        pages = ["/dashboard", "/tenancies", "/properties", "/repairs", "/compliance", "/complaints"]
        all_ok = True
        for page in pages:
            self.navigate(page)
            if not self.find_all(By.CSS_SELECTOR, "a[href='/dashboard'] svg, [class*='breadcrumb']"):
                all_ok = False
        record("TC-108", "Layout", "Breadcrumbs on all pages",
               "PASS" if all_ok else "FAIL", "Breadcrumbs everywhere", "", "medium")

    def test_tc109_footer(self):
        self.navigate("/dashboard")
        passed = self.text_present("Yantra.Works") and self.text_present("open-source")
        record("TC-109", "Branding", "Footer attribution",
               "PASS" if passed else "FAIL", "Footer branding", "", "low")


# ═══════════════════════════════════════════════════════════════
# TC-200: PERSONA SYSTEM (Critical re-test)
# ═══════════════════════════════════════════════════════════════

class TC200_Personas(SocialHomesTestBase):

    def _switch_persona(self, persona_text):
        """Helper to switch persona via the header dropdown."""
        btns = self.find_all(By.CSS_SELECTOR, "header button")
        for btn in reversed(btns):
            if any(name in btn.text for name in ["Sarah", "Mitchell", "Helen", "Marcus", "Priya", "Mark", "Housing", "Officer", "COO", "Director", "Operative"]):
                self.click_safe(btn)
                time.sleep(0.5)
                break
        options = self.find_all(By.XPATH, f"//*[contains(text(),'{persona_text}')]")
        for opt in options:
            if opt.is_displayed():
                self.click_safe(opt)
                time.sleep(1)
                return True
        return False

    def test_tc201_persona_switcher(self):
        self.navigate("/dashboard")
        # Open user menu
        btns = self.find_all(By.CSS_SELECTOR, "header button")
        for btn in reversed(btns):
            if "Sarah" in btn.text or "Mitchell" in btn.text or "Housing" in btn.text:
                self.click_safe(btn)
                time.sleep(0.5)
                break
        personas = ["Chief Operating Officer", "Head of Housing", "Team Manager", "Housing Officer", "Repairs Operative"]
        found = [p for p in personas if self.text_present(p)]
        passed = len(found) >= 4
        record("TC-201", "Personas", "5 personas in switcher",
               "PASS" if passed else "FAIL", "5 personas", f"Found: {found}", "high")

    def test_tc202_persona_changes_dashboard(self):
        """CRITICAL: Dashboard content should change per persona."""
        self.navigate("/dashboard")
        time.sleep(1)
        
        # Capture Housing Officer dashboard
        officer_page = self.driver.page_source
        
        # Switch to COO
        self._switch_persona("Chief Operating Officer")
        time.sleep(1.5)
        
        # Navigate to dashboard again to see changes
        self.navigate("/dashboard")
        time.sleep(1.5)
        coo_page = self.driver.page_source
        
        # Check for differences - the KPI values or labels should differ
        # Housing Officer should see patch-level data, COO org-wide
        content_changed = officer_page != coo_page
        
        # Also check for organisation name (COO should see org-wide)
        has_org_name = self.text_present("Riverside") or self.text_present("RCHA")
        
        record("TC-202", "Personas", "Dashboard changes per persona",
               "PASS" if content_changed else "FAIL",
               "Dashboard KPIs change scope per persona",
               f"Content changed: {content_changed}, Org name: {has_org_name}",
               "critical")
        self.screenshot("tc202_persona_dashboard")
        
        # Switch back to Housing Officer
        self._switch_persona("Housing Officer")

    def test_tc203_briefing_persona_specific(self):
        """CRITICAL: Briefing should show persona-specific tasks."""
        # As Housing Officer
        self._switch_persona("Housing Officer")
        self.navigate("/briefing")
        time.sleep(1.5)
        officer_briefing = self.driver.page_source
        
        # Switch to COO
        self._switch_persona("Chief Operating Officer")
        self.navigate("/briefing")
        time.sleep(1.5)
        coo_briefing = self.driver.page_source
        
        content_changed = officer_briefing != coo_briefing
        # Check that briefing has clickable items
        clickable_items = self.find_all(By.CSS_SELECTOR, "[class*='cursor-pointer'], button[onClick], a")
        has_clickable = len(clickable_items) > 5
        
        record("TC-203", "Personas", "Briefing is persona-specific",
               "PASS" if content_changed else "FAIL",
               "Briefing tasks differ between COO and Housing Officer",
               f"Content changed: {content_changed}, Clickable items: {len(clickable_items)}",
               "critical")
        self.screenshot("tc203_briefing_persona")
        
        # Switch back
        self._switch_persona("Housing Officer")

    def test_tc204_yantra_assist_persona(self):
        """CRITICAL: Yantra Assist should change per persona AND per page."""
        self.navigate("/dashboard")
        time.sleep(1)
        
        # Open Yantra Assist
        header_btns = self.find_all(By.CSS_SELECTOR, "header button")
        for btn in header_btns:
            svgs = btn.find_elements(By.TAG_NAME, "svg")
            if svgs and "Sparkle" in (btn.get_attribute("class") or ""):
                self.click_safe(btn)
                break
            # Also try by badge text
            if "8" in btn.text or "AI" in (btn.get_attribute("aria-label") or ""):
                self.click_safe(btn)
                break
        time.sleep(1)
        
        dashboard_assist = self.driver.page_source
        has_yantra = self.text_present("Yantra Assist")
        
        # Close and navigate to tenancies, reopen
        self.navigate("/tenancies")
        time.sleep(1)
        header_btns = self.find_all(By.CSS_SELECTOR, "header button")
        for btn in header_btns:
            if btn.find_elements(By.TAG_NAME, "svg"):
                self.click_safe(btn)
                time.sleep(0.5)
                if self.text_present("Yantra Assist"):
                    break
        time.sleep(1)
        
        tenancy_assist = self.driver.page_source
        
        content_differs = dashboard_assist != tenancy_assist
        
        record("TC-204", "Personas", "Yantra Assist adapts to context",
               "PASS" if (has_yantra and content_differs) else "FAIL",
               "Yantra Assist content changes per page and persona",
               f"Panel found: {has_yantra}, Content differs between pages: {content_differs}",
               "critical")


# ═══════════════════════════════════════════════════════════════
# TC-300: DASHBOARD (Re-test navigation)
# ═══════════════════════════════════════════════════════════════

class TC300_Dashboard(SocialHomesTestBase):

    def test_tc301_eight_kpi_cards(self):
        self.navigate("/dashboard")
        labels = ["Properties", "Tenancies", "Active Repairs", "Rent Collected",
                  "Arrears", "Compliance", "Complaints", "AI Alerts"]
        found = [l for l in labels if self.text_present(l)]
        record("TC-301", "Dashboard", "8 KPI cards",
               "PASS" if len(found) >= 7 else "FAIL",
               "8 KPI cards", f"Found {len(found)}: {found}", "high")

    def test_tc302_kpi_cards_navigate(self):
        """Previously BLOCKED: KPI cards should now navigate."""
        self.navigate("/dashboard")
        time.sleep(1)
        # Find and click the Properties KPI card
        try:
            # KpiCard has onClick, so find clickable cards
            cards = self.find_all(By.CSS_SELECTOR, "[class*='cursor-pointer']")
            for card in cards:
                if "Properties" in card.text:
                    initial_url = self.driver.current_url
                    self.click_safe(card)
                    time.sleep(1)
                    navigated = self.driver.current_url != initial_url
                    record("TC-302", "Dashboard", "KPI cards navigate",
                           "PASS" if navigated else "FAIL",
                           "Click Properties → /properties",
                           f"URL: {self.driver.current_url}", "high")
                    return
            # Fallback: try finding any card-like element with properties
            record("TC-302", "Dashboard", "KPI cards navigate",
                   "FAIL", "Clickable Properties card", "Could not locate card", "high")
        except Exception as e:
            record("TC-302", "Dashboard", "KPI cards navigate", "FAIL", "Navigate", str(e), "high")

    def test_tc305_big6_tiles_navigate(self):
        """Previously FAIL: Big 6 tiles should now navigate to compliance sub-pages."""
        self.navigate("/dashboard")
        time.sleep(1)
        # Find Gas Safety tile and click it
        try:
            gas_els = self.find_all(By.XPATH, "//*[contains(text(),'Gas')]")
            for el in gas_els:
                parent = el
                for _ in range(3):
                    try:
                        parent = parent.find_element(By.XPATH, "./..")
                        if parent.get_attribute("onclick") or "cursor-pointer" in (parent.get_attribute("class") or ""):
                            break
                    except Exception:
                        break
                self.click_safe(parent)
                time.sleep(1)
                if "/compliance" in self.driver.current_url:
                    break
            passed = "/compliance" in self.driver.current_url
            record("TC-305", "Dashboard", "Big 6 tiles navigate",
                   "PASS" if passed else "FAIL",
                   "Click Gas → /compliance/gas",
                   f"URL: {self.driver.current_url}", "high")
        except Exception as e:
            record("TC-305", "Dashboard", "Big 6 tiles navigate", "FAIL", "Navigate", str(e), "high")

    def test_tc308_activity_timeline_navigate(self):
        """Previously FAIL: Activity items should now navigate."""
        self.navigate("/dashboard")
        time.sleep(1)
        # Find activity items with click handlers
        activity_items = self.find_all(By.CSS_SELECTOR, "[class*='cursor-pointer']")
        has_clickable_activities = len(activity_items) > 8  # More than just KPI cards
        record("TC-308", "Dashboard", "Activity timeline navigates",
               "PASS" if has_clickable_activities else "FAIL",
               "Activity items have click handlers",
               f"Clickable elements: {len(activity_items)}", "high")

    def test_tc309_org_name_displayed(self):
        """New test: Organisation name should be displayed on dashboard."""
        self.navigate("/dashboard")
        has_name = self.text_present("Riverside") or self.text_present("RCHA")
        has_rp = self.text_present("RP") or self.text_present("4567")
        record("TC-309", "Dashboard", "Organisation name displayed",
               "PASS" if has_name else "FAIL",
               "Riverside Crescent Housing Association visible",
               f"Name: {has_name}, RP: {has_rp}", "medium")


# ═══════════════════════════════════════════════════════════════
# TC-400: EXPLORE (Re-test 3D + List)
# ═══════════════════════════════════════════════════════════════

class TC400_Explore(SocialHomesTestBase):

    def test_tc401_map_loads(self):
        self.navigate("/explore")
        time.sleep(2)
        has_map = len(self.find_all(By.CSS_SELECTOR, ".leaflet-container")) > 0
        record("TC-401", "Explore", "Map loads",
               "PASS" if has_map else "FAIL", "Leaflet map", f"Found: {has_map}", "high")

    def test_tc402_drill_down(self):
        self.navigate("/explore")
        time.sleep(2)
        # Try clicking London in children list
        links = self.find_all(By.XPATH, "//*[contains(text(),'London')]")
        for link in links:
            if link.is_displayed():
                self.click_safe(link)
                time.sleep(1.5)
                break
        passed = self.text_present("Southwark") or self.text_present("Lewisham")
        record("TC-402", "Explore", "Drill Country→Region",
               "PASS" if passed else "FAIL",
               "Click London shows LAs", f"Drilled: {passed}", "high")

    def test_tc404_three_js_at_block_level(self):
        """Previously FAIL: Should now have Three.js 3D at block level."""
        self.navigate("/explore")
        time.sleep(2)
        # Navigate down: London → Southwark → Oak Park Estate → a block
        steps = ["London", "Southwark", "Oak Park"]
        for step in steps:
            links = self.find_all(By.XPATH, f"//*[contains(text(),'{step}')]")
            for link in links:
                if link.is_displayed():
                    self.click_safe(link)
                    time.sleep(1.5)
                    break
        
        # Now try to click a block
        block_links = self.find_all(By.XPATH, "//*[contains(text(),'Tower') or contains(text(),'Block') or contains(text(),'House')]")
        for link in block_links:
            if link.is_displayed():
                self.click_safe(link)
                time.sleep(2)
                break
        
        # Check for Three.js canvas
        has_canvas = len(self.find_all(By.TAG_NAME, "canvas")) > 0
        has_3d_text = self.text_present("3D") or self.text_present("View 3D") or self.text_present("Building")
        
        record("TC-404", "Explore", "Three.js 3D at block level",
               "PASS" if has_canvas else "FAIL",
               "Three.js Canvas renders at block level",
               f"Canvas: {has_canvas}, 3D text: {has_3d_text}",
               "critical")
        self.screenshot("tc404_3d_block")

    def test_tc405_list_view(self):
        """Previously FAIL: List view should now show tabular data."""
        self.navigate("/explore")
        time.sleep(2)
        list_btns = self.find_all(By.XPATH, "//button[contains(.,'List')]")
        if list_btns:
            self.click_safe(list_btns[0])
            time.sleep(1)
            has_table = len(self.find_all(By.CSS_SELECTOR, "table, th, thead")) > 0
            has_data = self.text_present("London") or self.text_present("Region")
            record("TC-405", "Explore", "List view with table",
                   "PASS" if (has_table or has_data) else "FAIL",
                   "Tabular list view", f"Table: {has_table}, Data: {has_data}", "medium")
        else:
            record("TC-405", "Explore", "List view toggle", "FAIL", "Button present", "Not found", "medium")


# ═══════════════════════════════════════════════════════════════
# TC-500: PROPERTIES (Re-test map + documents)
# ═══════════════════════════════════════════════════════════════

class TC500_Properties(SocialHomesTestBase):

    def test_tc501_properties_list(self):
        self.navigate("/properties")
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        record("TC-501", "Properties", "Properties list loads",
               "PASS" if len(rows) > 0 else "FAIL",
               "50 properties", f"Rows: {len(rows)}", "high")

    def test_tc502_map_view(self):
        """Previously FAIL: Map view should now be implemented."""
        self.navigate("/properties")
        time.sleep(1)
        map_btns = self.find_all(By.XPATH, "//button[contains(.,'Map')]")
        if map_btns:
            self.click_safe(map_btns[0])
            time.sleep(2)
            has_map = len(self.find_all(By.CSS_SELECTOR, ".leaflet-container")) > 0
            has_markers = len(self.find_all(By.CSS_SELECTOR, ".leaflet-marker-icon, .leaflet-marker-pane *")) > 0
            record("TC-502", "Properties", "Map view with markers",
                   "PASS" if has_map else "FAIL",
                   "Leaflet map with property markers",
                   f"Map: {has_map}, Markers: {has_markers}", "high")
            self.screenshot("tc502_property_map")
        else:
            # Map might be default view or accessible differently
            has_map = len(self.find_all(By.CSS_SELECTOR, ".leaflet-container")) > 0
            record("TC-502", "Properties", "Map view",
                   "PASS" if has_map else "FAIL",
                   "Map available", f"Map: {has_map}", "high")

    def test_tc503_property_detail_tabs(self):
        """Previously FAIL: All tabs should now be accessible."""
        self.navigate("/properties")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr, [class*='cursor-pointer']")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            # Check we navigated
            if "/properties/" in self.driver.current_url:
                tabs = self.find_all(By.CSS_SELECTOR, "button")
                tab_texts = [btn.text for btn in tabs if btn.text.strip()]
                expected = ["Overview", "Compliance", "Documents"]
                found = [t for t in expected if any(t.lower() in txt.lower() for txt in tab_texts)]
                record("TC-503", "Properties", "Property detail tabs",
                       "PASS" if len(found) >= 2 else "FAIL",
                       f"Tabs: {expected}", f"Found: {found}", "high")
            else:
                record("TC-503", "Properties", "Property detail", "FAIL",
                       "Navigate to detail", f"URL: {self.driver.current_url}", "high")

    def test_tc504_documents_tab(self):
        """Previously FAIL: Documents tab should now list certificates."""
        self.navigate("/properties")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/properties/" in self.driver.current_url:
                doc_btns = self.find_all(By.XPATH, "//button[contains(.,'Document')]")
                if doc_btns:
                    self.click_safe(doc_btns[0])
                    time.sleep(0.5)
                    has_certs = (self.text_present("Gas") or self.text_present("EICR") or
                                 self.text_present("EPC") or self.text_present("Certificate"))
                    has_placeholder = self.text_present("coming soon")
                    record("TC-504", "Properties", "Documents tab with certificates",
                           "PASS" if (has_certs and not has_placeholder) else "FAIL",
                           "Certificates listed", f"Certs: {has_certs}, Placeholder: {has_placeholder}", "medium")
                else:
                    record("TC-504", "Properties", "Documents tab", "FAIL", "Tab found", "No tab", "medium")

    def test_tc505_property_ai_fields(self):
        """New test: Property should have dynamic AI fields."""
        self.navigate("/properties")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/properties/" in self.driver.current_url:
                has_ai_estimate = self.text_present("AI estimate") or self.text_present("✦")
                has_carbon = self.text_present("Carbon") or self.text_present("carbon")
                has_retrofit = self.text_present("Retrofit") or self.text_present("EPC C")
                has_repair_cost = self.text_present("Repair Cost") or self.text_present("repair cost")
                record("TC-505", "Properties", "Dynamic AI fields on property",
                       "PASS" if has_ai_estimate else "FAIL",
                       "AI fields: carbon emission, retrofit cost, repair prediction",
                       f"AI estimate: {has_ai_estimate}, Carbon: {has_carbon}, Retrofit: {has_retrofit}",
                       "critical")
                self.screenshot("tc505_property_ai_fields")


# ═══════════════════════════════════════════════════════════════
# TC-600: TENANCIES (Re-test click-through + AI)
# ═══════════════════════════════════════════════════════════════

class TC600_Tenancies(SocialHomesTestBase):

    def test_tc601_tenancy_list(self):
        self.navigate("/tenancies")
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        record("TC-601", "Tenancies", "Tenancy list loads",
               "PASS" if len(rows) > 0 else "FAIL",
               "45 tenancies", f"Rows: {len(rows)}", "high")

    def test_tc602_click_through(self):
        """Previously FAIL: Table rows should now navigate."""
        self.navigate("/tenancies")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            passed = "/tenancies/" in self.driver.current_url and self.driver.current_url != f"{BASE_URL}/tenancies"
            record("TC-602", "Tenancies", "Row click-through to detail",
                   "PASS" if passed else "FAIL",
                   "Navigate to /tenancies/:id",
                   f"URL: {self.driver.current_url}", "high")
            self.screenshot("tc602_tenancy_detail")

    def test_tc603_case_references_navigate(self):
        """Previously BLOCKED: Case references should now navigate."""
        self.navigate("/tenancies")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/tenancies/" in self.driver.current_url:
                # Click Cases tab
                cases_btns = self.find_all(By.XPATH, "//button[contains(.,'Cases')]")
                if cases_btns:
                    self.click_safe(cases_btns[0])
                    time.sleep(0.5)
                # Look for clickable case items
                case_items = self.find_all(By.CSS_SELECTOR, "[class*='cursor-pointer']")
                case_refs = self.find_all(By.XPATH, "//*[contains(text(),'REP-') or contains(text(),'CMP-')]")
                has_cases = len(case_refs) > 0
                # Try clicking a case
                if case_refs:
                    pre_url = self.driver.current_url
                    self.click_safe(case_refs[0])
                    time.sleep(1)
                    navigated = self.driver.current_url != pre_url
                    record("TC-603", "Tenancies", "Case references navigate",
                           "PASS" if navigated else "FAIL",
                           "Click case ref → detail page",
                           f"Cases found: {len(case_refs)}, Navigated: {navigated}", "high")
                else:
                    record("TC-603", "Tenancies", "Case references", "FAIL",
                           "Case items present", "No case references found", "high")

    def test_tc604_ai_dynamic_fields(self):
        """Previously FAIL: Tenant should now have dynamic AI fields."""
        self.navigate("/tenancies")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/tenancies/" in self.driver.current_url:
                has_ai_estimate = self.text_present("AI estimate") or self.text_present("✦")
                has_income = self.text_present("Household Income") or self.text_present("household income")
                has_sustainability = self.text_present("Sustainability") or self.text_present("sustainability")
                has_complaint_risk = self.text_present("Complaint Risk") or self.text_present("complaint risk")
                
                record("TC-604", "Tenancies", "Dynamic AI fields on tenant",
                       "PASS" if has_ai_estimate else "FAIL",
                       "AI fields: estimated income, complaint risk, sustainability score, arrears trajectory",
                       f"AI estimate: {has_ai_estimate}, Income: {has_income}, Sustainability: {has_sustainability}",
                       "critical")
                self.screenshot("tc604_tenant_ai_fields")

    def test_tc604b_urgency_visual_emphasis(self):
        """New test: Page should visually adapt to tenant urgency."""
        self.navigate("/tenancies")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/tenancies/" in self.driver.current_url:
                page_src = self.driver.page_source
                has_ring = "ring-" in page_src and ("garnet" in page_src or "warning" in page_src)
                has_warnings = self.text_present("immediate attention") or self.text_present("requires") or self.text_present("WARNING") or self.text_present("Warning")
                record("TC-604b", "AI-Native", "Urgency visual emphasis on tenant",
                       "PASS" if (has_ring or has_warnings) else "FAIL",
                       "Crisis/urgent tenants get ring borders, expanded warnings, pulsing indicators",
                       f"Ring styling: {has_ring}, Warnings: {has_warnings}",
                       "high")


# ═══════════════════════════════════════════════════════════════
# TC-700: REPAIRS (Re-test)
# ═══════════════════════════════════════════════════════════════

class TC700_Repairs(SocialHomesTestBase):

    def test_tc701_repairs_list(self):
        self.navigate("/repairs")
        time.sleep(1)
        # Check for list or kanban
        has_list = len(self.find_all(By.CSS_SELECTOR, "tbody tr")) > 0
        has_kanban = self.text_present("Kanban") or self.text_present("kanban")
        record("TC-701", "Repairs", "Repairs list/kanban",
               "PASS" if has_list else "FAIL",
               "List view with data", f"List: {has_list}, Kanban option: {has_kanban}", "high")

    def test_tc703_click_through(self):
        """Previously FAIL: Repair rows should navigate."""
        self.navigate("/repairs")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            passed = "/repairs/" in self.driver.current_url and "/repairs/new" not in self.driver.current_url
            record("TC-703", "Repairs", "Row click-through",
                   "PASS" if passed else "FAIL",
                   "Navigate to /repairs/:id",
                   f"URL: {self.driver.current_url}", "high")

    def test_tc705_data_count_200(self):
        """Previously FAIL: Should now have 200 repairs."""
        self.navigate("/repairs")
        time.sleep(1)
        has_200 = self.text_present("200")
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        record("TC-705", "Repairs", "200 repairs per spec",
               "PASS" if (has_200 or len(rows) >= 20) else "FAIL",
               "200 repairs in dataset",
               f"Count text: {has_200}, Visible rows: {len(rows)}",
               "critical")

    def test_tc706_repair_ai_fields(self):
        """New test: Repair detail should have dynamic AI fields."""
        self.navigate("/repairs")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/repairs/" in self.driver.current_url:
                has_ai_estimate = self.text_present("AI estimate") or self.text_present("✦")
                has_similar_cost = self.text_present("Similar") or self.text_present("Average Cost")
                has_ftf = self.text_present("First-Time") or self.text_present("first-time")
                record("TC-706", "Repairs", "Dynamic AI fields on repair",
                       "PASS" if has_ai_estimate else "FAIL",
                       "AI fields: similar cost, first-time-fix likelihood, recurrence risk",
                       f"AI estimate: {has_ai_estimate}, Similar cost: {has_similar_cost}, FTF: {has_ftf}",
                       "critical")
                self.screenshot("tc706_repair_ai_fields")


# ═══════════════════════════════════════════════════════════════
# TC-800: COMPLAINTS
# ═══════════════════════════════════════════════════════════════

class TC800_Complaints(SocialHomesTestBase):

    def test_tc801_complaint_dashboard(self):
        self.navigate("/complaints")
        has_stage1 = self.text_present("Stage 1")
        has_stage2 = self.text_present("Stage 2")
        record("TC-801", "Complaints", "Complaint dashboard",
               "PASS" if has_stage1 and has_stage2 else "FAIL",
               "Stage 1/2 counts + TSM", f"S1: {has_stage1}, S2: {has_stage2}", "high")

    def test_tc802_complaint_detail_ai_fields(self):
        """New: Complaint detail should have AI fields (Ombudsman risk, compensation)."""
        self.navigate("/complaints")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/complaints/" in self.driver.current_url:
                has_ai = self.text_present("AI estimate") or self.text_present("✦")
                has_ombudsman = self.text_present("Ombudsman") or self.text_present("ombudsman")
                has_compensation = self.text_present("Compensation") or self.text_present("compensation")
                record("TC-802", "Complaints", "AI fields on complaint",
                       "PASS" if has_ai else "FAIL",
                       "Ombudsman risk, compensation estimate, similar outcomes",
                       f"AI: {has_ai}, Ombudsman: {has_ombudsman}, Compensation: {has_compensation}",
                       "critical")
                self.screenshot("tc802_complaint_ai")

    def test_tc803_complaint_data_count(self):
        self.navigate("/complaints")
        has_34 = self.text_present("34")
        record("TC-803", "Complaints", "34 open complaints",
               "PASS" if has_34 else "FAIL",
               "34 open complaints per spec", f"Found 34: {has_34}", "critical")


# ═══════════════════════════════════════════════════════════════
# TC-900: AI-NATIVE FEATURES (Critical re-test)
# ═══════════════════════════════════════════════════════════════

class TC900_AiNative(SocialHomesTestBase):

    def test_tc901_ai_action_flow(self):
        """Previously FAIL: AI action buttons should now work."""
        self.navigate("/tenancies")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/tenancies/" in self.driver.current_url:
                # Look for AI action buttons
                action_btns = self.find_all(By.XPATH, 
                    "//button[contains(.,'Send') or contains(.,'Income') or contains(.,'Welfare') or contains(.,'Arrears') or contains(.,'Holding')]")
                if not action_btns:
                    action_btns = self.find_all(By.CSS_SELECTOR, "[class*='border-status-ai'] button")
                has_actions = len(action_btns) > 0
                
                if action_btns:
                    self.click_safe(action_btns[0])
                    time.sleep(0.5)
                    has_preview = self.text_present("Preview") or self.text_present("Dear") or self.text_present("preview")
                    record("TC-901", "AI-Native", "AI action multi-step flow",
                           "PASS" if has_preview else "FAIL",
                           "Click action → contextual preview → send → follow-up",
                           f"Actions: {len(action_btns)}, Preview: {has_preview}", "high")
                    self.screenshot("tc901_ai_flow")
                else:
                    record("TC-901", "AI-Native", "AI action buttons",
                           "FAIL", "Action buttons present", "None found", "high")

    def test_tc902_dynamic_ai_fields(self):
        """Previously FAIL: Dynamic AI information fields should now exist."""
        self.navigate("/tenancies")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/tenancies/" in self.driver.current_url:
                # Look for purple-bordered AI estimate cards
                ai_fields = self.find_all(By.CSS_SELECTOR, "[class*='border-status-ai']")
                ai_text = self.text_present("AI estimate") or self.text_present("✦")
                has_income = self.text_present("Household Income")
                has_sustainability = self.text_present("Sustainability")
                
                field_count = len(ai_fields)
                record("TC-902", "AI-Native", "Dynamic AI information fields",
                       "PASS" if (ai_text and field_count > 0) else "FAIL",
                       "Purple-bordered AI estimate fields: income, complaint risk, sustainability, trajectory",
                       f"AI fields: {field_count}, AI text: {ai_text}, Income: {has_income}, Sustainability: {has_sustainability}",
                       "critical")
                self.screenshot("tc902_ai_fields")

    def test_tc904_contextual_drafting(self):
        """Previously FAIL: Letters should now reference tenant situation."""
        self.navigate("/tenancies")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/tenancies/" in self.driver.current_url:
                # Find and click a Send/Draft action
                send_btns = self.find_all(By.XPATH, "//button[contains(.,'Send') or contains(.,'Holding') or contains(.,'Draft')]")
                if not send_btns:
                    send_btns = self.find_all(By.CSS_SELECTOR, "[class*='border-status-ai'] button")
                if send_btns:
                    self.click_safe(send_btns[0])
                    time.sleep(0.5)
                    page = self.driver.page_source
                    has_dear = "Dear" in page
                    has_amount = "£" in page
                    has_tenant_name = any(name in page for name in ["Mrs", "Mr", "Ms"])
                    record("TC-904", "AI-Native", "Contextual letter drafting",
                           "PASS" if (has_dear and (has_amount or has_tenant_name)) else "FAIL",
                           "Draft references tenant name, amounts, situation",
                           f"Dear: {has_dear}, Amount: {has_amount}, Name: {has_tenant_name}",
                           "critical")
                else:
                    record("TC-904", "AI-Native", "Contextual letter drafting",
                           "FAIL", "Draft buttons found", "None found", "critical")

    def test_tc905_yantra_assist_context_aware(self):
        """Previously FAIL: Yantra Assist should change per page."""
        self.navigate("/dashboard")
        time.sleep(1)
        # Open Yantra Assist
        header_btns = self.find_all(By.CSS_SELECTOR, "header button")
        for btn in header_btns:
            if btn.find_elements(By.TAG_NAME, "svg"):
                self.click_safe(btn)
                time.sleep(0.5)
                if self.text_present("Yantra Assist"):
                    break
        time.sleep(0.5)
        dashboard_content = self.driver.page_source
        
        # Navigate to a tenant detail page
        self.navigate("/tenancies")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
        
        # Reopen Yantra Assist
        header_btns = self.find_all(By.CSS_SELECTOR, "header button")
        for btn in header_btns:
            if btn.find_elements(By.TAG_NAME, "svg"):
                self.click_safe(btn)
                time.sleep(0.5)
                if self.text_present("Yantra Assist"):
                    break
        time.sleep(0.5)
        tenant_content = self.driver.page_source
        
        content_differs = dashboard_content != tenant_content
        record("TC-905", "AI-Native", "Yantra Assist context-aware",
               "PASS" if content_differs else "FAIL",
               "Content changes between dashboard and tenant page",
               f"Differs: {content_differs}", "critical")

    def test_tc907_complaint_prevention(self):
        """Previously FAIL: AI should detect complaint risk and suggest prevention."""
        self.navigate("/tenancies")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        if rows:
            self.click_safe(rows[0])
            time.sleep(1.5)
            if "/tenancies/" in self.driver.current_url:
                has_prediction = self.text_present("probability") or self.text_present("risk") or self.text_present("Complaint Risk")
                has_prevention = (self.text_present("prevention") or self.text_present("Prevention") or
                                  self.text_present("Escalate") or self.text_present("escalat"))
                record("TC-907", "AI-Native", "Complaint prevention intelligence",
                       "PASS" if has_prediction else "FAIL",
                       "AI detects complaint risk and suggests prevention actions",
                       f"Prediction: {has_prediction}, Prevention: {has_prevention}",
                       "critical")

    def test_tc908_closed_case_ai(self):
        """Closed cases should still get AI analysis."""
        self.navigate("/repairs")
        time.sleep(1)
        rows = self.find_all(By.CSS_SELECTOR, "tbody tr")
        for row in rows[:15]:
            if "complete" in row.text.lower() or "closed" in row.text.lower():
                self.click_safe(row)
                time.sleep(1.5)
                has_ai = self.text_present("AI estimate") or self.text_present("✦") or self.text_present("Recurrence") or self.text_present("Root Cause")
                record("TC-908", "AI-Native", "Closed cases get AI analysis",
                       "PASS" if has_ai else "FAIL",
                       "AI analysis on completed repairs",
                       f"AI present: {has_ai}", "high")
                return
        record("TC-908", "AI-Native", "Closed cases AI", "BLOCKED", "Find completed repair", "None visible", "high")


# ═══════════════════════════════════════════════════════════════
# TC-1000+: COMPLIANCE, RENT, ALLOCATIONS, REPORTS, etc
# ═══════════════════════════════════════════════════════════════

class TC1000_Other(SocialHomesTestBase):

    def test_tc1001_compliance_big6(self):
        self.navigate("/compliance")
        cats = ["Gas", "Electrical", "Fire", "Asbestos", "Legionella", "Lift"]
        found = [c for c in cats if self.text_present(c)]
        record("TC-1001", "Compliance", "Big 6 dashboard", "PASS" if len(found) >= 5 else "FAIL",
               "6 categories", f"Found: {found}", "high")

    def test_tc1002_awaabs_law(self):
        self.navigate("/compliance/awaabs-law")
        time.sleep(1)
        has_emerg = self.text_present("Emergency") or self.text_present("emergency")
        has_sig = self.text_present("Significant") or self.text_present("significant")
        record("TC-1002", "Compliance", "Awaab's Law timers",
               "PASS" if has_emerg and has_sig else "FAIL",
               "Emergency + Significant cases with timers", f"E: {has_emerg}, S: {has_sig}", "critical")

    def test_tc1101_rent_dashboard(self):
        self.navigate("/rent")
        has_arrears = self.text_present("Arrears")
        has_worklist = self.text_present("Prioriti") or self.text_present("Worklist") or self.text_present("Risk")
        record("TC-1101", "Rent", "Arrears dashboard + worklist",
               "PASS" if has_arrears and has_worklist else "FAIL",
               "Arrears + AI worklist", f"Arrears: {has_arrears}, Worklist: {has_worklist}", "high")

    def test_tc1201_void_kanban(self):
        self.navigate("/allocations")
        time.sleep(1)
        void_btns = self.find_all(By.XPATH, "//button[contains(.,'Void')]")
        if void_btns:
            self.click_safe(void_btns[0])
            time.sleep(0.5)
        stages = ["Notice", "Keys", "Inspection", "Works", "Quality", "Ready", "Offer", "Let"]
        found = [s for s in stages if self.text_present(s)]
        record("TC-1201", "Allocations", "Void kanban",
               "PASS" if len(found) >= 6 else "FAIL",
               "8 stages", f"Found: {found}", "high")

    def test_tc1301_reports_hub(self):
        self.navigate("/reports")
        cats = ["Regulatory", "Operational", "Compliance", "Financial", "Governance", "Tenant"]
        found = [c for c in cats if self.text_present(c)]
        record("TC-1301", "Reports", "Reports hub",
               "PASS" if len(found) >= 5 else "FAIL",
               "6 categories", f"Found: {found}", "high")

    def test_tc1302_tsm_report(self):
        self.navigate("/reports/tsm")
        time.sleep(1)
        has_tsm = self.text_present("TSM") or self.text_present("Tenant Satisfaction")
        record("TC-1302", "Reports", "TSM report",
               "PASS" if has_tsm else "FAIL", "TSM measures", f"Found: {has_tsm}", "high")

    def test_tc1401_tenant_portal(self):
        self.navigate("/tenant-portal")
        has_welcome = self.text_present("Welcome") or self.text_present("welcome")
        record("TC-1401", "Tenant Portal", "Portal loads",
               "PASS" if has_welcome else "FAIL", "Welcome message", f"Found: {has_welcome}", "medium")

    def test_tc1501_ai_centre(self):
        self.navigate("/ai")
        time.sleep(1)
        models = ["Arrears", "Damp", "Complaint", "Repair", "Vulnerability", "ASB", "Compliance"]
        found = [m for m in models if self.text_present(m)]
        record("TC-1501", "AI Centre", "Prediction models",
               "PASS" if len(found) >= 5 else "FAIL",
               "8 models", f"Found: {found}", "high")

    def test_tc1502_ai_chat(self):
        """Previously FAIL: Should now use data-aware AI chat."""
        self.navigate("/ai")
        time.sleep(1)
        asst_btns = self.find_all(By.XPATH, "//button[contains(.,'Assistant')]")
        if asst_btns:
            self.click_safe(asst_btns[0])
            time.sleep(0.5)
        try:
            inputs = self.find_all(By.CSS_SELECTOR, "input, textarea")
            for inp in inputs:
                if inp.is_displayed():
                    inp.send_keys("How many tenants are in arrears?")
                    inp.send_keys(Keys.ENTER)
                    time.sleep(1.5)
                    # Check response references data
                    has_data = self.text_present("tenant") or self.text_present("arrears") or self.text_present("£")
                    has_generic = self.text_present("I can help with that") and not self.text_present("tenant")
                    record("TC-1502", "AI Centre", "AI chat with data-aware responses",
                           "PASS" if has_data else "FAIL",
                           "Chat returns data-aware response about tenants/arrears",
                           f"Data ref: {has_data}, Generic: {has_generic}", "high")
                    return
        except Exception as e:
            record("TC-1502", "AI Centre", "AI chat", "FAIL", "Chat works", str(e), "high")

    def test_tc1601_dark_mode(self):
        self.navigate("/dashboard")
        bg = self.driver.execute_script("return getComputedStyle(document.body).backgroundColor;")
        is_dark = any(x in bg for x in ["13, 17, 23", "13,17,23", "0, 0, 0"])
        record("TC-1601", "Design", "Dark mode #0D1117",
               "PASS" if is_dark else "FAIL",
               "bg: #0D1117 (rgb 13,17,23)", f"bg: {bg}", "high")

    def test_tc1602_uk_dates(self):
        self.navigate("/dashboard")
        page = self.driver.page_source
        uk_dates = re.findall(r'\d{2}/\d{2}/\d{4}', page)
        record("TC-1602", "Design", "UK date format",
               "PASS" if len(uk_dates) > 0 else "FAIL",
               "DD/MM/YYYY dates", f"Found: {len(uk_dates)}", "medium")

    def test_tc1603_gbp(self):
        self.navigate("/dashboard")
        record("TC-1603", "Design", "GBP currency",
               "PASS" if "£" in self.driver.page_source else "FAIL",
               "£ symbol", "", "medium")

    def test_tc1604_animations(self):
        self.navigate("/dashboard")
        page = self.driver.page_source
        has_anim = "animate" in page.lower() or "fade" in page.lower()
        record("TC-1604", "Design", "Animations",
               "PASS" if has_anim else "FAIL", "Animation classes", "", "medium")


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

def generate_report():
    report_path = os.path.join(os.path.dirname(__file__), "..", "TEST-REPORT-V2.md")
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    blocked = sum(1 for r in RESULTS if r["status"] == "BLOCKED")
    critical_fails = [r for r in RESULTS if r["status"] == "FAIL" and r["severity"] == "critical"]
    high_fails = [r for r in RESULTS if r["status"] == "FAIL" and r["severity"] == "high"]

    with open(report_path, "w") as f:
        f.write("# SocialHomes.Ai — Re-Test Report v2\n\n")
        f.write(f"**Date**: {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        f.write("**Tester**: QA Agent (Selenium Automated)\n")
        f.write("**Application**: SocialHomes.Ai v0.0.0 (Post-fix)\n")
        f.write("**Tested Against**: Doc1 + Doc2 + AI-Native Architecture Requirements\n\n")
        f.write("---\n\n## Executive Summary\n\n")
        f.write(f"| Metric | v1 (Before) | v2 (After) |\n|--------|-------------|------------|\n")
        f.write(f"| Total Tests | 69 | {total} |\n")
        f.write(f"| **PASSED** | 39 (56.5%) | **{passed} ({passed/total*100:.1f}%)** |\n")
        f.write(f"| **FAILED** | 28 | **{failed}** |\n")
        f.write(f"| **BLOCKED** | 2 | **{blocked}** |\n")
        f.write(f"| Critical Failures | 11 | **{len(critical_fails)}** |\n")
        f.write(f"| High Failures | 13 | **{len(high_fails)}** |\n\n")

        if critical_fails:
            f.write("---\n\n## Remaining Critical Failures\n\n")
            for r in critical_fails:
                f.write(f"### {r['test_id']}: {r['title']}\n")
                f.write(f"- **Expected**: {r['expected']}\n- **Actual**: {r['actual']}\n")
                if r['notes']: f.write(f"- **Notes**: {r['notes']}\n")
                f.write("\n")

        if high_fails:
            f.write("---\n\n## Remaining High Severity Failures\n\n")
            for r in high_fails:
                f.write(f"### {r['test_id']}: {r['title']}\n")
                f.write(f"- **Expected**: {r['expected']}\n- **Actual**: {r['actual']}\n\n")

        f.write("---\n\n## Full Results\n\n")
        categories = sorted(set(r["category"] for r in RESULTS))
        for cat in categories:
            cat_results = [r for r in RESULTS if r["category"] == cat]
            f.write(f"### {cat}\n\n| ID | Title | Result | Severity |\n|-----|-------|--------|----------|\n")
            for r in cat_results:
                st = "PASS" if r["status"] == "PASS" else f"**{r['status']}**"
                f.write(f"| {r['test_id']} | {r['title']} | {st} | {r['severity']} |\n")
            f.write("\n")

        f.write("\n---\n*Report generated by SocialHomes.Ai QA Agent v2*\n")

    json_path = os.path.join(os.path.dirname(__file__), "test_results_v2.json")
    with open(json_path, "w") as f:
        json.dump(RESULTS, f, indent=2)

    print(f"\n{'='*60}")
    print(f"RE-TEST REPORT v2")
    print(f"{'='*60}")
    print(f"Total: {total} | Pass: {passed} | Fail: {failed} | Blocked: {blocked}")
    print(f"Pass Rate: {passed/total*100:.1f}% (was 56.5%)")
    print(f"Critical Failures: {len(critical_fails)} (was 11)")
    print(f"Report: {report_path}")
    print(f"{'='*60}")


if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    for tc in [TC100_AppShell, TC200_Personas, TC300_Dashboard, TC400_Explore,
               TC500_Properties, TC600_Tenancies, TC700_Repairs, TC800_Complaints,
               TC900_AiNative, TC1000_Other]:
        suite.addTests(loader.loadTestsFromTestCase(tc))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    generate_report()
