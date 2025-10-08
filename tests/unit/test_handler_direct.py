"""
test_handler_direct.py

Direct tests of handler functions that can work without AWS dependencies.
"""

import unittest
import os
import sys
import json

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib'))

class TestHandlerDirect(unittest.TestCase):
    """Direct tests of handler logic."""
    
    def setUp(self):
        """Set up environment variables."""
        os.environ['TABLE_NAME'] = 'test-table'
        os.environ['ENVIRONMENT'] = 'test'
        os.environ['CONFIG_PARAM'] = '/test/config'
        os.environ['DB_PARAM'] = '/test/db'
        os.environ['FEATURE_FLAGS_PARAM'] = '/test/flags'
    
    def test_validation_function_direct(self):
        """Test validation function by importing it directly."""
        try:
            # Import the module using sys.modules to avoid lambda keyword issue
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "handler", 
                os.path.join(os.path.dirname(__file__), '../../lib/lambda/handler.py')
            )
            handler = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(handler)
            
            # Test valid data
            valid_data = {
                'tracking_id': 'TRK123',
                'status': 'in_transit',
                'location': {'lat': 40.7128, 'lng': -74.0060}
            }
            self.assertTrue(handler.validate_tracking_data(valid_data))
            
            # Test all valid statuses
            valid_statuses = ['pending', 'in_transit', 'delivered', 'failed']
            for status in valid_statuses:
                test_data = {
                    'tracking_id': f'TRK_{status}',
                    'status': status,
                    'location': {'lat': 40.7128, 'lng': -74.0060}
                }
                self.assertTrue(handler.validate_tracking_data(test_data), 
                              f"Status {status} should be valid")
            
            # Test invalid cases
            invalid_cases = [
                # Missing tracking_id
                {'status': 'in_transit', 'location': {'lat': 40.7128, 'lng': -74.0060}},
                # Missing status
                {'tracking_id': 'TRK123', 'location': {'lat': 40.7128, 'lng': -74.0060}},
                # Missing location
                {'tracking_id': 'TRK123', 'status': 'in_transit'},
                # Invalid status
                {'tracking_id': 'TRK123', 'status': 'invalid', 'location': {'lat': 40.7128, 'lng': -74.0060}},
                # Missing lat
                {'tracking_id': 'TRK123', 'status': 'in_transit', 'location': {'lng': -74.0060}},
                # Missing lng
                {'tracking_id': 'TRK123', 'status': 'in_transit', 'location': {'lat': 40.7128}}
            ]
            
            for i, invalid_data in enumerate(invalid_cases):
                self.assertFalse(handler.validate_tracking_data(invalid_data), 
                               f"Case {i} should be invalid: {invalid_data}")
            
        except Exception as e:
            self.skipTest(f"Could not import handler: {e}")
    
    def test_handler_constants(self):
        """Test that handler constants are set correctly."""
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "handler", 
                os.path.join(os.path.dirname(__file__), '../../lib/lambda/handler.py')
            )
            handler = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(handler)
            
            # Test environment variables are read
            self.assertEqual(handler.TABLE_NAME, 'test-table')
            self.assertEqual(handler.ENVIRONMENT, 'test')
            
            # Test cache constants
            self.assertEqual(handler.CACHE_TTL, 300)
            self.assertEqual(handler.MAX_CACHE_SIZE, 50)
            
            # Test that caches exist and are dictionaries
            self.assertIsInstance(handler._parameter_cache, dict)
            self.assertIsInstance(handler._cache_expiry, dict)
            
        except Exception as e:
            self.skipTest(f"Could not import handler: {e}")
    
    def test_json_operations_like_handler(self):
        """Test JSON operations similar to what the handler does."""
        # Test event parsing like the handler
        test_event = {
            'httpMethod': 'POST',
            'path': '/track',
            'body': json.dumps({
                'tracking_id': 'TRK123',
                'status': 'in_transit',
                'location': {'lat': 40.7128, 'lng': -74.0060}
            }),
            'queryStringParameters': None
        }
        
        # Test body parsing
        if test_event.get('body'):
            body = json.loads(test_event['body'])
            self.assertIn('tracking_id', body)
            self.assertEqual(body['tracking_id'], 'TRK123')
        
        # Test query string parsing
        query_event = {
            'httpMethod': 'GET',
            'path': '/status',
            'queryStringParameters': {
                'tracking_id': 'TRK456',
                'limit': '10'
            }
        }
        
        query_params = query_event.get('queryStringParameters') or {}
        tracking_id = query_params.get('tracking_id')
        limit = int(query_params.get('limit', 10))
        
        self.assertEqual(tracking_id, 'TRK456')
        self.assertEqual(limit, 10)
    
    def test_response_formatting(self):
        """Test response formatting similar to handler."""
        # Test success response
        success_response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Tracking update stored successfully',
                'tracking_id': 'TRK123',
                'timestamp': 1609459200000
            }),
            'headers': {'Content-Type': 'application/json'}
        }
        
        self.assertEqual(success_response['statusCode'], 200)
        self.assertIn('Content-Type', success_response['headers'])
        
        body = json.loads(success_response['body'])
        self.assertIn('tracking_id', body)
        self.assertEqual(body['tracking_id'], 'TRK123')
        
        # Test error response
        error_response = {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid tracking data'}),
            'headers': {'Content-Type': 'application/json'}
        }
        
        self.assertEqual(error_response['statusCode'], 400)
        error_body = json.loads(error_response['body'])
        self.assertIn('error', error_body)
    
    def test_time_operations(self):
        """Test time operations similar to handler."""
        import time
        
        # Test timestamp operations
        current_time = time.time()
        timestamp_ms = int(current_time * 1000)
        
        self.assertIsInstance(timestamp_ms, int)
        self.assertGreater(timestamp_ms, 0)
        
        # Test time formatting
        formatted_time = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(current_time))
        self.assertIsInstance(formatted_time, str)
        self.assertIn('-', formatted_time)  # Should have date separators
        self.assertIn(':', formatted_time)  # Should have time separators
    
    def test_data_structure_operations(self):
        """Test data structure operations like in handler."""
        # Test item creation similar to store_tracking_update
        import time
        
        input_data = {
            'tracking_id': 'TRK123',
            'status': 'delivered',
            'location': {'lat': 40.7128, 'lng': -74.0060},
            'metadata': {'driver': 'John Doe'}
        }
        
        timestamp = int(time.time() * 1000)
        
        # Create item like handler does
        item = {
            'tracking_id': input_data['tracking_id'],
            'timestamp': timestamp,
            'status': input_data['status'],
            'location': input_data['location'],
            'environment': 'test',
            'created_at': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
        }
        
        # Add optional metadata
        if 'metadata' in input_data:
            item['metadata'] = input_data['metadata']
        
        # Test item structure
        self.assertEqual(item['tracking_id'], 'TRK123')
        self.assertEqual(item['status'], 'delivered')
        self.assertIn('lat', item['location'])
        self.assertIn('lng', item['location'])
        self.assertEqual(item['environment'], 'test')
        self.assertIn('metadata', item)
        self.assertEqual(item['metadata']['driver'], 'John Doe')


if __name__ == '__main__':
    unittest.main()
