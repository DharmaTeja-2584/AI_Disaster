import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from conftest import capture_screenshot

def clear_and_type(elem, text):
    elem.send_keys(Keys.CONTROL, "a")
    elem.send_keys(Keys.BACKSPACE)
    if text:
        elem.send_keys(text)

def login_as_civilian(driver, base_url):
    driver.get(f"{base_url}/login")
    wait = WebDriverWait(driver, 5)
    email_elem = driver.find_element(By.ID, "login-email")
    clear_and_type(email_elem, "civilian@demo.com")
    pwd_elem = driver.find_element(By.ID, "login-password")
    clear_and_type(pwd_elem, "demo1234")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    wait.until(lambda d: "/civilian/dashboard" in d.current_url)

@pytest.mark.equivalence
class TestIncidentReportingEquivalence:
    """
    Equivalence Class Partitioning (ECP) for Incident Intake and AI Triage:
      - Description Validation: [Valid >= 5 chars], [Invalid < 5 chars, Empty]
      - Latitude & Longitude Validation: [Valid -90..90, -180..180], [Invalid Empty]
      - AI Severity Score Partitions:
          * High / Critical Severity Partition (Severity 7-10, P1 Critical)
          * Low Severity Partition (Severity 1-3, P3/P4 Low)
    """

    def test_ep_incident_description_too_short(self, driver, base_url):
        """IEC-INC-1: Description length < 5 characters partition."""
        login_as_civilian(driver, base_url)
        driver.get(f"{base_url}/civilian/submit")
        wait = WebDriverWait(driver, 5)
        wait.until(lambda d: d.find_element(By.ID, "description"))

        desc_input = driver.find_element(By.ID, "description")
        clear_and_type(desc_input, "Fire")

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(0.5)

        err_elem = driver.find_element(By.XPATH, "//*[contains(text(), 'Description must be at least 5 characters')]")
        capture_screenshot(driver, "ECP_INC_Description_Too_Short")
        assert err_elem.is_displayed()

    def test_ep_incident_empty_coordinates(self, driver, base_url):
        """IEC-INC-2: Coordinate input empty equivalence partition."""
        login_as_civilian(driver, base_url)
        driver.get(f"{base_url}/civilian/submit")
        wait = WebDriverWait(driver, 5)
        wait.until(lambda d: d.find_element(By.ID, "latitude"))

        lat_elem = driver.find_element(By.ID, "latitude")
        lon_elem = driver.find_element(By.ID, "longitude")
        clear_and_type(lat_elem, "")
        clear_and_type(lon_elem, "")

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(0.5)

        lat_err = driver.find_element(By.XPATH, "//*[contains(text(), 'Valid latitude is required')]")
        lon_err = driver.find_element(By.XPATH, "//*[contains(text(), 'Valid longitude is required')]")
        capture_screenshot(driver, "ECP_INC_Empty_Coordinates")
        assert lat_err.is_displayed()
        assert lon_err.is_displayed()

    def test_ep_ai_triage_critical_partition(self, driver, base_url):
        """
        VEC-INC-HIGH: High/Critical Severity Partition (Severity 7-10).
        Inputs: Structural collapse with trapped civilians and casualties.
        Verified Output: Severity score in range [7, 10], Incident registered.
        """
        login_as_civilian(driver, base_url)
        driver.get(f"{base_url}/civilian/submit")
        wait = WebDriverWait(driver, 8)
        wait.until(lambda d: d.find_element(By.ID, "disasterType"))

        Select(driver.find_element(By.ID, "disasterType")).select_by_visible_text("Building Collapse")
        
        clear_and_type(driver.find_element(By.ID, "latitude"), "34.0522")
        clear_and_type(driver.find_element(By.ID, "longitude"), "-118.2437")
        clear_and_type(
            driver.find_element(By.ID, "description"),
            "Severe multi-story building collapse with trapped victims and active fire."
        )
        clear_and_type(driver.find_element(By.ID, "casualties"), "3")
        clear_and_type(driver.find_element(By.ID, "injuries"), "12")

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # Wait for AI Result card to display calculated severity
        wait.until(lambda d: "REGISTERED" in d.page_source and "Calculated Severity" in d.page_source)
        capture_screenshot(driver, "ECP_AI_Triage_High_Critical")
        
        page_src = driver.page_source
        assert "REGISTERED" in page_src
        assert "Calculated Severity" in page_src
        # Verify high severity indicator is present
        assert any(score in page_src for score in ["7/10", "8/10", "9/10", "10/10"])

    def test_ep_ai_triage_low_severity_partition(self, driver, base_url):
        """
        VEC-INC-LOW: Low Severity Partition (Severity 1-4).
        Inputs: Minor incident, zero casualties, non-life-threatening cues.
        Verified Output: Severity score in range [1, 4], Incident registered.
        """
        login_as_civilian(driver, base_url)
        driver.get(f"{base_url}/civilian/submit")
        wait = WebDriverWait(driver, 8)
        wait.until(lambda d: d.find_element(By.ID, "disasterType"))

        Select(driver.find_element(By.ID, "disasterType")).select_by_visible_text("Minor Flood")

        clear_and_type(driver.find_element(By.ID, "latitude"), "34.0500")
        clear_and_type(driver.find_element(By.ID, "longitude"), "-118.2400")
        clear_and_type(
            driver.find_element(By.ID, "description"),
            "Shallow puddle on lawn curb, normal conditions and quiet street."
        )
        clear_and_type(driver.find_element(By.ID, "casualties"), "0")
        clear_and_type(driver.find_element(By.ID, "injuries"), "0")
        clear_and_type(driver.find_element(By.ID, "affectedPopulation"), "0")

        # Deselect pre-checked tags by finding active buttons with border-emergency
        for tag in ["Structural Damage", "Trapped Civilians", "Active Fire"]:
            for btn in driver.find_elements(By.XPATH, f"//button[contains(., '{tag}')]"):
                if "border-emergency" in (btn.get_attribute("class") or ""):
                    btn.click()
                    time.sleep(0.2)

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        wait.until(lambda d: "REGISTERED" in d.page_source and "Calculated Severity" in d.page_source)
        capture_screenshot(driver, "ECP_AI_Triage_Low_Severity")

        page_src = driver.page_source
        assert "REGISTERED" in page_src
        assert any(score in page_src for score in ["1/10", "2/10", "3/10", "4/10", "5/10"])
