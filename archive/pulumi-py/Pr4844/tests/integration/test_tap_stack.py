"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3


# Integration tests use actual deployed resources from the stack


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load outputs from flat-outputs.json
        outputs_file = 'cfn-outputs/flat-outputs.json'

        if os.path.exists(outputs_file):
            with open(outputs_file, 'r', encoding='utf-8') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}

        # Extract region from ARNs in outputs
        region = None
        for key, value in cls.outputs.items():
            if isinstance(value, str) and value.startswith('arn:aws:'):
                # ARN format: arn:aws:service:region:account:resource
                parts = value.split(':')
                if len(parts) >= 4:
                    region = parts[3]
                    break
        
        # Fallback to environment variable or default region
        if not region:
            region = os.environ.get('AWS_REGION', 'us-east-1')

        # Initialize AWS clients with the correct region
        cls.dynamodb = boto3.client('dynamodb', region_name=region)
        cls.lambda_client = boto3.client('lambda', region_name=region)
        cls.events = boto3.client('events', region_name=region)
        cls.sns = boto3.client('sns', region_name=region)
        cls.logs = boto3.client('logs', region_name=region)

    def test_dynamodb_tables_exist(self):
        """Test that DynamoDB tables were created successfully."""
        if 'shipment_table_name' in self.outputs:
            table_name = self.outputs['shipment_table_name']
            response = self.dynamodb.describe_table(TableName=table_name)
            self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')

        if 'error_table_name' in self.outputs:
            error_table = self.outputs['error_table_name']
            response = self.dynamodb.describe_table(TableName=error_table)
            self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')

    def test_dynamodb_table_configurations(self):
        """Test DynamoDB table detailed configurations."""
        if 'shipment_table_name' in self.outputs:
            table_name = self.outputs['shipment_table_name']
            response = self.dynamodb.describe_table(TableName=table_name)
            table = response['Table']
            
            # Verify billing mode
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Verify encryption is enabled
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')
            
            # Verify point-in-time recovery
            pitr = self.dynamodb.describe_continuous_backups(TableName=table_name)
            self.assertEqual(
                pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
                'ENABLED'
            )
            
            # Verify GSIs exist
            self.assertIn('GlobalSecondaryIndexes', table)
            gsi_names = [gsi['IndexName'] for gsi in table['GlobalSecondaryIndexes']]
            self.assertIn('shipment-index', gsi_names)
            self.assertIn('status-index', gsi_names)
        
        if 'error_table_name' in self.outputs:
            error_table = self.outputs['error_table_name']
            response = self.dynamodb.describe_table(TableName=error_table)
            table = response['Table']
            
            # Verify TTL is configured
            ttl_response = self.dynamodb.describe_time_to_live(TableName=error_table)
            self.assertEqual(ttl_response['TimeToLiveDescription']['TimeToLiveStatus'], 'ENABLED')
            self.assertEqual(ttl_response['TimeToLiveDescription']['AttributeName'], 'ttl')

    def test_lambda_functions_exist(self):
        """Test that Lambda functions were created and are active."""
        if 'shipment_processor_name' in self.outputs:
            func_name = self.outputs['shipment_processor_name']
            response = self.lambda_client.get_function(FunctionName=func_name)
            self.assertIn('Configuration', response)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.10')

        if 'status_updater_name' in self.outputs:
            func_name = self.outputs['status_updater_name']
            response = self.lambda_client.get_function(FunctionName=func_name)
            self.assertIn('Configuration', response)
        
        if 'notification_handler_name' in self.outputs:
            func_name = self.outputs['notification_handler_name']
            response = self.lambda_client.get_function(FunctionName=func_name)
            self.assertIn('Configuration', response)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.10')

    def test_lambda_configurations(self):
        """Test Lambda function detailed configurations."""
        if 'shipment_processor_name' in self.outputs:
            func_name = self.outputs['shipment_processor_name']
            response = self.lambda_client.get_function(FunctionName=func_name)
            config = response['Configuration']
            
            # Verify runtime and handler
            self.assertEqual(config['Runtime'], 'python3.10')
            self.assertEqual(config['Handler'], 'shipment_processor.handler')
            
            # Verify timeout and memory
            self.assertEqual(config['Timeout'], 30)
            self.assertEqual(config['MemorySize'], 256)
            
            # Verify dead letter config
            self.assertIn('DeadLetterConfig', config)
            if 'alert_topic_arn' in self.outputs:
                self.assertEqual(config['DeadLetterConfig']['TargetArn'], self.outputs['alert_topic_arn'])
            
            # Verify reserved concurrent executions (if set)
            if 'ReservedConcurrentExecutions' in config:
                self.assertEqual(config['ReservedConcurrentExecutions'], 10)
        
        if 'status_updater_name' in self.outputs:
            func_name = self.outputs['status_updater_name']
            response = self.lambda_client.get_function(FunctionName=func_name)
            config = response['Configuration']
            
            # Verify timeout and memory
            self.assertEqual(config['Timeout'], 15)
            self.assertEqual(config['MemorySize'], 128)
            
            # Verify handler
            self.assertEqual(config['Handler'], 'status_updater.handler')
        
        if 'notification_handler_name' in self.outputs:
            func_name = self.outputs['notification_handler_name']
            response = self.lambda_client.get_function(FunctionName=func_name)
            config = response['Configuration']
            
            # Verify timeout and memory
            self.assertEqual(config['Timeout'], 10)
            self.assertEqual(config['MemorySize'], 128)
            
            # Verify handler
            self.assertEqual(config['Handler'], 'notification_handler.handler')

    def test_eventbridge_bus_exists(self):
        """Test that EventBridge event bus exists."""
        if 'event_bus_name' in self.outputs:
            bus_name = self.outputs['event_bus_name']
            response = self.events.describe_event_bus(Name=bus_name)
            self.assertIn('Arn', response)
            self.assertEqual(response['Name'], bus_name)

    def test_sns_topics_exist(self):
        """Test that SNS topics were created."""
        if 'alert_topic_arn' in self.outputs:
            topic_arn = self.outputs['alert_topic_arn']
            response = self.sns.get_topic_attributes(TopicArn=topic_arn)
            self.assertIn('Attributes', response)

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups were created for Lambda functions."""
        if 'shipment_processor_name' in self.outputs:
            log_group = f"/aws/lambda/{self.outputs['shipment_processor_name']}"
            response = self.logs.describe_log_groups(
                logGroupNamePrefix=log_group
            )
            self.assertGreater(len(response.get('logGroups', [])), 0)

    def test_sns_topic_configurations(self):
        """Test SNS topic configurations."""
        if 'alert_topic_arn' in self.outputs:
            topic_arn = self.outputs['alert_topic_arn']
            response = self.sns.get_topic_attributes(TopicArn=topic_arn)
            attributes = response['Attributes']
            
            # Verify KMS encryption is enabled
            self.assertIn('KmsMasterKeyId', attributes)
            self.assertIn('aws/sns', attributes['KmsMasterKeyId'])
        
        if 'processing_topic_arn' in self.outputs:
            topic_arn = self.outputs['processing_topic_arn']
            response = self.sns.get_topic_attributes(TopicArn=topic_arn)
            attributes = response['Attributes']
            
            # Verify KMS encryption is enabled
            self.assertIn('KmsMasterKeyId', attributes)

    def test_eventbridge_rules_exist(self):
        """Test that EventBridge rules were created."""
        if 'event_bus_name' in self.outputs:
            bus_name = self.outputs['event_bus_name']
            
            # List rules for the event bus
            response = self.events.list_rules(EventBusName=bus_name)
            rules = response.get('Rules', [])
            
            # Verify rules exist
            self.assertGreater(len(rules), 0, "No EventBridge rules found")
            
            # Check for expected rules
            rule_names = [rule['Name'] for rule in rules]
            expected_patterns = ['shipment-create', 'status-update', 'errors']
            
            for pattern in expected_patterns:
                matching_rules = [name for name in rule_names if pattern in name]
                self.assertGreater(
                    len(matching_rules), 
                    0, 
                    f"No rule found matching pattern '{pattern}'"
                )

    def test_eventbridge_targets_configured(self):
        """Test that EventBridge rules have Lambda targets configured."""
        if 'event_bus_name' in self.outputs:
            bus_name = self.outputs['event_bus_name']
            response = self.events.list_rules(EventBusName=bus_name)
            
            for rule in response.get('Rules', []):
                rule_name = rule['Name']
                
                # Skip archive rules - they don't have Lambda targets
                if 'Archive' in rule_name or 'archive' in rule_name:
                    continue
                
                # Get targets for each rule
                targets_response = self.events.list_targets_by_rule(
                    Rule=rule_name,
                    EventBusName=bus_name
                )
                
                targets = targets_response.get('Targets', [])
                self.assertGreater(
                    len(targets), 
                    0, 
                    f"No targets configured for rule '{rule_name}'"
                )
                
                # Verify at least one target is a Lambda function
                lambda_targets = [t for t in targets if 'lambda' in t.get('Arn', '')]
                self.assertGreater(
                    len(lambda_targets),
                    0,
                    f"No Lambda targets found for rule '{rule_name}'"
                )

    def test_end_to_end_shipment_event_processing(self):
        """
        End-to-end test: Send a shipment event through EventBridge and verify
        it gets processed by Lambda (check CloudWatch logs).
        """
        import time
        import uuid
        
        # Skip if required outputs are not available
        required_outputs = ['event_bus_name', 'shipment_processor_name']
        if not all(key in self.outputs for key in required_outputs):
            self.skipTest("Required outputs not available for E2E test")
        
        event_bus_name = self.outputs['event_bus_name']
        lambda_function_name = self.outputs['shipment_processor_name']
        
        # Generate unique test shipment ID
        test_shipment_id = f"TEST-SHIP-{uuid.uuid4().hex[:8]}"
        
        try:
            # Step 1: Send test event to EventBridge
            event_detail = {
                'shipment_id': test_shipment_id,
                'status': 'in_transit',
                'metadata': {
                    'origin': 'New York',
                    'destination': 'Los Angeles',
                    'carrier': 'TestCarrier',
                    'estimated_days': 3
                }
            }
            
            put_response = self.events.put_events(
                Entries=[
                    {
                        'Source': 'logistics.shipment',
                        'DetailType': 'Shipment Created',
                        'Detail': json.dumps(event_detail),
                        'EventBusName': event_bus_name
                    }
                ]
            )
            
            # Verify event was accepted
            self.assertEqual(put_response['FailedEntryCount'], 0)
            self.assertGreater(len(put_response['Entries']), 0)
            
            # Step 2: Wait for Lambda processing and check CloudWatch logs
            max_wait_seconds = 30
            wait_interval = 2
            log_found = False
            
            log_group_name = f"/aws/lambda/{lambda_function_name}"
            
            for _ in range(max_wait_seconds // wait_interval):
                time.sleep(wait_interval)
                
                # Check CloudWatch logs for processing confirmation
                try:
                    # Get recent log streams
                    streams_response = self.logs.describe_log_streams(
                        logGroupName=log_group_name,
                        orderBy='LastEventTime',
                        descending=True,
                        limit=5
                    )
                    
                    if streams_response.get('logStreams'):
                        # Get events from the most recent stream
                        latest_stream = streams_response['logStreams'][0]
                        events_response = self.logs.get_log_events(
                            logGroupName=log_group_name,
                            logStreamName=latest_stream['logStreamName'],
                            startTime=int((time.time() - 60) * 1000),  # Last minute
                            limit=50
                        )
                        
                        # Check if our test shipment ID appears in the logs
                        for event in events_response.get('events', []):
                            if test_shipment_id in event.get('message', ''):
                                log_found = True
                                break
                        
                        if log_found:
                            break
                            
                except Exception as e:
                    # Logs might not be ready or query might fail, continue waiting
                    print(f"Log check attempt failed: {str(e)}")
                    continue
            
            # Assert that the event was processed (found in logs)
            self.assertTrue(
                log_found, 
                f"Event processing not found in CloudWatch logs after {max_wait_seconds} seconds"
            )
            
        except Exception as e:
            self.fail(f"End-to-end test failed: {str(e)}")


if __name__ == '__main__':
    unittest.main()
