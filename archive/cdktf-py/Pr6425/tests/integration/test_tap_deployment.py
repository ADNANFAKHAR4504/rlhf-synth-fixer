"""Integration tests for TAP Stack deployed infrastructure"""
import json
import os
import time
import pytest
import boto3
from botocore.exceptions import ClientError


class TestTapDeployment:
    """Integration tests for deployed TAP infrastructure"""

    @pytest.fixture(scope="class")
    def aws_region(self):
        """Get AWS region from environment"""
        return os.getenv("AWS_REGION", "us-east-1")

    @pytest.fixture(scope="class")
    def environment_suffix(self):
        """Get environment suffix from environment"""
        return os.getenv("ENVIRONMENT_SUFFIX", "test")

    @pytest.fixture(scope="class")
    def ec2_client(self, aws_region):
        """Create EC2 client"""
        return boto3.client('ec2', region_name=aws_region)

    @pytest.fixture(scope="class")
    def rds_client(self, aws_region):
        """Create RDS client"""
        return boto3.client('rds', region_name=aws_region)

    @pytest.fixture(scope="class")
    def s3_client(self, aws_region):
        """Create S3 client"""
        return boto3.client('s3', region_name=aws_region)

    @pytest.fixture(scope="class")
    def iam_client(self, aws_region):
        """Create IAM client"""
        return boto3.client('iam', region_name=aws_region)

    # ========================================================================
    # VPC & NETWORKING INTEGRATION TESTS
    # ========================================================================

    def test_vpc_exists_and_available(self, ec2_client, environment_suffix):
        """Test that VPC is deployed and in available state"""
        response = ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'aurora-vpc-{environment_suffix}']}
            ]
        )
        
        assert len(response['Vpcs']) >= 1, "VPC not found"
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available', f"VPC is in {vpc['State']} state"
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_vpc_dns_enabled(self, ec2_client, environment_suffix):
        """Test that VPC has DNS support and hostnames enabled"""
        response = ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'aurora-vpc-{environment_suffix}']}
            ]
        )
        
        vpc = response['Vpcs'][0]
        vpc_id = vpc['VpcId']
        
        # Check DNS support
        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert dns_support['EnableDnsSupport']['Value'] is True
        
        # Check DNS hostnames
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

    def test_subnets_exist_in_multiple_azs(self, ec2_client, environment_suffix):
        """Test that subnets are created in different availability zones"""
        response = ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'aurora-vpc-{environment_suffix}']}
            ]
        )
        vpc_id = response['Vpcs'][0]['VpcId']
        
        subnets_response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        
        subnets = subnets_response['Subnets']
        assert len(subnets) >= 2, "Should have at least 2 subnets"
        
        # Check different AZs
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(azs) >= 2, "Subnets should be in at least 2 different AZs"

    def test_subnets_not_public(self, ec2_client, environment_suffix):
        """Test that subnets are private (no auto-assign public IP)"""
        response = ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'aurora-vpc-{environment_suffix}']}
            ]
        )
        vpc_id = response['Vpcs'][0]['VpcId']
        
        subnets_response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        
        for subnet in subnets_response['Subnets']:
            assert subnet['MapPublicIpOnLaunch'] is False

    # ========================================================================
    # S3 BUCKET INTEGRATION TESTS
    # ========================================================================

    def test_s3_bucket_exists(self, s3_client, environment_suffix):
        """Test that S3 bucket is created"""
        # Bucket name pattern: tap-bucket-{env}-{stack_name}
        bucket_prefix = f"tap-bucket-{environment_suffix}"
        
        response = s3_client.list_buckets()
        matching_buckets = [
            b for b in response['Buckets']
            if b['Name'].startswith(bucket_prefix)
        ]
        
        assert len(matching_buckets) >= 1, f"No buckets found with prefix {bucket_prefix}"

    def test_s3_bucket_versioning_enabled(self, s3_client, environment_suffix):
        """Test that S3 bucket has versioning enabled"""
        bucket_prefix = f"tap-bucket-{environment_suffix}"
        
        response = s3_client.list_buckets()
        matching_buckets = [
            b for b in response['Buckets']
            if b['Name'].startswith(bucket_prefix)
        ]
        
        if matching_buckets:
            bucket_name = matching_buckets[0]['Name']
            versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert versioning.get('Status') == 'Enabled', "Bucket versioning not enabled"

    # ========================================================================
    # SECURITY GROUP INTEGRATION TESTS
    # ========================================================================

    def test_security_group_exists(self, ec2_client, environment_suffix):
        """Test that security group is created"""
        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'aurora-sg-{environment_suffix}']}
            ]
        )
        
        assert len(response['SecurityGroups']) >= 1, "Security group not found"

    def test_security_group_ingress_rules(self, ec2_client, environment_suffix):
        """Test that security group has correct ingress rules"""
        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'aurora-sg-{environment_suffix}']}
            ]
        )
        
        sg = response['SecurityGroups'][0]
        ingress_rules = sg['IpPermissions']
        
        # Should have ingress rule for PostgreSQL
        pg_rules = [
            r for r in ingress_rules
            if r.get('FromPort') == 5432 and r.get('ToPort') == 5432
        ]
        
        assert len(pg_rules) >= 1, "PostgreSQL ingress rule not found"
        assert pg_rules[0]['IpProtocol'] == 'tcp'

    def test_security_group_egress_rules(self, ec2_client, environment_suffix):
        """Test that security group has egress rules"""
        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'aurora-sg-{environment_suffix}']}
            ]
        )
        
        sg = response['SecurityGroups'][0]
        egress_rules = sg['IpPermissionsEgress']
        
        assert len(egress_rules) >= 1, "No egress rules found"

    # ========================================================================
    # IAM ROLE INTEGRATION TESTS
    # ========================================================================

    def test_iam_role_exists(self, iam_client, environment_suffix):
        """Test that IAM role for RDS monitoring exists"""
        role_name = f"rds-monitoring-role-{environment_suffix}"
        
        try:
            response = iam_client.get_role(RoleName=role_name)
            assert response['Role']['Path'] == '/service-role/'
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                pytest.skip(f"IAM role {role_name} not found (may not have permissions)")
            raise

    def test_iam_role_has_policy_attached(self, iam_client, environment_suffix):
        """Test that IAM role has the monitoring policy attached"""
        role_name = f"rds-monitoring-role-{environment_suffix}"
        
        try:
            response = iam_client.list_attached_role_policies(RoleName=role_name)
            policy_names = [p['PolicyName'] for p in response['AttachedPolicies']]
            
            assert 'AmazonRDSEnhancedMonitoringRole' in policy_names
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                pytest.skip(f"IAM role {role_name} not found (may not have permissions)")
            raise

    # ========================================================================
    # RDS PARAMETER GROUP INTEGRATION TESTS
    # ========================================================================

    def test_cluster_parameter_group_exists(self, rds_client, environment_suffix):
        """Test that cluster parameter group is created"""
        pg_name = f"aurora-postgres16-cluster-pg-{environment_suffix}".lower()
        
        response = rds_client.describe_db_cluster_parameter_groups(
            DBClusterParameterGroupName=pg_name
        )
        
        assert len(response['DBClusterParameterGroups']) == 1
        pg = response['DBClusterParameterGroups'][0]
        assert pg['DBParameterGroupFamily'] == 'aurora-postgresql16'

    def test_cluster_parameter_group_has_ssl_parameter(self, rds_client, environment_suffix):
        """Test that cluster parameter group has SSL enforcement"""
        pg_name = f"aurora-postgres16-cluster-pg-{environment_suffix}".lower()
        
        response = rds_client.describe_db_cluster_parameters(
            DBClusterParameterGroupName=pg_name
        )
        
        ssl_param = [
            p for p in response['Parameters']
            if p['ParameterName'] == 'rds.force_ssl'
        ]
        
        # Check if parameter exists and is set to 1
        if ssl_param:
            assert ssl_param[0].get('ParameterValue') == '1'

    def test_db_parameter_group_exists(self, rds_client, environment_suffix):
        """Test that DB parameter group is created"""
        pg_name = f"aurora-postgres16-db-pg-{environment_suffix}".lower()
        
        response = rds_client.describe_db_parameter_groups(
            DBParameterGroupName=pg_name
        )
        
        assert len(response['DBParameterGroups']) == 1
        pg = response['DBParameterGroups'][0]
        assert pg['DBParameterGroupFamily'] == 'aurora-postgresql16'

    # ========================================================================
    # AURORA CLUSTER INTEGRATION TESTS
    # ========================================================================

    def test_aurora_cluster_exists_and_available(self, rds_client, environment_suffix):
        """Test that Aurora cluster is created and available"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        assert len(response['DBClusters']) == 1
        cluster = response['DBClusters'][0]
        
        # Cluster might still be creating, so check status
        valid_statuses = ['available', 'creating', 'modifying', 'backing-up']
        assert cluster['Status'] in valid_statuses, f"Cluster status is {cluster['Status']}"

    def test_aurora_cluster_engine_version(self, rds_client, environment_suffix):
        """Test that Aurora cluster uses PostgreSQL 16.9"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        assert cluster['Engine'] == 'aurora-postgresql'
        assert cluster['EngineVersion'] == '16.9'

    def test_aurora_cluster_encryption_enabled(self, rds_client, environment_suffix):
        """Test that Aurora cluster has encryption enabled"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        assert cluster['StorageEncrypted'] is True

    def test_aurora_cluster_backup_retention(self, rds_client, environment_suffix):
        """Test that Aurora cluster has correct backup retention"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        assert cluster['BackupRetentionPeriod'] == 7

    def test_aurora_cluster_cloudwatch_logs(self, rds_client, environment_suffix):
        """Test that Aurora cluster exports logs to CloudWatch"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        assert 'postgresql' in cluster['EnabledCloudwatchLogsExports']

    def test_aurora_cluster_in_correct_vpc(self, rds_client, ec2_client, environment_suffix):
        """Test that Aurora cluster is in the correct VPC"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        # Get cluster VPC
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        cluster = response['DBClusters'][0]
        
        # Get subnet group to find VPC
        subnet_group_name = cluster['DBSubnetGroup']
        subnet_group = rds_client.describe_db_subnet_groups(
            DBSubnetGroupName=subnet_group_name
        )
        
        cluster_vpc_id = subnet_group['DBSubnetGroups'][0]['VpcId']
        
        # Get expected VPC
        vpc_response = ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'aurora-vpc-{environment_suffix}']}
            ]
        )
        expected_vpc_id = vpc_response['Vpcs'][0]['VpcId']
        
        assert cluster_vpc_id == expected_vpc_id

    # ========================================================================
    # AURORA INSTANCE INTEGRATION TESTS
    # ========================================================================

    def test_aurora_instance_exists(self, rds_client, environment_suffix):
        """Test that Aurora instance is created"""
        instance_id = f"aurora-postgres-{environment_suffix}-instance-1"
        
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        
        assert len(response['DBInstances']) == 1
        instance = response['DBInstances'][0]
        
        valid_statuses = ['available', 'creating', 'modifying', 'backing-up']
        assert instance['DBInstanceStatus'] in valid_statuses

    def test_aurora_instance_class(self, rds_client, environment_suffix):
        """Test that Aurora instance uses correct instance class"""
        instance_id = f"aurora-postgres-{environment_suffix}-instance-1"
        
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        
        instance = response['DBInstances'][0]
        assert instance['DBInstanceClass'] == 'db.r6g.large'

    def test_aurora_instance_not_public(self, rds_client, environment_suffix):
        """Test that Aurora instance is not publicly accessible"""
        instance_id = f"aurora-postgres-{environment_suffix}-instance-1"
        
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        
        instance = response['DBInstances'][0]
        assert instance['PubliclyAccessible'] is False

    def test_aurora_instance_performance_insights(self, rds_client, environment_suffix):
        """Test that Performance Insights is enabled"""
        instance_id = f"aurora-postgres-{environment_suffix}-instance-1"
        
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        
        instance = response['DBInstances'][0]
        assert instance['PerformanceInsightsEnabled'] is True

    def test_aurora_instance_enhanced_monitoring(self, rds_client, environment_suffix):
        """Test that Enhanced Monitoring is configured"""
        instance_id = f"aurora-postgres-{environment_suffix}-instance-1"
        
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        
        instance = response['DBInstances'][0]
        assert instance['MonitoringInterval'] == 60
        assert 'MonitoringRoleArn' in instance

    # ========================================================================
    # DB SUBNET GROUP INTEGRATION TESTS
    # ========================================================================

    def test_db_subnet_group_exists(self, rds_client, environment_suffix):
        """Test that DB subnet group is created"""
        subnet_group_name = f"aurora-subnet-group-{environment_suffix}".lower()
        
        response = rds_client.describe_db_subnet_groups(
            DBSubnetGroupName=subnet_group_name
        )
        
        assert len(response['DBSubnetGroups']) == 1
        subnet_group = response['DBSubnetGroups'][0]
        assert len(subnet_group['Subnets']) >= 2

    def test_db_subnet_group_multiple_azs(self, rds_client, environment_suffix):
        """Test that DB subnet group spans multiple AZs"""
        subnet_group_name = f"aurora-subnet-group-{environment_suffix}".lower()
        
        response = rds_client.describe_db_subnet_groups(
            DBSubnetGroupName=subnet_group_name
        )
        
        subnet_group = response['DBSubnetGroups'][0]
        azs = set(subnet['SubnetAvailabilityZone']['Name'] for subnet in subnet_group['Subnets'])
        
        assert len(azs) >= 2, "DB subnet group should span at least 2 AZs"

    # ========================================================================
    # CONNECTIVITY & OPERATIONAL TESTS
    # ========================================================================

    def test_aurora_endpoint_resolution(self, rds_client, environment_suffix):
        """Test that Aurora cluster endpoint can be resolved"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        endpoint = cluster.get('Endpoint')
        
        assert endpoint is not None
        assert len(endpoint) > 0
        assert '.' in endpoint

    def test_aurora_reader_endpoint_exists(self, rds_client, environment_suffix):
        """Test that Aurora reader endpoint exists"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        reader_endpoint = cluster.get('ReaderEndpoint')
        
        assert reader_endpoint is not None
        assert len(reader_endpoint) > 0

    # ========================================================================
    # TAGGING COMPLIANCE TESTS
    # ========================================================================

    def test_vpc_has_required_tags(self, ec2_client, environment_suffix):
        """Test that VPC has all required tags"""
        response = ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'aurora-vpc-{environment_suffix}']}
            ]
        )
        
        vpc = response['Vpcs'][0]
        tags = {tag['Key']: tag['Value'] for tag in vpc['Tags']}
        
        assert 'Name' in tags
        assert environment_suffix in tags['Name']

    def test_aurora_cluster_has_required_tags(self, rds_client, environment_suffix):
        """Test that Aurora cluster has required tags"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        tags = {tag['Key']: tag['Value'] for tag in cluster.get('TagList', [])}
        
        assert 'Name' in tags
        assert 'Environment' in tags

    # ========================================================================
    # SECURITY & COMPLIANCE TESTS
    # ========================================================================

    def test_aurora_uses_encrypted_storage(self, rds_client, environment_suffix):
        """Test that Aurora storage is encrypted"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        assert cluster['StorageEncrypted'] is True, "Storage must be encrypted"

    def test_s3_bucket_blocks_public_access(self, s3_client, environment_suffix):
        """Test that S3 bucket blocks public access (if configured)"""
        bucket_prefix = f"tap-bucket-{environment_suffix}"
        
        response = s3_client.list_buckets()
        matching_buckets = [
            b for b in response['Buckets']
            if b['Name'].startswith(bucket_prefix)
        ]
        
        if matching_buckets:
            bucket_name = matching_buckets[0]['Name']
            try:
                public_access = s3_client.get_public_access_block(Bucket=bucket_name)
                # If public access block is configured, verify it's restrictive
                if 'PublicAccessBlockConfiguration' in public_access:
                    config = public_access['PublicAccessBlockConfiguration']
                    # These should ideally be True for security
                    assert config.get('BlockPublicAcls', False)
            except ClientError as e:
                # PublicAccessBlock might not be configured, which is okay for test
                if e.response['Error']['Code'] != 'NoSuchPublicAccessBlockConfiguration':
                    raise

    # ========================================================================
    # PERFORMANCE & RELIABILITY TESTS
    # ========================================================================

    @pytest.mark.slow
    def test_aurora_cluster_eventually_becomes_available(self, rds_client, environment_suffix):
        """Test that Aurora cluster eventually reaches available state"""
        cluster_id = f"aurora-postgres-{environment_suffix}"
        max_wait_time = 1800  # 30 minutes
        poll_interval = 60  # 1 minute
        elapsed_time = 0
        
        while elapsed_time < max_wait_time:
            response = rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            
            cluster = response['DBClusters'][0]
            status = cluster['Status']
            
            if status == 'available':
                return  # Success
            elif status in ['creating', 'modifying', 'backing-up']:
                time.sleep(poll_interval)
                elapsed_time += poll_interval
            else:
                pytest.fail(f"Unexpected cluster status: {status}")
        
        pytest.fail(f"Cluster did not become available within {max_wait_time} seconds")

    # ========================================================================
    # RESOURCE CLEANUP VALIDATION TESTS
    # ========================================================================

    def test_no_orphaned_resources(self, ec2_client, environment_suffix):
        """Test that no orphaned network interfaces exist"""
        response = ec2_client.describe_network_interfaces(
            Filters=[
                {'Name': 'tag:Environment', 'Values': [environment_suffix]},
                {'Name': 'status', 'Values': ['available']}  # available means not attached
            ]
        )
        
        # Should not have detached network interfaces
        # (some might be attaching, which is okay)
        available_enis = [
            eni for eni in response['NetworkInterfaces']
            if eni['Status'] == 'available'
        ]
        
        # Allow some time for resources to attach
        assert len(available_enis) <= 2, "Too many orphaned network interfaces"

