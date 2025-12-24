import os
import sys
import tempfile
import zipfile
import unittest
from unittest.mock import Mock, patch, MagicMock, mock_open

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

    def _setup_compute_mocks(self):
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
    @patch('os.path.exists')
    def test_database_component_with_pitr(self, mock_exists):
        """Test database component creates DynamoDB table with PITR"""
        from lib.components.database import DatabaseComponent

        # Mock metadata.json doesn't exist, so it falls back to env var
        mock_exists.return_value = False

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
    @patch('os.path.exists')
    def test_database_component_localstack_skips_pitr(self, mock_exists):
        """Test database component skips PITR in LocalStack"""
        from lib.components.database import DatabaseComponent

        # Mock metadata.json doesn't exist, so it falls back to env var
        mock_exists.return_value = False

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

    @patch.dict(os.environ, {"PROVIDER": ""})
    @patch('builtins.open', new_callable=mock_open, read_data='{"provider": "aws"}')
    @patch('os.path.exists')
    def test_database_component_reads_metadata_file(self, mock_exists, mock_file):
        from lib.components.database import DatabaseComponent

        mock_exists.return_value = True

        mock_table = Mock()
        mock_table.name = "test-table"

        self.mock_aws.dynamodb.Table = Mock(return_value=mock_table)
        self.mock_aws.dynamodb.TableAttributeArgs = Mock
        self.mock_aws.dynamodb.TableGlobalSecondaryIndexArgs = Mock
        self.mock_aws.dynamodb.TablePointInTimeRecoveryArgs = Mock

        DatabaseComponent("test-db", environment="dev", tags={"Environment": "dev"})

        _, kwargs = self.mock_aws.dynamodb.Table.call_args
        self.assertIn("point_in_time_recovery", kwargs)

    @patch.dict(os.environ, {"PROVIDER": "localstack"})
    @patch('builtins.open', side_effect=OSError("boom"))
    @patch('os.path.exists')
    def test_database_component_metadata_read_error_falls_back_to_env(self, mock_exists, mock_file):
        from lib.components.database import DatabaseComponent

        mock_exists.return_value = True

        mock_table = Mock()
        mock_table.name = "test-table"

        self.mock_aws.dynamodb.Table = Mock(return_value=mock_table)
        self.mock_aws.dynamodb.TableAttributeArgs = Mock
        self.mock_aws.dynamodb.TableGlobalSecondaryIndexArgs = Mock
        self.mock_aws.dynamodb.TableGlobalSecondaryIndexArgs = Mock

        DatabaseComponent("test-db", environment="dev", tags={"Environment": "dev"})
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

    def test_zip_directory_contents_skips_hidden_files(self):
        from lib.components.serverless import zip_directory_contents

        with tempfile.TemporaryDirectory() as tmpdir:
            src = os.path.join(tmpdir, "src")
            os.makedirs(src, exist_ok=True)
            with open(os.path.join(src, ".hidden"), "w", encoding="utf-8") as f:
                f.write("secret")
            with open(os.path.join(src, "visible.txt"), "w", encoding="utf-8") as f:
                f.write("ok")

            out_zip = os.path.join(tmpdir, "out.zip")
            zip_directory_contents(src, out_zip)

            with zipfile.ZipFile(out_zip, "r") as zf:
                names = set(zf.namelist())
            self.assertIn("visible.txt", names)
            self.assertNotIn(".hidden", names)

    @patch('lib.components.serverless.zip_directory_contents')
    @patch('os.path.exists', return_value=False)
    def test_serverless_component_raises_when_zip_missing(self, mock_exists, mock_zip):
        from lib.components.serverless import ServerlessComponent

        self.mock_aws.lambda_.Function = Mock()

        with self.assertRaises(FileNotFoundError):
            ServerlessComponent(
                "test-serverless",
                environment="dev",
                tags={"Environment": "dev"},
                lambda_role_arn="arn:aws:iam::123456789012:role/test-role",
            )

    # ===== Monitoring Component Tests =====
    @patch.dict(os.environ, {"PROVIDER": ""})
    @patch('os.path.exists')
    def test_monitoring_component_with_email_subscription(self, mock_exists):
        """Test monitoring component creates SNS with email subscription"""
        from lib.components.monitoring import MonitoringComponent

        # Mock metadata.json doesn't exist, so it falls back to env var
        mock_exists.return_value = False

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
    @patch('os.path.exists')
    def test_monitoring_component_localstack_skips_email(self, mock_exists):
        """Test monitoring component skips email subscription in LocalStack"""
        from lib.components.monitoring import MonitoringComponent

        # Mock metadata.json doesn't exist, so it falls back to env var
        mock_exists.return_value = False

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

    @patch.dict(os.environ, {"PROVIDER": ""})
    @patch('builtins.open', new_callable=mock_open, read_data='{"provider": "aws"}')
    @patch('os.path.exists')
    def test_monitoring_component_reads_metadata_file(self, mock_exists, mock_file):
        from lib.components.monitoring import MonitoringComponent

        mock_exists.return_value = True

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

        self.assertIsNotNone(component.sns_subscription)

    @patch.dict(os.environ, {"PROVIDER": "localstack"})
    @patch('builtins.open', side_effect=OSError("boom"))
    @patch('os.path.exists')
    def test_monitoring_component_metadata_read_error_falls_back_to_env(self, mock_exists, mock_file):
        from lib.components.monitoring import MonitoringComponent

        mock_exists.return_value = True

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

        self.assertIsNone(component.sns_subscription)
        self.mock_pulumi.log.info.assert_called()

    # ===== Compute Component Tests =====
    @patch.dict(os.environ, {"PROVIDER": ""})
    @patch('os.path.exists')
    def test_compute_component_creates_vpc_and_resources(self, mock_exists):
        """Test compute component creates VPC, subnets, and EC2 instances"""
        from lib.components.compute import ComputeComponent

        # Mock metadata.json doesn't exist, so it falls back to env var
        mock_exists.return_value = False

        # Mock all required resources
        self._setup_compute_mocks()

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

    @patch.dict(os.environ, {"PROVIDER": ""})
    @patch('os.path.exists')
    def test_compute_component_vpc_cidr_by_environment(self, mock_exists):
        from lib.components.compute import ComputeComponent

        mock_exists.return_value = False
        self._setup_compute_mocks()

        for env in ["prod", "test", "staging", "unknown"]:
            component = ComputeComponent(
                f"test-compute-{env}",
                environment=env,
                tags={"Environment": env},
                instance_profile="test-profile",
            )
            self.assertIsNotNone(component.vpc)

    @patch.dict(os.environ, {"PROVIDER": "localstack"})
    @patch('builtins.open', side_effect=OSError("boom"))
    @patch('os.path.exists')
    def test_compute_component_metadata_read_error_falls_back_to_env(self, mock_exists, mock_file):
        from lib.components.compute import ComputeComponent

        mock_exists.return_value = True
        self._setup_compute_mocks()
        self.mock_aws.ec2.Instance = Mock()

        component = ComputeComponent(
            "test-compute",
            environment="dev",
            tags={"Environment": "dev"},
            instance_profile="test-profile",
        )

        # In LocalStack, EC2 instances are skipped to avoid deployment hangs
        self.assertEqual(len(component.ec2_instances), 0)
        self.assertEqual(self.mock_aws.ec2.Instance.call_count, 0)

    @patch.dict(os.environ, {"PROVIDER": ""})
    @patch('builtins.open', new_callable=mock_open, read_data='{"provider": "localstack"}')
    @patch('os.path.exists')
    def test_compute_component_localstack_skips_instances(self, mock_exists, mock_file):
        """Test compute component skips EC2 instances when running in LocalStack"""
        from lib.components.compute import ComputeComponent

        mock_exists.return_value = True

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
        self.mock_aws.ec2.Instance = Mock()
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
        # EC2 instances should be skipped in LocalStack to avoid deployment hangs
        self.assertEqual(len(component.ec2_instances), 0)
        self.assertIsNotNone(component.alb)
        # No EC2 instances should be created in LocalStack
        self.assertEqual(self.mock_aws.ec2.Instance.call_count, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2, buffer=True)
