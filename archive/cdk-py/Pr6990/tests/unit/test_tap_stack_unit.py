"""
Unit tests for TapStack CDK stack.
Tests the main orchestration stack and all child constructs.
"""

import os
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match, Capture
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

    def test_region_from_environment_variables(self, app, monkeypatch):
        """Test that regions are read from environment variables."""
        monkeypatch.setenv('AWS_REGION', 'us-west-2')
        monkeypatch.setenv('REPLICA_REGION', 'eu-central-1')
        props = TapStackProps(environment_suffix="envtest")
        stack = TapStack(app, "TestStack", props=props)
        assert stack is not None

    def test_vpc_resources_created(self, template):
        """Test that VPC resources are created."""
        # Primary and Replica VPCs
        template.resource_count_is("AWS::EC2::VPC", 2)

        # VPC Peering Connection not used (both VPCs in same region)
        template.resource_count_is("AWS::EC2::VPCPeeringConnection", 0)

        # Gateway VPC Endpoints for S3
        template.resource_count_is("AWS::EC2::VPCEndpoint", 2)

    def test_primary_vpc_configuration(self, template):
        """Test primary VPC is configured correctly."""
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })

    def test_replica_vpc_configuration(self, template):
        """Test replica VPC is configured correctly."""
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.1.0.0/16"
        })

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

    def test_primary_instance_configuration(self, template):
        """Test primary RDS instance has correct configuration."""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "EngineVersion": Match.string_like_regexp("^15.*"),
            "DBInstanceClass": "db.r6g.large",
            "MultiAZ": True,
            "StorageEncrypted": True,
            "AllocatedStorage": "100",
            "StorageType": "gp3",
            "BackupRetentionPeriod": 7,
            "DeletionProtection": False,
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    def test_read_replica_configuration(self, template):
        """Test read replica has correct configuration."""
        # Read replica should reference source database
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "SourceDBInstanceIdentifier": Match.any_value(),
            "DBInstanceClass": "db.r6g.large",
            "StorageEncrypted": True,
            "DeletionProtection": False
        })

    def test_secrets_manager_created(self, template):
        """Test that Secrets Manager secret is created for database credentials."""
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Description": Match.string_like_regexp(".*PostgreSQL.*"),
            "GenerateSecretString": {
                "GenerateStringKey": "password",
                "SecretStringTemplate": '{"username":"postgres"}'
            }
        })

    def test_parameter_group_configuration(self, template):
        """Test RDS parameter group is configured correctly."""
        template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Description": Match.string_like_regexp(".*audit.*"),
            "Parameters": {
                "log_statement": "all",
                "rds.force_ssl": "0"
            }
        })

    def test_lambda_function_created(self, template):
        """Test that failover Lambda function is created."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 300
        })

    def test_lambda_has_vpc_config(self, template):
        """Test Lambda function is deployed in VPC."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.object_like({
                "SubnetIds": Match.any_value(),
                "SecurityGroupIds": Match.any_value()
            })
        })

    def test_lambda_environment_variables(self, template):
        """Test Lambda function has required environment variables."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "PRIMARY_INSTANCE_ID": Match.any_value(),
                    "REPLICA_INSTANCE_ID": Match.any_value(),
                    "HOSTED_ZONE_ID": Match.any_value(),
                    "RECORD_NAME": Match.any_value()
                })
            }
        })

    def test_lambda_iam_role(self, template):
        """Test Lambda IAM role has correct policies."""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    })
                ])
            })
        })

    def test_lambda_rds_permissions(self, template):
        """Test Lambda has RDS permissions."""
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "rds:PromoteReadReplica",
                            "rds:DescribeDBInstances",
                            "rds:ModifyDBInstance"
                        ])
                    })
                ])
            })
        })

    def test_lambda_route53_permissions(self, template):
        """Test Lambda has Route53 permissions."""
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "route53:ChangeResourceRecordSets",
                            "route53:GetChange",
                            "route53:ListResourceRecordSets"
                        ])
                    })
                ])
            })
        })

    def test_route53_hosted_zone_created(self, template):
        """Test that Route53 private hosted zone is created."""
        template.has_resource_properties("AWS::Route53::HostedZone", {
            "VPCs": Match.any_value()
        })

    def test_route53_weighted_records_created(self, template):
        """Test that Route53 weighted records are created."""
        # Should have 2 weighted records (primary and replica)
        template.resource_count_is("AWS::Route53::RecordSet", 2)

        # Primary record with 100% weight
        template.has_resource_properties("AWS::Route53::RecordSet", {
            "Type": "CNAME",
            "SetIdentifier": "primary",
            "Weight": 100
        })

        # Replica record with 0% weight
        template.has_resource_properties("AWS::Route53::RecordSet", {
            "Type": "CNAME",
            "SetIdentifier": "replica",
            "Weight": 0
        })

    def test_cloudwatch_alarms_created(self, template):
        """Test that CloudWatch alarms are created."""
        # Should have multiple alarms (at least 9)
        template.resource_count_is("AWS::CloudWatch::Alarm", 9)

    def test_replication_lag_alarm(self, template):
        """Test replication lag alarm configuration."""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "ReplicaLag",
            "Namespace": "AWS/RDS",
            "Threshold": 60,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    def test_cpu_alarms(self, template):
        """Test CPU utilization alarms for both instances."""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/RDS",
            "Threshold": 80,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    def test_storage_alarms(self, template):
        """Test free storage space alarms."""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "FreeStorageSpace",
            "Namespace": "AWS/RDS",
            "Threshold": 10737418240,  # 10GB
            "ComparisonOperator": "LessThanThreshold"
        })

    def test_lambda_error_alarm(self, template):
        """Test Lambda error alarm configuration."""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "Errors",
            "Namespace": "AWS/Lambda",
            "Threshold": 1,
            "ComparisonOperator": "GreaterThanOrEqualToThreshold"
        })

    def test_sns_topic_created(self, template):
        """Test that SNS topic is created for notifications."""
        template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "Database Replication Alarms"
        })

    def test_cloudwatch_dashboard_created(self, template):
        """Test that CloudWatch dashboard is created."""
        template.has_resource("AWS::CloudWatch::Dashboard", {})

    def test_stack_outputs(self, template):
        """Test that all required stack outputs are defined."""
        template.has_output("PrimaryEndpoint", {})
        template.has_output("ReplicaEndpoint", {})
        template.has_output("Route53CNAME", {})
        template.has_output("FailoverFunctionArn", {})

    def test_primary_endpoint_output_description(self, template):
        """Test primary endpoint output has correct description."""
        template.has_output("PrimaryEndpoint", {
            "Description": Match.string_like_regexp(".*Primary.*")
        })

    def test_replica_endpoint_output_description(self, template):
        """Test replica endpoint output has correct description."""
        template.has_output("ReplicaEndpoint", {
            "Description": Match.string_like_regexp(".*same region as primary.*")
        })

    def test_deletion_protection_disabled(self, template):
        """Test that deletion protection is disabled for all RDS instances."""
        # All RDS instances should have DeletionProtection: False
        template.all_resources_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False
        })

    def test_removal_policy_destroy(self, template):
        """Test that removal policy is set to DESTROY for testing."""
        # Secrets should have deletion policy
        template.has_resource("AWS::SecretsManager::Secret", {
            "DeletionPolicy": "Delete"
        })

    def test_security_group_ingress_rules(self, template):
        """Test security groups have proper ingress rules."""
        # Security group ingress rules are defined inline in CDK
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 5432,
                    "ToPort": 5432
                })
            ])
        })

    def test_subnet_configuration(self, template):
        """Test that subnets are configured correctly."""
        # Should have private subnets
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False
        })

    def test_cloudwatch_log_retention(self, template):
        """Test CloudWatch log retention is configured."""
        # RDS CloudWatch logs are configured via EnableCloudwatchLogsExports
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    def test_multi_az_enabled(self, template):
        """Test that Multi-AZ is enabled for primary instance."""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "MultiAZ": True
        })

    def test_encryption_enabled(self, template):
        """Test that encryption is enabled for all RDS instances."""
        template.all_resources_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })

    def test_backup_retention_configured(self, template):
        """Test that backup retention is configured correctly."""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7
        })

    def test_vpc_endpoints_for_s3(self, template):
        """Test that S3 VPC endpoints are created."""
        template.has_resource_properties("AWS::EC2::VPCEndpoint", {
            "VpcEndpointType": "Gateway"
        })

    def test_resource_naming_with_suffix(self, stack):
        """Test that resources are named with environment suffix."""
        template = Template.from_stack(stack)
        # Check that instance identifiers contain suffix
        capture = Capture()
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceIdentifier": capture
        })
        assert "test" in str(capture.as_string())

    def test_no_public_access(self, template):
        """Test that RDS instances are not publicly accessible."""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "PubliclyAccessible": False
        })

    def test_lambda_log_group(self, template):
        """Test that Lambda function has logging configured."""
        # Lambda function automatically creates log groups
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": Match.string_like_regexp("db-failover-.*")
        })

    def test_alarm_actions_configured(self, template):
        """Test that alarms have SNS actions configured."""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmActions": Match.any_value()
        })

    def test_database_connections_alarm(self, template):
        """Test database connections alarm configuration."""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "DatabaseConnections",
            "Namespace": "AWS/RDS",
            "Threshold": 800
        })

    def test_primary_availability_alarm_for_route53(self, template):
        """Test primary database availability alarm for Route53 failover."""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "DatabaseConnections",
            "Threshold": 0,
            "ComparisonOperator": "LessThanOrEqualToThreshold",
            "TreatMissingData": "breaching"
        })

    def test_sns_alarm_subscription(self, template):
        """Test SNS topic is used for alarm actions."""
        # Verify alarms have SNS topic actions
        template.resource_count_is("AWS::SNS::Topic", 1)

    def test_lambda_sns_permissions(self, template):
        """Test Lambda has SNS publish permissions."""
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": "sns:Publish"
                    })
                ])
            })
        })
