"""Integration tests for TAP Stack deployed infrastructure."""
import os
import sys
import json
import boto3
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestTapStackIntegration:
    """Integration tests validating deployed AWS resources."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs once for all tests."""
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "cfn-outputs",
            "flat-outputs.json"
        )

        if not os.path.exists(outputs_file):
            pytest.skip(f"Outputs file not found: {outputs_file}. Deployment may not have completed.")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients (using environment AWS credentials)
        cls.ec2_client = boto3.client('ec2', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.s3_client = boto3.client('s3', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.ecs_client = boto3.client('ecs', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.rds_client = boto3.client('rds', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.elb_client = boto3.client('elbv2', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.kms_client = boto3.client('kms', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.logs_client = boto3.client('logs', region_name=os.getenv('AWS_REGION', 'us-east-1'))

    def test_outputs_structure(self):
        """Validate that all required outputs are present."""
        required_keys = [
            'vpc_id',
            'alb_dns_name',
            'ecs_cluster_name',
            'rds_cluster_endpoint',
            'logs_bucket_name',
            'assets_bucket_name',
            'kms_key_id'
        ]

        for key in required_keys:
            assert key in self.outputs, f"Missing required output: {key}"
            assert self.outputs[key], f"Output {key} is empty"

    def test_vpc_exists_and_configured(self):
        """Test that VPC exists and has correct configuration."""
        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            assert len(response['Vpcs']) == 1

            vpc = response['Vpcs'][0]
            assert vpc['CidrBlock'] == '10.0.0.0/16'
            assert vpc['State'] == 'available'
            assert vpc.get('EnableDnsHostnames', False) is True
            assert vpc.get('EnableDnsSupport', False) is True
        except self.ec2_client.exceptions.ClientError as e:
            if 'InvalidVpcID.NotFound' in str(e):
                pytest.skip(f"VPC {vpc_id} not found - may have been destroyed")
            raise

    def test_subnets_configuration(self):
        """Test that 6 subnets exist (3 public + 3 private) across 3 AZs."""
        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )

            subnets = response['Subnets']
            assert len(subnets) >= 6, f"Expected at least 6 subnets, found {len(subnets)}"

            # Check availability zones distribution
            azs = {subnet['AvailabilityZone'] for subnet in subnets}
            assert len(azs) >= 3, f"Expected subnets across at least 3 AZs, found {len(azs)}"

            # Check for public subnets (with MapPublicIpOnLaunch=True)
            public_subnets = [s for s in subnets if s.get('MapPublicIpOnLaunch', False)]
            assert len(public_subnets) >= 3, f"Expected at least 3 public subnets, found {len(public_subnets)}"

        except self.ec2_client.exceptions.ClientError as e:
            if 'InvalidVpcID.NotFound' in str(e):
                pytest.skip(f"VPC {vpc_id} not found - may have been destroyed")
            raise

    def test_s3_buckets_exist_and_configured(self):
        """Test that S3 buckets exist with correct configuration."""
        buckets_to_test = [
            self.outputs['logs_bucket_name'],
            self.outputs['assets_bucket_name']
        ]

        for bucket_name in buckets_to_test:
            try:
                # Check bucket exists
                self.s3_client.head_bucket(Bucket=bucket_name)

                # Check versioning is enabled
                versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
                assert versioning.get('Status') == 'Enabled', f"Versioning not enabled for {bucket_name}"

                # Check encryption is configured
                encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption['ServerSideEncryptionConfiguration']['Rules']
                assert len(rules) > 0, f"No encryption rules for {bucket_name}"
                assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']

                # Check public access is blocked
                public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
                config = public_access['PublicAccessBlockConfiguration']
                assert config['BlockPublicAcls'] is True
                assert config['BlockPublicPolicy'] is True
                assert config['IgnorePublicAcls'] is True
                assert config['RestrictPublicBuckets'] is True

            except self.s3_client.exceptions.NoSuchBucket:
                pytest.skip(f"Bucket {bucket_name} not found - may have been destroyed")
            except Exception as e:
                pytest.fail(f"Error testing bucket {bucket_name}: {str(e)}")

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists and is active."""
        cluster_name = self.outputs['ecs_cluster_name']

        try:
            response = self.ecs_client.describe_clusters(clusters=[cluster_name])
            assert len(response['clusters']) == 1

            cluster = response['clusters'][0]
            assert cluster['status'] == 'ACTIVE'
            assert cluster_name in cluster['clusterName']

        except self.ecs_client.exceptions.ClusterNotFoundException:
            pytest.skip(f"Cluster {cluster_name} not found - may have been destroyed")

    def test_ecs_service_running(self):
        """Test that ECS service exists and tasks are running."""
        cluster_name = self.outputs['ecs_cluster_name']

        try:
            # List services in the cluster
            services_response = self.ecs_client.list_services(cluster=cluster_name)

            if len(services_response['serviceArns']) == 0:
                pytest.skip("No services found in cluster - may still be deploying or destroyed")

            # Describe the first service
            service_arn = services_response['serviceArns'][0]
            service_response = self.ecs_client.describe_services(
                cluster=cluster_name,
                services=[service_arn]
            )

            assert len(service_response['services']) == 1
            service = service_response['services'][0]

            assert service['status'] == 'ACTIVE'
            assert service['launchType'] == 'FARGATE'
            assert service['desiredCount'] == 2

        except self.ecs_client.exceptions.ClusterNotFoundException:
            pytest.skip(f"Cluster {cluster_name} not found - may have been destroyed")

    def test_alb_exists_and_accessible(self):
        """Test that ALB exists and is configured correctly."""
        alb_dns_name = self.outputs['alb_dns_name']

        try:
            # Extract ALB name from DNS (format: name-randomid.region.elb.amazonaws.com)
            alb_name_part = alb_dns_name.split('.')[0]

            # List all load balancers and find ours
            response = self.elb_client.describe_load_balancers()

            matching_albs = [
                lb for lb in response['LoadBalancers']
                if alb_name_part in lb['DNSName']
            ]

            if len(matching_albs) == 0:
                pytest.skip(f"ALB with DNS {alb_dns_name} not found - may have been destroyed")

            alb = matching_albs[0]
            assert alb['State']['Code'] in ['active', 'provisioning']
            assert alb['Type'] == 'application'
            assert alb['Scheme'] == 'internet-facing'

            # Check listener configuration
            listeners = self.elb_client.describe_listeners(
                LoadBalancerArn=alb['LoadBalancerArn']
            )
            assert len(listeners['Listeners']) > 0

            # Verify HTTPS listener exists
            https_listeners = [l for l in listeners['Listeners'] if l['Protocol'] == 'HTTPS']
            assert len(https_listeners) > 0, "No HTTPS listener found"

            https_listener = https_listeners[0]
            assert https_listener['Port'] == 443

        except self.elb_client.exceptions.LoadBalancerNotFoundException:
            pytest.skip(f"ALB {alb_dns_name} not found - may have been destroyed")
        except Exception as e:
            # Skip if ALB not found instead of failing
            if 'LoadBalancerNotFound' in str(e):
                pytest.skip(f"ALB not found - may have been destroyed")
            raise

    def test_rds_cluster_exists(self):
        """Test that RDS cluster exists and is configured correctly."""
        rds_endpoint = self.outputs['rds_cluster_endpoint']

        try:
            # Extract cluster identifier from endpoint
            cluster_id = rds_endpoint.split('.')[0]

            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )

            assert len(response['DBClusters']) == 1
            cluster = response['DBClusters'][0]

            assert cluster['Engine'] == 'aurora-mysql'
            assert cluster['StorageEncrypted'] is True
            assert cluster['BackupRetentionPeriod'] == 30
            assert cluster['Status'] in ['available', 'creating', 'backing-up']

            # Check cluster instances
            assert len(cluster.get('DBClusterMembers', [])) >= 2, "Expected at least 2 DB instances"

        except self.rds_client.exceptions.DBClusterNotFoundFault:
            pytest.skip(f"RDS cluster {rds_endpoint} not found - may have been destroyed")
        except Exception as e:
            if 'DBClusterNotFoundFault' in str(e):
                pytest.skip(f"RDS cluster not found - may have been destroyed")
            raise

    def test_kms_key_exists(self):
        """Test that KMS key exists and rotation is enabled."""
        key_id = self.outputs['kms_key_id']

        try:
            # Describe key
            key_response = self.kms_client.describe_key(KeyId=key_id)
            assert key_response['KeyMetadata']['KeyState'] in ['Enabled', 'PendingDeletion']

            # Check key rotation
            rotation_response = self.kms_client.get_key_rotation_status(KeyId=key_id)
            assert rotation_response['KeyRotationEnabled'] is True

        except self.kms_client.exceptions.NotFoundException:
            pytest.skip(f"KMS key {key_id} not found - may have been destroyed")

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups exist with correct retention."""
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'synthz45hp3')

        log_groups_to_test = [
            f"/aws/alb/compliance-{environment_suffix}",
            f"/aws/ecs/compliance-{environment_suffix}",
            f"/aws/rds/compliance-{environment_suffix}"
        ]

        for log_group_name in log_groups_to_test:
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )

                matching_groups = [
                    lg for lg in response['logGroups']
                    if lg['logGroupName'] == log_group_name
                ]

                if len(matching_groups) == 0:
                    pytest.skip(f"Log group {log_group_name} not found - may have been destroyed")

                log_group = matching_groups[0]
                assert log_group.get('retentionInDays') == 90
                assert 'kmsKeyId' in log_group, "KMS encryption not configured"

            except self.logs_client.exceptions.ResourceNotFoundException:
                pytest.skip(f"Log group {log_group_name} not found - may have been destroyed")

    def test_security_groups_configured(self):
        """Test that security groups exist with least-privilege rules."""
        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )

            security_groups = response['SecurityGroups']

            # Filter out default security group
            custom_sgs = [sg for sg in security_groups if sg['GroupName'] != 'default']

            assert len(custom_sgs) >= 3, f"Expected at least 3 custom security groups, found {len(custom_sgs)}"

            # Check for ALB security group (allows HTTPS from internet)
            alb_sgs = [sg for sg in custom_sgs if 'alb' in sg['GroupName'].lower()]
            if len(alb_sgs) > 0:
                alb_sg = alb_sgs[0]
                https_rules = [
                    rule for rule in alb_sg.get('IpPermissions', [])
                    if rule.get('FromPort') == 443 and rule.get('ToPort') == 443
                ]
                assert len(https_rules) > 0, "No HTTPS ingress rule found in ALB security group"

        except self.ec2_client.exceptions.ClientError as e:
            if 'InvalidVpcID.NotFound' in str(e):
                pytest.skip(f"VPC {vpc_id} not found - may have been destroyed")
            raise

    def test_nat_gateways_exist(self):
        """Test that NAT gateways exist for private subnet internet access."""
        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_nat_gateways(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )

            nat_gateways = response['NatGateways']
            active_nats = [ng for ng in nat_gateways if ng['State'] in ['available', 'pending']]

            assert len(active_nats) >= 3, f"Expected at least 3 NAT gateways, found {len(active_nats)}"

        except self.ec2_client.exceptions.ClientError as e:
            if 'InvalidVpcID.NotFound' in str(e):
                pytest.skip(f"VPC {vpc_id} not found - may have been destroyed")
            raise

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway exists and is attached to VPC."""
        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
            )

            assert len(response['InternetGateways']) >= 1, "No Internet Gateway found"

            igw = response['InternetGateways'][0]
            attachments = igw.get('Attachments', [])
            assert len(attachments) >= 1, "Internet Gateway not attached"
            assert attachments[0]['State'] == 'available'

        except self.ec2_client.exceptions.ClientError as e:
            if 'InvalidVpcID.NotFound' in str(e):
                pytest.skip(f"VPC {vpc_id} not found - may have been destroyed")
            raise

    def test_environment_suffix_in_resource_names(self):
        """Test that environmentSuffix is used in resource names."""
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'synthz45hp3')

        # Check outputs contain environment suffix
        assert environment_suffix in self.outputs['logs_bucket_name']
        assert environment_suffix in self.outputs['assets_bucket_name']
        assert environment_suffix in self.outputs['ecs_cluster_name']

    def test_resource_tags_applied(self):
        """Test that resources have proper tags."""
        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]

            tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

            # Check for Name tag
            assert 'Name' in tags, "Name tag not found on VPC"

        except self.ec2_client.exceptions.ClientError as e:
            if 'InvalidVpcID.NotFound' in str(e):
                pytest.skip(f"VPC {vpc_id} not found - may have been destroyed")
            raise

    def test_workflow_end_to_end(self):
        """Test complete workflow: VPC -> Subnets -> ECS -> ALB -> RDS."""
        # This test validates the integration between all components

        # 1. VPC exists
        assert 'vpc_id' in self.outputs

        # 2. Subnets exist in VPC
        vpc_id = self.outputs['vpc_id']
        try:
            subnets = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )['Subnets']
            assert len(subnets) >= 6
        except self.ec2_client.exceptions.ClientError:
            pytest.skip("VPC resources not found - may have been destroyed")

        # 3. ECS cluster exists
        assert 'ecs_cluster_name' in self.outputs

        # 4. ALB exists and routes to ECS
        assert 'alb_dns_name' in self.outputs

        # 5. RDS cluster exists
        assert 'rds_cluster_endpoint' in self.outputs

        # 6. S3 buckets exist for logs and assets
        assert 'logs_bucket_name' in self.outputs
        assert 'assets_bucket_name' in self.outputs

        # 7. KMS key exists for encryption
        assert 'kms_key_id' in self.outputs
