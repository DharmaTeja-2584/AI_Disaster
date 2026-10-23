import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from conftest import capture_screenshot

def clear_and_type(elem, text):
    elem.send_keys(Keys.CONTROL, "a")
    elem.send_keys(Keys.BACKSPACE)
    if text:
        elem.send_keys(text)

def login_as_commander(driver, base_url):
    driver.get(f"{base_url}/login")
    wait = WebDriverWait(driver, 5)
    email_elem = driver.find_element(By.ID, "login-email")
    clear_and_type(email_elem, "commander@demo.com")
    pwd_elem = driver.find_element(By.ID, "login-password")
    clear_and_type(pwd_elem, "demo1234")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    wait.until(lambda d: "/commander/command-center" in d.current_url)

@pytest.mark.equivalence
class TestResourceAllocationEquivalence:
    """
    Equivalence Class Partitioning (ECP) for Transactional Resource Allocation:
      Input Parameter: Allocation Quantity
      - Partition 1 (Valid): 1 <= Quantity <= Available Stock
      - Partition 2 (Invalid - Non-positive): Quantity <= 0
      - Partition 3 (Invalid - Over-allocation): Quantity > Available Stock
    """

    def test_ep_resource_valid_quantity(self, driver, base_url):
        """VEC-RES-1: Valid Quantity Partition within available stock boundaries."""
        login_as_commander(driver, base_url)
        driver.get(f"{base_url}/commander/resources")
        wait = WebDriverWait(driver, 6)

        # Open allocation modal
        allocate_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Allocate to Incident')]"))
        )
        allocate_btn.click()

        # Wait for modal form to load
        qty_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='number' and @min='1']"))
        )
        clear_and_type(qty_input, "2")
        time.sleep(0.5)

        confirm_btn = driver.find_element(By.XPATH, "//button[contains(., 'Confirm Allocation')]")
        capture_screenshot(driver, "ECP_RES_Valid_Quantity")
        
        # In valid equivalence partition, the confirm button must be enabled
        assert confirm_btn.is_enabled(), "Confirm allocation button should be enabled for valid quantity"
        assert not ("border-emergency" in qty_input.get_attribute("class"))

    def test_ep_resource_zero_or_negative_quantity(self, driver, base_url):
        """IEC-RES-1: Invalid Quantity Partition (<= 0)."""
        login_as_commander(driver, base_url)
        driver.get(f"{base_url}/commander/resources")
        wait = WebDriverWait(driver, 6)

        allocate_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Allocate to Incident')]"))
        )
        allocate_btn.click()

        qty_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='number' and @min='1']"))
        )
        clear_and_type(qty_input, "0")
        time.sleep(0.5)

        confirm_btn = driver.find_element(By.XPATH, "//button[contains(., 'Confirm Allocation')]")
        capture_screenshot(driver, "ECP_RES_Zero_Quantity")

        # In invalid non-positive partition, confirm button is disabled by business rules
        assert not confirm_btn.is_enabled(), "Confirm allocation button should be disabled for quantity <= 0"

    def test_ep_resource_over_allocation(self, driver, base_url):
        """IEC-RES-2: Invalid Over-Allocation Partition (Quantity > Available Stock)."""
        login_as_commander(driver, base_url)
        driver.get(f"{base_url}/commander/resources")
        wait = WebDriverWait(driver, 6)

        allocate_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Allocate to Incident')]"))
        )
        allocate_btn.click()

        qty_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='number' and @min='1']"))
        )
        # Enter extreme quantity that exceeds stockpile
        clear_and_type(qty_input, "999999")
        time.sleep(0.5)

        confirm_btn = driver.find_element(By.XPATH, "//button[contains(., 'Confirm Allocation')]")
        capture_screenshot(driver, "ECP_RES_Over_Allocation")

        # Assert visual indicator and disabled submission
        assert not confirm_btn.is_enabled(), "Confirm button must be disabled when requested stock exceeds inventory"
        assert "border-emergency" in qty_input.get_attribute("class")
        assert "exceeds available inventory" in driver.page_source.lower()
