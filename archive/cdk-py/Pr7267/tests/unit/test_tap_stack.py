import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "testenv"
        self.stack = TapStack(self.app, "TapStackTest", self.env_suffix)
        self.template = Template.from_stack(self.stack)

    @mark.it("creates stack with all required resources")
    def test_creates_complete_stack(self):
        # ASSERT - Verify all major resource types exist
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.resource_count_is("AWS::KMS::Key", 2)  # aurora and s3 keys
        self.template.resource_count_is("AWS::RDS::DBCluster", 1)
        self.template.resource_count_is("AWS::RDS::DBInstance", 2)  # writer + 1 reader
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        self.template.resource_count_is("AWS::S3::Bucket", 1)
        # Lambda: 1 main function + 1 CustomResource for S3 auto-delete
        self.assertGreaterEqual(len(self.template.find_resources("AWS::Lambda::Function")), 1)
        self.template.resource_count_is("AWS::SNS::Topic", 1)
        self.template.resource_count_is("AWS::Backup::BackupPlan", 1)
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 3)
        self.template.resource_count_is("AWS::Events::Rule", 2)

    @mark.it("creates VPC with Multi-AZ configuration")
    def test_creates_vpc_multi_az(self):
        # ASSERT
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({"Key": "Name", "Value": f"dr-vpc-{self.env_suffix}"})
            ])
        })

        # Verify Multi-AZ (2 AZs with 2 private + 2 public subnets = 4 total)
        self.template.resource_count_is("AWS::EC2::Subnet", 4)

        # Verify VPC endpoints for S3 and DynamoDB
        self.template.resource_count_is("AWS::EC2::VPCEndpoint", 2)

    @mark.it("creates KMS keys with encryption and rotation")
    def test_creates_kms_keys(self):
        # ASSERT - Verify KMS key properties
        self.template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
            "KeyPolicy": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": "kms:*"
                    })
                ])
            })
        })

        # Verify KMS aliases exist
        self.template.resource_count_is("AWS::KMS::Alias", 2)

    @mark.it("creates Aurora PostgreSQL cluster with Multi-AZ")
    def test_creates_aurora_cluster(self):
        # ASSERT
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": "15.8",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "DeletionProtection": False
        })

        # Verify DB subnet group
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

        # Verify security group
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Aurora PostgreSQL cluster"
        })

        # Verify master secret
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("creates DynamoDB table with PITR and encryption")
    def test_creates_dynamodb_table(self):
        # ASSERT
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"dr-table-{self.env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates S3 bucket with versioning and encryption")
    def test_creates_s3_bucket(self):
        # ASSERT
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"dr-backup-bucket-{self.env_suffix}",
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    })
                ])
            },
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates Lambda function in VPC")
    def test_creates_lambda_function(self):
        # ASSERT
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"dr-function-{self.env_suffix}",
            "Runtime": "python3.11",
            "Timeout": 60
        })

        # Verify Lambda has VPC configuration
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.object_like({
                "SubnetIds": Match.any_value()
            })
        })

    @mark.it("creates SNS topic for notifications")
    def test_creates_sns_topic(self):
        # ASSERT
        self.template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"dr-notifications-{self.env_suffix}",
            "DisplayName": "DR Notifications"
        })

        # Verify SNS topic policy
        self.template.resource_count_is("AWS::SNS::TopicPolicy", 1)

    @mark.it("creates AWS Backup plan with proper configuration")
    def test_creates_backup_plan(self):
        # ASSERT
        self.template.has_resource_properties("AWS::Backup::BackupPlan", {
            "BackupPlan": {
                "BackupPlanName": f"dr-backup-plan-{self.env_suffix}",
                "BackupPlanRule": Match.array_with([
                    Match.object_like({
                        "RuleName": f"HourlyBackup-{self.env_suffix}",
                        "ScheduleExpression": "cron(0 * ? * * *)"
                    })
                ])
            }
        })

        # Verify backup vault
        self.template.resource_count_is("AWS::Backup::BackupVault", 1)

        # Verify backup selections (Aurora and DynamoDB)
        self.template.resource_count_is("AWS::Backup::BackupSelection", 2)

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        # ASSERT - Verify alarms exist (3 total: Aurora CPU, DynamoDB Throttle, Lambda Errors)
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 3)

        # Verify Aurora CPU alarm
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"Aurora-High-CPU-{self.env_suffix}",
            "ComparisonOperator": "GreaterThanThreshold",
            "Threshold": 80,
            "Namespace": "AWS/RDS"
        })

        # Verify DynamoDB throttle alarm
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"DynamoDB-Throttled-Requests-{self.env_suffix}",
            "Namespace": "AWS/DynamoDB"
        })

        # Verify Lambda errors alarm
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"Lambda-Errors-{self.env_suffix}",
            "Namespace": "AWS/Lambda"
        })

    @mark.it("creates EventBridge rules for backup monitoring")
    def test_creates_eventbridge_rules(self):
        # ASSERT
        self.template.resource_count_is("AWS::Events::Rule", 2)

        # Verify backup job rule
        self.template.has_resource_properties("AWS::Events::Rule", {
            "Name": f"backup-job-state-change-{self.env_suffix}",
            "EventPattern": {
                "source": ["aws.backup"],
                "detail-type": ["Backup Job State Change"]
            }
        })

        # Verify restore job rule
        self.template.has_resource_properties("AWS::Events::Rule", {
            "Name": f"restore-job-state-change-{self.env_suffix}",
            "EventPattern": {
                "source": ["aws.backup"],
                "detail-type": ["Restore Job State Change"]
            }
        })

    @mark.it("uses environment suffix in all resource names")
    def test_uses_environment_suffix(self):
        # ASSERT - Verify S3 bucket name includes suffix
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": Match.string_like_regexp(f".*{self.env_suffix}$")
        })

        # Verify DynamoDB table name includes suffix
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": Match.string_like_regexp(f".*{self.env_suffix}$")
        })

        # Verify Lambda function name includes suffix
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": Match.string_like_regexp(f".*{self.env_suffix}$")
        })

    @mark.it("has proper IAM roles and policies")
    def test_creates_iam_roles(self):
        # ASSERT - Verify Lambda role has VPC execution permissions
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            })
        })

        # Verify managed policy for VPC access exists (checking separately to avoid nested matcher issues)
        roles = self.template.find_resources("AWS::IAM::Role")
        has_vpc_policy = False
        for role_id, role in roles.items():
            if "ManagedPolicyArns" in role.get("Properties", {}):
                policy_arns = role["Properties"]["ManagedPolicyArns"]
                for arn in policy_arns:
                    arn_str = str(arn)
                    if "AWSLambdaVPCAccessExecutionRole" in arn_str:
                        has_vpc_policy = True
                        break
        self.assertTrue(has_vpc_policy, "Lambda role should have VPC execution policy")

    @mark.it("has proper security group configurations")
    def test_security_groups(self):
        # ASSERT - Verify security groups exist
        # Aurora SG + Lambda SG
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 2)

        # Verify security groups have egress configuration (inline in SecurityGroup resource)
        security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
        has_egress = False
        for sg_id, sg in security_groups.items():
            if "SecurityGroupEgress" in sg.get("Properties", {}):
                has_egress = True
                break
        self.assertTrue(has_egress, "Security groups should have egress rules configured")

    @mark.it("sets proper removal policies for cleanup")
    def test_removal_policies(self):
        # ASSERT - Verify resources have DeletionPolicy set to Delete
        self.template.has_resource("AWS::RDS::DBCluster", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

        self.template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

        self.template.has_resource("AWS::DynamoDB::Table", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ASSERT
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("has proper resource tags")
    def test_resource_tags(self):
        # Verify VPC has proper tags
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({"Key": "Name"})
            ])
        })
