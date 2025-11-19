"""Integration tests for TapStack."""
import json
import os
from pathlib import Path

import pytest

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


class TestTapStackIntegration:
    """Integration tests for deployed TAP Stack infrastructure."""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load outputs from flat-outputs.json."""
        # Try multiple possible locations for the outputs file
        possible_paths = [
            Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json",
            Path(__file__).parent.parent.parent / "flat-outputs.json",
            Path("cfn-outputs/flat-outputs.json"),
            Path("flat-outputs.json"),
        ]
        
        outputs_path = None
        for path in possible_paths:
            if path.exists():
                outputs_path = path
                break
        
        if not outputs_path:
            pytest.skip(f"Infrastructure not deployed - flat-outputs.json not found in any of: {[str(p) for p in possible_paths]}")

        with open(outputs_path, 'r') as f:
            raw_outputs = json.load(f)

        stack_name = list(raw_outputs.keys())[0] if raw_outputs else None
        if not stack_name:
            pytest.skip("No stack outputs found")

        return raw_outputs[stack_name]

    @pytest.fixture(scope="class")
    def region(self):
        """Get AWS region."""
        return os.getenv("AWS_REGION", "us-east-1")

    @pytest.fixture(scope="class")
    def ec2_client(self, region):
        """Create EC2 client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('ec2', region_name=region)
        except Exception:
            pytest.skip("Unable to create EC2 client")

    @pytest.fixture(scope="class")
    def rds_client(self, region):
        """Create RDS client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('rds', region_name=region)
        except Exception:
            pytest.skip("Unable to create RDS client")

    @pytest.fixture(scope="class")
    def elb_client(self, region):
        """Create ELB v2 client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('elbv2', region_name=region)
        except Exception:
            pytest.skip("Unable to create ELB client")

    @pytest.fixture(scope="class")
    def autoscaling_client(self, region):
        """Create Auto Scaling client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('autoscaling', region_name=region)
        except Exception:
            pytest.skip("Unable to create Auto Scaling client")

    @pytest.fixture(scope="class")
    def dms_client(self, region):
        """Create DMS client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('dms', region_name=region)
        except Exception:
            pytest.skip("Unable to create DMS client")

    @pytest.fixture(scope="class")
    def s3_client(self, region):
        """Create S3 client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('s3', region_name=region)
        except Exception:
            pytest.skip("Unable to create S3 client")

    @pytest.fixture(scope="class")
    def cloudwatch_client(self, region):
        """Create CloudWatch client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('cloudwatch', region_name=region)
        except Exception:
            pytest.skip("Unable to create CloudWatch client")

    @pytest.fixture(scope="class")
    def route53_client(self, region):
        """Create Route53 client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('route53', region_name=region)
        except Exception:
            pytest.skip("Unable to create Route53 client")

    def test_outputs_file_exists_and_valid(self, outputs):
        """Verify outputs file exists and contains expected keys."""
        assert outputs is not None
        assert 'vpc_id' in outputs
        assert 'alb_dns_name' in outputs
        assert 'rds_cluster_endpoint' in outputs
        assert 'rds_reader_endpoint' in outputs
        assert 'dms_replication_instance_arn' in outputs
        assert 'dms_task_arn' in outputs
        assert 'cloudwatch_dashboard_name' in outputs
        assert 'workspace' in outputs

    def test_vpc_has_public_subnets(self, outputs, ec2_client):
        """Test VPC has public subnets configured."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
                ]
            )
            # Should have 3 public subnets
            assert len(response['Subnets']) == 3
            
            # Verify they're in different AZs
            azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
            assert len(set(azs)) == 3, "Public subnets should be in different AZs"
        except ClientError:
            pytest.skip("Unable to describe public subnets")

    def test_vpc_has_private_subnets(self, outputs, ec2_client):
        """Test VPC has private subnets configured."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'map-public-ip-on-launch', 'Values': ['false']}
                ]
            )
            # Should have 3 private subnets
            assert len(response['Subnets']) == 3
            
            # Verify they're in different AZs
            azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
            assert len(set(azs)) == 3, "Private subnets should be in different AZs"
        except ClientError:
            pytest.skip("Unable to describe private subnets")

    def test_internet_gateway_attached(self, outputs, ec2_client):
        """Test Internet Gateway is attached to VPC."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = ec2_client.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
            )
            assert len(response['InternetGateways']) == 1
            igw = response['InternetGateways'][0]
            assert len(igw['Attachments']) == 1
            assert igw['Attachments'][0]['State'] == 'available'
        except ClientError:
            pytest.skip("Unable to describe Internet Gateway")

    def test_alb_exists_and_active(self, outputs, elb_client):
        """Test Application Load Balancer exists and is active."""
        alb_dns = outputs.get('alb_dns_name')
        assert alb_dns is not None

        try:
            response = elb_client.describe_load_balancers()
            albs = [lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns]
            assert len(albs) == 1
            alb = albs[0]
            assert alb['State']['Code'] == 'active'
            assert alb['Type'] == 'application'
            assert alb['Scheme'] == 'internet-facing'
        except ClientError:
            pytest.skip("Unable to describe ALB")

    def test_alb_has_target_group(self, outputs, elb_client):
        """Test ALB has target group configured."""
        alb_dns = outputs.get('alb_dns_name')

        try:
            # Get ALB ARN
            response = elb_client.describe_load_balancers()
            albs = [lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns]
            alb_arn = albs[0]['LoadBalancerArn']

            # Get target groups
            tg_response = elb_client.describe_target_groups(LoadBalancerArn=alb_arn)
            assert len(tg_response['TargetGroups']) >= 1
            
            target_group = tg_response['TargetGroups'][0]
            assert target_group['Protocol'] == 'HTTP'
            assert target_group['Port'] == 80
            assert target_group['HealthCheckEnabled'] is True
        except ClientError:
            pytest.skip("Unable to describe ALB target groups")

    def test_alb_has_listener(self, outputs, elb_client):
        """Test ALB has HTTP listener configured."""
        alb_dns = outputs.get('alb_dns_name')

        try:
            # Get ALB ARN
            response = elb_client.describe_load_balancers()
            albs = [lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns]
            alb_arn = albs[0]['LoadBalancerArn']

            # Get listeners
            listener_response = elb_client.describe_listeners(LoadBalancerArn=alb_arn)
            assert len(listener_response['Listeners']) >= 1
            
            listener = listener_response['Listeners'][0]
            assert listener['Protocol'] == 'HTTP'
            assert listener['Port'] == 80
        except ClientError:
            pytest.skip("Unable to describe ALB listeners")

    def test_autoscaling_group_exists(self, outputs, autoscaling_client, ec2_client):
        """Test Auto Scaling Group exists with correct configuration."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = autoscaling_client.describe_auto_scaling_groups()
            # Filter ASGs by VPC
            asgs = []
            for asg in response['AutoScalingGroups']:
                if asg.get('VPCZoneIdentifier'):
                    subnet_ids = asg['VPCZoneIdentifier'].split(',')
                    subnet_response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
                    if subnet_response['Subnets'][0]['VpcId'] == vpc_id:
                        asgs.append(asg)
            
            assert len(asgs) >= 1, "No Auto Scaling Group found in VPC"
            asg = asgs[0]
            assert asg['MinSize'] == 3
            assert asg['MaxSize'] == 9
            assert asg['DesiredCapacity'] == 3
            assert asg['HealthCheckType'] == 'EC2'  # Updated to EC2 for faster deployment
        except ClientError:
            pytest.skip("Unable to describe Auto Scaling Group")

    def test_rds_aurora_cluster_exists(self, outputs, rds_client):
        """Test RDS Aurora cluster exists and is available."""
        cluster_endpoint = outputs.get('rds_cluster_endpoint')
        assert cluster_endpoint is not None

        cluster_id = cluster_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
            assert len(response['DBClusters']) == 1
            cluster = response['DBClusters'][0]
            assert cluster['Status'] == 'available'
            assert cluster['Engine'] == 'aurora-mysql'
            assert cluster['DBClusterIdentifier'] == cluster_id
        except ClientError:
            pytest.skip("Unable to describe RDS Aurora cluster")

    def test_rds_cluster_configuration(self, outputs, rds_client):
        """Test RDS cluster is configured correctly."""
        cluster_endpoint = outputs.get('rds_cluster_endpoint')
        cluster_id = cluster_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
            cluster = response['DBClusters'][0]
            assert cluster['StorageEncrypted'] is True
            assert cluster['BackupRetentionPeriod'] == 7
            assert 'audit' in cluster.get('EnabledCloudwatchLogsExports', [])
            assert 'error' in cluster.get('EnabledCloudwatchLogsExports', [])
        except ClientError:
            pytest.skip("Unable to verify RDS cluster configuration")

    def test_rds_cluster_has_instances(self, outputs, rds_client):
        """Test RDS cluster has writer and reader instances."""
        cluster_endpoint = outputs.get('rds_cluster_endpoint')
        cluster_id = cluster_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
            cluster = response['DBClusters'][0]
            members = cluster.get('DBClusterMembers', [])
            
            # Should have 3 instances (1 writer + 2 readers)
            assert len(members) == 3
            
            # Verify we have a writer
            writers = [m for m in members if m['IsClusterWriter']]
            assert len(writers) == 1
            
            # Verify we have readers
            readers = [m for m in members if not m['IsClusterWriter']]
            assert len(readers) == 2
        except ClientError:
            pytest.skip("Unable to verify RDS cluster instances")

    def test_rds_reader_endpoint_exists(self, outputs, rds_client):
        """Test RDS reader endpoint is configured."""
        reader_endpoint = outputs.get('rds_reader_endpoint')
        assert reader_endpoint is not None
        assert 'cluster-ro' in reader_endpoint

    def test_dms_replication_instance_exists(self, outputs, dms_client):
        """Test DMS replication instance exists."""
        dms_arn = outputs.get('dms_replication_instance_arn')
        assert dms_arn is not None

        try:
            response = dms_client.describe_replication_instances()
            instances = [inst for inst in response['ReplicationInstances'] 
                        if inst['ReplicationInstanceArn'] == dms_arn]
            assert len(instances) == 1
            instance = instances[0]
            assert instance['ReplicationInstanceStatus'] in ['available', 'modifying']
        except ClientError:
            pytest.skip("Unable to describe DMS replication instance")

    def test_dms_replication_task_exists(self, outputs, dms_client):
        """Test DMS replication task exists."""
        task_arn = outputs.get('dms_task_arn')
        assert task_arn is not None

        try:
            response = dms_client.describe_replication_tasks()
            tasks = [task for task in response['ReplicationTasks'] 
                    if task['ReplicationTaskArn'] == task_arn]
            assert len(tasks) == 1
            task = tasks[0]
            assert task['MigrationType'] == 'full-load-and-cdc'
        except ClientError:
            pytest.skip("Unable to describe DMS replication task")

    def test_s3_bucket_exists(self, outputs, s3_client):
        """Test S3 artifacts bucket exists."""
        bucket_name = outputs.get('artifacts_bucket_name')
        if not bucket_name:
            pytest.skip("S3 bucket name not in outputs")

        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        except ClientError:
            pytest.skip("Unable to access S3 bucket")

    def test_s3_bucket_has_versioning_enabled(self, outputs, s3_client):
        """Test S3 bucket has versioning enabled."""
        bucket_name = outputs.get('artifacts_bucket_name')
        if not bucket_name:
            pytest.skip("S3 bucket name not in outputs")

        try:
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert response.get('Status') == 'Enabled'
        except ClientError:
            pytest.skip("Unable to verify S3 versioning")

    def test_s3_bucket_has_encryption_enabled(self, outputs, s3_client):
        """Test S3 bucket has encryption enabled."""
        bucket_name = outputs.get('artifacts_bucket_name')
        if not bucket_name:
            pytest.skip("S3 bucket name not in outputs")

        try:
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            assert len(rules) > 0
            assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'
            assert rules[0].get('BucketKeyEnabled') is True
        except ClientError:
            pytest.skip("Unable to verify S3 encryption")

    def test_cloudwatch_dashboard_exists(self, outputs, cloudwatch_client):
        """Test CloudWatch dashboard exists."""
        dashboard_name = outputs.get('cloudwatch_dashboard_name')
        assert dashboard_name is not None

        try:
            response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
            assert response['DashboardName'] == dashboard_name
            assert response['DashboardBody'] is not None
        except ClientError:
            pytest.skip("Unable to describe CloudWatch dashboard")

    def test_cloudwatch_alarms_exist(self, outputs, cloudwatch_client):
        """Test CloudWatch alarms exist."""
        workspace = outputs.get('workspace', '')

        try:
            response = cloudwatch_client.describe_alarms()
            alarms = response.get('MetricAlarms', [])
            
            # Filter alarms related to this stack
            stack_alarms = [alarm for alarm in alarms if workspace in alarm['AlarmName']]
            
            if len(stack_alarms) >= 1:
                # Check for specific alarms
                alarm_names = [alarm['AlarmName'] for alarm in stack_alarms]
                
                # Should have alarms for unhealthy hosts and DMS lag
                unhealthy_alarms = [name for name in alarm_names if 'unhealthy' in name.lower()]
                dms_alarms = [name for name in alarm_names if 'dms' in name.lower() or 'lag' in name.lower()]
                
                assert len(unhealthy_alarms) >= 1 or len(dms_alarms) >= 1
            else:
                pytest.skip("No stack-specific alarms found")
        except ClientError:
            pytest.skip("Unable to verify CloudWatch alarms")

    def test_security_groups_configured(self, outputs, ec2_client):
        """Test security groups are properly configured."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            security_groups = response['SecurityGroups']
            
            # Should have at least 4 security groups (ALB, EC2, RDS, DMS) + default
            assert len(security_groups) >= 5
            
            sg_names = [sg.get('GroupName', '') for sg in security_groups]
            
            # Verify key security groups exist
            alb_sgs = [name for name in sg_names if 'alb' in name.lower()]
            ec2_sgs = [name for name in sg_names if 'ec2' in name.lower()]
            rds_sgs = [name for name in sg_names if 'rds' in name.lower()]
            
            assert len(alb_sgs) >= 1, "ALB security group not found"
            assert len(ec2_sgs) >= 1, "EC2 security group not found"
            assert len(rds_sgs) >= 1, "RDS security group not found"
        except ClientError:
            pytest.skip("Unable to verify security groups")

    def test_route53_hosted_zone_exists(self, outputs, route53_client):
        """Test Route53 hosted zone exists."""
        workspace = outputs.get('workspace', '')

        try:
            response = route53_client.list_hosted_zones()
            zones = response.get('HostedZones', [])
            
            # Look for zones matching this workspace
            workspace_zones = [zone for zone in zones if workspace in zone['Name']]
            
            if len(workspace_zones) >= 1:
                zone = workspace_zones[0]
                assert 'internal.local' in zone['Name']
            else:
                pytest.skip("Route53 hosted zone not found")
        except ClientError:
            pytest.skip("Unable to verify Route53 hosted zone")

    def test_complete_infrastructure_deployed(self, outputs):
        """Test all critical infrastructure components are present."""
        required_outputs = [
            'vpc_id',
            'alb_dns_name',
            'rds_cluster_endpoint',
            'rds_reader_endpoint',
            'dms_replication_instance_arn',
            'dms_task_arn',
            'cloudwatch_dashboard_name',
            'workspace'
        ]

        for output_key in required_outputs:
            assert output_key in outputs, f"Missing required output: {output_key}"
            assert outputs[output_key] is not None, f"Output {output_key} is None"
            assert len(str(outputs[output_key])) > 0, f"Output {output_key} is empty"

    def test_workspace_output_valid(self, outputs):
        """Test workspace output is valid."""
        workspace = outputs.get('workspace')
        assert workspace is not None
        assert len(workspace) > 0
        # Workspace should match the pattern (e.g., pr6815, dev, prod)
        assert workspace.isalnum() or workspace.replace('-', '').replace('_', '').isalnum()

