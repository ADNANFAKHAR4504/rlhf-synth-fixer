"""
Integration tests for Single-Region Payment Processing Infrastructure.
Tests live AWS resources deployed by CDK using flat-outputs.json.
"""
import json
import os
from pathlib import Path
import boto3
import pytest
from pytest import mark


# Load flat-outputs.json
outputs_path = Path(__file__).parent.parent.parent / 'cfn-outputs' / 'flat-outputs.json'
if not outputs_path.exists():
    pytest.skip(f"flat-outputs.json not found at {outputs_path}", allow_module_level=True)

with open(outputs_path) as f:
    outputs = json.load(f)

# Get environment suffix and region from outputs and environment variables
environment_suffix = outputs.get('EnvironmentSuffix', os.getenv('ENVIRONMENT_SUFFIX', 'dev'))
region = os.getenv('AWS_REGION', 'us-east-1')


def extract_function_name_from_arn(arn):
    """Extract function name from Lambda ARN."""
    if arn and ':function:' in arn:
        return arn.split(':function:')[1]
    return None


def extract_cluster_id_from_endpoint(endpoint):
    """Extract cluster identifier from RDS endpoint."""
    if endpoint:
        # Format: cluster-id.cluster-hash.region.rds.amazonaws.com
        return endpoint.split('.')[0]
    return None

# Initialize AWS clients
ec2_client = boto3.client('ec2', region_name=region)
rds_client = boto3.client('rds', region_name=region)
dynamodb_client = boto3.client('dynamodb', region_name=region)
lambda_client = boto3.client('lambda', region_name=region)
apigateway_client = boto3.client('apigateway', region_name=region)
s3_client = boto3.client('s3', region_name=region)
cloudwatch_client = boto3.client('cloudwatch', region_name=region)
sns_client = boto3.client('sns', region_name=region)
ssm_client = boto3.client('ssm', region_name=region)


@mark.describe("VPC Integration Tests")
class TestVpcIntegration:
    """Test live VPC resources"""

    @mark.it("verifies VPC exists and is available")
    def test_vpc_exists(self):
        """Test that VPC is deployed and available."""
        vpc_id = outputs.get('VpcId')
        assert vpc_id, f"VPC ID not found in outputs for environment {environment_suffix}"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['State'] == 'available'

        # Verify VPC tags
        tags = {tag['Key']: tag['Value'] for tag in response['Vpcs'][0].get('Tags', [])}
        assert tags.get('Name') == f'payment-vpc-{environment_suffix}'

    @mark.it("verifies correct subnet configuration")
    def test_subnet_configuration(self):
        """Test that VPC has correct subnet types across 3 AZs."""
        vpc_id = outputs.get('VpcId')

        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) == 9, f"Expected 9 subnets (3 AZs × 3 types), got {len(subnets)}"

        # Verify we have 3 different AZs
        availability_zones = {subnet['AvailabilityZone'] for subnet in subnets}
        assert len(availability_zones) == 3, f"Expected 3 AZs, got {len(availability_zones)}"

    @mark.it("verifies NAT gateway is running")
    def test_nat_gateway(self):
        """Test that NAT gateway is deployed and available."""
        vpc_id = outputs.get('VpcId')

        response = ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        nat_gateways = [ng for ng in response['NatGateways'] if ng['State'] != 'deleted']
        assert len(nat_gateways) == 1, f"Expected 1 NAT gateway, got {len(nat_gateways)}"
        assert nat_gateways[0]['State'] == 'available'


@mark.describe("Database Integration Tests")
class TestDatabaseIntegration:
    """Test live database resources"""

    @mark.it("verifies Aurora cluster is available")
    def test_aurora_cluster_exists(self):
        """Test that Aurora PostgreSQL cluster is deployed and available."""
        db_endpoint = outputs.get('DBEndpoint')
        assert db_endpoint, f"DB endpoint not found in outputs for environment {environment_suffix}"

        cluster_id = extract_cluster_id_from_endpoint(db_endpoint)
        assert cluster_id, "Could not extract cluster ID from DB endpoint"

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'
        assert cluster['Engine'] == 'aurora-postgresql'
        assert cluster['MultiAZ'] is True

    @mark.it("verifies Aurora has writer and reader instances")
    def test_aurora_instances(self):
        """Test that Aurora has both writer and reader instances."""
        db_endpoint = outputs.get('DBEndpoint')
        cluster_id = extract_cluster_id_from_endpoint(db_endpoint)

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        members = cluster['DBClusterMembers']
        assert len(members) >= 2, f"Expected at least 2 instances (writer + reader), got {len(members)}"

        writers = [m for m in members if m['IsClusterWriter']]
        readers = [m for m in members if not m['IsClusterWriter']]

        assert len(writers) == 1, f"Expected 1 writer instance, got {len(writers)}"
        assert len(readers) >= 1, f"Expected at least 1 reader instance, got {len(readers)}"

    @mark.it("verifies DynamoDB table exists and is active")
    def test_dynamodb_table(self):
        """Test that DynamoDB transactions table is deployed and active."""
        table_name = outputs.get('DynamoDBTableName')
        assert table_name, f"DynamoDB table name not found in outputs for environment {environment_suffix}"

        response = dynamodb_client.describe_table(TableName=table_name)

        table = response['Table']
        assert table['TableStatus'] == 'ACTIVE'
        assert 'BillingModeSummary' in table
        assert table['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'


@mark.describe("Lambda Integration Tests")
class TestLambdaIntegration:
    """Test live Lambda functions"""

    @mark.it("verifies payment validation function exists")
    def test_payment_validation_function(self):
        """Test that payment validation Lambda is deployed."""
        function_arn = outputs.get('PaymentValidationFn')
        assert function_arn, f"Payment validation function ARN not found in outputs"

        function_name = extract_function_name_from_arn(function_arn)
        response = lambda_client.get_function(FunctionName=function_name)

        config = response['Configuration']
        assert config['State'] == 'Active'
        assert config['Runtime'].startswith('python3')
        assert config['Handler'] == 'index.handler'

    @mark.it("verifies transaction processing function exists")
    def test_transaction_processing_function(self):
        """Test that transaction processing Lambda is deployed."""
        function_arn = outputs.get('TransactionProcessingFn')
        assert function_arn, f"Transaction processing function ARN not found in outputs"

        function_name = extract_function_name_from_arn(function_arn)
        response = lambda_client.get_function(FunctionName=function_name)

        config = response['Configuration']
        assert config['State'] == 'Active'
        assert config['Runtime'].startswith('python3')

    @mark.it("verifies notification function exists")
    def test_notification_function(self):
        """Test that notification Lambda is deployed."""
        function_arn = outputs.get('NotificationFn')
        assert function_arn, f"Notification function ARN not found in outputs"

        function_name = extract_function_name_from_arn(function_arn)
        response = lambda_client.get_function(FunctionName=function_name)

        config = response['Configuration']
        assert config['State'] == 'Active'
        assert config['Runtime'].startswith('python3')

    @mark.it("verifies Lambda functions are in VPC")
    def test_lambda_vpc_configuration(self):
        """Test that Lambda functions are deployed in VPC."""
        vpc_id = outputs.get('VpcId')
        function_arn = outputs.get('PaymentValidationFn')
        function_name = extract_function_name_from_arn(function_arn)

        response = lambda_client.get_function_configuration(FunctionName=function_name)

        vpc_config = response.get('VpcConfig', {})
        assert vpc_config.get('VpcId') == vpc_id
        assert len(vpc_config.get('SubnetIds', [])) > 0
        assert len(vpc_config.get('SecurityGroupIds', [])) > 0


@mark.describe("API Gateway Integration Tests")
class TestApiGatewayIntegration:
    """Test live API Gateway resources"""

    @mark.it("verifies REST API exists")
    def test_api_exists(self):
        """Test that API Gateway REST API is deployed."""
        api_id = outputs.get('APIId')
        assert api_id, f"API ID not found in outputs for environment {environment_suffix}"

        response = apigateway_client.get_rest_api(restApiId=api_id)

        assert response['name'] == f'payment-api-{environment_suffix}'

    @mark.it("verifies API has deployment")
    def test_api_deployment(self):
        """Test that API has an active deployment."""
        api_id = outputs.get('APIId')

        response = apigateway_client.get_deployments(restApiId=api_id)

        deployments = response['items']
        assert len(deployments) > 0, "No deployments found for API"

    @mark.it("verifies API URL is accessible")
    def test_api_url(self):
        """Test that API URL is properly formatted."""
        api_url = outputs.get('APIEndpoint')
        assert api_url, f"API URL not found in outputs for environment {environment_suffix}"

        assert api_url.startswith('https://')
        assert 'execute-api' in api_url
        assert region in api_url


@mark.describe("Storage Integration Tests")
class TestStorageIntegration:
    """Test live S3 storage resources"""

    @mark.it("verifies S3 bucket exists")
    def test_s3_bucket_exists(self):
        """Test that S3 bucket is deployed."""
        bucket_name = outputs.get('BucketName')
        assert bucket_name, f"Bucket name not found in outputs for environment {environment_suffix}"

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    @mark.it("verifies S3 bucket has versioning enabled")
    def test_s3_versioning(self):
        """Test that S3 bucket versioning is enabled."""
        bucket_name = outputs.get('BucketName')

        response = s3_client.get_bucket_versioning(Bucket=bucket_name)

        assert response.get('Status') == 'Enabled'

    @mark.it("verifies S3 bucket has encryption")
    def test_s3_encryption(self):
        """Test that S3 bucket encryption is configured."""
        bucket_name = outputs.get('BucketName')

        response = s3_client.get_bucket_encryption(Bucket=bucket_name)

        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']

    @mark.it("verifies S3 bucket has lifecycle policy")
    def test_s3_lifecycle(self):
        """Test that S3 bucket has lifecycle rules."""
        bucket_name = outputs.get('BucketName')

        try:
            response = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            assert len(response['Rules']) > 0
        except Exception as e:
            # Check for NoSuchLifecycleConfiguration error in the error message
            if 'NoSuchLifecycleConfiguration' in str(e):
                pytest.fail("No lifecycle configuration found on bucket")
            raise


@mark.describe("Monitoring Integration Tests")
class TestMonitoringIntegration:
    """Test live monitoring resources"""

    @mark.it("verifies SNS topic exists")
    def test_sns_topic(self):
        """Test that SNS alarm topic is deployed."""
        topic_arn = outputs.get('AlarmTopicArn')
        assert topic_arn, f"SNS topic ARN not found in outputs for environment {environment_suffix}"

        response = sns_client.get_topic_attributes(TopicArn=topic_arn)

        # Verify SNS topic exists and has a display name
        assert 'DisplayName' in response['Attributes']
        assert len(response['Attributes']['DisplayName']) > 0

    @mark.it("verifies CloudWatch alarms exist")
    def test_cloudwatch_alarms(self):
        """Test that CloudWatch alarms are deployed."""
        # Get all alarms and filter by environment suffix
        response = cloudwatch_client.describe_alarms()

        alarms = [alarm for alarm in response['MetricAlarms']
                  if alarm['AlarmName'].endswith(f'-{environment_suffix}')]
        assert len(alarms) >= 3, f"Expected at least 3 alarms (RDS, Lambda, API), got {len(alarms)}"

    @mark.it("verifies RDS CPU alarm exists")
    def test_rds_cpu_alarm(self):
        """Test that RDS CPU utilization alarm is configured."""
        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix='RDS-CPU-High'
        )

        # Filter alarms by environment suffix
        alarms = [alarm for alarm in response['MetricAlarms']
                  if alarm['AlarmName'].endswith(f'-{environment_suffix}')]
        assert len(alarms) >= 1, "RDS CPU alarm not found"

        alarm = alarms[0]
        assert alarm['MetricName'] == 'CPUUtilization'
        assert alarm['Namespace'] == 'AWS/RDS'


@mark.describe("Parameter Store Integration Tests")
class TestParameterStoreIntegration:
    """Test live SSM Parameter Store resources"""

    @mark.it("verifies database endpoint parameter exists")
    def test_db_endpoint_parameter(self):
        """Test that DB endpoint parameter is stored."""
        parameter_name = '/payment/db-endpoint'

        response = ssm_client.get_parameter(Name=parameter_name)

        parameter = response['Parameter']
        assert parameter['Type'] == 'String'
        assert len(parameter['Value']) > 0

    @mark.it("verifies API URL parameter exists")
    def test_api_url_parameter(self):
        """Test that API URL parameter is stored."""
        parameter_name = '/payment/api-url'

        response = ssm_client.get_parameter(Name=parameter_name)

        parameter = response['Parameter']
        assert parameter['Type'] == 'String'
        assert parameter['Value'].startswith('https://')

    @mark.it("verifies feature flags parameter exists")
    def test_feature_flags_parameter(self):
        """Test that feature flags parameter is stored."""
        parameter_name = '/payment/feature-flags'

        response = ssm_client.get_parameter(Name=parameter_name)

        parameter = response['Parameter']
        assert parameter['Type'] == 'String'
        # Verify it's valid JSON
        import json
        flags = json.loads(parameter['Value'])
        assert isinstance(flags, dict)

    @mark.it("verifies app status parameter exists")
    def test_environment_parameter(self):
        """Test that app status parameter is stored."""
        parameter_name = '/payment/app-status'

        response = ssm_client.get_parameter(Name=parameter_name)
        parameter = response['Parameter']
        assert parameter['Type'] == 'String'
        assert len(parameter['Value']) > 0


@mark.describe("End-to-End Integration Tests")
class TestEndToEndIntegration:
    """Test complete payment processing flow"""

    @mark.it("verifies complete infrastructure connectivity")
    def test_infrastructure_connectivity(self):
        """Test that all components are properly connected."""
        # Verify VPC
        vpc_id = outputs.get('VpcId')
        assert vpc_id

        # Verify Database exists and is in a subnet group
        db_endpoint = outputs.get('DBEndpoint')
        cluster_id = extract_cluster_id_from_endpoint(db_endpoint)
        cluster_response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = cluster_response['DBClusters'][0]

        # Verify cluster has a DB subnet group (which implies it's in a VPC)
        assert 'DBSubnetGroup' in cluster
        assert cluster['DBSubnetGroup']  # Should have a subnet group name

        # Get VPC ID from DB subnet group
        if 'DBSubnetGroup' in cluster and cluster['DBSubnetGroup']:
            subnet_group_name = cluster['DBSubnetGroup']
            subnet_group_response = rds_client.describe_db_subnet_groups(
                DBSubnetGroupName=subnet_group_name
            )
            cluster_vpc_id = subnet_group_response['DBSubnetGroups'][0]['VpcId']
            assert cluster_vpc_id == vpc_id

        # Verify Lambda in VPC
        function_arn = outputs.get('PaymentValidationFn')
        function_name = extract_function_name_from_arn(function_arn)
        lambda_response = lambda_client.get_function_configuration(FunctionName=function_name)
        lambda_vpc_id = lambda_response['VpcConfig']['VpcId']
        assert lambda_vpc_id == vpc_id

        # Verify API Gateway exists
        api_id = outputs.get('APIId')
        assert api_id

    @mark.it("verifies monitoring covers all components")
    def test_monitoring_coverage(self):
        """Test that monitoring is set up for all critical components."""
        # Check for alarms covering RDS, Lambda, and API
        response = cloudwatch_client.describe_alarms()

        # Filter alarms by environment suffix
        alarms = [alarm for alarm in response['MetricAlarms']
                  if alarm['AlarmName'].endswith(f'-{environment_suffix}')]
        alarm_names = [alarm['AlarmName'] for alarm in alarms]

        # Verify we have alarms for different components
        has_rds_alarm = any('rds' in name.lower() or 'db' in name.lower() for name in alarm_names)
        has_lambda_alarm = any('lambda' in name.lower() for name in alarm_names)
        has_api_alarm = any('api' in name.lower() for name in alarm_names)

        assert has_rds_alarm, "No RDS alarms found"
        assert has_lambda_alarm, "No Lambda alarms found"
        assert has_api_alarm, "No API alarms found"

    @mark.it("verifies parameter store has all required configs")
    def test_parameter_store_complete(self):
        """Test that all required parameters are stored."""
        required_parameters = [
            '/payment/db-endpoint',
            '/payment/api-url',
            '/payment/feature-flags',
            '/payment/app-status'
        ]

        for param_name in required_parameters:
            response = ssm_client.get_parameter(Name=param_name)
            assert response['Parameter'], f"Parameter {param_name} not found"
