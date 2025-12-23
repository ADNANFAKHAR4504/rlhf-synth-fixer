import os
import sys
import unittest
from unittest.mock import Mock, patch, MagicMock

# Set environment variable for Pulumi testing
os.environ["PULUMI_TEST_MODE"] = "true"


class MockComponentResource:
    def __init__(self, type_name, name, props=None, opts=None):
        self.type_name = type_name
        self.name = name
        self.props = props
        self.opts = opts
        self.outputs = None

    def register_outputs(self, outputs):
        self.outputs = outputs


class MockOutput:
    """Mock Pulumi Output"""

    def __init__(self, value=None):
        self.value = value

    @staticmethod
    def from_input(value):
        mock = Mock()
        mock.apply = Mock(return_value=value)
        return mock

    @staticmethod
    def all(*args):
        mock_result = Mock()
        mock_result.apply = Mock(return_value=Mock())
        return mock_result

    @staticmethod
    def concat(*args):
        return Mock()


class TestComponents(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up class-level mocks"""
        # Mock Pulumi modules
        cls.mock_pulumi = Mock()
        cls.mock_pulumi.ComponentResource = MockComponentResource
        cls.mock_pulumi.ResourceOptions = Mock
        cls.mock_pulumi.Output = MockOutput
        cls.mock_pulumi.AssetArchive = Mock()
        cls.mock_pulumi.FileArchive = Mock()
        cls.mock_pulumi.StringAsset = Mock()
        cls.mock_pulumi.get_stack = Mock(return_value="test")
        cls.mock_pulumi.log = Mock()
        cls.mock_pulumi.log.info = Mock()
        cls.mock_pulumi.export = Mock()

        # Mock AWS modules
        cls.mock_aws = Mock()
        cls.mock_aws.get_region.return_value = Mock(name="us-east-1")
        cls.mock_aws.get_availability_zones.return_value = Mock(
            names=["us-east-1a", "us-east-1b"]
        )
        cls.mock_aws.get_caller_identity.return_value = Mock(account_id="123456789012")

        # Mock AWS resource classes
        cls.mock_aws.ec2 = Mock()
        cls.mock_aws.iam = Mock()
        cls.mock_aws.s3 = Mock()
        cls.mock_aws.dynamodb = Mock()
        cls.mock_aws.lambda_ = Mock()
        cls.mock_aws.cloudwatch = Mock()
        cls.mock_aws.sns = Mock()
        cls.mock_aws.lb = Mock()

        # Apply module patches
        sys.modules["pulumi"] = cls.mock_pulumi
        sys.modules["pulumi_aws"] = cls.mock_aws

    def setUp(self):
        """Set up test environment for each test"""
        # Clear any existing imports to ensure clean state
        modules_to_clear = [m for m in sys.modules if m.startswith("lib.")]
        for module in modules_to_clear:
            if module in sys.modules:
                del sys.modules[module]

    # ===== IAM Component Tests =====
    def test_iam_component_initialization(self):
        """Test IAM component creates roles and policies"""
        from lib.components.iam import IAMComponent

        # Create mock resources
        mock_role = Mock()
        mock_role.id = "test-role-id"
        mock_role.name = "test-role"
        mock_role.arn = "arn:aws:iam::123456789012:role/test-role"

        mock_policy = Mock()
        mock_profile = Mock()
        mock_profile.name = "test-profile"

        self.mock_aws.iam.Role = Mock(return_value=mock_role)
        self.mock_aws.iam.RolePolicy = Mock(return_value=mock_policy)
        self.mock_aws.iam.InstanceProfile = Mock(return_value=mock_profile)

        # Create component
        component = IAMComponent(
            "test-iam", environment="dev", tags={"Environment": "dev"}
        )

        # Verify resources were created
        self.assertIsNotNone(component.instance_role)
        self.assertIsNotNone(component.lambda_role)
        self.assertIsNotNone(component.backup_role)
        self.assertIsNotNone(component.instance_profile)

    # ===== Storage Component Tests =====
    def test_storage_component_creates_bucket(self):
        """Test storage component creates S3 bucket with encryption"""
        from lib.components.storage import StorageComponent

        mock_bucket = Mock()
        mock_bucket.bucket = "test-bucket"
        mock_bucket.id = "test-bucket"
        # Mock arn with apply method for Pulumi Output
        mock_arn = Mock()
        mock_arn.apply = Mock(return_value="arn:aws:s3:::test-bucket")
        mock_bucket.arn = mock_arn

        self.mock_aws.s3.Bucket = Mock(return_value=mock_bucket)
        self.mock_aws.s3.BucketServerSideEncryptionConfigurationV2 = Mock()
        self.mock_aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs = Mock
        self.mock_aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs = Mock
        self.mock_aws.s3.BucketVersioningV2 = Mock()
        self.mock_aws.s3.BucketVersioningV2VersioningConfigurationArgs = Mock
        self.mock_aws.s3.BucketPublicAccessBlock = Mock()
        self.mock_aws.s3.BucketPolicy = Mock()

        component = StorageComponent(
            "test-storage", environment="dev", tags={"Environment": "dev"}
        )

        self.assertIsNotNone(component.bucket)
        self.assertEqual(component.bucket.bucket, "test-bucket")

    # ===== Database Component Tests =====
    @patch.dict(os.environ, {"PROVIDER": ""})
    def test_database_component_with_pitr(self):
        """Test database component creates DynamoDB table with PITR"""
        from lib.components.database import DatabaseComponent

        mock_table = Mock()
        mock_table.name = "test-table"
        mock_table.arn = "arn:aws:dynamodb:us-east-1:123456789012:table/test-table"

        self.mock_aws.dynamodb.Table = Mock(return_value=mock_table)
        self.mock_aws.dynamodb.TableAttributeArgs = Mock
        self.mock_aws.dynamodb.TableGlobalSecondaryIndexArgs = Mock
        self.mock_aws.dynamodb.TablePointInTimeRecoveryArgs = Mock

        component = DatabaseComponent(
            "test-db", environment="dev", tags={"Environment": "dev"}
        )

        self.assertIsNotNone(component.table)
        self.assertEqual(component.table.name, "test-table")

    @patch.dict(os.environ, {"PROVIDER": "localstack"})
    def test_database_component_localstack_skips_pitr(self):
        """Test database component skips PITR in LocalStack"""
        from lib.components.database import DatabaseComponent

        mock_table = Mock()
        mock_table.name = "test-table"

        self.mock_aws.dynamodb.Table = Mock(return_value=mock_table)
        self.mock_aws.dynamodb.TableAttributeArgs = Mock
        self.mock_aws.dynamodb.TableGlobalSecondaryIndexArgs = Mock

        component = DatabaseComponent(
            "test-db", environment="dev", tags={"Environment": "dev"}
        )

        self.assertIsNotNone(component.table)
        # Verify log.info was called for LocalStack message
        self.mock_pulumi.log.info.assert_called()

    # ===== Serverless Component Tests =====
    def test_serverless_component_creates_lambda(self):
        """Test serverless component creates Lambda function"""
        from lib.components.serverless import ServerlessComponent

        mock_lambda = Mock()
        mock_lambda.name = "test-lambda"
        mock_lambda.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"

        self.mock_aws.lambda_.Function = Mock(return_value=mock_lambda)

        component = ServerlessComponent(
            "test-serverless",
            environment="dev",
            tags={"Environment": "dev"},
            lambda_role_arn="arn:aws:iam::123456789012:role/test-role",
        )

        self.assertIsNotNone(component.lambda_function)
        self.assertEqual(component.lambda_function.name, "test-lambda")

    # ===== Monitoring Component Tests =====
    @patch.dict(os.environ, {"PROVIDER": ""})
    def test_monitoring_component_with_email_subscription(self):
        """Test monitoring component creates SNS with email subscription"""
        from lib.components.monitoring import MonitoringComponent

        mock_topic = Mock()
        mock_topic.arn = "arn:aws:sns:us-east-1:123456789012:test-topic"

        mock_subscription = Mock()
        mock_alarm = Mock()
        mock_alarm.name = "test-alarm"

        self.mock_aws.sns.Topic = Mock(return_value=mock_topic)
        self.mock_aws.sns.TopicSubscription = Mock(return_value=mock_subscription)
        self.mock_aws.cloudwatch.MetricAlarm = Mock(return_value=mock_alarm)

        mock_instance = Mock()
        mock_instance._name = "test-instance"
        mock_instance.id = "i-12345678"

        component = MonitoringComponent(
            "test-monitoring",
            instances=[mock_instance],
            tags={"Environment": "dev"},
            notification_email="test@example.com",
        )

        self.assertIsNotNone(component.sns_topic)
        self.assertIsNotNone(component.sns_subscription)
        self.assertTrue(len(component.alarms) > 0)

    @patch.dict(os.environ, {"PROVIDER": "localstack"})
    def test_monitoring_component_localstack_skips_email(self):
        """Test monitoring component skips email subscription in LocalStack"""
        from lib.components.monitoring import MonitoringComponent

        mock_topic = Mock()
        mock_topic.arn = "arn:aws:sns:us-east-1:123456789012:test-topic"

        mock_alarm = Mock()
        mock_alarm.name = "test-alarm"

        self.mock_aws.sns.Topic = Mock(return_value=mock_topic)
        self.mock_aws.cloudwatch.MetricAlarm = Mock(return_value=mock_alarm)

        mock_instance = Mock()
        mock_instance._name = "test-instance"
        mock_instance.id = "i-12345678"

        component = MonitoringComponent(
            "test-monitoring",
            instances=[mock_instance],
            tags={"Environment": "dev"},
            notification_email="test@example.com",
        )

        self.assertIsNotNone(component.sns_topic)
        self.assertIsNone(component.sns_subscription)
        # Verify log.info was called for LocalStack message
        self.mock_pulumi.log.info.assert_called()

    # ===== Compute Component Tests =====
    def test_compute_component_creates_vpc_and_resources(self):
        """Test compute component creates VPC, subnets, and EC2 instances"""
        from lib.components.compute import ComputeComponent

        # Mock all required resources
        mock_vpc = Mock()
        mock_vpc.id = "vpc-123"

        mock_igw = Mock()
        mock_subnet = Mock()
        mock_subnet.id = "subnet-123"

        mock_eip = Mock()
        mock_nat = Mock()
        mock_route_table = Mock()
        mock_route_table.id = "rtb-123"

        mock_sg = Mock()
        mock_sg.id = "sg-123"

        mock_instance = Mock()
        mock_instance.id = "i-123"

        mock_tg = Mock()
        mock_tg.arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/123"

        mock_alb = Mock()
        mock_alb.dns_name = "test-alb.us-east-1.elb.amazonaws.com"
        mock_alb.arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test/123"

        # Set up mocks
        self.mock_aws.ec2.Vpc = Mock(return_value=mock_vpc)
        self.mock_aws.ec2.InternetGateway = Mock(return_value=mock_igw)
        self.mock_aws.ec2.Subnet = Mock(return_value=mock_subnet)
        self.mock_aws.ec2.Eip = Mock(return_value=mock_eip)
        self.mock_aws.ec2.NatGateway = Mock(return_value=mock_nat)
        self.mock_aws.ec2.RouteTable = Mock(return_value=mock_route_table)
        self.mock_aws.ec2.Route = Mock()
        self.mock_aws.ec2.RouteTableAssociation = Mock()
        self.mock_aws.ec2.SecurityGroup = Mock(return_value=mock_sg)
        self.mock_aws.ec2.SecurityGroupRule = Mock()
        self.mock_aws.ec2.Instance = Mock(return_value=mock_instance)
        self.mock_aws.lb.TargetGroup = Mock(return_value=mock_tg)
        self.mock_aws.lb.TargetGroupAttachment = Mock()
        self.mock_aws.lb.LoadBalancer = Mock(return_value=mock_alb)
        self.mock_aws.lb.Listener = Mock()

        component = ComputeComponent(
            "test-compute",
            environment="dev",
            tags={"Environment": "dev"},
            instance_profile="test-profile",
        )

        self.assertIsNotNone(component.vpc)
        self.assertEqual(component.vpc.id, "vpc-123")
        self.assertTrue(len(component.public_subnets) > 0)
        self.assertTrue(len(component.ec2_instances) > 0)
        self.assertIsNotNone(component.alb)


if __name__ == "__main__":
    unittest.main(verbosity=2, buffer=True)
