import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from conftest import capture_screenshot

@pytest.mark.equivalence
class TestLoginEquivalence:
    """
    Equivalence Class Partitioning (ECP) for Authentication & Login.
    Partitions:
      - Valid Credentials (Civilian Role -> /civilian/dashboard)
      - Valid Credentials (Commander Role -> /commander/command-center)
      - Invalid Password Partition
      - Non-existent User Account Partition
      - Empty Email Field Partition
      - Empty Password Field Partition
    """

    def test_ep_login_valid_civilian(self, driver, base_url):
        """VEC-AUTH-1: Valid Registered Civilian Equivalence Partition."""
        driver.get(f"{base_url}/login")
        wait = WebDriverWait(driver, 5)

        driver.find_element(By.ID, "login-email").clear()
        driver.find_element(By.ID, "login-email").send_keys("civilian@demo.com")
        driver.find_element(By.ID, "login-password").clear()
        driver.find_element(By.ID, "login-password").send_keys("demo1234")

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        wait.until(lambda d: "/civilian/dashboard" in d.current_url)
        capture_screenshot(driver, "ECP_AUTH_Valid_Civilian")
        assert "/civilian/dashboard" in driver.current_url

    def test_ep_login_valid_commander(self, driver, base_url):
        """VEC-AUTH-2: Valid Incident Commander Equivalence Partition."""
        driver.get(f"{base_url}/login")
        wait = WebDriverWait(driver, 5)

        driver.find_element(By.ID, "login-email").clear()
        driver.find_element(By.ID, "login-email").send_keys("commander@demo.com")
        driver.find_element(By.ID, "login-password").clear()
        driver.find_element(By.ID, "login-password").send_keys("demo1234")

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        wait.until(lambda d: "/commander/command-center" in d.current_url)
        capture_screenshot(driver, "ECP_AUTH_Valid_Commander")
        assert "/commander/command-center" in driver.current_url

    def test_ep_login_invalid_password(self, driver, base_url):
        """IEC-AUTH-1: Invalid Password Equivalence Partition."""
        driver.get(f"{base_url}/login")
        wait = WebDriverWait(driver, 5)

        driver.find_element(By.ID, "login-email").clear()
        driver.find_element(By.ID, "login-email").send_keys("civilian@demo.com")
        driver.find_element(By.ID, "login-password").clear()
        driver.find_element(By.ID, "login-password").send_keys("WrongSecret999!")

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # Error notification or alert-critical banner appears
        wait.until(lambda d: len(d.find_elements(By.CLASS_NAME, "alert-critical")) > 0 or "failed" in d.page_source.lower())
        capture_screenshot(driver, "ECP_AUTH_Invalid_Password")
        assert "/login" in driver.current_url
        assert "login failed" in driver.page_source.lower() or len(driver.find_elements(By.CLASS_NAME, "alert-critical")) > 0

    def test_ep_login_nonexistent_email(self, driver, base_url):
        """IEC-AUTH-2: Unregistered / Non-existent Account Equivalence Partition."""
        driver.get(f"{base_url}/login")
        wait = WebDriverWait(driver, 5)

        driver.find_element(By.ID, "login-email").clear()
        driver.find_element(By.ID, "login-email").send_keys("unknown_ghost_account@nonexistent.org")
        driver.find_element(By.ID, "login-password").clear()
        driver.find_element(By.ID, "login-password").send_keys("demo1234")

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        wait.until(lambda d: "failed" in d.page_source.lower() or len(d.find_elements(By.CLASS_NAME, "alert-critical")) > 0)
        capture_screenshot(driver, "ECP_AUTH_Nonexistent_Account")
        assert "/login" in driver.current_url

    def test_ep_login_empty_inputs(self, driver, base_url):
        """IEC-AUTH-3: Empty Inputs Equivalence Partition."""
        driver.get(f"{base_url}/login")

        driver.find_element(By.ID, "login-email").clear()
        driver.find_element(By.ID, "login-password").clear()

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(0.5)

        email_err = driver.find_element(By.XPATH, "//*[contains(text(), 'Email is required')]")
        pwd_err = driver.find_element(By.XPATH, "//*[contains(text(), 'Password is required')]")
        capture_screenshot(driver, "ECP_AUTH_Empty_Inputs")
        assert email_err.is_displayed()
        assert pwd_err.is_displayed()
