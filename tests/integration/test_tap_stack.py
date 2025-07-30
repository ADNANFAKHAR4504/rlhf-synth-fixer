
import json
import os
import unittest
import requests
import time

from pytest import mark

base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.api_url = flat_outputs.get('ApiUrl', '')
    self.hello_endpoint = flat_outputs.get('HelloEndpoint', '')
    self.user_endpoint = flat_outputs.get('UserEndpoint', '')

    if not self.api_url:
      self.skipTest("Stack outputs not available - deployment required")

  @mark.it("API Gateway Hello endpoint returns successful response")
  def test_hello_endpoint_success(self):
    response = requests.get(self.hello_endpoint, timeout=30)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.headers.get('content-type'), 'application/json')
    response_data = response.json()
    self.assertIn('message', response_data)
    self.assertEqual(response_data['message'], 'Hello, World!')
    self.assertIn('timestamp', response_data)
    self.assertIn('path', response_data)
    self.assertIn('method', response_data)
    self.assertEqual(response_data['method'], 'GET')

  @mark.it("API Gateway Hello endpoint supports POST requests")
  def test_hello_endpoint_post(self):
    response = requests.post(self.hello_endpoint, json={'test': 'data'}, timeout=30)
    self.assertEqual(response.status_code, 200)
    response_data = response.json()
    self.assertEqual(response_data['message'], 'Hello, World!')
    self.assertEqual(response_data['method'], 'POST')

  @mark.it("API Gateway User endpoint with anonymous user")
  def test_user_endpoint_anonymous(self):
    user_base_url = self.user_endpoint.replace('/{userId}', '')
    response = requests.get(user_base_url, timeout=30)
    self.assertEqual(response.status_code, 200)
    response_data = response.json()
    self.assertIn('userId', response_data)
    self.assertEqual(response_data['userId'], 'anonymous')
    self.assertIn('message', response_data)
    self.assertIn('timestamp', response_data)
    self.assertIn('requestId', response_data)

  @mark.it("API Gateway User endpoint with specific userId")
  def test_user_endpoint_with_user_id(self):
    test_user_id = 'testuser123'
    user_url = self.user_endpoint.replace('{userId}', test_user_id)
    response = requests.get(user_url, timeout=30)
    self.assertEqual(response.status_code, 200)
    response_data = response.json()
    self.assertEqual(response_data['userId'], test_user_id)
    self.assertEqual(response_data['message'], f'Hello, {test_user_id}!')
    self.assertIn('timestamp', response_data)
    self.assertIn('requestId', response_data)

  @mark.it("API Gateway User endpoint with query parameters")
  def test_user_endpoint_with_query_params(self):
    test_user_id = 'queryuser'
    user_url = self.user_endpoint.replace('{userId}', test_user_id)
    query_params = {'param1': 'value1', 'param2': 'value2'}
    response = requests.get(user_url, params=query_params, timeout=30)
    self.assertEqual(response.status_code, 200)
    response_data = response.json()
    self.assertEqual(response_data['userId'], test_user_id)
    self.assertIn('queryParams', response_data)
    self.assertEqual(response_data['queryParams'].get('param1'), 'value1')
    self.assertEqual(response_data['queryParams'].get('param2'), 'value2')

  @mark.it("API Gateway CORS configuration allows cross-origin requests")
  def test_cors_configuration(self):
    response = requests.options(self.hello_endpoint, headers={'Origin': 'https://example.com'}, timeout=30)
    self.assertIn(response.status_code, [200, 204])
    cors_headers = [h.lower() for h in response.headers.keys()]
    self.assertIn('access-control-allow-origin', cors_headers)

  @mark.it("Lambda functions execute within Free Tier timeout limits")
  def test_lambda_performance_within_free_tier(self):
    start_time = time.time()
    response = requests.get(self.hello_endpoint, timeout=30)
    end_time = time.time()
    self.assertEqual(response.status_code, 200)
    response_time = end_time - start_time
    self.assertLess(response_time, 5.0, f"Response time {response_time}s exceeds expected limit")

  @mark.it("API Gateway endpoints return proper error handling")
  def test_api_error_handling(self):
    invalid_endpoint = f"{self.api_url}invalid-route"
    response = requests.get(invalid_endpoint, timeout=30)
    self.assertEqual(response.status_code, 404)

  @mark.it("All API endpoints use HTTPS")
  def test_https_enforcement(self):
    self.assertTrue(self.api_url.startswith('https://'))
    self.assertTrue(self.hello_endpoint.startswith('https://'))
    user_url_base = self.user_endpoint.replace('/{userId}', '')
    self.assertTrue(user_url_base.startswith('https://'))

  @mark.it("Lambda functions return consistent response structure")
  def test_consistent_response_structure(self):
    hello_response = requests.get(self.hello_endpoint, timeout=30)
    user_response = requests.get(self.user_endpoint.replace('{userId}', 'testuser'), timeout=30)
    self.assertEqual(hello_response.status_code, 200)
    self.assertEqual(user_response.status_code, 200)
    hello_data = hello_response.json()
    user_data = user_response.json()
    required_fields = ['timestamp']
    for field in required_fields:
      self.assertIn(field, hello_data)
      self.assertIn(field, user_data)
    self.assertIn('message', hello_data)
    self.assertIn('message', user_data)
