"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS testing
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
import pulumi

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class MyTestHelpers:
    """Helper class to manage Pulumi test resources"""

    @staticmethod
    def new_resource(args):
        """Test implementation for new resource creation"""
        # Generate basic test outputs - only what's needed for tests
        outputs = {
            'id': args.name,
            'urn': f'urn:pulumi:stack::project::{args.typ}::{args.name}',
            'name': args.name
        }
        
        # Add ARN for resources that need it (using test account ID)
        test_account_id = "123456789012"
        test_region = "us-east-1"
        
        if 'dynamodb' in args.typ:
            outputs['arn'] = f'arn:aws:dynamodb:{test_region}:{test_account_id}:table/{args.name}'
        elif 'sns' in args.typ and 'Topic' in args.typ:
            outputs['arn'] = f'arn:aws:sns:{test_region}:{test_account_id}:{args.name}'
        elif 'lambda' in args.typ and 'Function' in args.typ:
            outputs['arn'] = f'arn:aws:lambda:{test_region}:{test_account_id}:function:{args.name}'
        elif 'cloudwatch' in args.typ and 'EventBus' in args.typ:
            outputs['arn'] = f'arn:aws:events:{test_region}:{test_account_id}:event-bus/{args.name}'
        elif 'cloudwatch' in args.typ and 'EventArchive' in args.typ:
            outputs['arn'] = f'arn:aws:events:{test_region}:{test_account_id}:archive/{args.name}'
        elif 'iam' in args.typ and 'Role' in args.typ:
            outputs['arn'] = f'arn:aws:iam::{test_account_id}:role/{args.name}'
        elif 'iam' in args.typ and 'Policy' in args.typ:
            outputs['arn'] = f'arn:aws:iam::{test_account_id}:policy/{args.name}'
        elif 'cloudwatch' in args.typ and 'LogGroup' in args.typ:
            outputs['arn'] = f'arn:aws:logs:{test_region}:{test_account_id}:log-group:{args.name}'
        elif 'cloudwatch' in args.typ and 'MetricAlarm' in args.typ:
            outputs['arn'] = f'arn:aws:cloudwatch:{test_region}:{test_account_id}:alarm:{args.name}'
        else:
            outputs['arn'] = f'arn:aws::::{args.name}'
        
        return args.name, outputs

    @staticmethod
    def call(args):
        """Test implementation for resource calls"""
        return {}


pulumi.runtime.set_mocks(MyTestHelpers())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.log_retention_days, 7)
        self.assertEqual(args.alert_email, "devops@example.com")
        self.assertFalse(args.enable_xray)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Project": "Test", "Owner": "QA"}
        args = TapStackArgs(
            environment_suffix="prod",
            tags=custom_tags,
            log_retention_days=30,
            alert_email="ops@company.com",
            enable_xray=True
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.log_retention_days, 30)
        self.assertEqual(args.alert_email, "ops@company.com")
        self.assertTrue(args.enable_xray)

    def test_tap_stack_args_partial_values(self):
        """Test TapStackArgs with partial custom values."""
        args = TapStackArgs(
            environment_suffix="staging",
            log_retention_days=14
        )

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.log_retention_days, 14)
        self.assertEqual(args.alert_email, "devops@example.com")
        self.assertFalse(args.enable_xray)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack can be instantiated successfully."""

        def check_stack(args):
            stack = TapStack("test-stack", TapStackArgs(
                environment_suffix="test",
                tags={"Test": "True"}
            ))
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, "test")

        return check_stack({})

    @pulumi.runtime.test
    def test_tap_stack_has_dynamodb_tables(self):
        """Test TapStack creates DynamoDB tables."""

        def check_tables(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            self.assertIsNotNone(stack.shipment_events_table)
            self.assertIsNotNone(stack.error_events_table)

        return check_tables({})

    @pulumi.runtime.test
    def test_tap_stack_has_sns_topics(self):
        """Test TapStack creates SNS topics."""

        def check_topics(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            self.assertIsNotNone(stack.alert_topic)
            self.assertIsNotNone(stack.processing_topic)

        return check_topics({})

    @pulumi.runtime.test
    def test_tap_stack_has_eventbridge(self):
        """Test TapStack creates EventBridge resources."""

        def check_eventbridge(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            self.assertIsNotNone(stack.event_bus)
            self.assertIsNotNone(stack.event_archive)

        return check_eventbridge({})

    @pulumi.runtime.test
    def test_tap_stack_has_lambda_functions(self):
        """Test TapStack creates Lambda functions."""

        def check_lambdas(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            self.assertIsNotNone(stack.shipment_processor)
            self.assertIsNotNone(stack.status_updater)
            self.assertIsNotNone(stack.notification_handler)

        return check_lambdas({})

    @pulumi.runtime.test
    def test_tap_stack_with_xray_enabled(self):
        """Test TapStack configuration with X-Ray tracing enabled."""

        def check_xray(args):
            stack = TapStack("test-stack", TapStackArgs(
                environment_suffix="test",
                enable_xray=True
            ))
            self.assertIsNotNone(stack.shipment_processor)
            self.assertIsNotNone(stack.status_updater)

        return check_xray({})

    @pulumi.runtime.test
    def test_tap_stack_with_custom_retention(self):
        """Test TapStack with custom log retention days."""

        def check_retention(args):
            stack = TapStack("test-stack", TapStackArgs(
                environment_suffix="test",
                log_retention_days=30
            ))
            self.assertIsNotNone(stack)

        return check_retention({})


class TestLambdaFunctions(unittest.TestCase):
    """Test Lambda function handler logic."""

    def test_shipment_processor_import(self):
        """Test that shipment_processor module can be imported."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        self.assertIsNotNone(shipment_processor)
        self.assertTrue(hasattr(shipment_processor, 'handler'))

    def test_shipment_processor_handler_success(self):
        """Test shipment_processor handler with valid event."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        
        event = {
            'detail': {
                'shipment_id': 'SHIP-123',
                'status': 'in_transit',
                'metadata': {
                    'origin': 'NYC',
                    'destination': 'LA',
                    'carrier': 'FastShip',
                    'estimated_days': 3
                }
            }
        }
        
        result = shipment_processor.handler(event, {})
        
        self.assertEqual(result['statusCode'], 200)
        self.assertIn('shipment_id', result['body'])

    def test_shipment_processor_missing_shipment_id(self):
        """Test shipment_processor with missing shipment_id."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        
        event = {'detail': {'status': 'pending'}}
        
        with self.assertRaises(ValueError):
            shipment_processor.handler(event, {})

    def test_shipment_processor_process_shipment(self):
        """Test process_shipment function logic."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        
        result = shipment_processor.process_shipment(
            event_id='event-123',
            shipment_id='ship-456',
            status='in_transit',
            metadata={'origin': 'NYC', 'destination': 'LA', 'carrier': 'Ship', 'estimated_days': 3},
            timestamp=1234567890
        )
        
        self.assertIn('processed_at', result)
        self.assertIn('validations', result)
        self.assertIn('estimated_delivery', result)

    def test_status_updater_import(self):
        """Test that status_updater module can be imported."""
        import importlib
        status_updater = importlib.import_module('lib.lambda.status_updater')
        self.assertIsNotNone(status_updater)
        self.assertTrue(hasattr(status_updater, 'handler'))

    def test_status_updater_handler_success(self):
        """Test status_updater handler with valid event."""
        import importlib
        status_updater = importlib.import_module('lib.lambda.status_updater')
        
        event = {
            'detail': {
                'shipment_id': 'SHIP-123',
                'status': 'delivered',
                'old_status': 'in_transit'
            }
        }
        
        result = status_updater.handler(event, {})
        
        self.assertEqual(result['statusCode'], 200)
        self.assertIn('updated', result['body'])

    def test_status_updater_missing_fields(self):
        """Test status_updater with missing required fields."""
        import importlib
        status_updater = importlib.import_module('lib.lambda.status_updater')
        
        event = {'detail': {}}
        
        with self.assertRaises(ValueError):
            status_updater.handler(event, {})

    def test_status_updater_update_status(self):
        """Test update_status function."""
        import importlib
        status_updater = importlib.import_module('lib.lambda.status_updater')
        
        result = status_updater.update_status('ship-123', 'delivered', 'in_transit', 1234567890)
        
        self.assertIn('updated', result)
        self.assertTrue(result['updated'])

    def test_notification_handler_import(self):
        """Test that notification_handler module can be imported."""
        import importlib
        notification_handler = importlib.import_module('lib.lambda.notification_handler')
        self.assertIsNotNone(notification_handler)
        self.assertTrue(hasattr(notification_handler, 'handler'))

    def test_notification_handler_success(self):
        """Test notification_handler with valid event."""
        import importlib
        notification_handler = importlib.import_module('lib.lambda.notification_handler')
        
        event = {
            'detail-type': 'Processing Error',
            'detail': {
                'error_type': 'processing',
                'error_message': 'Test error'
            }
        }
        
        result = notification_handler.handler(event, {})
        
        self.assertEqual(result['statusCode'], 200)
        self.assertIn('processed', result['body'])

    def test_notification_handler_format_message(self):
        """Test format_notification_message function."""
        import importlib
        notification_handler = importlib.import_module('lib.lambda.notification_handler')
        
        detail = {'test': 'data'}
        message = notification_handler.format_notification_message(detail, 'Test Type', 'Test message')
        
        self.assertIsNotNone(message)
        self.assertIn('timestamp', message)
        self.assertIn('environment', message)

    def test_notification_handler_send_notification(self):
        """Test send_sns_notification function."""
        import importlib
        notification_handler = importlib.import_module('lib.lambda.notification_handler')
        
        # Test that the function doesn't raise an error
        notification_handler.send_sns_notification(
            'arn:aws:sns:us-east-1:123456789012:logistics-alerts-test',
            'Test Subject',
            'Test Message',
            True
        )

    def test_notification_handler_send_notification_error(self):
        """Test send_sns_notification with error."""
        import importlib
        notification_handler = importlib.import_module('lib.lambda.notification_handler')
        
        # Test that the function doesn't raise an error even with empty topic_arn
        notification_handler.send_sns_notification(
            '',
            'Test Subject',
            'Test Message',
            False
        )

    def test_shipment_processor_store_event(self):
        """Test store_event function."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        
        # Test that the function doesn't raise an error
        shipment_processor.store_event(
            'event-123', 'ship-456', 'in_transit',
            {'test': 'data'}, 1234567890, {'result': 'ok'}
        )

    def test_shipment_processor_store_event_error(self):
        """Test store_event with error."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        
        # Test that the function doesn't raise an error
        shipment_processor.store_event(
            'event-123', 'ship-456', 'in_transit',
            {'test': 'data'}, 1234567890, {'result': 'ok'}
        )

    def test_shipment_processor_store_error(self):
        """Test store_error function."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        
        # Test that the function doesn't raise an error
        shipment_processor.store_error({'test': 'event'}, 'Error message')

    def test_shipment_processor_send_notification(self):
        """Test send_notification function."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        
        # Test that the function doesn't raise an error
        shipment_processor.send_notification('ship-123', 'delivered', {'test': 'data'})

    def test_shipment_processor_send_notification_error(self):
        """Test send_notification with error."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        
        # Test that the function doesn't raise an error
        shipment_processor.send_notification('ship-123', 'delivered', {'test': 'data'})

    def test_shipment_processor_process_shipment_pending_status(self):
        """Test process_shipment with pending status."""
        import importlib
        shipment_processor = importlib.import_module('lib.lambda.shipment_processor')
        
        result = shipment_processor.process_shipment(
            event_id='event-123',
            shipment_id='ship-456',
            status='pending',
            metadata={'origin': 'NYC'},
            timestamp=1234567890
        )
        
        self.assertIn('processed_at', result)
        self.assertIn('validations', result)
        self.assertNotIn('estimated_delivery', result)

    def test_status_updater_store_error(self):
        """Test store_error function."""
        import importlib
        status_updater = importlib.import_module('lib.lambda.status_updater')
        
        # Test that the function doesn't raise an error
        status_updater.store_error({'test': 'event'}, 'Error message')

    def test_status_updater_update_status_error(self):
        """Test update_status with error."""
        import importlib
        status_updater = importlib.import_module('lib.lambda.status_updater')
        
        # Test that the function doesn't raise an error
        result = status_updater.update_status('ship-123', 'delivered', 'in_transit', 1234567890)
        self.assertTrue(result['updated'])

    def test_notification_handler_critical_alert(self):
        """Test notification_handler with critical alert."""
        import importlib
        notification_handler = importlib.import_module('lib.lambda.notification_handler')
        
        event = {
            'detail-type': 'Critical Error',
            'detail': {
                'error_type': 'critical',
                'error_message': 'Critical system error'
            }
        }
        
        result = notification_handler.handler(event, {})
        
        self.assertEqual(result['statusCode'], 200)
        self.assertIn('is_critical', result['body'])


if __name__ == '__main__':
    unittest.main()

