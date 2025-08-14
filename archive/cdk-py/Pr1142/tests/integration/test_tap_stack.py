import json
import os
import unittest
import requests
from pytest import mark

# --- Setup for Outputs File ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(
  BASE_DIR, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

# Load the CloudFormation outputs and check if the file is populated
if os.path.exists(FLAT_OUTPUTS_PATH) and os.path.getsize(FLAT_OUTPUTS_PATH) > 0:
  with open(FLAT_OUTPUTS_PATH, 'r', encoding='utf-8') as f:
    FLAT_OUTPUTS = json.load(f)
  CFN_OUTPUTS_AVAILABLE = True
else:
  FLAT_OUTPUTS = {}
  CFN_OUTPUTS_AVAILABLE = False


@mark.describe("WebApplicationStack")
class TestWebApplicationStack(unittest.TestCase):
  """Integration test suite for the WebApplicationStack CDK stack."""

  def setUp(self):
    """Prepares test data from CloudFormation outputs."""
    self.alb_dns_name = FLAT_OUTPUTS.get('AlbDnsName')
    self.cf_domain_name = FLAT_OUTPUTS.get('CloudFrontDistributionDomainName')

  @mark.it("Verifies ALB and CloudFront outputs are available.")
  @mark.skipif(
    not CFN_OUTPUTS_AVAILABLE,
    reason="CloudFormation outputs file is empty or missing. Deploy the stack first."
  )
  def test_cfn_outputs_are_present(self):
    """Checks if the required CloudFormation outputs are present."""
    self.assertIsNotNone(self.alb_dns_name, "AlbDnsName output is missing.")
    self.assertIsNotNone(
      self.cf_domain_name,
      "CloudFrontDistributionDomainName output is missing."
    )

  @mark.it("Verifies the ALB endpoint is reachable and returns a 200 OK.")
  @mark.skipif(
    not CFN_OUTPUTS_AVAILABLE,
    reason="Cannot test ALB; outputs file is empty."
  )
  def test_alb_is_reachable(self):
    """Tests if the ALB endpoint responds with a 200 OK status."""
    alb_url = f"http://{self.alb_dns_name}"

    try:
      response = requests.get(alb_url, timeout=15)
      self.assertEqual(
        response.status_code, 200,
        f"ALB at {alb_url} returned status code {response.status_code}."
      )
    except requests.exceptions.RequestException as exc:
      self.fail(f"Failed to connect to ALB at {alb_url}: {exc}")

  @mark.it("Verifies the CloudFront distribution is reachable and redirects to HTTPS.")
  @mark.skipif(
    not CFN_OUTPUTS_AVAILABLE,
    reason="Cannot test CloudFront; outputs file is empty."
  )
  def test_cloudfront_is_reachable(self):
    """Tests if the CloudFront distribution redirects to HTTPS and is reachable."""
    cf_url = f"http://{self.cf_domain_name}"

    try:
      response = requests.get(cf_url, timeout=15, allow_redirects=True)
      self.assertEqual(
        response.status_code, 200,
        f"CloudFront at {cf_url} returned status code {response.status_code}."
      )
      self.assertTrue(
        response.url.startswith("https://"),
        "CloudFront did not redirect to HTTPS."
      )
    except requests.exceptions.RequestException as exc:
      self.fail(f"Failed to connect to CloudFront at {cf_url}: {exc}")
