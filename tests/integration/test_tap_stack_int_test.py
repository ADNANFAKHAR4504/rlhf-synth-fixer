"""
Integration tests for Terraform Multi-Region DR Infrastructure
Tests validate deployed AWS resources and their interconnections
"""

import json
import os
import pytest
import boto3
from pathlib import Path
from botocore.exceptions import ClientError


class TestInfrastructureDeployment:
    """Test that infrastructure is deployed and accessible"""

    @classmethod
    def setup_class(cls):
        """Setup test environment and load deployment outputs"""
        cls.outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        if not cls.outputs_file.exists():
            pytest.skip("Deployment outputs not found. Run deployment first.")

        with open(cls.outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Get regions from outputs or environment
        cls.primary_region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.dr_region = 'us-west-2'  # DR region from requirements

        # Initialize AWS clients
        cls.ec2_primary = boto3.client('ec2', region_name=cls.primary_region)
        cls.ec2_dr = boto3.client('ec2', region_name=cls.dr_region)
        cls.rds_primary = boto3.client('rds', region_name=cls.primary_region)
        cls.rds_dr = boto3.client('rds', region_name=cls.dr_region)
        cls.s3 = boto3.client('s3')
        cls.dynamodb_primary = boto3.client('dynamodb', region_name=cls.primary_region)
        cls.dynamodb_dr = boto3.client('dynamodb', region_name=cls.dr_region)
        cls.elbv2_primary = boto3.client('elbv2', region_name=cls.primary_region)
        cls.elbv2_dr = boto3.client('elbv2', region_name=cls.dr_region)
        cls.lambda_primary = boto3.client('lambda', region_name=cls.primary_region)
        cls.lambda_dr = boto3.client('lambda', region_name=cls.dr_region)
        cls.route53 = boto3.client('route53')
        cls.cloudwatch_primary = boto3.client('cloudwatch', region_name=cls.primary_region)
        cls.cloudwatch_dr = boto3.client('cloudwatch', region_name=cls.dr_region)
        cls.sns_primary = boto3.client('sns', region_name=cls.primary_region)
        cls.sns_dr = boto3.client('sns', region_name=cls.dr_region)

    def test_outputs_file_exists(self):
        """Test that deployment outputs file exists"""
        assert self.outputs_file.exists(), "cfn-outputs/flat-outputs.json must exist after deployment"

    def test_outputs_not_empty(self):
        """Test that deployment outputs are not empty"""
        assert len(self.outputs) > 0, "Deployment outputs should not be empty"


class TestVPCInfrastructure:
    """Test VPC infrastructure in both regions"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.primary_region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.dr_region = 'us-west-2'
        cls.ec2_primary = boto3.client('ec2', region_name=cls.primary_region)
        cls.ec2_dr = boto3.client('ec2', region_name=cls.dr_region)

    def test_primary_vpc_exists(self):
        """Test that primary VPC exists"""
        vpc_id = self.outputs.get('primary_vpc_id')
        assert vpc_id, "Primary VPC ID must be in outputs"

        response = self.ec2_primary.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1, "Primary VPC must exist"
        assert response['Vpcs'][0]['State'] == 'available', "Primary VPC must be available"

    def test_dr_vpc_exists(self):
        """Test that DR VPC exists"""
        vpc_id = self.outputs.get('dr_vpc_id')
        assert vpc_id, "DR VPC ID must be in outputs"

        response = self.ec2_dr.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1, "DR VPC must exist"
        assert response['Vpcs'][0]['State'] == 'available', "DR VPC must be available"

    def test_vpc_peering_connection(self):
        """Test that VPC peering connection exists and is active"""
        peering_id = self.outputs.get('vpc_peering_id')
        assert peering_id, "VPC peering connection ID must be in outputs"

        response = self.ec2_primary.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=[peering_id]
        )
        assert len(response['VpcPeeringConnections']) == 1, "VPC peering connection must exist"
        assert response['VpcPeeringConnections'][0]['Status']['Code'] == 'active', \
            "VPC peering connection must be active"

    def test_primary_vpc_subnets(self):
        """Test that primary VPC has required subnets"""
        vpc_id = self.outputs.get('primary_vpc_id')
        response = self.ec2_primary.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = response['Subnets']
        assert len(subnets) >= 6, "Primary VPC must have at least 6 subnets (3 public + 3 private)"

        # Check for public and private subnets
        public_subnets = [s for s in subnets if 'public' in s.get('Tags', [{}])[0].get('Value', '').lower()]
        private_subnets = [s for s in subnets if 'private' in s.get('Tags', [{}])[0].get('Value', '').lower()]

        assert len(public_subnets) >= 3, "Must have at least 3 public subnets"
        assert len(private_subnets) >= 3, "Must have at least 3 private subnets"

    def test_dr_vpc_subnets(self):
        """Test that DR VPC has required subnets"""
        vpc_id = self.outputs.get('dr_vpc_id')
        response = self.ec2_dr.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = response['Subnets']
        assert len(subnets) >= 6, "DR VPC must have at least 6 subnets (3 public + 3 private)"


class TestRDSGlobalDatabase:
    """Test RDS Aurora Global Database"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.primary_region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.dr_region = 'us-west-2'
        cls.rds_primary = boto3.client('rds', region_name=cls.primary_region)
        cls.rds_dr = boto3.client('rds', region_name=cls.dr_region)

    def test_primary_rds_cluster_exists(self):
        """Test that primary RDS cluster exists"""
        endpoint = self.outputs.get('primary_rds_cluster_endpoint')
        assert endpoint, "Primary RDS endpoint must be in outputs"

        # Extract cluster identifier from endpoint
        cluster_id = endpoint.split('.')[0]
        response = self.rds_primary.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        assert len(response['DBClusters']) == 1, "Primary RDS cluster must exist"
        assert response['DBClusters'][0]['Status'] == 'available', "Primary RDS cluster must be available"

    def test_dr_rds_cluster_exists(self):
        """Test that DR RDS cluster exists"""
        endpoint = self.outputs.get('dr_rds_cluster_endpoint')
        assert endpoint, "DR RDS endpoint must be in outputs"

        cluster_id = endpoint.split('.')[0]
        response = self.rds_dr.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        assert len(response['DBClusters']) == 1, "DR RDS cluster must exist"
        assert response['DBClusters'][0]['Status'] == 'available', "DR RDS cluster must be available"

    def test_rds_encryption_enabled(self):
        """Test that RDS clusters have encryption enabled"""
        primary_endpoint = self.outputs.get('primary_rds_cluster_endpoint')
        primary_cluster_id = primary_endpoint.split('.')[0]

        response = self.rds_primary.describe_db_clusters(
            DBClusterIdentifier=primary_cluster_id
        )
        assert response['DBClusters'][0]['StorageEncrypted'], \
            "Primary RDS cluster must have encryption enabled"

    def test_rds_global_cluster_exists(self):
        """Test that RDS global cluster exists"""
        # List global clusters and find ours
        response = self.rds_primary.describe_global_clusters()
        global_clusters = response['GlobalClusters']

        # Find our global cluster (should contain environment suffix)
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        our_clusters = [gc for gc in global_clusters if env_suffix in gc['GlobalClusterIdentifier']]

        assert len(our_clusters) >= 1, "Global database cluster must exist"


class TestDynamoDBGlobalTable:
    """Test DynamoDB Global Table"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.primary_region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.dr_region = 'us-west-2'
        cls.dynamodb_primary = boto3.client('dynamodb', region_name=cls.primary_region)
        cls.dynamodb_dr = boto3.client('dynamodb', region_name=cls.dr_region)

    def test_dynamodb_table_exists_primary(self):
        """Test that DynamoDB table exists in primary region"""
        table_name = self.outputs.get('dynamodb_table_name')
        assert table_name, "DynamoDB table name must be in outputs"

        response = self.dynamodb_primary.describe_table(TableName=table_name)
        assert response['Table']['TableStatus'] == 'ACTIVE', "DynamoDB table must be active in primary region"

    def test_dynamodb_table_exists_dr(self):
        """Test that DynamoDB table exists in DR region"""
        table_name = self.outputs.get('dynamodb_table_name')

        response = self.dynamodb_dr.describe_table(TableName=table_name)
        assert response['Table']['TableStatus'] == 'ACTIVE', "DynamoDB table must be active in DR region"

    def test_dynamodb_global_table_configured(self):
        """Test that DynamoDB has global table replication configured"""
        table_name = self.outputs.get('dynamodb_table_name')

        response = self.dynamodb_primary.describe_table(TableName=table_name)
        replicas = response['Table'].get('Replicas', [])

        assert len(replicas) >= 1, "DynamoDB must have at least one replica configured"


class TestS3CrossRegionReplication:
    """Test S3 Cross-Region Replication"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.s3 = boto3.client('s3')

    def test_primary_s3_bucket_exists(self):
        """Test that primary S3 bucket exists"""
        bucket_name = self.outputs.get('primary_s3_bucket')
        assert bucket_name, "Primary S3 bucket name must be in outputs"

        response = self.s3.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200, "Primary S3 bucket must exist"

    def test_dr_s3_bucket_exists(self):
        """Test that DR S3 bucket exists"""
        bucket_name = self.outputs.get('dr_s3_bucket')
        assert bucket_name, "DR S3 bucket name must be in outputs"

        response = self.s3.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200, "DR S3 bucket must exist"

    def test_s3_encryption_enabled(self):
        """Test that S3 buckets have encryption enabled"""
        primary_bucket = self.outputs.get('primary_s3_bucket')

        response = self.s3.get_bucket_encryption(Bucket=primary_bucket)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0, "S3 bucket must have encryption configured"

    def test_s3_versioning_enabled(self):
        """Test that S3 buckets have versioning enabled (required for replication)"""
        primary_bucket = self.outputs.get('primary_s3_bucket')

        response = self.s3.get_bucket_versioning(Bucket=primary_bucket)
        assert response.get('Status') == 'Enabled', "S3 bucket must have versioning enabled for replication"


class TestLoadBalancers:
    """Test Application Load Balancers"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.primary_region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.dr_region = 'us-west-2'
        cls.elbv2_primary = boto3.client('elbv2', region_name=cls.primary_region)
        cls.elbv2_dr = boto3.client('elbv2', region_name=cls.dr_region)

    def test_primary_alb_exists(self):
        """Test that primary ALB exists and is active"""
        alb_dns = self.outputs.get('primary_alb_dns')
        assert alb_dns, "Primary ALB DNS must be in outputs"

        # List load balancers and find ours by DNS name
        response = self.elbv2_primary.describe_load_balancers()
        albs = [lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns]

        assert len(albs) == 1, "Primary ALB must exist"
        assert albs[0]['State']['Code'] == 'active', "Primary ALB must be active"

    def test_dr_alb_exists(self):
        """Test that DR ALB exists and is active"""
        alb_dns = self.outputs.get('dr_alb_dns')
        assert alb_dns, "DR ALB DNS must be in outputs"

        response = self.elbv2_dr.describe_load_balancers()
        albs = [lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns]

        assert len(albs) == 1, "DR ALB must exist"
        assert albs[0]['State']['Code'] == 'active', "DR ALB must be active"


class TestLambdaFunctions:
    """Test Lambda Functions"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.primary_region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.dr_region = 'us-west-2'
        cls.lambda_primary = boto3.client('lambda', region_name=cls.primary_region)
        cls.lambda_dr = boto3.client('lambda', region_name=cls.dr_region)

    def test_primary_lambda_exists(self):
        """Test that primary Lambda function exists"""
        function_arn = self.outputs.get('primary_lambda_function')
        assert function_arn, "Primary Lambda ARN must be in outputs"

        function_name = function_arn.split(':')[-1]
        response = self.lambda_primary.get_function(FunctionName=function_name)

        assert response['Configuration']['State'] == 'Active', "Primary Lambda must be active"

    def test_dr_lambda_exists(self):
        """Test that DR Lambda function exists"""
        function_arn = self.outputs.get('dr_lambda_function')
        assert function_arn, "DR Lambda ARN must be in outputs"

        function_name = function_arn.split(':')[-1]
        response = self.lambda_dr.get_function(FunctionName=function_name)

        assert response['Configuration']['State'] == 'Active', "DR Lambda must be active"


class TestRoute53Failover:
    """Test Route 53 Failover Configuration"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.route53 = boto3.client('route53')

    def test_route53_zone_exists(self):
        """Test that Route 53 hosted zone exists"""
        zone_id = self.outputs.get('route53_zone_id')
        assert zone_id, "Route 53 zone ID must be in outputs"

        response = self.route53.get_hosted_zone(Id=zone_id)
        assert response['HostedZone']['Id'] == zone_id, "Route 53 zone must exist"

    def test_route53_health_checks_exist(self):
        """Test that Route 53 health checks exist"""
        # List health checks
        response = self.route53.list_health_checks()
        health_checks = response['HealthChecks']

        # Filter for our environment
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        our_checks = [hc for hc in health_checks if env_suffix in hc.get('HealthCheckConfig', {}).get('FullyQualifiedDomainName', '')]

        assert len(our_checks) >= 2, "Must have health checks for primary and DR regions"


class TestCloudWatchMonitoring:
    """Test CloudWatch Monitoring"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.primary_region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.dr_region = 'us-west-2'
        cls.cloudwatch_primary = boto3.client('cloudwatch', region_name=cls.primary_region)
        cls.cloudwatch_dr = boto3.client('cloudwatch', region_name=cls.dr_region)

    def test_cloudwatch_alarms_exist_primary(self):
        """Test that CloudWatch alarms exist in primary region"""
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

        response = self.cloudwatch_primary.describe_alarms()
        alarms = [a for a in response['MetricAlarms'] if env_suffix in a['AlarmName']]

        assert len(alarms) > 0, "CloudWatch alarms must exist in primary region"

    def test_cloudwatch_alarms_exist_dr(self):
        """Test that CloudWatch alarms exist in DR region"""
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

        response = self.cloudwatch_dr.describe_alarms()
        alarms = [a for a in response['MetricAlarms'] if env_suffix in a['AlarmName']]

        assert len(alarms) > 0, "CloudWatch alarms must exist in DR region"


class TestSNSNotifications:
    """Test SNS Topics"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.primary_region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.dr_region = 'us-west-2'
        cls.sns_primary = boto3.client('sns', region_name=cls.primary_region)
        cls.sns_dr = boto3.client('sns', region_name=cls.dr_region)

    def test_primary_sns_topic_exists(self):
        """Test that primary SNS topic exists"""
        topic_arn = self.outputs.get('primary_sns_topic')
        assert topic_arn, "Primary SNS topic ARN must be in outputs"

        response = self.sns_primary.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn, "Primary SNS topic must exist"

    def test_dr_sns_topic_exists(self):
        """Test that DR SNS topic exists"""
        topic_arn = self.outputs.get('dr_sns_topic')
        assert topic_arn, "DR SNS topic ARN must be in outputs"

        response = self.sns_dr.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn, "DR SNS topic must exist"
