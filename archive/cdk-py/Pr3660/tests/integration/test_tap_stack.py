import json
import os
import unittest
import uuid
import time
from datetime import datetime
import requests

from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack"""

    def setUp(self):
        """Set up for integration tests"""
        self.api_endpoint = flat_outputs.get('ApiEndpoint')
        self.table_name = flat_outputs.get('TableName')
        self.environment = flat_outputs.get('EnvironmentName', 'dev')
        
        if not self.api_endpoint:
            self.skipTest("No API endpoint found in flat outputs - stack may not be deployed")
        
        # Ensure endpoint ends with /
        if not self.api_endpoint.endswith('/'):
            self.api_endpoint += '/'
            
        # Create unique test item ID to avoid conflicts
        self.test_item_id = f"test-item-{uuid.uuid4().hex[:8]}"
        self.test_sku = f"TEST-SKU-{uuid.uuid4().hex[:8]}"
        
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

    def tearDown(self):
        """Clean up test data"""
        if hasattr(self, 'test_item_id') and hasattr(self, 'test_sku'):
            try:
                # Attempt to clean up test item if it exists
                delete_url = f"{self.api_endpoint}items/{self.test_item_id}?sku={self.test_sku}"
                requests.delete(delete_url, headers=self.headers, timeout=10)
            except Exception:
                pass  # Ignore cleanup errors

    @mark.it("performs end-to-end CRUD operations on inventory API")
    def test_end_to_end_inventory_crud(self):
        """
        Complete end-to-end test of the inventory management API:
        1. Create an item (POST /items)
        2. Get the item (GET /items/{item_id})
        3. Update the item (PUT /items/{item_id})
        4. List items (GET /items) 
        5. Delete the item (DELETE /items/{item_id})
        """
        
        # Test data
        initial_item = {
            "sku": self.test_sku,
            "name": f"Test Product {self.test_item_id}",
            "description": "Integration test product",
            "quantity": 100,
            "price": 29.99,
            "category": "test-category",
            "status": "available"
        }
        
        updated_item = {
            "sku": self.test_sku,
            "name": f"Updated Test Product {self.test_item_id}",
            "description": "Updated integration test product", 
            "quantity": 85,
            "price": 34.99,
            "category": "updated-category",
            "status": "available"
        }

        # 1. CREATE ITEM (POST /items)
        print(f"\n1. Creating item via POST {self.api_endpoint}items")
        create_response = requests.post(
            f"{self.api_endpoint}items",
            json=initial_item,
            headers=self.headers,
            timeout=30
        )
        
        self.assertEqual(create_response.status_code, 201, 
                         f"Failed to create item: {create_response.text}")
        
        created_data = create_response.json()
        self.assertIn('item', created_data)
        self.assertEqual(created_data['item']['sku'], self.test_sku)
        self.assertEqual(created_data['item']['name'], initial_item['name'])
        
        # Store the item_id from creation response
        created_item_id = created_data['item']['item_id']
        self.test_item_id = created_item_id  # Update for cleanup
        
        # 2. GET ITEM (GET /items/{item_id})
        print(f"2. Getting item via GET {self.api_endpoint}items/{created_item_id}")
        get_response = requests.get(
            f"{self.api_endpoint}items/{created_item_id}?sku={self.test_sku}",
            headers=self.headers,
            timeout=30
        )
        
        self.assertEqual(get_response.status_code, 200,
                         f"Failed to get item: {get_response.text}")
        
        retrieved_data = get_response.json()
        self.assertIn('item', retrieved_data)
        self.assertEqual(retrieved_data['item']['item_id'], created_item_id)
        self.assertEqual(retrieved_data['item']['sku'], self.test_sku)
        self.assertEqual(retrieved_data['item']['name'], initial_item['name'])
        
        # 3. UPDATE ITEM (PUT /items/{item_id})
        print(f"3. Updating item via PUT {self.api_endpoint}items/{created_item_id}")
        update_response = requests.put(
            f"{self.api_endpoint}items/{created_item_id}",
            json=updated_item,
            headers=self.headers,
            timeout=30
        )
        
        self.assertEqual(update_response.status_code, 200,
                         f"Failed to update item: {update_response.text}")
        
        updated_data = update_response.json()
        self.assertIn('item', updated_data)
        self.assertEqual(updated_data['item']['name'], updated_item['name'])
        self.assertEqual(updated_data['item']['quantity'], updated_item['quantity'])
        self.assertEqual(updated_data['item']['price'], updated_item['price'])
        
        # 4. LIST ITEMS (GET /items)
        print(f"4. Listing items via GET {self.api_endpoint}items")
        list_response = requests.get(
            f"{self.api_endpoint}items",
            headers=self.headers,
            timeout=30
        )
        
        self.assertEqual(list_response.status_code, 200,
                         f"Failed to list items: {list_response.text}")
        
        list_data = list_response.json()
        self.assertIn('items', list_data)
        self.assertIsInstance(list_data['items'], list)
        
        # Verify our test item appears in the list
        test_item_found = False
        for item in list_data['items']:
            if item.get('item_id') == created_item_id:
                test_item_found = True
                self.assertEqual(item['name'], updated_item['name'])
                break
        
        self.assertTrue(test_item_found, "Test item not found in items list")
        
        # 5. DELETE ITEM (DELETE /items/{item_id})
        print(f"5. Deleting item via DELETE {self.api_endpoint}items/{created_item_id}")
        delete_response = requests.delete(
            f"{self.api_endpoint}items/{created_item_id}?sku={self.test_sku}",
            headers=self.headers,
            timeout=30
        )
        
        self.assertEqual(delete_response.status_code, 200,
                         f"Failed to delete item: {delete_response.text}")
        
        delete_data = delete_response.json()
        self.assertIn('message', delete_data)
        
        # 6. VERIFY DELETION - Item should not be found
        print(f"6. Verifying deletion via GET {self.api_endpoint}items/{created_item_id}")
        verify_response = requests.get(
            f"{self.api_endpoint}items/{created_item_id}?sku={self.test_sku}",
            headers=self.headers,
            timeout=30
        )
        
        self.assertEqual(verify_response.status_code, 404,
                         "Item should not be found after deletion")
        
        print("✅ End-to-end CRUD test completed successfully!")

    @mark.it("tests API validation with invalid data")
    def test_api_validation(self):
        """Test API request validation"""
        
        # Test creating item with missing required fields
        invalid_item = {
            "name": "Test Item",
            # Missing required: sku, quantity, category
        }
        
        print(f"\nTesting validation with invalid data at {self.api_endpoint}items")
        response = requests.post(
            f"{self.api_endpoint}items",
            json=invalid_item,
            headers=self.headers,
            timeout=30
        )
        
        # Should return 400 Bad Request for validation errors
        self.assertEqual(response.status_code, 400,
                         f"Expected validation error, got: {response.status_code} - {response.text}")

    @mark.it("tests API error handling for non-existent items") 
    def test_error_handling(self):
        """Test API error handling for non-existent resources"""
        
        non_existent_id = f"non-existent-{uuid.uuid4().hex[:8]}"
        non_existent_sku = f"NON-EXISTENT-{uuid.uuid4().hex[:8]}"
        
        print(f"\nTesting error handling for non-existent item: {non_existent_id}")
        
        # Try to get non-existent item
        response = requests.get(
            f"{self.api_endpoint}items/{non_existent_id}?sku={non_existent_sku}",
            headers=self.headers,
            timeout=30
        )
        
        self.assertEqual(response.status_code, 404,
                         f"Expected 404 for non-existent item, got: {response.status_code}")

    @mark.it("validates deployed infrastructure outputs")
    def test_infrastructure_outputs(self):
        """Validate that all expected infrastructure outputs are present"""
        
        print(f"\nValidating infrastructure outputs...")
        print(f"API Endpoint: {self.api_endpoint}")
        print(f"Table Name: {self.table_name}")
        print(f"Environment: {self.environment}")
        
        # Check required outputs
        self.assertIsNotNone(self.api_endpoint, "API endpoint should be available")
        self.assertIsNotNone(self.table_name, "Table name should be available")
        self.assertIsNotNone(self.environment, "Environment should be available")
        
        # Validate API endpoint format
        self.assertTrue(self.api_endpoint.startswith('https://'),
                        "API endpoint should use HTTPS")
        self.assertIn('execute-api', self.api_endpoint,
                      "API endpoint should be an API Gateway URL")
        
        # Validate table name format  
        self.assertTrue(self.table_name.startswith('inventory-'),
                        "Table name should start with 'inventory-'")
        
        print("✅ Infrastructure outputs validation passed!")
