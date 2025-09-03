# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    def test_s3_bucket_created(self):
        """Test if the S3 bucket is created with the correct properties"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}
                ]
            }
        })

    def test_dynamodb_table_created(self):
        """Test if the DynamoDB table is created with the correct properties"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"tap-data-table-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {"SSEEnabled": True}
        })

    def test_rds_instance_created(self):
        """Test if the RDS instance is created with the correct properties"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceIdentifier": f"tap-db-{env_suffix}",
            "Engine": "postgres",
            "DBInstanceClass": "db.t3.micro",
            "AllocatedStorage": "20",
            "StorageEncrypted": True
        })

    def test_application_load_balancer_created(self):
        """Test if the Application Load Balancer is created with the correct properties"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": f"tap-alb-{env_suffix}",
            "Scheme": "internet-facing"
        })

    def test_api_gateway_created(self):
        """Test if the API Gateway is created with the correct properties"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"tap-api-{env_suffix}"
        })

    def test_sns_topic_created(self):
        """Test if the SNS topic is created with the correct properties"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"tap-notifications-{env_suffix}"
        })

    def test_iam_roles_created(self):
        """Test if the IAM roles for Lambda and EC2 are created with the correct properties"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::IAM::Role", 6)
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"lambda-execution-role-{env_suffix}"
        })
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"ec2-instance-role-{env_suffix}"
        })
