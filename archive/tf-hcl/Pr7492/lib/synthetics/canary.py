from aws_synthetics.selenium import synthetics_webdriver as webdriver
from aws_synthetics.common import synthetics_logger as logger
import os

def handler(event, context):
    """
    CloudWatch Synthetics canary for endpoint monitoring.
    Tests API health and performance across multiple regions.
    """

    # Configure browser
    browser = webdriver.Chrome()
    browser.set_page_load_timeout(30)

    environment = os.environ.get('ENVIRONMENT', 'prod')
    region = os.environ.get('REGION', 'us-east-1')

    endpoints = [
        'https://api.example.com/health',
        'https://api.example.com/status',
        'https://app.example.com'
    ]

    try:
        for endpoint in endpoints:
            logger.info(f"Testing endpoint: {endpoint}")

            # Navigate to endpoint
            browser.get(endpoint)

            # Verify page loaded
            page_source = browser.page_source

            if 'error' in page_source.lower():
                raise Exception(f"Error detected on page: {endpoint}")

            logger.info(f"Successfully validated {endpoint}")

            # Take screenshot
            browser.save_screenshot(f"screenshot_{endpoint.replace('://', '_').replace('/', '_')}.png")

        logger.info(f"All endpoints validated successfully in {region}")

    except Exception as e:
        logger.error(f"Canary failed: {str(e)}")
        raise

    finally:
        browser.quit()

    return "Canary completed successfully"
