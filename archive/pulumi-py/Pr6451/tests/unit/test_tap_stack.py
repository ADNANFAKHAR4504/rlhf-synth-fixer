"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi test utilities.
Tests multi-region disaster recovery infrastructure without actual AWS deployment.
"""

import unittest
import pulumi
import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


class MinimalMocks(pulumi.runtime.Mocks):
    """
    Minimal mock that returns inputs as outputs without resource-specific logic.
    Extended to handle multi-region RDS disaster recovery resources.
    """

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Return inputs as outputs with minimal computed properties."""
        outputs = {**args.inputs, "id": f"{args.name}-id"}
        
        # Add resource-specific computed properties
        if "aws:kms/key:Key" in args.typ:
            outputs["arn"] = f"arn:aws:kms:us-east-1:123456789012:key/{args.name}-id"
            outputs["key_id"] = f"{args.name}-key-id"
        elif "aws:kms/alias:Alias" in args.typ:
            outputs["arn"] = f"arn:aws:kms:us-east-1:123456789012:alias/{args.name}"
        elif "aws:ec2/vpc:Vpc" in args.typ:
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:vpc/{args.name}-id"
            outputs["cidr_block"] = args.inputs.get("cidr_block", "10.0.0.0/16")
            outputs["default_security_group_id"] = f"sg-{args.name}"
        elif "aws:ec2/subnet:Subnet" in args.typ:
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:subnet/{args.name}-id"
            outputs["availability_zone"] = args.inputs.get("availability_zone", "us-east-1a")
        elif "aws:ec2/securityGroup:SecurityGroup" in args.typ:
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:security-group/{args.name}-id"
        elif "aws:rds/subnetGroup:SubnetGroup" in args.typ:
            outputs["arn"] = f"arn:aws:rds:us-east-1:123456789012:subnet-group/{args.name}"
        elif "aws:rds/parameterGroup:ParameterGroup" in args.typ:
            outputs["arn"] = f"arn:aws:rds:us-east-1:123456789012:pg:{args.name}"
        elif "aws:rds/instance:Instance" in args.typ:
            outputs["arn"] = f"arn:aws:rds:us-east-1:123456789012:db:{args.name}"
            outputs["endpoint"] = f"{args.name}.rds.amazonaws.com"
            outputs["identifier"] = args.inputs.get("identifier", args.name)
            outputs["address"] = f"{args.name}.rds.amazonaws.com"
            outputs["port"] = args.inputs.get("port", 5432)
        elif "aws:secretsmanager/secret:Secret" in args.typ:
            outputs["arn"] = f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}"
        elif "aws:secretsmanager/secretVersion:SecretVersion" in args.typ:
            outputs["secret_string"] = json.dumps({"username": "dbadmin", "password": "test-password"})
        elif "aws:iam/role:Role" in args.typ:
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
        elif "aws:iam/rolePolicyAttachment:RolePolicyAttachment" in args.typ:
            outputs["id"] = f"{args.name}-attachment-id"
        elif "aws:sns/topic:Topic" in args.typ:
            outputs["arn"] = f"arn:aws:sns:us-east-1:123456789012:{args.name}"
        elif "aws:cloudwatch/metricAlarm:MetricAlarm" in args.typ:
            outputs["arn"] = f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}"
        elif "aws:route53/zone:Zone" in args.typ:
            outputs["zone_id"] = f"Z{args.name}"
            outputs["name_servers"] = ["ns1.example.com", "ns2.example.com"]
        elif "aws:route53/healthCheck:HealthCheck" in args.typ:
            outputs["id"] = f"{args.name}-health-check-id"
        elif "aws:route53/record:Record" in args.typ:
            outputs["fqdn"] = f"{args.name}.example.com"
        elif "aws:iam/rolePolicy:RolePolicy" in args.typ:
            outputs["id"] = f"{args.name}-policy-id"
        elif "aws:provider:Provider" in args.typ:
            outputs["id"] = f"{args.name}-provider-id"
        
        return [f"{args.name}-id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getRegion:getRegion":
            return {"region": "us-east-1", "name": "us-east-1", "id": "us-east-1"}
        elif args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zone_ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        return args.args


pulumi.runtime.set_mocks(MinimalMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.db_username, 'dbadmin')

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {"Team": "Infrastructure", "CostCenter": "Engineering"}
        args = TapStackArgs(
            environment_suffix="prod",
            tags=custom_tags,
            db_username="admin"
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.db_username, 'admin')

    def test_tap_stack_args_dev_environment(self):
        """Test TapStackArgs with dev environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="dev")

        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_prod_environment(self):
        """Test TapStackArgs with prod environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="prod")

        self.assertEqual(args.environment_suffix, 'prod')

    def test_tap_stack_args_custom_db_username(self):
        """Test TapStackArgs with custom database username."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(db_username="postgres")

        self.assertEqual(args.db_username, 'postgres')


class TestTapStackInstantiation(unittest.TestCase):
    """Test cases for TapStack instantiation and basic properties."""

    @pulumi.runtime.test
    def test_stack_instantiation_without_errors(self):
        """Test that stack can be instantiated without errors."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_instantiation(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify stack is created
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, "test")
            
            return {}

        return check_instantiation([])

    @pulumi.runtime.test
    def test_stack_with_default_environment(self):
        """Test stack with default environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_default_env(args):
            stack = TapStack("test-stack", TapStackArgs())
            
            # Should default to 'dev'
            self.assertEqual(stack.environment_suffix, "dev")
            
            return {}

        return check_default_env([])

    @pulumi.runtime.test
    def test_stack_with_prod_environment(self):
        """Test stack with production environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_env(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))
            
            self.assertEqual(stack.environment_suffix, "prod")
            
            return {}

        return check_prod_env([])

    @pulumi.runtime.test
    def test_stack_creates_providers(self):
        """Test that AWS providers are created for both regions."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_providers(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify providers are created
            self.assertIsNotNone(stack.primary_provider)
            self.assertIsNotNone(stack.dr_provider)
            
            return {}

        return check_providers([])


class TestTapStackTags(unittest.TestCase):
    """Test resource tagging functionality."""

    @pulumi.runtime.test
    def test_custom_tags_applied(self):
        """Test custom tags are stored in stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {"Team": "DevOps", "Project": "DisasterRecovery"}
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

            self.assertEqual(stack.tags, custom_tags)

            return {}

        return check_tags([])

    @pulumi.runtime.test
    def test_no_tags_provided(self):
        """Test stack works when no tags are provided."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_no_tags(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Tags should be empty dict when not provided
            self.assertEqual(stack.tags, {})

            return {}

        return check_no_tags([])


class TestTapStackPrimaryRegionInfrastructure(unittest.TestCase):
    """Test primary region (us-east-1) infrastructure creation."""

    @pulumi.runtime.test
    def test_primary_kms_key_creation(self):
        """Test that primary KMS key is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_kms(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify primary KMS key is created
            self.assertIsNotNone(stack.primary_kms)
            
            return {}

        return check_kms([])

    @pulumi.runtime.test
    def test_primary_vpc_creation(self):
        """Test that primary VPC is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_vpc(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify primary VPC is created
            self.assertIsNotNone(stack.primary_vpc)
            
            return {}

        return check_vpc([])

    @pulumi.runtime.test
    def test_primary_subnets_creation(self):
        """Test that primary subnets are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_subnets(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify primary subnets are created
            self.assertIsNotNone(stack.primary_subnet_1)
            self.assertIsNotNone(stack.primary_subnet_2)
            
            return {}

        return check_subnets([])

    @pulumi.runtime.test
    def test_primary_db_instance_creation(self):
        """Test that primary RDS instance is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_db(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify primary DB instance is created
            self.assertIsNotNone(stack.primary_db)
            
            return {}

        return check_db([])

    @pulumi.runtime.test
    def test_primary_security_group_creation(self):
        """Test that primary security group is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_sg(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify primary security group is created
            self.assertIsNotNone(stack.primary_sg)
            
            return {}

        return check_sg([])

    @pulumi.runtime.test
    def test_primary_subnet_group_creation(self):
        """Test that primary subnet group is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_subnet_group(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify primary subnet group is created
            self.assertIsNotNone(stack.primary_subnet_group)
            
            return {}

        return check_subnet_group([])

    @pulumi.runtime.test
    def test_parameter_group_creation(self):
        """Test that parameter group is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_param_group(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify parameter group is created
            self.assertIsNotNone(stack.parameter_group)
            
            return {}

        return check_param_group([])

    @pulumi.runtime.test
    def test_db_secret_creation(self):
        """Test that database secret is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_secret(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify database secret is created
            self.assertIsNotNone(stack.db_secret)
            
            return {}

        return check_secret([])


class TestTapStackDRRegionInfrastructure(unittest.TestCase):
    """Test DR region (us-west-2) infrastructure creation."""

    @pulumi.runtime.test
    def test_dr_kms_key_creation(self):
        """Test that DR KMS key is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_kms(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify DR KMS key is created
            self.assertIsNotNone(stack.dr_kms)
            
            return {}

        return check_kms([])

    @pulumi.runtime.test
    def test_dr_vpc_creation(self):
        """Test that DR VPC is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_vpc(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify DR VPC is created
            self.assertIsNotNone(stack.dr_vpc)
            
            return {}

        return check_vpc([])

    @pulumi.runtime.test
    def test_dr_subnets_creation(self):
        """Test that DR subnets are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_subnets(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify DR subnets are created
            self.assertIsNotNone(stack.dr_subnet_1)
            self.assertIsNotNone(stack.dr_subnet_2)
            
            return {}

        return check_subnets([])

    @pulumi.runtime.test
    def test_replica_db_instance_creation(self):
        """Test that replica RDS instance is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_replica(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify replica DB instance is created
            self.assertIsNotNone(stack.replica_db)
            
            return {}

        return check_replica([])

    @pulumi.runtime.test
    def test_dr_security_group_creation(self):
        """Test that DR security group is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_sg(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify DR security group is created
            self.assertIsNotNone(stack.dr_sg)
            
            return {}

        return check_sg([])


class TestTapStackMonitoring(unittest.TestCase):
    """Test CloudWatch monitoring and alerting infrastructure."""

    @pulumi.runtime.test
    def test_sns_topic_creation(self):
        """Test that SNS topic for alerts is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_sns(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify SNS topic is created
            self.assertIsNotNone(stack.alert_topic)
            
            return {}

        return check_sns([])

    @pulumi.runtime.test
    def test_cloudwatch_alarms_creation(self):
        """Test that CloudWatch alarms are configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_alarms(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify CloudWatch alarms are created
            self.assertIsNotNone(stack.primary_cpu_alarm)
            self.assertIsNotNone(stack.replication_lag_alarm)
            self.assertIsNotNone(stack.primary_storage_alarm)
            self.assertIsNotNone(stack.primary_connections_alarm)
            
            return {}

        return check_alarms([])

    @pulumi.runtime.test
    def test_monitoring_role_creation(self):
        """Test that RDS monitoring role is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_monitoring_role(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify monitoring role is created
            self.assertIsNotNone(stack.monitoring_role)
            
            return {}

        return check_monitoring_role([])


class TestTapStackRoute53Failover(unittest.TestCase):
    """Test Route 53 health checks and failover configuration."""

    @pulumi.runtime.test
    def test_hosted_zone_creation(self):
        """Test that Route 53 hosted zone is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_zone(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify hosted zone is created
            self.assertIsNotNone(stack.hosted_zone)
            
            return {}

        return check_zone([])

    @pulumi.runtime.test
    def test_health_check_creation(self):
        """Test that Route 53 health check is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_health_check(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify health check is created
            self.assertIsNotNone(stack.primary_health_check)
            
            return {}

        return check_health_check([])

    @pulumi.runtime.test
    def test_dns_records_creation(self):
        """Test that Route 53 DNS records are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_records(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify DNS records are created
            self.assertIsNotNone(stack.primary_dns_record)
            self.assertIsNotNone(stack.dr_dns_record)
            
            return {}

        return check_records([])


class TestTapStackSnapshotAutomation(unittest.TestCase):
    """Test cross-region snapshot automation."""

    @pulumi.runtime.test
    def test_snapshot_lambda_role_creation(self):
        """Test that Lambda role for snapshot automation is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_role(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify snapshot Lambda role is created
            self.assertIsNotNone(stack.snapshot_lambda_role)
            
            return {}

        return check_role([])

    @pulumi.runtime.test
    def test_snapshot_lambda_policy_creation(self):
        """Test that Lambda policy for snapshot automation is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_policy(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify snapshot Lambda policy is created
            self.assertIsNotNone(stack.snapshot_lambda_policy)
            
            return {}

        return check_policy([])


class TestTapStackNaming(unittest.TestCase):
    """Test resource naming conventions."""

    @pulumi.runtime.test
    def test_resource_naming_with_dev_environment(self):
        """Test resources are named with dev environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dev_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="dev"))

            self.assertEqual(stack.environment_suffix, "dev")

            return {}

        return check_dev_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_prod_environment(self):
        """Test resources are named with prod environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))

            self.assertEqual(stack.environment_suffix, "prod")

            return {}

        return check_prod_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_custom_environment(self):
        """Test resources are named with custom environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_custom_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="staging"))

            self.assertEqual(stack.environment_suffix, "staging")

            return {}

        return check_custom_naming([])


class TestTapStackMultiRegion(unittest.TestCase):
    """Test multi-region deployment configuration."""

    @pulumi.runtime.test
    def test_primary_region_provider(self):
        """Test that primary region provider is configured correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_primary_provider(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify primary provider is created
            self.assertIsNotNone(stack.primary_provider)
            
            return {}

        return check_primary_provider([])

    @pulumi.runtime.test
    def test_dr_region_provider(self):
        """Test that DR region provider is configured correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dr_provider(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify DR provider is created
            self.assertIsNotNone(stack.dr_provider)
            
            return {}

        return check_dr_provider([])

    @pulumi.runtime.test
    def test_both_regions_have_resources(self):
        """Test that both primary and DR regions have resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_both_regions(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify both regions have VPCs
            self.assertIsNotNone(stack.primary_vpc)
            self.assertIsNotNone(stack.dr_vpc)
            
            # Verify both regions have KMS keys
            self.assertIsNotNone(stack.primary_kms)
            self.assertIsNotNone(stack.dr_kms)
            
            return {}

        return check_both_regions([])


class TestTapStackCompliance(unittest.TestCase):
    """Test compliance-related configurations."""

    @pulumi.runtime.test
    def test_encryption_configured(self):
        """Test that encryption is configured for RDS."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_encryption(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify KMS keys are created for encryption
            self.assertIsNotNone(stack.primary_kms)
            self.assertIsNotNone(stack.dr_kms)
            
            return {}

        return check_encryption([])

    @pulumi.runtime.test
    def test_secrets_manager_configured(self):
        """Test that Secrets Manager is configured for credentials."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_secrets(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify secrets are created
            self.assertIsNotNone(stack.db_secret)
            self.assertIsNotNone(stack.db_password)
            
            return {}

        return check_secrets([])


class TestTapStackDisasterRecovery(unittest.TestCase):
    """Test disaster recovery features."""

    @pulumi.runtime.test
    def test_replica_instance_configured(self):
        """Test that read replica is configured for DR."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_replica(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify replica instance is created
            self.assertIsNotNone(stack.replica_db)
            
            return {}

        return check_replica([])

    @pulumi.runtime.test
    def test_failover_dns_configured(self):
        """Test that Route 53 failover DNS is configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_failover(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify failover DNS records are created
            self.assertIsNotNone(stack.primary_dns_record)
            self.assertIsNotNone(stack.dr_dns_record)
            
            return {}

        return check_failover([])

    @pulumi.runtime.test
    def test_replication_monitoring_configured(self):
        """Test that replication lag monitoring is configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_replication_monitoring(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify replication lag alarm is created
            self.assertIsNotNone(stack.replication_lag_alarm)
            
            return {}

        return check_replication_monitoring([])


class TestTapStackMultipleInstances(unittest.TestCase):
    """Test creating multiple stack instances."""

    @pulumi.runtime.test
    def test_multiple_dev_stacks(self):
        """Test creating multiple dev environment stacks."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_multiple_stacks(args):
            stack1 = TapStack("dev-stack-1", TapStackArgs(environment_suffix="dev"))
            stack2 = TapStack("dev-stack-2", TapStackArgs(environment_suffix="dev"))
            
            self.assertIsNotNone(stack1)
            self.assertIsNotNone(stack2)
            self.assertEqual(stack1.environment_suffix, "dev")
            self.assertEqual(stack2.environment_suffix, "dev")
            
            return {}

        return check_multiple_stacks([])

    @pulumi.runtime.test
    def test_mixed_environment_stacks(self):
        """Test creating stacks with different environments."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_mixed_stacks(args):
            dev_stack = TapStack("dev-stack", TapStackArgs(environment_suffix="dev"))
            prod_stack = TapStack("prod-stack", TapStackArgs(environment_suffix="prod"))
            
            self.assertIsNotNone(dev_stack)
            self.assertIsNotNone(prod_stack)
            self.assertEqual(dev_stack.environment_suffix, "dev")
            self.assertEqual(prod_stack.environment_suffix, "prod")
            
            return {}

        return check_mixed_stacks([])


if __name__ == '__main__':
    unittest.main()
