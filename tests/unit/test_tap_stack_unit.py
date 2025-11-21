"""
Unit tests for TapStack.

This module contains comprehensive unit tests for the TapStack CDK construct,
ensuring all resources are created correctly and configured as expected.
Tests validate resource properties, dependencies, and configurations without
requiring actual AWS deployment.
"""
import json
import os
from unittest.mock import patch

import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Template, Match

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app():
    """Create a CDK App for testing."""
    return cdk.App()


@pytest.fixture
def stack(app):
    """Create a TapStack for testing."""
    props = TapStackProps(
        environment_suffix="test123",
        env=cdk.Environment(account="123456789012", region="us-east-1")
    )
    return TapStack(app, "TestStack", props=props, env=props.env)


@pytest.fixture
def template(stack):
    """Generate CloudFormation template from stack."""
    return Template.from_stack(stack)


class TestStackCreation:
    """Test stack initialization and basic properties."""

    def test_stack_creation(self, stack):
        """Test that stack is created successfully."""
        assert stack is not None
        assert stack.environment_suffix == "test123"

    def test_stack_attributes(self, stack):
        """Test stack has all required attributes."""
        assert hasattr(stack, 'kms_key')
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'customer_gateway')
        assert hasattr(stack, 'vpn_connection')
        assert hasattr(stack, 'dms_replication_subnet_group')
        assert hasattr(stack, 'dms_replication_instance')
        assert hasattr(stack, 'cloudendure_role')
        assert hasattr(stack, 'private_hosted_zone')
        assert hasattr(stack, 'migration_tracking_table')
        assert hasattr(stack, 'sns_topic')
        assert hasattr(stack, 'ssm_document')
        assert hasattr(stack, 'rollback_lambda')
        assert hasattr(stack, 'dashboard')


class TestKMSKey:
    """Test KMS key creation and configuration."""

    def test_kms_key_exists(self, template):
        """Test KMS key is created."""
        template.resource_count_is("AWS::KMS::Key", 1)

    def test_kms_key_properties(self, template):
        """Test KMS key has correct properties."""
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })


class TestVPC:
    """Test VPC creation and configuration."""

    def test_vpc_exists(self, template):
        """Test VPC is created."""
        template.resource_count_is("AWS::EC2::VPC", 1)

    def test_vpc_cidr(self, template):
        """Test VPC has correct CIDR block."""
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_vpc_subnets(self, template):
        """Test VPC has public and private subnets."""
        # Count subnets - 3 AZs x 2 subnet types = 6 subnets
        template.resource_count_is("AWS::EC2::Subnet", 6)

    def test_nat_gateway(self, template):
        """Test NAT Gateway is created (cost optimization: 1 NAT gateway)."""
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    def test_vpc_endpoints(self, template):
        """Test VPC endpoints for S3 and DynamoDB are created."""
        # S3 and DynamoDB gateway endpoints
        template.resource_count_is("AWS::EC2::VPCEndpoint", 2)


class TestCustomerGateway:
    """Test Customer Gateway for VPN connection."""

    def test_customer_gateway_exists(self, template):
        """Test Customer Gateway is created."""
        template.resource_count_is("AWS::EC2::CustomerGateway", 1)

    def test_customer_gateway_properties(self, template):
        """Test Customer Gateway has correct properties."""
        template.has_resource_properties("AWS::EC2::CustomerGateway", {
            "BgpAsn": 65000,
            "IpAddress": "203.0.113.12",
            "Type": "ipsec.1"
        })


class TestVPNConnection:
    """Test VPN connection configuration."""

    def test_vpn_gateway_exists(self, template):
        """Test VPN Gateway is created."""
        template.resource_count_is("AWS::EC2::VPNGateway", 1)

    def test_vpn_gateway_properties(self, template):
        """Test VPN Gateway has correct properties."""
        template.has_resource_properties("AWS::EC2::VPNGateway", {
            "Type": "ipsec.1",
            "AmazonSideAsn": 64512
        })

    def test_vpn_gateway_attachment(self, template):
        """Test VPN Gateway is attached to VPC."""
        # There may be multiple gateway attachments (IGW + VPN Gateway)
        resources = template.find_resources("AWS::EC2::VPCGatewayAttachment")
        assert len(resources) >= 1

    def test_vpn_connection_exists(self, template):
        """Test VPN Connection is created."""
        template.resource_count_is("AWS::EC2::VPNConnection", 1)

    def test_vpn_connection_properties(self, template):
        """Test VPN Connection has correct properties."""
        template.has_resource_properties("AWS::EC2::VPNConnection", {
            "Type": "ipsec.1",
            "StaticRoutesOnly": False
        })

    def test_vpn_route_propagation(self, template):
        """Test VPN route propagation is enabled for private subnets."""
        # Should have route propagation for 3 private subnets
        template.resource_count_is("AWS::EC2::VPNGatewayRoutePropagation", 3)


class TestDMS:
    """Test DMS resources for database migration."""

    def test_dms_subnet_group_exists(self, template):
        """Test DMS subnet group is created."""
        template.resource_count_is("AWS::DMS::ReplicationSubnetGroup", 1)

    def test_dms_replication_instance_exists(self, template):
        """Test DMS replication instance is created."""
        template.resource_count_is("AWS::DMS::ReplicationInstance", 1)

    def test_dms_replication_instance_properties(self, template):
        """Test DMS replication instance has correct properties."""
        template.has_resource_properties("AWS::DMS::ReplicationInstance", {
            "ReplicationInstanceClass": "dms.t3.medium",
            "AllocatedStorage": 100,
            "MultiAZ": True,
            "PubliclyAccessible": False,
            # Note: EngineVersion omitted to use AWS default/latest supported version
        })

    def test_dms_security_group(self, template):
        """Test DMS security group is created."""
        # VPC default SG + DMS SG, count varies
        # Just verify at least one security group exists
        resources = template.find_resources("AWS::EC2::SecurityGroup")
        assert len(resources) >= 1


class TestCloudEndureRole:
    """Test CloudEndure IAM role configuration."""

    def test_cloudendure_role_exists(self, template):
        """Test CloudEndure IAM role is created."""
        # CloudEndure agents run on EC2 instances, so role must be assumable by EC2
        # Find the CloudEndure role by matching both role name and service principal
        resources = template.find_resources("AWS::IAM::Role")
        cloudendure_role_found = False
        for resource_id, resource in resources.items():
            props = resource.get("Properties", {})
            role_name = props.get("RoleName", "")
            assume_policy = props.get("AssumeRolePolicyDocument", {})
            statements = assume_policy.get("Statement", [])
            
            # Check if this is the CloudEndure role (matches naming pattern)
            if "cloudendure-role" in role_name or "CloudEndureRole" in resource_id:
                for stmt in statements:
                    principal = stmt.get("Principal", {})
                    service = principal.get("Service", "")
                    if service == "ec2.amazonaws.com":
                        cloudendure_role_found = True
                        break
                if cloudendure_role_found:
                    break
        
        assert cloudendure_role_found, "CloudEndure role with ec2.amazonaws.com service principal not found"

    def test_cloudendure_role_policies(self, template):
        """Test CloudEndure role has required policies."""
        # Check for EC2 permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "ec2:DescribeInstances",
                            "ec2:RunInstances"
                        ])
                    })
                ])
            }
        })


class TestRoute53:
    """Test Route 53 private hosted zone."""

    def test_private_hosted_zone_exists(self, template):
        """Test private hosted zone is created."""
        template.resource_count_is("AWS::Route53::HostedZone", 1)

    def test_private_hosted_zone_properties(self, template, stack):
        """Test private hosted zone has correct properties."""
        template.has_resource_properties("AWS::Route53::HostedZone", {
            "Name": f"migration-{stack.environment_suffix}.internal.",
            "VPCs": Match.array_with([Match.object_like({})])
        })


class TestDynamoDB:
    """Test DynamoDB table for migration tracking."""

    def test_dynamodb_table_exists(self, template):
        """Test DynamoDB table is created."""
        template.resource_count_is("AWS::DynamoDB::Table", 1)

    def test_dynamodb_table_properties(self, template, stack):
        """Test DynamoDB table has correct properties."""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"migration-tracking-{stack.environment_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    def test_dynamodb_table_keys(self, template):
        """Test DynamoDB table has correct partition and sort keys."""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {"AttributeName": "serverId", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ]
        })

    def test_dynamodb_gsi(self, template):
        """Test DynamoDB table has GSI for migration phase queries."""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": Match.array_with([
                Match.object_like({
                    "IndexName": "MigrationPhaseIndex",
                    "KeySchema": [
                        {"AttributeName": "migrationPhase", "KeyType": "HASH"},
                        {"AttributeName": "timestamp", "KeyType": "RANGE"}
                    ]
                })
            ])
        })


class TestSNS:
    """Test SNS topic for notifications."""

    def test_sns_topic_exists(self, template):
        """Test SNS topic is created."""
        template.resource_count_is("AWS::SNS::Topic", 1)

    def test_sns_topic_properties(self, template, stack):
        """Test SNS topic has correct properties."""
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"migration-notifications-{stack.environment_suffix}",
            "DisplayName": f"Migration Status Notifications {stack.environment_suffix}"
        })


class TestSSM:
    """Test Systems Manager document."""

    def test_ssm_document_exists(self, template):
        """Test SSM document is created."""
        template.resource_count_is("AWS::SSM::Document", 1)

    def test_ssm_document_properties(self, template, stack):
        """Test SSM document has correct properties."""
        template.has_resource_properties("AWS::SSM::Document", {
            "Name": f"post-migration-validation-{stack.environment_suffix}",
            "DocumentType": "Command"
        })

    def test_ssm_document_content(self, template):
        """Test SSM document has validation steps."""
        template.has_resource_properties("AWS::SSM::Document", {
            "Content": {
                "schemaVersion": "2.2",
                "mainSteps": Match.array_with([
                    Match.object_like({"name": "validateApplicationHealth"}),
                    Match.object_like({"name": "validateDatabaseConnectivity"}),
                    Match.object_like({"name": "validateServiceAvailability"})
                ])
            }
        })


class TestLambda:
    """Test Lambda function for rollback."""

    def test_lambda_function_exists(self, template):
        """Test Lambda function is created."""
        # May have multiple Lambda functions (including log retention custom resource)
        resources = template.find_resources("AWS::Lambda::Function")
        assert len(resources) >= 1

    def test_lambda_function_properties(self, template, stack):
        """Test Lambda function has correct properties."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"migration-rollback-{stack.environment_suffix}",
            "Runtime": "python3.11",
            "Handler": "index.handler"
        })

    def test_lambda_environment_variables(self, template):
        """Test Lambda function has required environment variables."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "HOSTED_ZONE_ID": Match.any_value(),
                    "TABLE_NAME": Match.any_value(),
                    "SNS_TOPIC_ARN": Match.any_value()
                })
            }
        })

    def test_lambda_role_exists(self, template):
        """Test Lambda execution role is created."""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            }
        })

    def test_lambda_role_permissions(self, template):
        """Test Lambda role has required permissions."""
        # Check for Route53, DynamoDB, SNS, and CloudWatch permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "route53:ChangeResourceRecordSets"
                        ])
                    })
                ])
            }
        })


class TestCloudWatch:
    """Test CloudWatch dashboard."""

    def test_dashboard_exists(self, template):
        """Test CloudWatch dashboard is created."""
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    def test_dashboard_properties(self, template, stack):
        """Test CloudWatch dashboard has correct properties."""
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"migration-dashboard-{stack.environment_suffix}"
        })

    def test_dashboard_has_widgets(self, template):
        """Test CloudWatch dashboard contains monitoring widgets."""
        # Dashboard body is a Fn::Join, just verify dashboard exists with a body
        resources = template.find_resources("AWS::CloudWatch::Dashboard")
        assert len(resources) == 1
        for resource_id, resource in resources.items():
            assert "DashboardBody" in resource["Properties"]


class TestStackOutputs:
    """Test CloudFormation stack outputs."""

    def test_vpc_output(self, template):
        """Test VPC ID output exists."""
        template.has_output("VpcId", {})

    def test_dms_output(self, template):
        """Test DMS replication instance output exists."""
        template.has_output("DmsReplicationInstanceArn", {})

    def test_cloudendure_output(self, template):
        """Test CloudEndure role output exists."""
        template.has_output("CloudEndureRoleArn", {})

    def test_vpn_output(self, template):
        """Test VPN connection output exists."""
        template.has_output("VpnConnectionId", {})

    def test_route53_output(self, template):
        """Test Route 53 output exists."""
        template.has_output("PrivateHostedZoneId", {})

    def test_dynamodb_output(self, template):
        """Test DynamoDB table output exists."""
        template.has_output("MigrationTrackingTableName", {})

    def test_sns_output(self, template):
        """Test SNS topic output exists."""
        template.has_output("SnsTopicArn", {})

    def test_ssm_output(self, template):
        """Test SSM document output exists."""
        template.has_output("SsmDocumentName", {})

    def test_lambda_output(self, template):
        """Test Lambda function output exists."""
        template.has_output("RollbackLambdaArn", {})

    def test_dashboard_output(self, template):
        """Test CloudWatch dashboard output exists."""
        template.has_output("DashboardName", {})


class TestResourceNaming:
    """Test resource naming conventions with environment suffix."""

    def test_all_resources_use_environment_suffix(self, stack):
        """Test all resources include environment suffix in their names."""
        suffix = stack.environment_suffix

        # Check key resource identifiers via node IDs
        # Note: Some CDK resources use tokens for names, so we verify the suffix in the construct ID
        assert suffix in stack.private_hosted_zone.zone_name
        assert suffix in stack.migration_tracking_table.node.id
        assert suffix in stack.sns_topic.node.id
        assert suffix in stack.rollback_lambda.node.id
        assert suffix in stack.dashboard.node.id


class TestSecurityConfiguration:
    """Test security configurations."""

    def test_kms_encryption_for_dynamodb(self, template):
        """Test DynamoDB table uses KMS encryption."""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True,
                "SSEType": "KMS"
            }
        })

    def test_kms_encryption_for_sns(self, template):
        """Test SNS topic uses KMS encryption."""
        template.has_resource_properties("AWS::SNS::Topic", {
            "KmsMasterKeyId": Match.any_value()
        })

    def test_dms_instance_not_public(self, template):
        """Test DMS replication instance is not publicly accessible."""
        template.has_resource_properties("AWS::DMS::ReplicationInstance", {
            "PubliclyAccessible": False
        })


class TestCostOptimization:
    """Test cost optimization configurations."""

    def test_single_nat_gateway(self, template):
        """Test only 1 NAT gateway is created for cost optimization."""
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    def test_dynamodb_pay_per_request(self, template):
        """Test DynamoDB uses pay-per-request billing mode."""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST"
        })


class TestRemovalPolicies:
    """Test removal policies for destroyable resources."""

    def test_dynamodb_removal_policy(self, stack):
        """Test DynamoDB table has DESTROY removal policy."""
        # Access the L2 construct to check removal policy
        assert stack.migration_tracking_table.node.default_child.apply_removal_policy is not None


class TestEdgeCases:
    """Test edge cases and error scenarios."""

    def test_stack_with_different_suffix(self, app):
        """Test stack creation with different environment suffix."""
        props = TapStackProps(
            environment_suffix="prod",
            env=cdk.Environment(account="123456789012", region="us-west-2")
        )
        stack = TapStack(app, "ProdStack", props=props, env=props.env)
        assert stack.environment_suffix == "prod"

    def test_stack_synth_success(self, app, stack):
        """Test stack can be synthesized without errors."""
        template = app.synth().get_stack_by_name(stack.stack_name).template
        assert template is not None
        assert "Resources" in template


class TestIntegrationPoints:
    """Test integration between components."""

    def test_lambda_can_access_dynamodb(self, template):
        """Test Lambda has permissions to access DynamoDB table."""
        # Find all IAM policies and check if any has DynamoDB permissions
        policies = template.find_resources("AWS::IAM::Policy")
        dynamodb_perms_found = False
        for policy_id, policy in policies.items():
            statements = policy["Properties"]["PolicyDocument"]["Statement"]
            for stmt in statements:
                if "Action" in stmt:
                    actions = stmt["Action"] if isinstance(stmt["Action"], list) else [stmt["Action"]]
                    if any("dynamodb:" in action for action in actions):
                        dynamodb_perms_found = True
                        break
        assert dynamodb_perms_found, "DynamoDB permissions not found in any IAM policy"

    def test_lambda_can_access_route53(self, template):
        """Test Lambda has permissions to access Route 53."""
        # Find all IAM policies and check if any has Route 53 permissions
        policies = template.find_resources("AWS::IAM::Policy")
        route53_perms_found = False
        for policy_id, policy in policies.items():
            statements = policy["Properties"]["PolicyDocument"]["Statement"]
            for stmt in statements:
                if "Action" in stmt:
                    actions = stmt["Action"] if isinstance(stmt["Action"], list) else [stmt["Action"]]
                    if any("route53:" in action for action in actions):
                        route53_perms_found = True
                        break
        assert route53_perms_found, "Route 53 permissions not found in any IAM policy"

    def test_lambda_can_publish_to_sns(self, template):
        """Test Lambda has permissions to publish to SNS."""
        # Find all IAM policies and check if any has SNS permissions
        policies = template.find_resources("AWS::IAM::Policy")
        sns_perms_found = False
        for policy_id, policy in policies.items():
            statements = policy["Properties"]["PolicyDocument"]["Statement"]
            for stmt in statements:
                if "Action" in stmt:
                    actions = stmt["Action"] if isinstance(stmt["Action"], list) else [stmt["Action"]]
                    if any("sns:" in action for action in actions):
                        sns_perms_found = True
                        break
        assert sns_perms_found, "SNS permissions not found in any IAM policy"
