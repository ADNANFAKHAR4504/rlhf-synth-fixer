"""
Unit tests for DatabaseStack
Tests the primary database infrastructure for disaster recovery.
"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("DatabaseStack")
class TestDatabaseStack(unittest.TestCase):
    """Test cases for the DatabaseStack construct"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc(self):
        """Test that VPC is created with proper CIDR and subnets"""
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })

    @mark.it("creates security group for database")
    def test_creates_security_group(self):
        """Test that security group is created for database access"""
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 1)
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": Match.string_like_regexp(".*PostgreSQL.*")
        })

    @mark.it("creates RDS database with db.r6g.large instance type")
    def test_creates_rds_instance_correct_type(self):
        """Test that RDS instance uses db.r6g.large as required"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": "db.r6g.large",
            "Engine": "postgres",
            "MultiAZ": True
        })

    @mark.it("enables Multi-AZ for primary database")
    def test_enables_multi_az(self):
        """Test that primary database has Multi-AZ enabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "MultiAZ": True
        })

    @mark.it("configures 7-day backup retention")
    def test_configures_backup_retention(self):
        """Test that backup retention is set to 7 days"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7
        })

    @mark.it("enables storage encryption")
    def test_enables_encryption(self):
        """Test that storage encryption is enabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })

    @mark.it("disables deletion protection for testing")
    def test_disables_deletion_protection(self):
        """Test that deletion protection is disabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False
        })

    @mark.it("enables CloudWatch Logs export")
    def test_enables_cloudwatch_logs(self):
        """Test that PostgreSQL logs are exported to CloudWatch"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    @mark.it("creates Secrets Manager secret for credentials")
    def test_creates_secrets_manager_secret(self):
        """Test that database credentials are stored in Secrets Manager"""
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("creates parameter group with audit logging")
    def test_creates_parameter_group(self):
        """Test that parameter group has log_statement=all"""
        self.template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Parameters": Match.object_like({
                "log_statement": "all"
            })
        })

    @mark.it("disables force_ssl in parameter group")
    def test_disables_force_ssl(self):
        """Test that force_ssl is disabled for legacy compatibility"""
        self.template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Parameters": Match.object_like({
                "rds.force_ssl": "0"
            })
        })

    @mark.it("creates subnet group for database")
    def test_creates_subnet_group(self):
        """Test that DB subnet group is created"""
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("creates Lambda function for failover")
    def test_creates_failover_lambda(self):
        """Test that Lambda function is created for failover automation"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.handler",
            "Runtime": "python3.11",
            "Timeout": 300
        })

    @mark.it("creates IAM role for Lambda with RDS permissions")
    def test_creates_lambda_role_with_rds_permissions(self):
        """Test that Lambda role has permissions to promote replica"""
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "rds:PromoteReadReplica"
                        ])
                    })
                ])
            })
        })

    @mark.it("creates IAM role for Lambda with Route53 permissions")
    def test_creates_lambda_role_with_route53_permissions(self):
        """Test that Lambda role has permissions to update Route53"""
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "route53:ChangeResourceRecordSets"
                        ])
                    })
                ])
            })
        })

    @mark.it("sets Lambda environment variables")
    def test_sets_lambda_environment_variables(self):
        """Test that Lambda has required environment variables"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "ENVIRONMENT_SUFFIX": self.env_suffix,
                    "REPLICA_DB_INSTANCE": f"replica-db-{self.env_suffix}",
                    "REPLICA_REGION": "eu-west-1"
                })
            }
        })

    @mark.it("creates Route53 private hosted zone")
    def test_creates_route53_hosted_zone(self):
        """Test that private hosted zone is created"""
        self.template.resource_count_is("AWS::Route53::HostedZone", 1)

    @mark.it("creates Route53 health check with CloudWatch alarm")
    def test_creates_route53_health_check(self):
        """Test that health check monitors database via CloudWatch"""
        self.template.has_resource_properties("AWS::Route53::HealthCheck", {
            "HealthCheckConfig": Match.object_like({
                "Type": "CLOUDWATCH_METRIC"
            })
        })

    @mark.it("creates CloudWatch alarm for database connections")
    def test_creates_connection_alarm(self):
        """Test that CloudWatch alarm monitors database connections"""
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Namespace": "AWS/RDS",
            "MetricName": "DatabaseConnections"
        })

    @mark.it("creates CloudWatch alarm for replication lag")
    def test_creates_replication_lag_alarm(self):
        """Test that replication lag alarm is created"""
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "ReplicaLag",
            "Threshold": 60
        })

    @mark.it("creates SNS topic for alarms")
    def test_creates_sns_topic(self):
        """Test that SNS topic is created for alarm notifications"""
        self.template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates weighted routing record for primary")
    def test_creates_weighted_routing_record(self):
        """Test that weighted routing record is created"""
        self.template.has_resource_properties("AWS::Route53::RecordSet", {
            "Type": "CNAME",
            "Weight": 100
        })

    @mark.it("includes environment suffix in all resource names")
    def test_includes_env_suffix_in_names(self):
        """Test that all resources include environment suffix"""
        # Check database instance identifier
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceIdentifier": f"primary-db-{self.env_suffix}"
        })

        # Check Lambda function name
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"failover-function-{self.env_suffix}"
        })

        # Check secret name
        self.template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"db-credentials-{self.env_suffix}"
        })

    @mark.it("outputs primary database endpoint")
    def test_outputs_primary_endpoint(self):
        """Test that primary database endpoint is exported"""
        outputs = self.template.to_json().get('Outputs', {})
        matching_outputs = [k for k in outputs.keys() if k.startswith('DatabaseStackPrimaryDatabaseEndpoint')]
        self.assertTrue(len(matching_outputs) > 0, "Expected output starting with 'DatabaseStackPrimaryDatabaseEndpoint'")

    @mark.it("outputs database secret ARN")
    def test_outputs_secret_arn(self):
        """Test that database secret ARN is exported"""
        outputs = self.template.to_json().get('Outputs', {})
        matching_outputs = [k for k in outputs.keys() if k.startswith('DatabaseStackDatabaseSecretArn')]
        self.assertTrue(len(matching_outputs) > 0, "Expected output starting with 'DatabaseStackDatabaseSecretArn'")

    @mark.it("outputs Route53 hosted zone ID")
    def test_outputs_hosted_zone_id(self):
        """Test that hosted zone ID is exported"""
        outputs = self.template.to_json().get('Outputs', {})
        matching_outputs = [k for k in outputs.keys() if k.startswith('DatabaseStackRoute53HostedZoneId')]
        self.assertTrue(len(matching_outputs) > 0, "Expected output starting with 'DatabaseStackRoute53HostedZoneId'")

    @mark.it("outputs database CNAME")
    def test_outputs_database_cname(self):
        """Test that database CNAME is exported"""
        outputs = self.template.to_json().get('Outputs', {})
        matching_outputs = [k for k in outputs.keys() if k.startswith('DatabaseStackDatabaseCname')]
        self.assertTrue(len(matching_outputs) > 0, "Expected output starting with 'DatabaseStackDatabaseCname'")

    @mark.it("outputs failover function ARN")
    def test_outputs_failover_function_arn(self):
        """Test that failover function ARN is exported"""
        outputs = self.template.to_json().get('Outputs', {})
        matching_outputs = [k for k in outputs.keys() if k.startswith('DatabaseStackFailoverFunctionArn')]
        self.assertTrue(len(matching_outputs) > 0, "Expected output starting with 'DatabaseStackFailoverFunctionArn'")

    @mark.it("creates NAT Gateway for private subnet connectivity")
    def test_creates_nat_gateway(self):
        """Test that NAT Gateway is created for private subnets"""
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("uses PostgreSQL version 15")
    def test_uses_postgres_15(self):
        """Test that PostgreSQL version 15 is used"""
        self.template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Family": Match.string_like_regexp("postgres15.*")
        })
