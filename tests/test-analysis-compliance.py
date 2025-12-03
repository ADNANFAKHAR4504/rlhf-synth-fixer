#!/usr/bin/env python3
"""
Test suite for Infrastructure Compliance Analysis script using moto
"""

import json
import csv
import os
import sys
import unittest
from datetime import datetime
import boto3
from moto import mock_aws
import pytest

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from analyse import ComplianceInfraAnalyzer


class TestComplianceInfraAnalyzer(unittest.TestCase):
    """Test cases for ComplianceInfraAnalyzer using moto mocks"""

    def _cleanup_all_lambda_functions(self):
        """Delete ALL Lambda functions from Moto to ensure test isolation"""
        try:
            lambda_client = boto3.client('lambda', region_name='us-east-1')
            paginator = lambda_client.get_paginator('list_functions')
            for page in paginator.paginate():
                for func in page.get('Functions', []):
                    try:
                        lambda_client.delete_function(FunctionName=func['FunctionName'])
                    except Exception:
                        pass  # Ignore errors during cleanup
        except Exception:
            pass  # If pagination fails, continue

    def _cleanup_all_dynamodb_tables(self):
        """Delete ALL DynamoDB tables from Moto to ensure test isolation"""
        try:
            dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
            response = dynamodb_client.list_tables()
            for table_name in response.get('TableNames', []):
                try:
                    dynamodb_client.delete_table(TableName=table_name)
                except Exception:
                    pass  # Ignore errors during cleanup
        except Exception:
            pass  # If list fails, continue

    def _cleanup_all_sns_topics(self):
        """Delete ALL SNS topics from Moto to ensure test isolation"""
        try:
            sns_client = boto3.client('sns', region_name='us-east-1')
            response = sns_client.list_topics()
            for topic in response.get('Topics', []):
                try:
                    sns_client.delete_topic(TopicArn=topic['TopicArn'])
                except Exception:
                    pass  # Ignore errors during cleanup
        except Exception:
            pass  # If list fails, continue

    def _cleanup_all_cloudwatch_alarms(self):
        """Delete ALL CloudWatch alarms from Moto to ensure test isolation"""
        try:
            cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')
            response = cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response.get('MetricAlarms', [])]
            if alarm_names:
                try:
                    cloudwatch_client.delete_alarms(AlarmNames=alarm_names)
                except Exception:
                    pass  # Ignore errors during cleanup
        except Exception:
            pass  # If describe fails, continue

    def _cleanup_all_eventbridge_rules(self):
        """Delete ALL EventBridge rules from Moto to ensure test isolation"""
        try:
            events_client = boto3.client('events', region_name='us-east-1')
            response = events_client.list_rules()
            for rule in response.get('Rules', []):
                rule_name = rule['Name']
                try:
                    # Remove targets first
                    targets_response = events_client.list_targets_by_rule(Rule=rule_name)
                    target_ids = [target['Id'] for target in targets_response.get('Targets', [])]
                    if target_ids:
                        events_client.remove_targets(Rule=rule_name, Ids=target_ids)
                except Exception:
                    pass  # Ignore errors during target cleanup
                try:
                    # Delete rule
                    events_client.delete_rule(Name=rule_name)
                except Exception:
                    pass  # Ignore errors during rule cleanup
        except Exception:
            pass  # If list fails, continue

    @mock_aws
    def test_analyze_lambda_functions(self):
        """Test detection of Lambda scanner functions"""
        # Clean ALL resources from previous tests to ensure isolation
        self._cleanup_all_lambda_functions()

        # Setup
        iam_client = boto3.client('iam', region_name='us-east-1')
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        analyzer = ComplianceInfraAnalyzer()

        # Create IAM role with proper trust policy for Lambda
        assume_role_policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        # Use unique role name to avoid conflicts with other tests
        role_name = 'lambda-role-test-analyze-lambda-functions'
        try:
            iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=assume_role_policy_document,
                Path='/',
            )
        except iam_client.exceptions.EntityAlreadyExistsException:
            # Role already exists from previous test run, continue
            pass

        # Clean up any existing functions from previous test runs
        for func_name in ['ec2-scanner-test1', 's3-compliance-scanner-test1', 'other-function-test1']:
            try:
                lambda_client.delete_function(FunctionName=func_name)
            except lambda_client.exceptions.ResourceNotFoundException:
                pass  # Function doesn't exist, continue

        # Create scanner functions with unique names
        lambda_client.create_function(
            FunctionName='ec2-scanner-test1',
            Runtime='nodejs18.x',
            Role=f'arn:aws:iam::123456789012:role/{role_name}',
            Handler='index.handler',
            Code={'ZipFile': b'fake code'},
            MemorySize=256,
            Timeout=60
        )

        lambda_client.create_function(
            FunctionName='s3-compliance-scanner-test1',
            Runtime='nodejs18.x',
            Role=f'arn:aws:iam::123456789012:role/{role_name}',
            Handler='index.handler',
            Code={'ZipFile': b'fake code'},
            MemorySize=512,
            Timeout=120
        )

        # Create non-scanner function
        lambda_client.create_function(
            FunctionName='other-function-test1',
            Runtime='python3.9',
            Role=f'arn:aws:iam::123456789012:role/{role_name}',
            Handler='main.handler',
            Code={'ZipFile': b'fake code'}
        )

        # Run test
        lambda_analysis = analyzer.analyze_lambda_functions()

        # Assertions
        self.assertEqual(lambda_analysis['total_count'], 3)
        self.assertEqual(len(lambda_analysis['scanner_functions']), 2)
        self.assertIn('ec2-scanner-test1', lambda_analysis['scanner_functions'])
        self.assertIn('s3-compliance-scanner-test1', lambda_analysis['scanner_functions'])

        # Check function details
        ec2_scanner = next((f for f in lambda_analysis['functions'] if f['name'] == 'ec2-scanner-test1'), None)
        self.assertIsNotNone(ec2_scanner)
        self.assertEqual(ec2_scanner['runtime'], 'nodejs18.x')
        self.assertEqual(ec2_scanner['memory'], 256)
        self.assertEqual(ec2_scanner['timeout'], 60)

    @mock_aws
    def test_analyze_dynamodb_tables(self):
        """Test detection of compliance DynamoDB tables"""
        # Clean ALL resources from previous tests to ensure isolation
        self._cleanup_all_dynamodb_tables()

        # Setup
        dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        analyzer = ComplianceInfraAnalyzer()

        # Create compliance table with TTL
        dynamodb_client.create_table(
            TableName='compliance-history-pr7708',
            KeySchema=[
                {'AttributeName': 'resourceType', 'KeyType': 'HASH'},
                {'AttributeName': 'scanTimestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'resourceType', 'AttributeType': 'S'},
                {'AttributeName': 'scanTimestamp', 'AttributeType': 'N'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

        # Enable TTL
        dynamodb_client.update_time_to_live(
            TableName='compliance-history-pr7708',
            TimeToLiveSpecification={
                'Enabled': True,
                'AttributeName': 'expirationTime'
            }
        )

        # Create non-compliance table
        dynamodb_client.create_table(
            TableName='other-table',
            KeySchema=[
                {'AttributeName': 'id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

        # Run test
        dynamodb_analysis = analyzer.analyze_dynamodb_tables()

        # Assertions
        self.assertEqual(dynamodb_analysis['total_count'], 2)
        self.assertEqual(len(dynamodb_analysis['compliance_tables']), 1)
        self.assertIn('compliance-history-pr7708', dynamodb_analysis['compliance_tables'])

        # Check table details
        compliance_table = dynamodb_analysis['tables'][0]
        self.assertEqual(compliance_table['name'], 'compliance-history-pr7708')
        self.assertEqual(compliance_table['hash_key'], 'resourceType')
        self.assertEqual(compliance_table['range_key'], 'scanTimestamp')
        self.assertTrue(compliance_table['ttl_enabled'])
        self.assertEqual(compliance_table['ttl_attribute'], 'expirationTime')

    @mock_aws
    def test_analyze_sns_topics(self):
        """Test detection of SNS alert topics"""
        # Clean ALL resources from previous tests to ensure isolation
        self._cleanup_all_sns_topics()

        # Setup
        sns_client = boto3.client('sns', region_name='us-east-1')
        analyzer = ComplianceInfraAnalyzer()

        # Create alert topic with subscription
        alert_topic = sns_client.create_topic(Name='compliance-alerts-pr7708')
        topic_arn = alert_topic['TopicArn']

        sns_client.set_topic_attributes(
            TopicArn=topic_arn,
            AttributeName='DisplayName',
            AttributeValue='Infrastructure Compliance Alerts'
        )

        sns_client.subscribe(
            TopicArn=topic_arn,
            Protocol='email',
            Endpoint='ops@example.com'
        )

        # Create non-alert topic
        sns_client.create_topic(Name='other-topic')

        # Run test
        sns_analysis = analyzer.analyze_sns_topics()

        # Assertions
        self.assertEqual(sns_analysis['total_count'], 2)
        self.assertEqual(len(sns_analysis['alert_topics']), 1)

        # Check topic details
        alert_topic_info = sns_analysis['topics'][0]
        self.assertEqual(alert_topic_info['display_name'], 'Infrastructure Compliance Alerts')
        self.assertEqual(alert_topic_info['subscriptions_count'], 1)
        self.assertEqual(alert_topic_info['subscriptions'][0]['protocol'], 'email')
        self.assertEqual(alert_topic_info['subscriptions'][0]['endpoint'], 'ops@example.com')

    @mock_aws
    def test_analyze_cloudwatch_alarms(self):
        """Test detection of compliance CloudWatch alarms"""
        # Clean ALL resources from previous tests to ensure isolation
        self._cleanup_all_cloudwatch_alarms()

        # Setup
        cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')
        analyzer = ComplianceInfraAnalyzer()

        # Create compliance alarm
        cloudwatch_client.put_metric_alarm(
            AlarmName='compliance-threshold-pr7708',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=2,
            MetricName='NonCompliantResources',
            Namespace='InfraQA/Compliance',
            Period=300,
            Statistic='Average',
            Threshold=10.0,
            ActionsEnabled=True,
            AlarmDescription='Alert when compliance drops below threshold',
            AlarmActions=['arn:aws:sns:us-east-1:123456789012:compliance-alerts']
        )

        # Create non-compliance alarm
        cloudwatch_client.put_metric_alarm(
            AlarmName='other-alarm',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=1,
            MetricName='CPUUtilization',
            Namespace='AWS/EC2',
            Period=300,
            Statistic='Average',
            Threshold=80.0
        )

        # Run test
        alarm_analysis = analyzer.analyze_cloudwatch_alarms()

        # Assertions
        self.assertEqual(alarm_analysis['total_count'], 2)
        self.assertEqual(len(alarm_analysis['compliance_alarms']), 1)
        self.assertIn('compliance-threshold-pr7708', alarm_analysis['compliance_alarms'])

        # Check alarm details
        compliance_alarm = alarm_analysis['alarms'][0]
        self.assertEqual(compliance_alarm['name'], 'compliance-threshold-pr7708')
        self.assertEqual(compliance_alarm['namespace'], 'InfraQA/Compliance')
        self.assertEqual(compliance_alarm['threshold'], 10.0)
        self.assertEqual(compliance_alarm['comparison_operator'], 'GreaterThanThreshold')

    @mock_aws
    def test_analyze_eventbridge_rules(self):
        """Test detection of EventBridge scanner rules"""
        # Clean ALL resources from previous tests to ensure isolation
        self._cleanup_all_lambda_functions()
        self._cleanup_all_eventbridge_rules()

        # Setup
        iam_client = boto3.client('iam', region_name='us-east-1')
        events_client = boto3.client('events', region_name='us-east-1')
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        analyzer = ComplianceInfraAnalyzer()

        # Create IAM role with proper trust policy for Lambda
        assume_role_policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        iam_client.create_role(
            RoleName='lambda-role',
            AssumeRolePolicyDocument=assume_role_policy_document,
            Path='/',
        )

        # Create Lambda function to target
        lambda_client.create_function(
            FunctionName='ec2-scanner-pr7708',
            Runtime='nodejs18.x',
            Role='arn:aws:iam::123456789012:role/lambda-role',
            Handler='index.handler',
            Code={'ZipFile': b'fake code'}
        )

        # Create scanner rule
        events_client.put_rule(
            Name='ec2-scanner-schedule-pr7708',
            ScheduleExpression='rate(6 hours)',
            State='ENABLED',
            Description='Trigger EC2 compliance scanner every 6 hours'
        )

        events_client.put_targets(
            Rule='ec2-scanner-schedule-pr7708',
            Targets=[{
                'Id': '1',
                'Arn': 'arn:aws:lambda:us-east-1:123456789012:function:ec2-scanner-pr7708'
            }]
        )

        # Create non-scanner rule
        events_client.put_rule(
            Name='other-rule',
            ScheduleExpression='rate(1 day)',
            State='ENABLED'
        )

        # Run test
        rule_analysis = analyzer.analyze_eventbridge_rules()

        # Assertions
        self.assertEqual(rule_analysis['total_count'], 2)
        self.assertEqual(len(rule_analysis['scanner_rules']), 1)
        self.assertIn('ec2-scanner-schedule-pr7708', rule_analysis['scanner_rules'])

        # Check rule details
        scanner_rule = rule_analysis['rules'][0]
        self.assertEqual(scanner_rule['name'], 'ec2-scanner-schedule-pr7708')
        self.assertEqual(scanner_rule['schedule'], 'rate(6 hours)')
        self.assertEqual(scanner_rule['state'], 'ENABLED')
        self.assertEqual(len(scanner_rule['targets']), 1)

    @mock_aws
    def test_full_analysis_and_reporting(self):
        """Test complete analysis workflow including report generation"""
        # Clean ALL resources from previous tests to ensure isolation
        self._cleanup_all_lambda_functions()
        self._cleanup_all_dynamodb_tables()
        self._cleanup_all_sns_topics()
        self._cleanup_all_cloudwatch_alarms()
        self._cleanup_all_eventbridge_rules()

        # Setup
        iam_client = boto3.client('iam', region_name='us-east-1')
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        sns_client = boto3.client('sns', region_name='us-east-1')
        cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')
        events_client = boto3.client('events', region_name='us-east-1')
        analyzer = ComplianceInfraAnalyzer()

        # Create IAM role with proper trust policy for Lambda
        assume_role_policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        # Use unique role name to avoid conflicts with other tests
        role_name = 'lambda-role-test-full-analysis'
        try:
            iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=assume_role_policy_document,
                Path='/',
            )
        except iam_client.exceptions.EntityAlreadyExistsException:
            # Role already exists from previous test run, continue
            pass

        # Clean up existing resources from previous test runs
        # Delete Lambda functions if exist
        try:
            lambda_client.delete_function(FunctionName='ec2-scanner-test-full')
        except lambda_client.exceptions.ResourceNotFoundException:
            pass
        try:
            lambda_client.delete_function(FunctionName='s3-compliance-scanner-test-full')
        except lambda_client.exceptions.ResourceNotFoundException:
            pass

        # Delete DynamoDB table if exists
        try:
            dynamodb_client.delete_table(TableName='compliance-history-test-full')
        except dynamodb_client.exceptions.ResourceNotFoundException:
            pass

        # Delete SNS topic if exists
        try:
            topics = sns_client.list_topics()
            for topic in topics.get('Topics', []):
                if 'compliance-alerts-test-full' in topic['TopicArn']:
                    sns_client.delete_topic(TopicArn=topic['TopicArn'])
        except Exception:
            pass

        # Delete CloudWatch alarm if exists
        try:
            cloudwatch_client.delete_alarms(AlarmNames=['compliance-threshold-test-full'])
        except Exception:
            pass

        # Delete EventBridge rule if exists
        try:
            events_client.remove_targets(Rule='ec2-scanner-schedule-test-full', Ids=['1'])
        except Exception:
            pass
        try:
            events_client.delete_rule(Name='ec2-scanner-schedule-test-full')
        except Exception:
            pass

        # Create test infrastructure
        # Lambda scanners (need at least 2 for health check)
        lambda_client.create_function(
            FunctionName='ec2-scanner-test-full',
            Runtime='nodejs18.x',
            Role=f'arn:aws:iam::123456789012:role/{role_name}',
            Handler='index.handler',
            Code={'ZipFile': b'fake code'}
        )

        lambda_client.create_function(
            FunctionName='s3-compliance-scanner-test-full',
            Runtime='python3.9',
            Role=f'arn:aws:iam::123456789012:role/{role_name}',
            Handler='handler.main',
            Code={'ZipFile': b'fake code'}
        )

        # DynamoDB table with unique name
        dynamodb_client.create_table(
            TableName='compliance-history-test-full',
            KeySchema=[
                {'AttributeName': 'resourceType', 'KeyType': 'HASH'},
                {'AttributeName': 'scanTimestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'resourceType', 'AttributeType': 'S'},
                {'AttributeName': 'scanTimestamp', 'AttributeType': 'N'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

        # SNS topic with unique name
        alert_topic = sns_client.create_topic(Name='compliance-alerts-test-full')

        # CloudWatch alarm with unique name
        cloudwatch_client.put_metric_alarm(
            AlarmName='compliance-threshold-test-full',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=2,
            MetricName='NonCompliantResources',
            Namespace='InfraQA/Compliance',
            Period=300,
            Statistic='Average',
            Threshold=10.0
        )

        # EventBridge rule with unique name
        events_client.put_rule(
            Name='ec2-scanner-schedule-test-full',
            ScheduleExpression='rate(6 hours)',
            State='ENABLED'
        )

        # Run analysis
        results = analyzer.run_analysis()

        # Verify results structure
        self.assertIn('analysis_timestamp', results)
        self.assertIn('lambda_functions', results)
        self.assertIn('dynamodb_tables', results)
        self.assertIn('sns_topics', results)
        self.assertIn('cloudwatch_alarms', results)
        self.assertIn('eventbridge_rules', results)
        self.assertIn('summary', results)
        self.assertIn('health_checks', results)

        # Verify summary
        summary = results['summary']
        self.assertEqual(summary['scanner_functions_count'], 2)  # 2 scanner functions created
        self.assertEqual(summary['compliance_tables_count'], 1)
        self.assertEqual(summary['alert_topics_count'], 1)
        self.assertEqual(summary['compliance_alarms_count'], 1)
        self.assertEqual(summary['scanner_rules_count'], 1)

        # Verify health checks
        health = results['health_checks']
        self.assertTrue(health['has_scanner_functions'])
        self.assertTrue(health['has_compliance_table'])
        self.assertTrue(health['has_alert_topic'])
        self.assertTrue(health['has_compliance_alarms'])
        self.assertTrue(health['has_scheduled_scans'])

        # Save reports
        json_file = 'test_compliance_report.json'
        csv_file = 'test_compliance_report.csv'

        try:
            analyzer.save_reports(results, json_file, csv_file)

            # Verify JSON report
            self.assertTrue(os.path.exists(json_file))
            with open(json_file, 'r') as f:
                json_data = json.load(f)
                self.assertIn('analysis_timestamp', json_data)
                self.assertIn('summary', json_data)
                self.assertIn('health_checks', json_data)

            # Verify CSV report
            self.assertTrue(os.path.exists(csv_file))
            with open(csv_file, 'r') as f:
                csv_content = f.read()
                self.assertIn('Infrastructure Compliance Analysis Report', csv_content)
                self.assertIn('Summary Statistics', csv_content)
                self.assertIn('Infrastructure Health Checks', csv_content)

        finally:
            # Cleanup
            if os.path.exists(json_file):
                os.remove(json_file)
            if os.path.exists(csv_file):
                os.remove(csv_file)

    def test_moto_server_integration(self):
        """Test integration with moto server on port 5001"""
        # This test demonstrates how to use the script with a moto server
        # In CI, set AWS_ENDPOINT_URL environment variable
        endpoint_url = 'http://localhost:5001'

        # Check if moto server is available (skip if not)
        try:
            test_client = boto3.client('lambda',
                                     region_name='us-east-1',
                                     endpoint_url=endpoint_url)
            test_client.list_functions()
        except Exception:
            self.skipTest("Moto server not available on port 5001")

        # If server is available, create analyzer with endpoint
        analyzer = ComplianceInfraAnalyzer(endpoint_url=endpoint_url)

        # Verify it can run without errors
        results = analyzer.run_analysis()
        self.assertIsInstance(results, dict)
        self.assertIn('lambda_functions', results)


if __name__ == '__main__':
    # Run tests
    unittest.main()
