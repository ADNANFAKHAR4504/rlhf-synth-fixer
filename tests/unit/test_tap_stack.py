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
            "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{call.name}/abc123",
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
    return {}


class TestTapStack(unittest.TestCase):
    """Test TapStack component resource."""

    def test_stack_creation(self):
        """Test that TapStack creates successfully with required resources."""
        import os
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

        def check_stack(args):
            from lib.tap_stack import TapStack, TapStackArgs

            # Mock configuration
            with patch('pulumi.Config') as mock_config_cls:
                mock_config = MagicMock()
                mock_config.require.side_effect = lambda k: {
                    'ami_id': 'ami-12345678',
                    'owner': 'test-owner',
                    'cost_center': 'test-cc',
                    'project': 'test-project'
                }.get(k, 'default')
                mock_config.require_secret.return_value = pulumi.Output.from_input('test-password')
                mock_config.get.return_value = None
                mock_config.get_int.return_value = None
                mock_config_cls.return_value = mock_config

                stack = TapStack(
                    name="test-stack",
                    args=TapStackArgs(environment_suffix="test")
                )

                return {
                    'environment_suffix': stack.environment_suffix,
                }

        result = pulumi.Output.all().apply(check_stack)
        return result

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


if __name__ == '__main__':
    # Mock AWS data sources
    with patch('pulumi_aws.get_availability_zones') as mock_azs:
        mock_azs.return_value = {
            'names': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
            'state': 'available'
        }

        # Set up Pulumi mocks
        def mock_new_resource(args):
            return {
                "id": f"{args.name}_id",
                "urn": f"urn:pulumi:test::test-project::{args.typ}::{args.name}"
            }

        pulumi.runtime.set_mocks(
            pulumi.runtime.Mocks(
                call=pulumi_mocks,
                new_resource=mock_new_resource
            )
        )

        # Suppress deprecation warnings from Pulumi AWS provider
        import warnings
        warnings.filterwarnings("ignore", category=DeprecationWarning)

        unittest.main()
