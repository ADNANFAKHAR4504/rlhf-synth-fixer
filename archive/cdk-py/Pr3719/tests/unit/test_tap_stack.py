import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from pathlib import Path
import sys
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates the high availability nested stack with default tags")
    def test_creates_nested_stack_with_default_tags(self):
        stack = TapStack(self.app, "TapStackUnderTest")
        template = Template.from_stack(stack)

        resources = template.find_resources("AWS::CloudFormation::Stack")
        self.assertEqual(len(resources), 1)

        nested = next(iter(resources.values()))
        tags = {tag["Key"]: tag["Value"] for tag in nested["Properties"]["Tags"]}

        self.assertEqual(tags.get("Project"), "TapProject")
        self.assertEqual(tags.get("Owner"), "TapTeam")

    @mark.it("applies custom props to nested stack tags")
    def test_nested_stack_uses_custom_props(self):
        props = TapStackProps(
            environment_suffix="qa",
            environment="staging",
            project_name="MyApp",
            owner="TeamX"
        )

        stack = TapStack(self.app, "TapStackCustomProps", props=props)
        template = Template.from_stack(stack)

        resources = template.find_resources("AWS::CloudFormation::Stack")
        self.assertEqual(len(resources), 1)

        nested = next(iter(resources.values()))
        tags = {tag["Key"]: tag["Value"] for tag in nested["Properties"]["Tags"]}

        self.assertEqual(tags.get("Project"), "MyApp")
        self.assertEqual(tags.get("Owner"), "TeamX")

    @mark.it("provisions key resources inside the high availability stack")
    def test_high_availability_nested_stack_resources(self):
        stack = TapStack(self.app, "TapStackResources")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.resource_count_is("AWS::Lambda::Function", 1)

        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "EngineVersion": "16.9"
        })

        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "DB_INSTANCE_ID": Match.any_value(),
                    "ENVIRONMENT": Match.any_value(),
                    "OWNER": Match.any_value()
                })
            }
        })

        outputs = template.to_json().get("Outputs", {})
        self.assertIn("ALBDNSName", outputs)

    @mark.it("verifies VPC configuration with correct subnet types and AZ count")
    def test_vpc_configuration(self):
        stack = TapStack(self.app, "TapStackVPC")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

        # Check for 2 NAT Gateways (one per AZ)
        template.resource_count_is("AWS::EC2::NatGateway", 2)

        # Verify subnet configurations exist
        public_subnets = template.find_resources("AWS::EC2::Subnet",
                                                 {"Properties": {"MapPublicIpOnLaunch": True}}
                                                 )
        self.assertGreaterEqual(len(public_subnets), 2, "Should have at least 2 public subnets")

    @mark.it("validates security group rules for ALB, EC2, and RDS")
    def test_security_group_rules(self):
        stack = TapStack(self.app, "TapStackSG")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        # ALB Security Group - HTTP from internet
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 80,
                    "ToPort": 80,
                    "IpProtocol": "tcp"
                })
            ])
        })

        # EC2 Security Group - SSH access
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for EC2 instances",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 22,
                    "ToPort": 22,
                    "IpProtocol": "tcp"
                })
            ])
        })

        # RDS Security Group - PostgreSQL port 5432
        template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "Description": "Allow PostgreSQL connections from EC2 instances"
        })

    @mark.it("ensures S3 bucket has versioning, encryption, and lifecycle rules")
    def test_s3_log_bucket_configuration(self):
        stack = TapStack(self.app, "TapStackS3")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            },
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Id": "DeleteOldLogs",
                        "Status": "Enabled",
                        "ExpirationInDays": 90,
                        "Transitions": Match.array_with([
                            Match.object_like({
                                "StorageClass": "STANDARD_IA",
                                "TransitionInDays": 30
                            })
                        ])
                    })
                ])
            }
        })

    @mark.it("verifies EC2 IAM role has required managed policies and permissions")
    def test_ec2_iam_role_configuration(self):
        stack = TapStack(self.app, "TapStackIAM")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        # Check for IAM role with EC2 service principal
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    })
                ])
            }),
            "Description": "IAM role for EC2 instances in the web application"
        })

        # Check for inline policy with Secrets Manager and KMS permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with(["secretsmanager:GetSecretValue", "kms:Decrypt"]),
                        "Effect": "Allow"
                    })
                ])
            })
        })

    @mark.it("validates RDS instance configuration with Multi-AZ and encryption")
    def test_rds_database_configuration(self):
        stack = TapStack(self.app, "TapStackRDS")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "EngineVersion": "16.9",
            "DBInstanceClass": "db.r6g.large",
            "AllocatedStorage": "100",
            "StorageType": "gp3",
            "StorageEncrypted": True,
            "MultiAZ": True,
            "BackupRetentionPeriod": 7,
            "PreferredBackupWindow": "03:00-04:00",
            "PreferredMaintenanceWindow": "Mon:04:00-Mon:05:00",
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

        # Check DB subnet group
        template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "DBSubnetGroupDescription": "Subnet group for RDS database"
        })

    @mark.it("verifies RDS deletion protection is disabled for non-prod environments")
    def test_rds_deletion_protection_disabled_for_non_prod(self):
        # Test with dev environment (default)
        stack = TapStack(self.app, "TapStackDev")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False
        })

    @mark.it("ensures ALB is internet-facing with correct listener configuration")
    def test_alb_configuration(self):
        stack = TapStack(self.app, "TapStackALB")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

        # Check for HTTP listener on port 80
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

        # Check target group health check configuration
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckPath": "/",
            "HealthCheckIntervalSeconds": 30,
            "HealthCheckTimeoutSeconds": 5,
            "HealthyThresholdCount": 2,
            "UnhealthyThresholdCount": 3,
            "Port": 80,
            "Protocol": "HTTP"
        })

    @mark.it("validates Auto Scaling Group capacity and scaling policy")
    def test_asg_configuration(self):
        stack = TapStack(self.app, "TapStackASG")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "6",
            "HealthCheckType": "ELB",
            "HealthCheckGracePeriod": 300
        })

        # Check for CPU-based scaling policy
        template.has_resource_properties("AWS::AutoScaling::ScalingPolicy", {
            "PolicyType": "TargetTrackingScaling",
            "TargetTrackingConfiguration": Match.object_like({
                "PredefinedMetricSpecification": {
                    "PredefinedMetricType": "ASGAverageCPUUtilization"
                },
                "TargetValue": 70
            })
        })

    @mark.it("verifies Lambda backup function has correct runtime and timeout")
    def test_lambda_backup_function(self):
        stack = TapStack(self.app, "TapStackLambda")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 300,
            "Environment": {
                "Variables": Match.object_like({
                    "DB_INSTANCE_ID": Match.any_value(),
                    "ENVIRONMENT": Match.any_value(),
                    "OWNER": Match.any_value()
                })
            }
        })

    @mark.it("ensures Lambda has RDS backup permissions")
    def test_lambda_backup_permissions(self):
        stack = TapStack(self.app, "TapStackLambdaPerms")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        # Check for Lambda execution role
        template.has_resource_properties("AWS::IAM::Role", {
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

        # Check for RDS snapshot permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "rds:CreateDBSnapshot",
                            "rds:DescribeDBInstances",
                            "rds:DescribeDBSnapshots",
                            "rds:DeleteDBSnapshot",
                            "rds:ListTagsForResource"
                        ])
                    })
                ])
            })
        })

    @mark.it("validates EventBridge rule schedules Lambda backup daily")
    def test_lambda_scheduled_backup_rule(self):
        stack = TapStack(self.app, "TapStackBackupSchedule")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.has_resource_properties("AWS::Events::Rule", {
            "ScheduleExpression": "cron(0 2 ? * * *)"
        })

    @mark.it("verifies CloudWatch alarms for CPU and memory monitoring")
    def test_cloudwatch_alarms(self):
        stack = TapStack(self.app, "TapStackAlarms")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        # Verify 3 CloudWatch alarms exist
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)

        # High CPU alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/EC2",
            "Threshold": 80,
            "EvaluationPeriods": 2,
            "DatapointsToAlarm": 2,
            "Statistic": "Average",
            "TreatMissingData": "breaching",
            "AlarmDescription": "Alarm when CPU utilization exceeds 80%"
        })

        # Low CPU alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/EC2",
            "Threshold": 20,
            "EvaluationPeriods": 3,
            "DatapointsToAlarm": 3,
            "TreatMissingData": "notBreaching",
            "AlarmDescription": "Alarm when CPU utilization is below 20%"
        })

        # Memory alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "mem_used_percent",
            "Namespace": "CWAgent",
            "Threshold": 85,
            "EvaluationPeriods": 2,
            "DatapointsToAlarm": 2,
            "TreatMissingData": "breaching",
            "AlarmDescription": "Alarm when memory utilization exceeds 85%"
        })

    @mark.it("validates parent stack exports VPC, ALB, and RDS outputs")
    def test_parent_stack_outputs(self):
        stack = TapStack(self.app, "TapStackOutputs")
        template = Template.from_stack(stack)

        outputs = template.to_json().get("Outputs", {})

        self.assertIn("VpcId", outputs)
        self.assertEqual(outputs["VpcId"]["Description"], "VPC ID")

        self.assertIn("AlbDnsName", outputs)
        self.assertEqual(outputs["AlbDnsName"]["Description"], "DNS name of the Application Load Balancer")

        self.assertIn("RdsEndpoint", outputs)
        self.assertEqual(outputs["RdsEndpoint"]["Description"], "RDS database endpoint")

    @mark.it("verifies environment suffix is properly capitalized in nested stack ID")
    def test_environment_suffix_capitalization(self):
        props = TapStackProps(environment_suffix="staging")
        stack = TapStack(self.app, "TapStackStaging", props=props)

        self.assertEqual(stack.environment_suffix, "staging")

        # Check nested stack construct ID has capitalized suffix
        nested_stack_id = stack.high_availability_web_app.node.id
        self.assertEqual(nested_stack_id, "HighAvailabilityWebAppStaging")

    @mark.it("ensures context values override default configurations")
    def test_context_value_resolution(self):
        # Create app with context values
        app_with_context = cdk.App(context={
            "environmentSuffix": "test",
            "environment": "testing",
            "projectName": "ContextProject",
            "owner": "ContextTeam"
        })

        stack = TapStack(app_with_context, "TapStackContext")

        self.assertEqual(stack.environment_suffix, "test")
        self.assertEqual(stack.environment_name, "testing")
        self.assertEqual(stack.project_name, "ContextProject")
        self.assertEqual(stack.owner_name, "ContextTeam")

    @mark.it("validates IAM role names include project and environment context")
    def test_iam_role_naming_convention(self):
        props = TapStackProps(
            environment_suffix="prod",
            environment="production",
            project_name="MyProject",
            owner="MyTeam"
        )
        stack = TapStack(self.app, "TapStackRoleNames", props=props)
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        # Check EC2 role name
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "MyProject-production-prod-Ec2InstanceRole"
        })

        # Check Lambda role name
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "MyProject-production-prod-BackupLambdaRole"
        })

    @mark.it("ensures all stacks have required tags")
    def test_stack_tagging(self):
        props = TapStackProps(
            environment="production",
            project_name="TaggedApp",
            owner="TagTeam"
        )
        stack = TapStack(self.app, "TapStackTags", props=props)
        template = Template.from_stack(stack)

        # Parent stack should have tags
        resources = template.find_resources("AWS::CloudFormation::Stack")
        nested = next(iter(resources.values()))
        tags = {tag["Key"]: tag["Value"] for tag in nested["Properties"]["Tags"]}

        self.assertEqual(tags.get("Environment"), "production")
        self.assertEqual(tags.get("Project"), "TaggedApp")
        self.assertEqual(tags.get("Owner"), "TagTeam")
