"""Integration tests for Blue-Green deployment stacks with live AWS resource validation"""
import pytest
import boto3
import json
import os
from pathlib import Path
from botocore.exceptions import ClientError


class TestOutputsFile:
    """Test cases for deployment outputs file"""

    @pytest.fixture(scope="class")
    def outputs_data(self):
        """Load deployment outputs from flat-outputs.json"""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        assert outputs_path.exists(), f"Outputs file not found at {outputs_path}"

        with open(outputs_path, 'r') as f:
            data = json.load(f)

        # Find the stack outputs (should be first/only key)
        stack_name = list(data.keys())[0]
        outputs = data[stack_name]

        assert outputs, "No outputs found in the JSON file"
        return outputs

    def test_outputs_file_exists(self):
        """Test that flat-outputs.json file exists"""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        assert outputs_path.exists(), "flat-outputs.json file does not exist"

    def test_outputs_has_required_keys(self, outputs_data):
        """Test that outputs file contains all required keys"""
        required_keys = [
            'alb_dns_name',
            'artifacts_bucket',
            'blue_target_group_arn',
            'database_endpoint',
            'database_secret_arn',
            'green_target_group_arn',
            'sns_topic_arn',
            'vpc_id'
        ]

        for key in required_keys:
            assert key in outputs_data, f"Missing required output key: {key}"
            assert outputs_data[key], f"Output key {key} is empty"

    def test_outputs_format_validation(self, outputs_data):
        """Test that outputs have correct format"""
        # VPC ID format
        assert outputs_data['vpc_id'].startswith('vpc-'), "Invalid VPC ID format"

        # ARN formats
        assert outputs_data['blue_target_group_arn'].startswith('arn:aws:'), "Invalid blue target group ARN"
        assert outputs_data['green_target_group_arn'].startswith('arn:aws:'), "Invalid green target group ARN"
        assert outputs_data['database_secret_arn'].startswith('arn:aws:'), "Invalid database secret ARN"
        assert outputs_data['sns_topic_arn'].startswith('arn:aws:sns:'), "Invalid SNS topic ARN"

        # DNS name format
        assert '.elb.amazonaws.com' in outputs_data['alb_dns_name'], "Invalid ALB DNS name format"
        assert '.rds.amazonaws.com' in outputs_data['database_endpoint'], "Invalid RDS endpoint format"


class TestVPCResources:
    """Integration tests for VPC and networking resources"""

    @pytest.fixture(scope="class")
    def outputs_data(self):
        """Load deployment outputs"""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        return data[list(data.keys())[0]]

    @pytest.fixture(scope="class")
    def ec2_client(self):
        """Create EC2 client"""
        return boto3.client('ec2', region_name='us-east-1')

    def test_vpc_exists(self, outputs_data, ec2_client):
        """Test that VPC exists and is available"""
        vpc_id = outputs_data['vpc_id']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1, "VPC not found"
        vpc = response['Vpcs'][0]

        assert vpc['State'] == 'available', f"VPC is not available, state: {vpc['State']}"
        assert vpc['CidrBlock'] == '10.0.0.0/16', f"Unexpected VPC CIDR block: {vpc['CidrBlock']}"

    def test_vpc_dns_settings(self, outputs_data, ec2_client):
        """Test that VPC has DNS hostnames and support enabled"""
        vpc_id = outputs_data['vpc_id']

        # Check DNS support
        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert dns_support['EnableDnsSupport']['Value'] is True, "DNS support not enabled"

        # Check DNS hostnames
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True, "DNS hostnames not enabled"

    def test_subnets_exist(self, outputs_data, ec2_client):
        """Test that all subnets exist (2 public + 2 private)"""
        vpc_id = outputs_data['vpc_id']

        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 4, f"Expected at least 4 subnets, found {len(subnets)}"

        # Verify CIDR blocks
        cidr_blocks = [subnet['CidrBlock'] for subnet in subnets]
        expected_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.10.0/24', '10.0.11.0/24']

        for expected_cidr in expected_cidrs:
            assert expected_cidr in cidr_blocks, f"Expected subnet CIDR {expected_cidr} not found"

    def test_public_subnets_configuration(self, outputs_data, ec2_client):
        """Test that public subnets have proper configuration"""
        vpc_id = outputs_data['vpc_id']

        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'cidr-block', 'Values': ['10.0.1.0/24', '10.0.2.0/24']}
            ]
        )

        public_subnets = response['Subnets']
        assert len(public_subnets) == 2, "Expected 2 public subnets"

        for subnet in public_subnets:
            assert subnet['MapPublicIpOnLaunch'] is True, f"Public subnet {subnet['SubnetId']} does not auto-assign public IPs"

    def test_internet_gateway_exists(self, outputs_data, ec2_client):
        """Test that Internet Gateway exists and is attached"""
        vpc_id = outputs_data['vpc_id']

        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        assert len(response['InternetGateways']) >= 1, "No Internet Gateway found"
        igw = response['InternetGateways'][0]

        assert len(igw['Attachments']) > 0, "Internet Gateway not attached"
        assert igw['Attachments'][0]['State'] == 'available', "Internet Gateway attachment not available"

    def test_nat_gateway_exists(self, outputs_data, ec2_client):
        """Test that NAT Gateway exists and is available"""
        vpc_id = outputs_data['vpc_id']

        response = ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        nat_gateways = [ng for ng in response['NatGateways'] if ng['State'] != 'deleted']
        assert len(nat_gateways) >= 1, "No NAT Gateway found"

        nat_gateway = nat_gateways[0]
        assert nat_gateway['State'] in ['available', 'pending'], f"NAT Gateway state: {nat_gateway['State']}"

    def test_route_tables_exist(self, outputs_data, ec2_client):
        """Test that route tables exist for public and private subnets"""
        vpc_id = outputs_data['vpc_id']

        response = ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        route_tables = response['RouteTables']
        # Should have at least 3 route tables: 1 main + 1 public + 1 private
        assert len(route_tables) >= 3, f"Expected at least 3 route tables, found {len(route_tables)}"

    def test_security_groups_exist(self, outputs_data, ec2_client):
        """Test that security groups exist for ALB, EC2, and RDS"""
        vpc_id = outputs_data['vpc_id']

        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        security_groups = response['SecurityGroups']
        sg_names = [sg.get('GroupName', '') for sg in security_groups]

        # Check for expected security groups (excluding default)
        non_default_sgs = [sg for sg in security_groups if sg['GroupName'] != 'default']
        assert len(non_default_sgs) >= 3, f"Expected at least 3 custom security groups, found {len(non_default_sgs)}"


class TestLoadBalancerResources:
    """Integration tests for Application Load Balancer resources"""

    @pytest.fixture(scope="class")
    def outputs_data(self):
        """Load deployment outputs"""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        return data[list(data.keys())[0]]

    @pytest.fixture(scope="class")
    def elbv2_client(self):
        """Create ELBv2 client"""
        return boto3.client('elbv2', region_name='us-east-1')

    def test_alb_exists(self, outputs_data, elbv2_client):
        """Test that Application Load Balancer exists and is active"""
        alb_dns_name = outputs_data['alb_dns_name']

        response = elbv2_client.describe_load_balancers()

        alb = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns_name:
                alb = lb
                break

        assert alb is not None, f"ALB with DNS name {alb_dns_name} not found"
        assert alb['State']['Code'] in ['active', 'provisioning'], f"ALB state: {alb['State']['Code']}"
        assert alb['Type'] == 'application', "Load balancer is not an Application Load Balancer"
        assert alb['Scheme'] == 'internet-facing', "ALB is not internet-facing"

    def test_alb_has_listeners(self, outputs_data, elbv2_client):
        """Test that ALB has at least one listener"""
        alb_dns_name = outputs_data['alb_dns_name']

        # Get ALB ARN
        response = elbv2_client.describe_load_balancers()
        alb_arn = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns_name:
                alb_arn = lb['LoadBalancerArn']
                break

        assert alb_arn is not None, "ALB ARN not found"

        # Check listeners
        listeners_response = elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)

        assert len(listeners_response['Listeners']) >= 1, "No listeners found on ALB"

        # Check that at least one listener is on port 80
        listener_ports = [listener['Port'] for listener in listeners_response['Listeners']]
        assert 80 in listener_ports, "No HTTP listener on port 80"

    def test_blue_target_group_exists(self, outputs_data, elbv2_client):
        """Test that Blue target group exists and is configured"""
        blue_tg_arn = outputs_data['blue_target_group_arn']

        response = elbv2_client.describe_target_groups(TargetGroupArns=[blue_tg_arn])

        assert len(response['TargetGroups']) == 1, "Blue target group not found"

        blue_tg = response['TargetGroups'][0]
        assert blue_tg['Protocol'] == 'HTTP', "Blue target group protocol is not HTTP"
        assert blue_tg['Port'] == 80, "Blue target group port is not 80"
        assert blue_tg['HealthCheckEnabled'] is True, "Health check not enabled on Blue target group"

    def test_green_target_group_exists(self, outputs_data, elbv2_client):
        """Test that Green target group exists and is configured"""
        green_tg_arn = outputs_data['green_target_group_arn']

        response = elbv2_client.describe_target_groups(TargetGroupArns=[green_tg_arn])

        assert len(response['TargetGroups']) == 1, "Green target group not found"

        green_tg = response['TargetGroups'][0]
        assert green_tg['Protocol'] == 'HTTP', "Green target group protocol is not HTTP"
        assert green_tg['Port'] == 80, "Green target group port is not 80"
        assert green_tg['HealthCheckEnabled'] is True, "Health check not enabled on Green target group"

    def test_target_groups_health_check_config(self, outputs_data, elbv2_client):
        """Test that target groups have proper health check configuration"""
        blue_tg_arn = outputs_data['blue_target_group_arn']
        green_tg_arn = outputs_data['green_target_group_arn']

        for tg_arn, color in [(blue_tg_arn, 'Blue'), (green_tg_arn, 'Green')]:
            response = elbv2_client.describe_target_groups(TargetGroupArns=[tg_arn])
            tg = response['TargetGroups'][0]

            assert tg['HealthCheckPath'] == '/', f"{color} target group health check path incorrect"
            assert tg['HealthCheckProtocol'] == 'HTTP', f"{color} target group health check protocol incorrect"
            assert tg['HealthCheckIntervalSeconds'] == 30, f"{color} target group health check interval incorrect"
            assert tg['HealthyThresholdCount'] == 2, f"{color} target group healthy threshold incorrect"
            assert tg['UnhealthyThresholdCount'] == 2, f"{color} target group unhealthy threshold incorrect"

    def test_target_group_registered_targets(self, outputs_data, elbv2_client):
        """Test that target groups have registered targets"""
        blue_tg_arn = outputs_data['blue_target_group_arn']
        green_tg_arn = outputs_data['green_target_group_arn']

        # Check Blue target group
        blue_health = elbv2_client.describe_target_health(TargetGroupArn=blue_tg_arn)
        blue_targets = blue_health['TargetHealthDescriptions']

        # Check Green target group
        green_health = elbv2_client.describe_target_health(TargetGroupArn=green_tg_arn)
        green_targets = green_health['TargetHealthDescriptions']

        # At least one target group should have registered targets
        total_targets = len(blue_targets) + len(green_targets)
        assert total_targets > 0, "No targets registered in any target group"


class TestDatabaseResources:
    """Integration tests for RDS database resources"""

    @pytest.fixture(scope="class")
    def outputs_data(self):
        """Load deployment outputs"""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        return data[list(data.keys())[0]]

    @pytest.fixture(scope="class")
    def rds_client(self):
        """Create RDS client"""
        return boto3.client('rds', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def secretsmanager_client(self):
        """Create Secrets Manager client"""
        return boto3.client('secretsmanager', region_name='us-east-1')

    def test_rds_cluster_exists(self, outputs_data, rds_client):
        """Test that RDS Aurora cluster exists and is available"""
        database_endpoint = outputs_data['database_endpoint']
        cluster_id = database_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        assert len(response['DBClusters']) == 1, "RDS cluster not found"

        cluster = response['DBClusters'][0]
        assert cluster['Status'] in ['available', 'creating', 'backing-up'], f"Cluster status: {cluster['Status']}"
        assert cluster['Engine'] == 'aurora-postgresql', f"Unexpected engine: {cluster['Engine']}"
        assert cluster['EngineMode'] == 'provisioned', f"Unexpected engine mode: {cluster['EngineMode']}"

    def test_rds_cluster_configuration(self, outputs_data, rds_client):
        """Test RDS cluster configuration"""
        database_endpoint = outputs_data['database_endpoint']
        cluster_id = database_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]

        # Check database name
        assert cluster['DatabaseName'] == 'appdb', f"Unexpected database name: {cluster.get('DatabaseName')}"

        # Check master username
        assert cluster['MasterUsername'] == 'dbadmin', f"Unexpected master username: {cluster['MasterUsername']}"

        # Check serverless v2 scaling
        assert 'ServerlessV2ScalingConfiguration' in cluster, "Serverless v2 scaling not configured"
        scaling = cluster['ServerlessV2ScalingConfiguration']
        assert scaling['MinCapacity'] == 0.5, f"Min capacity incorrect: {scaling['MinCapacity']}"
        assert scaling['MaxCapacity'] == 1.0, f"Max capacity incorrect: {scaling['MaxCapacity']}"

    def test_rds_cluster_instances_exist(self, outputs_data, rds_client):
        """Test that RDS cluster has at least one instance"""
        database_endpoint = outputs_data['database_endpoint']
        cluster_id = database_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        cluster_members = cluster['DBClusterMembers']

        assert len(cluster_members) >= 1, "No instances in the RDS cluster"

        # Check instance details
        for member in cluster_members:
            instance_id = member['DBInstanceIdentifier']
            instance_response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )
            instance = instance_response['DBInstances'][0]

            assert instance['DBInstanceClass'] == 'db.serverless', f"Unexpected instance class: {instance['DBInstanceClass']}"
            assert instance['Engine'] == 'aurora-postgresql', f"Unexpected engine: {instance['Engine']}"

    def test_database_secret_exists(self, outputs_data, secretsmanager_client):
        """Test that database secret exists in Secrets Manager"""
        secret_arn = outputs_data['database_secret_arn']

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        assert response['ARN'] == secret_arn, "Secret ARN mismatch"
        assert 'Name' in response, "Secret name not found"

    def test_database_secret_has_value(self, outputs_data, secretsmanager_client):
        """Test that database secret has a valid value"""
        secret_arn = outputs_data['database_secret_arn']

        try:
            response = secretsmanager_client.get_secret_value(SecretId=secret_arn)

            assert 'SecretString' in response, "Secret value not found"

            secret_data = json.loads(response['SecretString'])

            # Validate secret structure
            required_keys = ['username', 'password', 'engine', 'port', 'dbname']
            for key in required_keys:
                assert key in secret_data, f"Missing key in secret: {key}"

            assert secret_data['username'] == 'dbadmin', "Unexpected username in secret"
            assert secret_data['engine'] == 'postgres', "Unexpected engine in secret"
            assert secret_data['port'] == 5432, "Unexpected port in secret"
            assert secret_data['dbname'] == 'appdb', "Unexpected database name in secret"

        except ClientError as e:
            if e.response['Error']['Code'] == 'AccessDeniedException':
                pytest.skip("No access to read secret value")
            else:
                raise

    def test_rds_subnet_group_exists(self, outputs_data, rds_client):
        """Test that RDS subnet group exists"""
        database_endpoint = outputs_data['database_endpoint']
        cluster_id = database_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        subnet_group_name = cluster['DBSubnetGroup']

        # Verify subnet group exists
        subnet_response = rds_client.describe_db_subnet_groups(
            DBSubnetGroupName=subnet_group_name
        )

        assert len(subnet_response['DBSubnetGroups']) == 1, "DB subnet group not found"
        subnet_group = subnet_response['DBSubnetGroups'][0]

        # Should have at least 2 subnets (for HA)
        assert len(subnet_group['Subnets']) >= 2, "DB subnet group should have at least 2 subnets"


class TestComputeResources:
    """Integration tests for compute resources (ASG, EC2, IAM)"""

    @pytest.fixture(scope="class")
    def outputs_data(self):
        """Load deployment outputs"""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        return data[list(data.keys())[0]]

    @pytest.fixture(scope="class")
    def autoscaling_client(self):
        """Create Auto Scaling client"""
        return boto3.client('autoscaling', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def ec2_client(self):
        """Create EC2 client"""
        return boto3.client('ec2', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def iam_client(self):
        """Create IAM client"""
        return boto3.client('iam', region_name='us-east-1')

    def test_blue_asg_exists(self, outputs_data, autoscaling_client):
        """Test that Blue Auto Scaling Group exists"""
        response = autoscaling_client.describe_auto_scaling_groups()

        blue_asg = None
        for asg in response['AutoScalingGroups']:
            if 'blue' in asg['AutoScalingGroupName'].lower() and 'v1' in asg['AutoScalingGroupName']:
                blue_asg = asg
                break

        assert blue_asg is not None, "Blue Auto Scaling Group not found"
        assert blue_asg['MinSize'] == 1, f"Blue ASG min size incorrect: {blue_asg['MinSize']}"
        assert blue_asg['MaxSize'] == 4, f"Blue ASG max size incorrect: {blue_asg['MaxSize']}"
        assert blue_asg['DesiredCapacity'] == 2, f"Blue ASG desired capacity incorrect: {blue_asg['DesiredCapacity']}"

    def test_green_asg_exists(self, outputs_data, autoscaling_client):
        """Test that Green Auto Scaling Group exists"""
        response = autoscaling_client.describe_auto_scaling_groups()

        green_asg = None
        for asg in response['AutoScalingGroups']:
            if 'green' in asg['AutoScalingGroupName'].lower() and 'v1' in asg['AutoScalingGroupName']:
                green_asg = asg
                break

        assert green_asg is not None, "Green Auto Scaling Group not found"
        assert green_asg['MinSize'] == 1, f"Green ASG min size incorrect: {green_asg['MinSize']}"
        assert green_asg['MaxSize'] == 4, f"Green ASG max size incorrect: {green_asg['MaxSize']}"
        assert green_asg['DesiredCapacity'] == 2, f"Green ASG desired capacity incorrect: {green_asg['DesiredCapacity']}"

    def test_asg_health_check_configuration(self, outputs_data, autoscaling_client):
        """Test that ASGs have proper health check configuration"""
        response = autoscaling_client.describe_auto_scaling_groups()

        asgs = [asg for asg in response['AutoScalingGroups']
                if 'v1' in asg['AutoScalingGroupName'] and
                ('blue' in asg['AutoScalingGroupName'].lower() or 'green' in asg['AutoScalingGroupName'].lower())]

        assert len(asgs) >= 2, "Expected at least 2 ASGs (Blue and Green)"

        for asg in asgs:
            assert asg['HealthCheckType'] == 'ELB', f"ASG {asg['AutoScalingGroupName']} health check type is not ELB"
            assert asg['HealthCheckGracePeriod'] == 300, f"ASG {asg['AutoScalingGroupName']} health check grace period incorrect"

    def test_ec2_instances_running(self, outputs_data, autoscaling_client, ec2_client):
        """Test that EC2 instances are running in ASGs"""
        response = autoscaling_client.describe_auto_scaling_groups()

        asgs = [asg for asg in response['AutoScalingGroups']
                if 'v1' in asg['AutoScalingGroupName'] and
                ('blue' in asg['AutoScalingGroupName'].lower() or 'green' in asg['AutoScalingGroupName'].lower())]

        all_instance_ids = []
        for asg in asgs:
            instances = asg['Instances']
            instance_ids = [instance['InstanceId'] for instance in instances]
            all_instance_ids.extend(instance_ids)

        if all_instance_ids:
            ec2_response = ec2_client.describe_instances(InstanceIds=all_instance_ids)

            for reservation in ec2_response['Reservations']:
                for instance in reservation['Instances']:
                    assert instance['State']['Name'] in ['running', 'pending'], \
                        f"Instance {instance['InstanceId']} is in state {instance['State']['Name']}"

    def test_launch_templates_exist(self, outputs_data, ec2_client):
        """Test that launch templates exist for Blue and Green"""
        response = ec2_client.describe_launch_templates()

        launch_templates = response['LaunchTemplates']
        lt_names = [lt['LaunchTemplateName'] for lt in launch_templates]

        blue_lt_exists = any('blue' in name.lower() and 'v1' in name for name in lt_names)
        green_lt_exists = any('green' in name.lower() and 'v1' in name for name in lt_names)

        assert blue_lt_exists, "Blue launch template not found"
        assert green_lt_exists, "Green launch template not found"

    def test_iam_role_exists(self, outputs_data, iam_client):
        """Test that EC2 IAM role exists"""
        try:
            response = iam_client.list_roles()

            ec2_roles = [role for role in response['Roles']
                        if 'bluegreen-ec2-role-v1' in role['RoleName']]

            assert len(ec2_roles) >= 1, "EC2 IAM role not found"

        except ClientError as e:
            if e.response['Error']['Code'] == 'AccessDenied':
                pytest.skip("No access to list IAM roles")
            else:
                raise

    def test_iam_instance_profile_exists(self, outputs_data, iam_client):
        """Test that IAM instance profile exists"""
        try:
            response = iam_client.list_instance_profiles()

            instance_profiles = [ip for ip in response['InstanceProfiles']
                                if 'bluegreen-instance-profile-v1' in ip['InstanceProfileName']]

            assert len(instance_profiles) >= 1, "IAM instance profile not found"

        except ClientError as e:
            if e.response['Error']['Code'] == 'AccessDenied':
                pytest.skip("No access to list instance profiles")
            else:
                raise


class TestStorageResources:
    """Integration tests for S3 storage resources"""

    @pytest.fixture(scope="class")
    def outputs_data(self):
        """Load deployment outputs"""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        return data[list(data.keys())[0]]

    @pytest.fixture(scope="class")
    def s3_client(self):
        """Create S3 client"""
        return boto3.client('s3', region_name='us-east-1')

    def test_artifacts_bucket_exists(self, outputs_data, s3_client):
        """Test that artifacts S3 bucket exists"""
        bucket_name = outputs_data['artifacts_bucket']

        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200, "Bucket does not exist"
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                pytest.fail(f"Bucket {bucket_name} not found")
            else:
                raise

    def test_bucket_versioning_enabled(self, outputs_data, s3_client):
        """Test that bucket versioning is enabled"""
        bucket_name = outputs_data['artifacts_bucket']

        try:
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)

            assert 'Status' in response, "Versioning status not found"
            assert response['Status'] == 'Enabled', f"Versioning not enabled, status: {response.get('Status')}"
        except ClientError as e:
            if e.response['Error']['Code'] == 'AccessDenied':
                pytest.skip("No access to check bucket versioning")
            else:
                raise

class TestMonitoringResources:
    """Integration tests for monitoring and alerting resources"""

    @pytest.fixture(scope="class")
    def outputs_data(self):
        """Load deployment outputs"""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        return data[list(data.keys())[0]]

    @pytest.fixture(scope="class")
    def sns_client(self):
        """Create SNS client"""
        return boto3.client('sns', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def cloudwatch_client(self):
        """Create CloudWatch client"""
        return boto3.client('cloudwatch', region_name='us-east-1')

    def test_sns_topic_exists(self, outputs_data, sns_client):
        """Test that SNS topic exists"""
        topic_arn = outputs_data['sns_topic_arn']

        try:
            response = sns_client.get_topic_attributes(TopicArn=topic_arn)

            assert 'Attributes' in response, "Topic attributes not found"
            assert response['Attributes']['TopicArn'] == topic_arn, "Topic ARN mismatch"

        except ClientError as e:
            if e.response['Error']['Code'] == 'NotFound':
                pytest.fail(f"SNS topic {topic_arn} not found")
            else:
                raise

    def test_cloudwatch_alarms_exist(self, outputs_data, cloudwatch_client):
        """Test that CloudWatch alarms exist"""
        # Extract environment suffix from outputs
        stack_name = 'pr7248' if 'pr7248' in str(outputs_data) else 'test'

        response = cloudwatch_client.describe_alarms()

        alarms = response['MetricAlarms']
        alarm_names = [alarm['AlarmName'] for alarm in alarms]

        # Check for expected alarms
        alb_alarm_exists = any('alb-5xx' in name.lower() and 'v1' in name for name in alarm_names)
        blue_alarm_exists = any('blue-unhealthy' in name.lower() and 'v1' in name for name in alarm_names)
        green_alarm_exists = any('green-unhealthy' in name.lower() and 'v1' in name for name in alarm_names)

        assert alb_alarm_exists, "ALB 5XX alarm not found"
        assert blue_alarm_exists, "Blue unhealthy alarm not found"
        assert green_alarm_exists, "Green unhealthy alarm not found"

    def test_alarms_configured_with_sns(self, outputs_data, cloudwatch_client):
        """Test that CloudWatch alarms are configured with SNS actions"""
        topic_arn = outputs_data['sns_topic_arn']

        response = cloudwatch_client.describe_alarms()

        alarms = response['MetricAlarms']

        # Filter alarms for this deployment
        deployment_alarms = [alarm for alarm in alarms if 'v1' in alarm['AlarmName']]

        assert len(deployment_alarms) >= 3, "Expected at least 3 CloudWatch alarms"

        # Check that alarms have SNS actions
        for alarm in deployment_alarms:
            if 'bluegreen' in alarm['AlarmName'].lower():
                assert len(alarm.get('AlarmActions', [])) > 0, f"Alarm {alarm['AlarmName']} has no actions"
                assert topic_arn in alarm['AlarmActions'], f"Alarm {alarm['AlarmName']} not configured with SNS topic"

    def test_alb_5xx_alarm_configuration(self, outputs_data, cloudwatch_client):
        """Test ALB 5XX alarm configuration"""
        response = cloudwatch_client.describe_alarms()

        alarms = response['MetricAlarms']

        alb_alarms = [alarm for alarm in alarms
                     if 'alb-5xx' in alarm['AlarmName'].lower() and 'v1' in alarm['AlarmName']]

        assert len(alb_alarms) >= 1, "ALB 5XX alarm not found"

        alarm = alb_alarms[0]
        assert alarm['MetricName'] == 'HTTPCode_Target_5XX_Count', "Incorrect metric name"
        assert alarm['Namespace'] == 'AWS/ApplicationELB', "Incorrect namespace"
        assert alarm['Statistic'] == 'Sum', "Incorrect statistic"
        assert alarm['Threshold'] == 10, f"Incorrect threshold: {alarm['Threshold']}"
        assert alarm['ComparisonOperator'] == 'GreaterThanThreshold', "Incorrect comparison operator"


class TestResourceTags:
    """Integration tests for resource tagging"""

    @pytest.fixture(scope="class")
    def outputs_data(self):
        """Load deployment outputs"""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        return data[list(data.keys())[0]]

    @pytest.fixture(scope="class")
    def ec2_client(self):
        """Create EC2 client"""
        return boto3.client('ec2', region_name='us-east-1')

    def test_vpc_has_proper_tags(self, outputs_data, ec2_client):
        """Test that VPC has proper tags"""
        vpc_id = outputs_data['vpc_id']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        assert 'Name' in tags, "VPC missing Name tag"
        assert 'bluegreen' in tags['Name'].lower(), "VPC Name tag doesn't contain 'bluegreen'"
        assert 'v1' in tags['Name'], "VPC Name tag doesn't contain version 'v1'"

    def test_resources_have_environment_tags(self, outputs_data, ec2_client):
        """Test that resources have environment tags from default tags"""
        vpc_id = outputs_data['vpc_id']

        # Check VPC tags
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        # Should have default tags from AWS provider
        assert any(key in tags for key in ['Environment', 'ManagedBy', 'Project']), \
            "Missing default tags from AWS provider"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
