import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

DRIVER_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "drivers", "chromedriver-win64", "chromedriver.exe"))
SCREENSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "screenshots"))
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

@pytest.fixture(scope="session")
def base_url():
    return "http://localhost:5173"

@pytest.fixture(scope="function")
def driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--log-level=3")

    service = Service(executable_path=DRIVER_PATH)
    drv = webdriver.Chrome(service=service, options=chrome_options)
    drv.implicitly_wait(4)
    yield drv
    drv.quit()

def capture_screenshot(driver, test_name):
    path = os.path.join(SCREENSHOT_DIR, f"{test_name}.png")
    driver.save_screenshot(path)
    return path
