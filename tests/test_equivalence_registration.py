import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from conftest import capture_screenshot

@pytest.mark.equivalence
class TestRegistrationEquivalence:
    """
    Equivalence Class Partitioning (ECP) for Civilian Registration Form.
    Partitions:
      - Name: [Valid: 2-100 chars], [Invalid: < 2 chars, Empty]
      - Email: [Valid: RFC format], [Invalid: Missing @, Empty]
      - Password: [Valid: >= 8 chars], [Invalid: < 8 chars]
      - Confirm Password: [Valid: Matches Password], [Invalid: Mismatch]
    """

    def test_ep_reg_valid_submission(self, driver, base_url):
        """VEC-REG-1: All inputs belong to valid equivalence partitions."""
        driver.get(f"{base_url}/register")
        wait = WebDriverWait(driver, 5)
        
        unique_email = f"civilian_{int(time.time())}@disaster-safety.org"
        
        driver.find_element(By.ID, "reg-name").send_keys("Maria Santos")
        driver.find_element(By.ID, "reg-email").send_keys(unique_email)
        driver.find_element(By.ID, "reg-password").send_keys("Passcode123!")
        driver.find_element(By.ID, "reg-confirm").send_keys("Passcode123!")
        
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        # Verify navigation to civilian dashboard or successful registration
        wait.until(lambda d: "/civilian/dashboard" in d.current_url or "Account created" in d.page_source)
        capture_screenshot(driver, "ECP_REG_Valid_Submission")
        assert "/civilian/dashboard" in driver.current_url or "Welcome" in driver.page_source

    def test_ep_reg_name_too_short(self, driver, base_url):
        """IEC-REG-1: Invalid Equivalence Class: Name < 2 characters."""
        driver.get(f"{base_url}/register")
        
        driver.find_element(By.ID, "reg-name").send_keys("X")
        driver.find_element(By.ID, "reg-email").send_keys("valid.email@safety.org")
        driver.find_element(By.ID, "reg-password").send_keys("Password123!")
        driver.find_element(By.ID, "reg-confirm").send_keys("Password123!")
        
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(0.5)
        
        error_elem = driver.find_element(By.XPATH, "//*[contains(text(), 'Name must be at least 2 characters')]")
        capture_screenshot(driver, "ECP_REG_Name_Too_Short")
        assert error_elem.is_displayed(), "Expected validation error for short name"

    def test_ep_reg_email_invalid_format(self, driver, base_url):
        """IEC-REG-2: Invalid Equivalence Class: Email format lacking '@' or domain."""
        driver.get(f"{base_url}/register")
        
        email_elem = driver.find_element(By.ID, "reg-email")
        driver.find_element(By.ID, "reg-name").send_keys("Alex Mercer")
        email_elem.send_keys("invalid-email-address")
        driver.find_element(By.ID, "reg-password").send_keys("Password123!")
        driver.find_element(By.ID, "reg-confirm").send_keys("Password123!")
        
        # Verify HTML5 Equivalence constraint catches it
        is_html5_valid = driver.execute_script("return arguments[0].checkValidity();", email_elem)
        assert not is_html5_valid, "HTML5 constraint validation should identify invalid email format"
        
        # Disable browser native blocking to verify React custom equivalence validation
        driver.execute_script("arguments[0].form.noValidate = true;", email_elem)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(0.5)
        
        error_elem = driver.find_element(By.XPATH, "//*[contains(text(), 'Valid email is required')]")
        capture_screenshot(driver, "ECP_REG_Email_Invalid")
        assert error_elem.is_displayed(), "Expected React email validation error"

    def test_ep_reg_password_too_short(self, driver, base_url):
        """IEC-REG-3: Invalid Equivalence Class: Password length < 8 characters."""
        driver.get(f"{base_url}/register")
        
        driver.find_element(By.ID, "reg-name").send_keys("Elena Rostova")
        driver.find_element(By.ID, "reg-email").send_keys("elena.rostova@safety.org")
        driver.find_element(By.ID, "reg-password").send_keys("12345")
        driver.find_element(By.ID, "reg-confirm").send_keys("12345")
        
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(0.5)
        
        error_elem = driver.find_element(By.XPATH, "//*[contains(text(), 'Password must be at least 8 characters')]")
        capture_screenshot(driver, "ECP_REG_Password_Too_Short")
        assert error_elem.is_displayed(), "Expected password length validation error"

    def test_ep_reg_password_mismatch(self, driver, base_url):
        """IEC-REG-4: Invalid Equivalence Class: Confirm password does not match password."""
        driver.get(f"{base_url}/register")
        
        driver.find_element(By.ID, "reg-name").send_keys("John Walker")
        driver.find_element(By.ID, "reg-email").send_keys("john.walker@safety.org")
        driver.find_element(By.ID, "reg-password").send_keys("CorrectPass123!")
        driver.find_element(By.ID, "reg-confirm").send_keys("DifferentPass456!")
        
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(0.5)
        
        error_elem = driver.find_element(By.XPATH, "//*[contains(text(), 'Passwords do not match')]")
        capture_screenshot(driver, "ECP_REG_Password_Mismatch")
        assert error_elem.is_displayed(), "Expected password mismatch validation error"
