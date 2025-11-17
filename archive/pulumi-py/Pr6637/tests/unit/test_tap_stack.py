"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.
Tests validate resource creation, configuration, and relationships.
"""

import unittest
from unittest.mock import MagicMock, Mock, patch

import pulumi


def pulumi_mocks(call: pulumi.runtime.MockCallArgs):
    """Mock Pulumi resource calls for unit testing."""
    # Handle invokes
    if hasattr(call, 'token'):
        if call.token == 'aws:ec2/getAvailabilityZones:getAvailabilityZones':
            return {
                'names': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
                'state': 'available'
            }
        elif call.token == 'aws:iam/getPolicyDocument:getPolicyDocument':
            return {
                'json': '{"Version": "2012-10-17", "Statement": []}'
            }
        elif call.token == 'aws:ec2/getAmi:getAmi':
            return {'id': 'ami-latest'}
        return {}

    # Handle resources
    if call.typ == "aws:ec2/vpc:Vpc":
        return {"id": "vpc-12345", "cidrBlock": "10.0.0.0/16"}
    elif call.typ == "aws:ec2/subnet:Subnet":
        return {"id": f"subnet-{call.name}", "cidrBlock": "10.0.1.0/24"}
    elif call.typ == "aws:ec2/internetGateway:InternetGateway":
        return {"id": "igw-12345"}
    elif call.typ == "aws:ec2/routeTable:RouteTable":
        return {"id": f"rtb-{call.name}"}
    elif call.typ == "aws:ec2/route:Route":
        return {"id": f"route-{call.name}"}
    elif call.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
        return {"id": f"rtbassoc-{call.name}"}
    elif call.typ == "aws:ec2/securityGroup:SecurityGroup":
        return {"id": f"sg-{call.name}"}
    elif call.typ == "aws:s3/bucket:Bucket":
        return {"id": f"bucket-{call.name}", "bucket": call.name}
    elif call.typ == "aws:s3/bucketVersioning:BucketVersioning":
        return {"id": f"versioning-{call.name}"}
    elif call.typ == "aws:s3/bucketServerSideEncryptionConfiguration:BucketServerSideEncryptionConfiguration":
        return {"id": f"encryption-{call.name}"}
    elif call.typ == "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock":
        return {"id": f"public-access-block-{call.name}"}
    elif call.typ == "aws:iam/role:Role":
        return {"id": f"role-{call.name}", "arn": f"arn:aws:iam::123456789012:role/{call.name}"}
    elif call.typ == "aws:iam/rolePolicy:RolePolicy":
        return {"id": f"policy-{call.name}"}
    elif call.typ == "aws:iam/instanceProfile:InstanceProfile":
        return {"id": f"profile-{call.name}", "arn": f"arn:aws:iam::123456789012:instance-profile/{call.name}"}
    elif call.typ == "aws:rds/subnetGroup:SubnetGroup":
        return {"id": f"subnetgroup-{call.name}", "name": f"subnetgroup-{call.name}"}
    elif call.typ == "aws:rds/instance:Instance":
        return {
            "id": f"db-{call.name}",
            "endpoint": f"{call.name}.abc123.us-east-1.rds.amazonaws.com:3306",
            "address": f"{call.name}.abc123.us-east-1.rds.amazonaws.com"
        }
    elif call.typ == "aws:lb/loadBalancer:LoadBalancer":
        return {
            "id": f"alb-{call.name}",
            "arn": pulumi.Output.from_input(f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{call.name}/abc123"),
            "dnsName": f"{call.name}-123456789.us-east-1.elb.amazonaws.com"
        }
    elif call.typ == "aws:lb/targetGroup:TargetGroup":
        return {
            "id": f"tg-{call.name}",
            "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{call.name}/abc123"
        }
    elif call.typ == "aws:lb/listener:Listener":
        return {"id": f"listener-{call.name}"}
    elif call.typ == "aws:ec2/launchTemplate:LaunchTemplate":
        return {"id": f"lt-{call.name}"}
    elif call.typ == "aws:autoscaling/group:Group":
        return {"id": f"asg-{call.name}", "name": f"asg-{call.name}"}
    elif call.typ == "aws:cloudwatch/logGroup:LogGroup":
        return {"id": f"log-group-{call.name}", "arn": f"arn:aws:logs:us-east-1:123456789012:log-group:{call.name}"}
    elif call.typ == "aws:ec2/flowLog:FlowLog":
        return {"id": f"flow-log-{call.name}"}
    elif call.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
        return {"id": f"alarm-{call.name}"}
    return {}


class TestTapStack(unittest.TestCase):
    """Test TapStack component."""

    def setUp(self):
        """Set up mocks for each test."""
        # Mock AWS data sources
        self.az_patcher = patch('pulumi_aws.get_availability_zones')
        mock_azs = self.az_patcher.start()
        mock_azs.return_value = {
            'names': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
            'state': 'available'
        }

        # Set up Pulumi mocks
        def mock_new_resource(args):
            return f"{args.name}_id", {
                "id": f"{args.name}_id",
                "urn": f"urn:pulumi:test::test-project::{args.typ}::{args.name}"
            }

        class MockFuncs:
            def __init__(self, call_func, new_resource_func):
                self.call = call_func
                self.new_resource = new_resource_func

        mock_funcs = MockFuncs(pulumi_mocks, mock_new_resource)

        pulumi.runtime.set_mocks(mock_funcs)

        # Suppress deprecation warnings from Pulumi AWS provider
        import warnings
        warnings.filterwarnings("ignore", category=DeprecationWarning)

    def tearDown(self):
        """Clean up patches."""
        self.az_patcher.stop()

    @pulumi.runtime.test
    def test_stack_creation(self):
        """Test that TapStack creates successfully with required resources."""
        import os
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

        from lib.tap_stack import TapStack, TapStackArgs

        # Mock configuration
        with patch('pulumi.Config') as mock_config_cls, \
             patch('pulumi_aws.get_availability_zones') as mock_azs:
            mock_config = MagicMock()
            mock_config.require.side_effect = lambda k: {
                'ami_id': 'ami-0c02fb55956c7d316',
                'owner': 'test-owner',
                'cost_center': 'test-cc',
                'project': 'test-project'
            }.get(k, 'default')
            mock_config.require_secret.return_value = pulumi.Output.from_input('test-password')
            mock_config.get_secret.return_value = pulumi.Output.from_input('test-password')
            mock_config.get.return_value = None
            mock_config.get_int.return_value = None
            mock_config_cls.return_value = mock_config

            mock_az = MagicMock()
            mock_az.names = ['us-east-1a', 'us-east-1b', 'us-east-1c']
            mock_az.state = 'available'
            mock_azs.return_value = mock_az

            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix="test", tags={"Test": "value"})
            )

            # Validate basic stack creation
            self.assertEqual(stack.environment_suffix, "test")

        return True

    @pulumi.runtime.test
    def test_networking_resources(self):
        """Test networking resources are created correctly."""
        import os
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

        from lib.networking import NetworkingStack

        with patch('pulumi_aws.get_availability_zones') as mock_azs:
            mock_az = MagicMock()
            mock_az.names = ['us-east-1a', 'us-east-1b', 'us-east-1c']
            mock_az.state = 'available'
            mock_azs.return_value = mock_az

            networking = NetworkingStack(
                name="test-networking",
                environment_suffix="test",
                tags={"Environment": "test"},
                opts=None
            )

            # Validate VPC exists
            self.assertIsNotNone(networking.vpc)

            # Validate subnets
            self.assertEqual(len(networking.public_subnets), 3)
            self.assertEqual(len(networking.private_subnets), 3)

            # Validate security groups
            self.assertIsNotNone(networking.alb_sg)
            self.assertIsNotNone(networking.ec2_sg)
            self.assertIsNotNone(networking.rds_sg)

        return True

    def test_storage_resources(self):
        """Test storage resources are created correctly."""
        import os
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

        from lib.storage import StorageStack

        # Create storage stack without parent to avoid alias issues
        storage = StorageStack(
            name="test-storage",
            data_bucket_name="test-data-bucket",
            logs_bucket_name="test-logs-bucket",
            environment_suffix="test",
            tags={"Environment": "test"},
            opts=None  # No parent
        )

        # Validate buckets exist
        self.assertIsNotNone(storage.data_bucket)
        self.assertIsNotNone(storage.logs_bucket)

        # Validate encryption is enabled
        self.assertIsNotNone(storage.data_bucket_encryption)
        self.assertIsNotNone(storage.logs_bucket_encryption)

        # Validate public access is blocked
        self.assertIsNotNone(storage.data_bucket_public_access_block)
        self.assertIsNotNone(storage.logs_bucket_public_access_block)

    @pulumi.runtime.test
    def test_iam_resources(self):
        """Test IAM resources are created correctly."""
        import os
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

        from lib.iam import IAMStack

        iam = IAMStack(
            name="test-iam",
            data_bucket_arn=pulumi.Output.from_input("arn:aws:s3:::test-bucket"),
            logs_bucket_arn=pulumi.Output.from_input("arn:aws:s3:::test-logs"),
            environment_suffix="test",
            tags={"Environment": "test"},
            opts=None
        )

        # Validate IAM role exists
        self.assertIsNotNone(iam.ec2_role)

        # Validate policies exist
        self.assertIsNotNone(iam.s3_policy)
        self.assertIsNotNone(iam.cloudwatch_policy)

        # Validate instance profile exists
        self.assertIsNotNone(iam.instance_profile)

        return True

    @pulumi.runtime.test
    def test_database_resources(self):
        """Test database resources are created correctly."""
        import os
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

        from lib.database import DatabaseStack

        database = DatabaseStack(
            name="test-database",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2"),
                pulumi.Output.from_input("subnet-3")
            ],
            security_group_id=pulumi.Output.from_input("sg-12345"),
            db_name="testdb",
            db_username="admin",
            db_password=pulumi.Output.from_input("test-password"),
            instance_class="db.t3.medium",
            allocated_storage=100,
            environment_suffix="test",
            tags={"Environment": "test"},
            opts=None
        )

        # Validate RDS resources exist
        self.assertIsNotNone(database.subnet_group)
        self.assertIsNotNone(database.db_instance)

        return True

    @pulumi.runtime.test
    def test_web_tier_resources(self):
        """Test web tier resources are created correctly."""
        import os
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

        from lib.web_tier import WebTier, WebTierArgs

        web_tier_args = WebTierArgs(
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[
                pulumi.Output.from_input("subnet-pub-1"),
                pulumi.Output.from_input("subnet-pub-2"),
                pulumi.Output.from_input("subnet-pub-3")
            ],
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-priv-1"),
                pulumi.Output.from_input("subnet-priv-2"),
                pulumi.Output.from_input("subnet-priv-3")
            ],
            alb_security_group_id=pulumi.Output.from_input("sg-alb-12345"),
            ec2_security_group_id=pulumi.Output.from_input("sg-ec2-12345"),
            instance_profile_arn=pulumi.Output.from_input("arn:aws:iam::123456789012:instance-profile/test-profile"),
            ami_id="ami-0c02fb55956c7d316",
            instance_type="t3.medium",
            min_size=1,
            max_size=5,
            desired_capacity=2,
            environment_suffix="test",
            tags={"Environment": "test"}
        )

        web_tier = WebTier(
            name="test-web-tier",
            args=web_tier_args,
            opts=None
        )

        # Validate ALB exists
        self.assertIsNotNone(web_tier.alb)

        # Validate target group exists
        self.assertIsNotNone(web_tier.target_group)

        # Validate listener exists
        self.assertIsNotNone(web_tier.listener)

        # Validate launch template exists
        self.assertIsNotNone(web_tier.launch_template)

        # Validate ASG exists
        self.assertIsNotNone(web_tier.asg)

        return True

    @pulumi.runtime.test
    def test_monitoring_resources(self):
        """Test monitoring resources are created correctly."""
        import os
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

        from lib.monitoring import MonitoringStack

        monitoring = MonitoringStack(
            name="test-monitoring",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            alb_arn=pulumi.Output.from_input("arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/abc123"),
            rds_instance_id=pulumi.Output.from_input("db-test"),
            asg_name=pulumi.Output.from_input("asg-test"),
            logs_bucket_name=pulumi.Output.from_input("test-logs-bucket"),
            environment_suffix="test",
            tags={"Environment": "test"},
            opts=None
        )

        # Validate log group exists
        self.assertIsNotNone(monitoring.app_log_group)

        # Validate flow logs exist
        self.assertIsNotNone(monitoring.vpc_flow_log)

        return True

    @pulumi.runtime.test
    def test_web_tier_resources_without_ami(self):
        """Test web tier resources are created correctly when AMI is not provided."""
        import os
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

        from lib.web_tier import WebTier, WebTierArgs

        web_tier_args = WebTierArgs(
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[
                pulumi.Output.from_input("subnet-pub-1"),
                pulumi.Output.from_input("subnet-pub-2"),
                pulumi.Output.from_input("subnet-pub-3")
            ],
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-priv-1"),
                pulumi.Output.from_input("subnet-priv-2"),
                pulumi.Output.from_input("subnet-priv-3")
            ],
            alb_security_group_id=pulumi.Output.from_input("sg-alb-12345"),
            ec2_security_group_id=pulumi.Output.from_input("sg-ec2-12345"),
            instance_profile_arn=pulumi.Output.from_input("arn:aws:iam::123456789012:instance-profile/test-profile"),
            ami_id=None,  # AMI not provided, should trigger lookup
            instance_type="t3.medium",
            min_size=1,
            max_size=5,
            desired_capacity=2,
            environment_suffix="test",
            tags={"Environment": "test"}
        )

        web_tier = WebTier(
            name="test-web-tier-no-ami",
            args=web_tier_args,
            opts=None
        )

        # Validate ALB exists
        self.assertIsNotNone(web_tier.alb)

        # Validate target group exists
        self.assertIsNotNone(web_tier.target_group)

        # Validate listener exists
        self.assertIsNotNone(web_tier.listener)

        # Validate launch template exists
        self.assertIsNotNone(web_tier.launch_template)

        # Validate ASG exists
        self.assertIsNotNone(web_tier.asg)

        return True
