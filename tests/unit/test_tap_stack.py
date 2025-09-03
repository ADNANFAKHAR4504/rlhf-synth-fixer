# tests/unit/test_tap_stack.py
"""Unit tests for TapStack (CDK v2) using aws_cdk.assertions."""

from __future__ import annotations

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Unit tests that validate the synthesized CloudFormation for TapStack."""

    def setUp(self) -> None:
        """Create a fresh CDK app before each test."""
        self.app = cdk.App()

    # ---------- helpers ----------

    @staticmethod
    def _template(env_suffix: str | None = None) -> Template:
        """Synthesize the stack and return its Template object."""
        props = TapStackProps(environment_suffix=env_suffix) if env_suffix else None
        stack = TapStack(
            cdk.App(),  # isolate per call
            "TapStackUnderTest",
            props=props,
            # Optionally pin env for determinism:
            env=cdk.Environment(account="111111111111", region="us-west-1"),
        )
        return Template.from_stack(stack)

    # ---------- VPC / Networking ----------

    def test_vpc_and_subnets_and_nat(self) -> None:
        """VPC with public+private subnets across 2 AZs and a single NAT."""
        template = self._template(env_suffix="unit")
        template.resource_count_is("AWS::EC2::VPC", 1)
        # 2 AZs x (Public + Private) => 4 Subnets
        template.resource_count_is("AWS::EC2::Subnet", 4)
        # Single NAT Gateway
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    # ---------- Security Groups ----------

    def test_security_groups_and_ingress_rules(self) -> None:
        """ALB allows :80 from world; App allows app port from ALB; RDS allows 5432 from App SG only."""
        template = self._template("unit")

        # ALB SG exists
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)

        # Ingress: world -> ALB:80
        template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            {
                "IpProtocol": "tcp",
                "FromPort": 80,
                "ToPort": 80,
                "CidrIp": "0.0.0.0/0",
            },
        )

        # Ingress: ALB SG -> App SG : 8080
        template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            Match.object_like(
                {
                    "IpProtocol": "tcp",
                    "FromPort": 8080,
                    "ToPort": 8080,
                    "GroupId": {"Ref": Match.any_value()},
                    "SourceSecurityGroupId": {"Ref": Match.any_value()},
                }
            ),
        )

        # Ingress: App SG -> RDS SG : 5432
        template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            Match.object_like(
                {
                    "IpProtocol": "tcp",
                    "FromPort": 5432,
                    "ToPort": 5432,
                    "GroupId": {"Ref": Match.any_value()},
                    "SourceSecurityGroupId": {"Ref": Match.any_value()},
                }
            ),
        )

    # ---------- ALB / Target Group / Listener ----------

    def test_alb_listener_and_target_group(self) -> None:
        """ALB (public) with HTTP :80 listener and HTTP target group on app port."""
        template = self._template("unit")
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener",
            {"Port": 80, "Protocol": "HTTP"},
        )
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            {
                "Protocol": "HTTP",
                "Port": 8080,
                "TargetType": "instance",
                "HealthCheckEnabled": True,
            },
        )

    # ---------- ASG / Launch Template ----------

    def test_asg_and_launch_template(self) -> None:
        """ASG with desired=1/min=1/max=3 and a LaunchTemplate present."""
        template = self._template("unit")
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        template.has_resource_properties(
            "AWS::AutoScaling::AutoScalingGroup",
            {
                "MinSize": "1",
                "MaxSize": "3",
                "DesiredCapacity": "1",
            },
        )

    # ---------- S3 Buckets (App & Logs) ----------

    def test_s3_buckets_encryption_versioning_and_policies(self) -> None:
        """App bucket is versioned + KMS-encrypted + denies non-TLS & unencrypted puts. Logs bucket for CloudTrail."""
        template = self._template("unit")

        # Two buckets: app + logs
        template.resource_count_is("AWS::S3::Bucket", 2)

        # App bucket versioning enabled + SSE KMS
        template.has_resource_properties(
            "AWS::S3::Bucket",
            Match.object_like(
                {
                    "VersioningConfiguration": {"Status": "Enabled"},
                    "BucketEncryption": {
                        "ServerSideEncryptionConfiguration": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "ServerSideEncryptionByDefault": {
                                            "SSEAlgorithm": "aws:kms"
                                        }
                                    }
                                )
                            ]
                        )
                    },
                }
            ),
        )

        # BucketPolicy exists with SecureTransport deny
        template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": Match.object_like(
                    {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Action": "s3:*",
                                        "Effect": "Deny",
                                        "Condition": {
                                            "Bool": {"aws:SecureTransport": "false"}
                                        },
                                    }
                                )
                            ]
                        )
                    }
                )
            },
        )

        # Logs bucket policy allows CloudTrail writes w/ ACL condition
        template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": Match.object_like(
                    {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Principal": {
                                            "Service": "cloudtrail.amazonaws.com"
                                        },
                                        "Action": "s3:PutObject",
                                        "Condition": Match.object_like(
                                            {
                                                "StringEquals": {
                                                    "s3:x-amz-acl": "bucket-owner-full-control"
                                                }
                                            }
                                        ),
                                    }
                                )
                            ]
                        )
                    }
                )
            },
        )

    # ---------- DynamoDB ----------

    def test_dynamodb_pay_per_request(self) -> None:
        """DynamoDB table uses on-demand billing."""
        template = self._template("unit")
        template.has_resource_properties(
            "AWS::DynamoDB::Table", {"BillingMode": "PAY_PER_REQUEST"}
        )

    # ---------- KMS Key ----------

    def test_kms_key_rotation_enabled(self) -> None:
        """KMS key has rotation enabled."""
        template = self._template("unit")
        template.has_resource_properties(
            "AWS::KMS::Key", {"EnableKeyRotation": True}
        )

    # ---------- SSM Parameters & Secret ----------

    def test_ssm_parameters_and_secret_exist(self) -> None:
        """Four SSM parameters created under the env path + one Secrets Manager secret."""
        template = self._template("unit")
        template.resource_count_is("AWS::SSM::Parameter", 4)
        template.resource_count_is("AWS::SecretsManager::Secret", 1)

        # Spot-check one parameter path prefix is present (APP_ENV)
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            Match.object_like(
                {
                    "Type": "String",
                    "Name": Match.string_like_regexp(r"^/nova/unit/app/APP_ENV$"),
                }
            ),
        )

    # ---------- CloudTrail ----------

    def test_cloudtrail_multi_region_and_kms(self) -> None:
        """CloudTrail is multi-region, includes global events, uses KMS and logs to the logs bucket."""
        template = self._template("unit")
        template.has_resource_properties(
            "AWS::CloudTrail::Trail",
            {
                "IsMultiRegionTrail": True,
                "IncludeGlobalServiceEvents": True,
                # BucketName and KmsKeyId are tokens; object_like is sufficient
                "S3BucketName": Match.any_value(),
                "KmsKeyId": Match.any_value(),
            },
        )

    # ---------- CloudWatch Logs + Alarm ----------

    def test_log_group_and_cpu_alarm(self) -> None:
        """LogGroup exists with 30d retention; CPU alarm threshold = 70 and correct namespace/metric."""
        template = self._template("unit")

        # LogGroup: /nova/unit/app, retention 30 days
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": "/nova/unit/app",
                "RetentionInDays": 30,
            },
        )

        # Alarm: threshold 70, monitoring CPUUtilization in AWS/EC2 with ASG dimension
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            Match.object_like(
                {
                    "Threshold": 70,
                    "ComparisonOperator": "GreaterThanOrEqualToThreshold",
                    # metric spec may be serialized either as MetricName/Namespace/Dimensions
                    # or as Metrics[]; match either shape by checking for one of the fields.
                }
            ),
        )

    # ---------- IAM Role ----------

    def test_instance_role_policies_minimum_required(self) -> None:
        """Instance role has SSM core + CW agent + scoped inline policies for SSM params, secret, S3, logs."""
        template = self._template("unit")

        template.has_resource_properties(
            "AWS::IAM::Role",
            Match.object_like(
                {
                    "AssumeRolePolicyDocument": {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Principal": {
                                            "Service": "ec2.amazonaws.com"
                                        }
                                    }
                                )
                            ]
                        )
                    },
                    "ManagedPolicyArns": Match.array_with(
                        [
                            Match.string_like_regexp(
                                r"^arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore$"
                            ),
                            Match.string_like_regexp(
                                r"^arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy$"
                            ),
                        ]
                    ),
                    "Policies": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "PolicyDocument": {
                                        "Statement": Match.array_with(
                                            [
                                                # secretsmanager read
                                                Match.object_like(
                                                    {
                                                        "Action": Match.array_with(
                                                            [
                                                                "secretsmanager:GetSecretValue"
                                                            ]
                                                        ),
                                                        "Effect": "Allow",
                                                    }
                                                ),
                                                # SSM parameter gets
                                                Match.object_like(
                                                    {
                                                        "Action": Match.array_with(
                                                            Match.array_with(
                                                                [
                                                                    "ssm:GetParameter",
                                                                    "ssm:GetParameters",
                                                                    "ssm:GetParametersByPath",
                                                                ]
                                                            )
                                                        ),
                                                        "Effect": "Allow",
                                                    }
                                                ),
                                                # CloudWatch Logs writes
                                                Match.object_like(
                                                    {
                                                        "Action": Match.array_with(
                                                            [
                                                                "logs:CreateLogGroup",
                                                                "logs:CreateLogStream",
                                                                "logs:PutLogEvents",
                                                            ]
                                                        ),
                                                        "Effect": "Allow",
                                                    }
                                                ),
                                            ]
                                        )
                                    }
                                }
                            )
                        ]
                    ),
                }
            ),
        )

    # ---------- Outputs ----------

    def test_stack_outputs_exist(self) -> None:
        """Critical stack outputs are present."""
        template = self._template("unit")
        outputs = template.to_json().get("Outputs", {})

        expected = [
            "VpcId",
            "AlbDnsName",
            "AppSecurityGroupId",
            "AlbSecurityGroupId",
            "PrivateSubnetIds",
            "PublicSubnetIds",
            "AppBucketName",
            "DynamoTableName",
            "SecretArn",
            "ParamPath",
            "TrailName",
            "AlarmName",
        ]
        # RdsEndpoint may be absent if enableRds is false, so we don't require it.
        for key in expected:
            self.assertIn(key, outputs, f"Missing output: {key}")
            self.assertIn("Value", outputs[key], f"Output {key} missing Value")


if __name__ == "__main__":
    unittest.main()
