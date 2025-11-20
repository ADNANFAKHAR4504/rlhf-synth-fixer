import json
import os
import unittest
import boto3


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack CDK stack using deployed resources"""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs once for all tests"""
        # Get environment variables
        cls.region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

        base_dir = os.path.dirname(os.path.abspath(__file__))
        flat_outputs_path = os.path.join(
            base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        with open(flat_outputs_path, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.events_client = boto3.client('events', region_name=cls.region)

    def test_s3_audit_bucket_exists(self):
        """Test that audit S3 bucket exists and is accessible"""
        audit_bucket = self.outputs['AuditBucketName']

        # Verify bucket exists
        response = self.s3_client.head_bucket(Bucket=audit_bucket)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_s3_bucket_has_versioning_enabled(self):
        """Test that S3 bucket has versioning enabled"""
        audit_bucket = self.outputs['AuditBucketName']

        response = self.s3_client.get_bucket_versioning(Bucket=audit_bucket)
        self.assertEqual(response.get('Status'), 'Enabled')

    def test_lambda_functions_exist(self):
        """Test that all 4 Lambda functions are deployed"""
        scanner_arn = self.outputs['ScannerLambdaArn']
        json_report_arn = self.outputs['JsonReportLambdaArn']
        csv_report_arn = self.outputs['CsvReportLambdaArn']
        remediation_arn = self.outputs['RemediationLambdaArn']

        # Verify all Lambda functions exist
        for arn in [scanner_arn, json_report_arn, csv_report_arn, remediation_arn]:
            function_name = arn.split(':')[-1]
            response = self.lambda_client.get_function(FunctionName=function_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_lambda_has_reserved_concurrency(self):
        """Test that Lambda functions have reserved concurrent executions"""
        scanner_arn = self.outputs['ScannerLambdaArn']
        function_name = scanner_arn.split(':')[-1]

        response = self.lambda_client.get_function_concurrency(FunctionName=function_name)

        reserved_concurrency = response.get('ReservedConcurrentExecutions')
        self.assertIsNotNone(reserved_concurrency, "Lambda should have reserved concurrency")
        self.assertGreater(reserved_concurrency, 0)

    def test_sns_topic_exists(self):
        """Test that SNS topic for alerts exists"""
        topic_arn = self.outputs['SnsTopicArn']

        # Verify topic exists
        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC flow logs are enabled"""
        vpc_id = self.outputs['VpcId']

        # Check for flow logs
        response = self.ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        flow_logs = response.get('FlowLogs', [])
        self.assertGreater(len(flow_logs), 0, "VPC should have flow logs enabled")

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard is created"""
        dashboard_name = self.outputs['DashboardName']

        # Verify dashboard exists
        response = self.cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        self.assertIn('DashboardBody', response)

    def test_s3_bucket_has_encryption(self):
        """Test that S3 bucket has KMS encryption enabled"""
        audit_bucket = self.outputs['AuditBucketName']

        response = self.s3_client.get_bucket_encryption(Bucket=audit_bucket)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0)
        self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'aws:kms')

    def test_s3_bucket_has_lifecycle_policy(self):
        """Test that S3 bucket has lifecycle policy configured"""
        audit_bucket = self.outputs['AuditBucketName']

        response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=audit_bucket)
        rules = response.get('Rules', [])
        self.assertGreater(len(rules), 0, "Bucket should have lifecycle rules")

    def test_lambda_has_xray_tracing(self):
        """Test that Lambda functions have X-Ray tracing enabled"""
        scanner_arn = self.outputs['ScannerLambdaArn']
        function_name = scanner_arn.split(':')[-1]

        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']
        tracing_config = config.get('TracingConfig', {})
        self.assertEqual(tracing_config.get('Mode'), 'Active')

    def test_lambda_in_vpc(self):
        """Test that Lambda functions are deployed in VPC"""
        scanner_arn = self.outputs['ScannerLambdaArn']
        function_name = scanner_arn.split(':')[-1]

        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']
        vpc_config = config.get('VpcConfig', {})
        self.assertIsNotNone(vpc_config.get('VpcId'))
        self.assertGreater(len(vpc_config.get('SubnetIds', [])), 0)

    def test_lambda_environment_variables(self):
        """Test that Lambda functions have required environment variables"""
        scanner_arn = self.outputs['ScannerLambdaArn']
        function_name = scanner_arn.split(':')[-1]
        audit_bucket = self.outputs['AuditBucketName']

        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']
        env_vars = config.get('Environment', {}).get('Variables', {})

        self.assertIn('AUDIT_BUCKET', env_vars)
        self.assertEqual(env_vars['AUDIT_BUCKET'], audit_bucket)
        self.assertIn('ENVIRONMENT_SUFFIX', env_vars)

    def test_eventbridge_scheduled_rule_exists(self):
        """Test that EventBridge scheduled scan rule exists"""
        response = self.events_client.list_rules()
        rules = response.get('Rules', [])

        scheduled_rules = [r for r in rules if 'scheduledscanrule' in r['Name'].lower() and self.environment_suffix in r['Name']]
        self.assertGreater(len(scheduled_rules), 0, "Scheduled scan rule should exist")

        rule = scheduled_rules[0]
        self.assertIn('rate(6 hours)', rule.get('ScheduleExpression', ''))

    def test_eventbridge_ondemand_rule_exists(self):
        """Test that EventBridge on-demand scan rule exists"""
        response = self.events_client.list_rules()
        rules = response.get('Rules', [])

        ondemand_rules = [r for r in rules if 'ondemandscanrule' in r['Name'].lower() and self.environment_suffix in r['Name']]
        self.assertGreater(len(ondemand_rules), 0, "On-demand scan rule should exist")

    def test_vpc_has_private_subnets(self):
        """Test that VPC has private subnets configured"""
        vpc_id = self.outputs['VpcId']

        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response.get('Subnets', [])
        self.assertGreaterEqual(len(subnets), 2, "VPC should have at least 2 subnets")

    def test_vpc_endpoints_exist(self):
        """Test that VPC endpoints for Lambda and S3 are configured"""
        vpc_id = self.outputs['VpcId']

        response = self.ec2_client.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        endpoints = response.get('VpcEndpoints', [])
        self.assertGreaterEqual(len(endpoints), 2, "VPC should have at least 2 endpoints")

        service_names = [e['ServiceName'] for e in endpoints]
        lambda_endpoint = any('lambda' in s for s in service_names)
        s3_endpoint = any('s3' in s for s in service_names)

        self.assertTrue(lambda_endpoint, "VPC should have Lambda endpoint")
        self.assertTrue(s3_endpoint, "VPC should have S3 endpoint")

    def test_sns_topic_has_subscriptions(self):
        """Test that SNS topic has email subscriptions"""
        topic_arn = self.outputs['SnsTopicArn']

        response = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
        subscriptions = response.get('Subscriptions', [])
        self.assertGreater(len(subscriptions), 0, "SNS topic should have subscriptions")

    def test_vpc_flow_logs_configuration(self):
        """Test VPC flow logs are configured with correct settings"""
        vpc_id = self.outputs['VpcId']

        response = self.ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        flow_logs = response.get('FlowLogs', [])
        self.assertGreater(len(flow_logs), 0)

        flow_log = flow_logs[0]
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['LogDestinationType'], 'cloud-watch-logs')

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups for VPC flow logs exist"""
        log_group_pattern = f"/aws/vpc/audit-flowlogs-{self.region}-{self.environment_suffix}"

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_pattern
        )

        log_groups = response.get('logGroups', [])
        self.assertGreater(len(log_groups), 0, "VPC flow log group should exist")
