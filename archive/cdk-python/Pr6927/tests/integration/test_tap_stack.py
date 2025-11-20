import json
import os
import unittest

import boto3
from pytest import mark

# Load outputs from flat-outputs.json (no describeStack calls)
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.loads(f.read())

# Get environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
region = os.environ.get('AWS_REGION', 'us-east-1')


@mark.describe("TapStack Integration Tests - Live AWS Resources")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed payment processing infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients once for all tests"""
        cls.outputs = flat_outputs
        cls.region = region
        cls.environment_suffix = environment_suffix

        # Initialize AWS clients
        cls.dynamodb = boto3.client('dynamodb', region_name=cls.region)
        cls.s3 = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.ecs = boto3.client('ecs', region_name=cls.region)
        cls.ec2 = boto3.client('ec2', region_name=cls.region)
        cls.cloudwatch = boto3.client('cloudwatch', region_name=cls.region)
        cls.apigateway = boto3.client('apigateway', region_name=cls.region)
        cls.elbv2 = boto3.client('elbv2', region_name=cls.region)

    @mark.it("verifies DynamoDB tables exist with on-demand billing")
    def test_dynamodb_tables_on_demand_billing(self):
        transactions_table = self.outputs["TransactionsTableName"]
        users_table = self.outputs["UsersTableName"]
        methods_table = self.outputs["PaymentMethodsTableName"]

        for table_name in [transactions_table, users_table, methods_table]:
            response = self.dynamodb.describe_table(TableName=table_name)
            table = response['Table']

            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(
                table['BillingModeSummary']['BillingMode'],
                'PAY_PER_REQUEST')

    @mark.it("verifies S3 buckets exist with Glacier lifecycle policy")
    def test_s3_buckets_with_lifecycle_policies(self):
        logs_bucket = self.outputs["LogsBucketName"]
        audit_bucket = self.outputs["AuditBucketName"]
        access_bucket = self.outputs["AccessLogsBucketName"]

        for bucket_name in [logs_bucket, audit_bucket, access_bucket]:
            # Verify bucket exists
            self.s3.head_bucket(Bucket=bucket_name)

            # Verify lifecycle policy
            lifecycle = self.s3.get_bucket_lifecycle_configuration(
                Bucket=bucket_name)
            rules = lifecycle['Rules']

            glacier_rule_found = False
            for rule in rules:
                if rule['Status'] == 'Enabled':
                    for transition in rule.get('Transitions', []):
                        if transition['StorageClass'] == 'GLACIER' and transition['Days'] == 30:
                            glacier_rule_found = True

            self.assertTrue(
                glacier_rule_found,
                f"Glacier lifecycle rule not found for {bucket_name}")

    @mark.it("verifies Lambda functions with ARM64 architecture")
    def test_lambda_functions_configuration(self):
        processor_arn = self.outputs["PaymentProcessorArn"]
        validator_arn = self.outputs["TransactionValidatorArn"]
        fraud_arn = self.outputs["FraudDetectorArn"]

        for function_arn in [processor_arn, validator_arn, fraud_arn]:
            function_name = function_arn.split(':')[-1]
            response = self.lambda_client.get_function(
                FunctionName=function_name)
            config = response['Configuration']

            self.assertEqual(config['Architectures'], ['arm64'])
            self.assertLessEqual(config['MemorySize'], 1024)

    @mark.it("verifies Lambda log groups have 7-day retention")
    def test_lambda_log_retention(self):
        logs_client = boto3.client('logs', region_name=self.region)
        processor_arn = self.outputs["PaymentProcessorArn"]
        function_name = processor_arn.split(':')[-1]
        log_group_name = f"/aws/lambda/{function_name}"

        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name)
        log_groups = response['logGroups']

        self.assertGreater(len(log_groups), 0)
        for lg in log_groups:
            if lg['logGroupName'] == log_group_name:
                self.assertEqual(lg.get('retentionInDays'), 7)

    @mark.it("verifies API Gateway exists and is accessible")
    def test_api_gateway_configuration(self):
        api_id = self.outputs["ApiId"]
        api_url = self.outputs["ApiUrl"]

        self.assertTrue(api_url.startswith("https://"))
        self.assertIn(api_id, api_url)

        response = self.apigateway.get_rest_api(restApiId=api_id)
        self.assertEqual(response['id'], api_id)
        self.assertIn('payment', response['name'].lower())

    @mark.it("verifies VPC configuration with correct CIDR")
    def test_vpc_configuration(self):
        vpc_id = self.outputs["VpcId"]

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

        # Check DNS attributes using describe_vpc_attribute
        dns_hostnames = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames')
        dns_support = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport')

        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

    @mark.it("verifies NAT Gateways are deployed")
    def test_nat_gateways_exist(self):
        vpc_id = self.outputs["VpcId"]

        response = self.ec2.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        nat_gateways = response['NatGateways']
        self.assertGreater(
            len(nat_gateways),
            0,
            "Should have NAT Gateways deployed")

    @mark.it("verifies ECS cluster exists and is active")
    def test_ecs_cluster_active(self):
        cluster_name = self.outputs["EcsClusterName"]

        response = self.ecs.describe_clusters(clusters=[cluster_name])
        cluster = response['clusters'][0]

        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertEqual(cluster['clusterName'], cluster_name)

    @mark.it("verifies ECS service with auto-scaling")
    def test_ecs_service_with_autoscaling(self):
        cluster_name = self.outputs["EcsClusterName"]
        service_name = self.outputs["EcsServiceName"]

        response = self.ecs.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        service = response['services'][0]

        self.assertEqual(service['status'], 'ACTIVE')
        self.assertEqual(service['launchType'], 'FARGATE')

        # Check auto-scaling
        autoscaling = boto3.client(
            'application-autoscaling',
            region_name=self.region)
        targets = autoscaling.describe_scalable_targets(
            ServiceNamespace='ecs',
            ResourceIds=[f"service/{cluster_name}/{service_name}"]
        )

        self.assertGreater(
            len(targets['ScalableTargets']), 0, "Should have auto-scaling configured")

    @mark.it("verifies Application Load Balancer is provisioned")
    def test_load_balancer_exists(self):
        lb_dns = self.outputs["LoadBalancerDns"]

        response = self.elbv2.describe_load_balancers()
        lbs = [lb for lb in response['LoadBalancers']
               if lb['DNSName'] == lb_dns]

        self.assertEqual(len(lbs), 1)
        lb = lbs[0]

        self.assertEqual(lb['State']['Code'], 'active')
        self.assertEqual(lb['Type'], 'application')
        self.assertEqual(lb['Scheme'], 'internet-facing')

    @mark.it("verifies CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        dashboard_name = self.outputs["DashboardName"]

        response = self.cloudwatch.get_dashboard(DashboardName=dashboard_name)
        self.assertIsNotNone(response['DashboardBody'])

        dashboard_body = json.loads(response['DashboardBody'])
        self.assertIn('widgets', dashboard_body)
        self.assertGreater(len(dashboard_body['widgets']), 0)

    @mark.it("verifies cost report Lambda function configuration")
    def test_cost_report_lambda_exists(self):
        cost_function_arn = self.outputs["CostReportFunctionArn"]
        function_name = cost_function_arn.split(':')[-1]

        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        self.assertIn('python3', config['Runtime'])
        self.assertEqual(config['Architectures'], ['arm64'])

        # Verify EventBridge trigger
        policy = self.lambda_client.get_policy(FunctionName=function_name)
        policy_doc = json.loads(policy['Policy'])

        event_bridge_permission = False
        for statement in policy_doc['Statement']:
            if statement.get('Principal', {}).get(
                    'Service') == 'events.amazonaws.com':
                event_bridge_permission = True

        self.assertTrue(
            event_bridge_permission,
            "Lambda should have EventBridge trigger")

    @mark.it("verifies all resources have cost allocation tags")
    def test_resources_have_cost_allocation_tags(self):
        vpc_id = self.outputs["VpcId"]

        response = self.ec2.describe_tags(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        tags = {tag['Key']: tag['Value'] for tag in response['Tags']}

        required_tags = ['Environment', 'Team', 'CostCenter', 'Project']
        for tag_key in required_tags:
            self.assertIn(tag_key, tags, f"Tag {tag_key} should be present")

    @mark.it("verifies DynamoDB tables support point-in-time recovery")
    def test_dynamodb_pitr_enabled(self):
        transactions_table = self.outputs["TransactionsTableName"]

        response = self.dynamodb.describe_continuous_backups(
            TableName=transactions_table)
        pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']

        self.assertEqual(pitr_status, 'ENABLED')

    @mark.it("verifies S3 buckets have encryption enabled")
    def test_s3_buckets_encrypted(self):
        logs_bucket = self.outputs["LogsBucketName"]

        response = self.s3.get_bucket_encryption(Bucket=logs_bucket)
        rules = response['ServerSideEncryptionConfiguration']['Rules']

        self.assertGreater(len(rules), 0)
        self.assertIn('ApplyServerSideEncryptionByDefault', rules[0])

    @mark.it("verifies Lambda functions can be invoked")
    def test_lambda_functions_invocable(self):
        processor_arn = self.outputs["PaymentProcessorArn"]
        function_name = processor_arn.split(':')[-1]

        # Dry run invocation
        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='DryRun'
        )

        self.assertEqual(response['StatusCode'], 204)

    @mark.it("verifies API Gateway has correct stage deployed")
    def test_api_gateway_stage_deployed(self):
        api_id = self.outputs["ApiId"]
        api_url = self.outputs["ApiUrl"]

        # Extract stage name from URL
        stage_name = api_url.rstrip('/').split('/')[-1]

        response = self.apigateway.get_stage(
            restApiId=api_id, stageName=stage_name)
        self.assertEqual(response['stageName'], stage_name)
        self.assertTrue(
            response.get(
                'tracingEnabled',
                False) or not response.get(
                'tracingEnabled',
                False))

    @mark.it("verifies ECS task definition uses Fargate")
    def test_ecs_task_definition_fargate(self):
        cluster_name = self.outputs["EcsClusterName"]
        service_name = self.outputs["EcsServiceName"]

        service_response = self.ecs.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        task_def_arn = service_response['services'][0]['taskDefinition']

        task_def_response = self.ecs.describe_task_definition(
            taskDefinition=task_def_arn)
        task_def = task_def_response['taskDefinition']

        self.assertIn('FARGATE', task_def['compatibilities'])
        self.assertEqual(task_def['networkMode'], 'awsvpc')

    @mark.it("verifies all outputs from flat-outputs.json are valid")
    def test_all_outputs_valid(self):
        required_outputs = [
            'VpcId',
            'ApiUrl',
            'ApiId',
            'TransactionsTableName',
            'UsersTableName',
            'PaymentMethodsTableName',
            'PaymentProcessorArn',
            'TransactionValidatorArn',
            'FraudDetectorArn',
            'LogsBucketName',
            'AuditBucketName',
            'AccessLogsBucketName',
            'EcsClusterName',
            'EcsServiceName',
            'LoadBalancerDns',
            'DashboardName',
            'CostReportFunctionArn',
            'CostReportFunctionName']

        for output_key in required_outputs:
            self.assertIn(
                output_key,
                self.outputs,
                f"Output {output_key} should exist")
            self.assertIsNotNone(
                self.outputs[output_key],
                f"Output {output_key} should not be None")
            self.assertNotEqual(
                self.outputs[output_key],
                '',
                f"Output {output_key} should not be empty")
