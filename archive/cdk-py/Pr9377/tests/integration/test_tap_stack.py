import json
import os
import unittest
import time
import requests

from pytest import mark

# Detect LocalStack environment
IS_LOCALSTACK = (
    os.getenv('AWS_ENDPOINT_URL', '').find('localhost') != -1 or
    os.getenv('AWS_ENDPOINT_URL', '').find('4566') != -1
)

base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.load(f)
else:
  flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.api_url = flat_outputs.get('ApiUrl', '').rstrip('/')
    self.hello_endpoint = flat_outputs.get('HelloEndpoint', '').rstrip('/')
    self.user_endpoint_template = flat_outputs.get('UserEndpoint', '').rstrip('/')

    if not self.api_url or not self.hello_endpoint or not self.user_endpoint_template:
      self.skipTest("Required endpoint outputs are not available.")

  def _safe_get(self, url, **kwargs):
    try:
      return requests.get(url, timeout=30, **kwargs)
    except requests.exceptions.RequestException as e:
      self.fail(f"GET request to {url} failed: {e}")

  def _safe_post(self, url, **kwargs):
    try:
      return requests.post(url, timeout=30, **kwargs)
    except requests.exceptions.RequestException as e:
      self.fail(f"POST request to {url} failed: {e}")

  def _safe_options(self, url, **kwargs):
    try:
      return requests.options(url, timeout=30, **kwargs)
    except requests.exceptions.RequestException as e:
      self.fail(f"OPTIONS request to {url} failed: {e}")

  @mark.it("Hello endpoint returns 200 and valid payload")
  def test_hello_endpoint_success(self):
    response = self._safe_get(self.hello_endpoint)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.headers.get('content-type'), 'application/json')
    data = response.json()
    self.assertEqual(data['message'], 'Hello, World!')
    self.assertIn('timestamp', data)
    self.assertIn('path', data)
    self.assertIn('method', data)
    self.assertEqual(data['method'], 'GET')

  @mark.it("Hello endpoint supports POST")
  def test_hello_endpoint_post(self):
    response = self._safe_post(self.hello_endpoint, json={'dummy': 'data'})
    self.assertEqual(response.status_code, 200)
    data = response.json()
    self.assertEqual(data['message'], 'Hello, World!')
    self.assertEqual(data['method'], 'POST')

  @mark.it("User endpoint with anonymous access")
  def test_user_endpoint_anonymous(self):
    url = self.user_endpoint_template.replace("/{userId}", "")
    response = self._safe_get(url)
    self.assertEqual(response.status_code, 200)
    data = response.json()
    self.assertEqual(data['userId'], 'anonymous')
    self.assertIn('timestamp', data)
    self.assertIn('requestId', data)

  @mark.it("User endpoint with specific user ID")
  def test_user_endpoint_with_user_id(self):
    user_id = 'testuser123'
    url = self.user_endpoint_template.replace('{userId}', user_id)
    response = self._safe_get(url)
    self.assertEqual(response.status_code, 200)
    data = response.json()
    self.assertEqual(data['userId'], user_id)
    self.assertIn('timestamp', data)
    self.assertIn('requestId', data)
    self.assertEqual(data['message'], f'Hello, {user_id}!')

  @mark.it("User endpoint with query parameters")
  def test_user_endpoint_with_query_params(self):
    url = self.user_endpoint_template.replace('{userId}', 'queryuser')
    response = self._safe_get(url, params={'param1': 'a', 'param2': 'b'})
    self.assertEqual(response.status_code, 200)
    data = response.json()
    self.assertEqual(data['userId'], 'queryuser')
    self.assertEqual(data['queryParams'].get('param1'), 'a')
    self.assertEqual(data['queryParams'].get('param2'), 'b')

  @mark.it("OPTIONS preflight supports CORS")
  def test_cors_configuration(self):
    response = self._safe_options(
      self.hello_endpoint,
      headers={
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    )
    self.assertIn(response.status_code, [200, 204])

    # Print headers for debugging if CORS is missing
    cors_headers = {k.lower() for k in response.headers.keys()}
    if 'access-control-allow-origin' not in cors_headers:
      print("\n❌ CORS headers missing. Actual headers:")
      for k, v in response.headers.items():
        print(f"  {k}: {v}")

    self.assertIn(
      'access-control-allow-origin',
      cors_headers,
      "'access-control-allow-origin' header missing in response"
    )

  @mark.it("HTTPS URLs only (except LocalStack)")
  def test_https_enforcement(self):
    if IS_LOCALSTACK:
      # LocalStack uses HTTP by default
      self.assertTrue(
        self.api_url.startswith('http://') or self.api_url.startswith('https://')
      )
    else:
      self.assertTrue(self.api_url.startswith('https://'))
      self.assertTrue(self.hello_endpoint.startswith('https://'))
      self.assertTrue(self.user_endpoint_template.startswith('https://'))

  @mark.it("Handles bad paths with 404")
  def test_api_error_handling(self):
    url = f"{self.api_url}/does-not-exist"
    response = self._safe_get(url)
    self.assertEqual(response.status_code, 404)

  @mark.it("Response time within Free Tier limit")
  def test_lambda_performance_within_free_tier(self):
    start = time.time()
    response = self._safe_get(self.hello_endpoint)
    elapsed = time.time() - start
    self.assertEqual(response.status_code, 200)
    self.assertLess(elapsed, 5.0)

  @mark.it("Consistent response structure")
  def test_consistent_response_structure(self):
    hello = self._safe_get(self.hello_endpoint).json()
    user = self._safe_get(self.user_endpoint_template.replace('{userId}', 'abc')).json()
    for field in ['timestamp', 'message']:
      self.assertIn(field, hello)
      self.assertIn(field, user)
