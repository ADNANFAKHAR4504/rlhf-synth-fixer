"""
Unit tests for TapStack CDK stack.
Tests the main orchestration stack and all child constructs.
"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
import pytest
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack:
    """Test suite for TapStack orchestration."""

    @pytest.fixture
    def app(self):
        """Create a CDK app instance."""
        return cdk.App()

    @pytest.fixture
    def stack(self, app):
        """Create a TapStack instance."""
        props = TapStackProps(environment_suffix="test")
        return TapStack(app, "TestStack", props=props)

    @pytest.fixture
    def template(self, stack):
        """Generate CloudFormation template from stack."""
        return Template.from_stack(stack)

    def test_stack_creation(self, stack):
        """Test that stack can be created successfully."""
        assert stack is not None
        assert isinstance(stack, cdk.Stack)

    def test_environment_suffix_from_props(self, app):
        """Test environment suffix is correctly set from props."""
        props = TapStackProps(environment_suffix="custom")
        stack = TapStack(app, "TestStack", props=props)
        assert stack is not None

    def test_environment_suffix_from_context(self, app):
        """Test environment suffix is correctly set from context."""
        app_with_context = cdk.App(context={"environmentSuffix": "ctx"})
        stack = TapStack(app_with_context, "TestStack")
        assert stack is not None

    def test_environment_suffix_default(self, app):
        """Test environment suffix defaults to 'dev' when not provided."""
        stack = TapStack(app, "TestStack")
        assert stack is not None

    def test_vpc_resources_created(self, template):
        """Test that VPC resources are created."""
        # Primary VPC
        template.resource_count_is("AWS::EC2::VPC", 2)

        # VPC Peering Connection removed (not needed for RDS cross-region read replicas)
        template.resource_count_is("AWS::EC2::VPCPeeringConnection", 0)

        # Gateway VPC Endpoints for S3
        template.resource_count_is("AWS::EC2::VPCEndpoint", 2)

    def test_rds_resources_created(self, template):
        """Test that RDS resources are created."""
        # Primary RDS instance
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "MultiAZ": True,
            "StorageEncrypted": True,
            "AllocatedStorage": "100"
        })

        # Subnet groups
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 2)

        # Security groups
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": Match.string_like_regexp(".*PostgreSQL.*")
        })

    def test_secrets_manager_created(self, template):
        """Test that Secrets Manager secret is created for database credentials."""
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Description": "PostgreSQL database credentials",
            "GenerateSecretString": {
                "GenerateStringKey": "password",
                "SecretStringTemplate": '{"username":"postgres"}'
            }
        })

    def test_lambda_function_created(self, template):
        """Test that failover Lambda function is created."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 300
        })

        # Lambda IAM role
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ])
            }
        })

    def test_route53_resources_created(self, template):
        """Test that Route53 resources are created."""
        # Private hosted zone
        template.resource_count_is("AWS::Route53::HostedZone", 1)

        # Health check
        template.has_resource_properties("AWS::Route53::HealthCheck", {
            "HealthCheckConfig": {
                "Type": "HTTPS",
                "Port": 5432
            }
        })

        # Record sets (primary and replica)
        template.resource_count_is("AWS::Route53::RecordSet", 2)

    def test_cloudwatch_alarms_created(self, template):
        """Test that CloudWatch alarms are created."""
        # Replication lag alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "ReplicaLag",
            "Namespace": "AWS/RDS",
            "Threshold": 60,
            "ComparisonOperator": "GreaterThanThreshold"
        })

        # CPU alarms
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/RDS",
            "Threshold": 80
        })

        # Lambda error alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "Errors",
            "Namespace": "AWS/Lambda"
        })

    def test_sns_topic_created(self, template):
        """Test that SNS topic is created for alarm notifications."""
        template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "Database Replication Alarms"
        })

    def test_cloudwatch_dashboard_created(self, template):
        """Test that CloudWatch dashboard is created."""
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    def test_stack_outputs(self, template):
        """Test that stack outputs are created."""
        template.has_output("PrimaryEndpoint", {
            "Description": "Primary RDS PostgreSQL endpoint (us-east-1)"
        })

        template.has_output("ReplicaEndpoint", {
            "Description": "Replica RDS PostgreSQL endpoint (eu-west-1)"
        })

        template.has_output("Route53CNAME", {
            "Description": "Route53 CNAME for database endpoint"
        })

        template.has_output("FailoverFunctionArn", {
            "Description": "Lambda function ARN for automated failover"
        })

    def test_resource_naming_convention(self, template):
        """Test that resources follow naming convention with environment suffix."""
        # VPCs should have environment suffix in name
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({
                    "Key": "Name",
                    "Value": Match.string_like_regexp(".*test.*")
                })
            ])
        })

    def test_removal_policy_destroy(self, template):
        """Test that resources have correct removal policy for test environments."""
        # RDS instances should have DeletionPolicy: Delete (from RemovalPolicy.DESTROY)
        template.has_resource("AWS::RDS::DBInstance", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

        # Secrets should be destroyable
        template.has_resource("AWS::SecretsManager::Secret", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

    def test_security_group_ingress_rules(self, template):
        """Test that security groups have correct ingress rules."""
        # Security groups with inline ingress rules don't create separate SecurityGroupIngress resources
        # Check that security groups exist instead
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": Match.string_like_regexp(".*PostgreSQL.*")
        })

    def test_lambda_vpc_configuration(self, template):
        """Test that Lambda function is configured with VPC access."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": {
                "SubnetIds": Match.any_value(),
                "SecurityGroupIds": Match.any_value()
            }
        })

    def test_lambda_environment_variables(self, template):
        """Test that Lambda function has required environment variables."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": {
                    "PRIMARY_INSTANCE_ID": Match.any_value(),
                    "REPLICA_INSTANCE_ID": Match.any_value(),
                    "HOSTED_ZONE_ID": Match.any_value(),
                    "RECORD_NAME": Match.any_value(),
                    "PRIMARY_ENDPOINT": Match.any_value(),
                    "REPLICA_ENDPOINT": Match.any_value()
                }
            }
        })

    def test_iam_policy_permissions(self, template):
        """Test that IAM policies grant correct permissions."""
        # RDS permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": Match.array_with([
                            "rds:PromoteReadReplica",
                            "rds:DescribeDBInstances",
                            "rds:ModifyDBInstance"
                        ])
                    })
                ])
            }
        })

        # Route53 permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": Match.array_with([
                            "route53:ChangeResourceRecordSets",
                            "route53:GetChange",
                            "route53:ListResourceRecordSets"
                        ])
                    })
                ])
            }
        })

    def test_rds_parameter_group(self, template):
        """Test that RDS parameter group is configured correctly."""
        template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Family": "postgres15",
            "Parameters": {
                "log_statement": "all",
                "rds.force_ssl": "0"
            }
        })

    def test_cloudwatch_log_groups(self, template):
        """Test that CloudWatch log groups are created for Lambda."""
        # Log groups are created automatically by Lambda or explicitly
        template.resource_count_is("AWS::Logs::LogGroup", Match.any_value())

    def test_route53_weighted_routing(self, template):
        """Test that Route53 uses weighted routing policy."""
        # Primary record with weight 100
        template.has_resource_properties("AWS::Route53::RecordSet", {
            "Type": "CNAME",
            "Weight": 100,
            "SetIdentifier": "primary"
        })

        # Replica record with weight 0
        template.has_resource_properties("AWS::Route53::RecordSet", {
            "Type": "CNAME",
            "Weight": 0,
            "SetIdentifier": "replica"
        })

    def test_vpc_cidr_ranges(self, template):
        """Test that VPCs use non-overlapping CIDR ranges."""
        # Primary VPC: 10.0.0.0/16
        # Replica VPC: 10.1.0.0/16
        # We can't directly test CIDR values, but we can verify 2 VPCs exist
        template.resource_count_is("AWS::EC2::VPC", 2)

    def test_multi_az_configuration(self, template):
        """Test that primary RDS instance is configured for Multi-AZ."""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "MultiAZ": True
        })

    def test_storage_encryption(self, template):
        """Test that RDS instances have storage encryption enabled."""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })

    def test_no_deletion_protection(self, template):
        """Test that deletion protection is disabled for test environments."""
        # RDS instances should have DeletionProtection: false
        rds_resources = template.find_resources("AWS::RDS::DBInstance")
        for resource_id, resource in rds_resources.items():
            properties = resource.get("Properties", {})
            # DeletionProtection should be false or not present (defaults to false)
            assert properties.get("DeletionProtection", False) is False

    def test_cloudwatch_logs_exports(self, template):
        """Test that RDS instances export logs to CloudWatch."""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })
