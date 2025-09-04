"""Unit tests for TapStack (CDK v2) using aws_cdk.assertions.

Matches the current stack shape:
- VPC: 2 AZs, public+private (egress), single NAT
- ALB: internet-facing, HTTP :80 only; TG on 8080 with /health
- SG rules: world->ALB:80 (may be inline on SG or a discrete ingress resource),
            ALB SG->App SG:8080, App SG->RDS SG:5432
- DynamoDB: PAY_PER_REQUEST
- S3: app bucket versioned + KMS; logs bucket w/ CloudTrail write ACL condition
- CloudTrail: multi-region, includes global events, KMS-encrypted, logs to logs bucket
- IAM: EC2 role with SSM core + CW agent and scoped inline perms (as AWS::IAM::Policy)
- Logs: log group /nova/<env>/app with 30d retention
- Alarm: CPU >= 70%
- SSM params: 4 under path; one Secrets Manager secret
- Outputs: critical set present
"""

from __future__ import annotations

import json
import unittest

import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Match, Template

from lib.tap_stack import TapStack, TapStackProps


@pytest.mark.describe("TapStack Unit Tests (current stack shape)")
class TestTapStack(unittest.TestCase):
    """Validates the synthesized CloudFormation against expected architecture."""

    def setUp(self) -> None:
        """Create a fresh CDK app/stack before each test."""
        self.app = cdk.App()
        self.stack = TapStack(
            self.app,
            "TapStackUnderTest",
            props=TapStackProps(environment_suffix="unit"),
            env=cdk.Environment(account="111111111111", region="us-west-1"),
        )
        self.template: Template = Template.from_stack(self.stack)

    # ---------- VPC / Subnets / NAT ----------

    @pytest.mark.it("VPC has 2 public + 2 private subnets and a single NAT")
    def test_vpc_and_subnets_and_nat(self) -> None:
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        # 2 AZs x (Public + Private) => 4 Subnets
        self.template.resource_count_is("AWS::EC2::Subnet", 4)
        # Single NAT Gateway
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

    # ---------- Security Groups ----------

    @pytest.mark.it("Security groups and ingress rules are correct")
    def test_security_groups_and_ingress_rules(self) -> None:
        # 3 SGs: ALB, App, RDS
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 3)

        # Ingress: world -> ALB:80 (allow either inline on SG or discrete ingress resource)
        inline_ok = False
        for sg in self.template.find_resources("AWS::EC2::SecurityGroup").values():
            props = sg.get("Properties", {})
            for rule in props.get("SecurityGroupIngress", []) or []:
                if (
                    rule.get("IpProtocol") == "tcp"
                    and rule.get("FromPort") == 80
                    and rule.get("ToPort") == 80
                    and rule.get("CidrIp") == "0.0.0.0/0"
                ):
                    inline_ok = True
                    break
            if inline_ok:
                break

        if not inline_ok:
            # Fall back to a discrete ingress resource with CidrIp
            self.template.has_resource_properties(
                "AWS::EC2::SecurityGroupIngress",
                {
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0",
                },
            )

        # Ingress: ALB SG -> App SG :8080 (explicit SG->SG ingress)
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            Match.object_like(
                {
                    "IpProtocol": "tcp",
                    "FromPort": 8080,
                    "ToPort": 8080,
                    "GroupId": Match.any_value(),
                    "SourceSecurityGroupId": Match.any_value(),
                }
            ),
        )

        # Ingress: App SG -> RDS SG :5432 (explicit SG->SG ingress)
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            Match.object_like(
                {
                    "IpProtocol": "tcp",
                    "FromPort": 5432,
                    "ToPort": 5432,
                    "GroupId": Match.any_value(),
                    "SourceSecurityGroupId": Match.any_value(),
                }
            ),
        )

    # ---------- ALB / Target Group / Listener ----------

    @pytest.mark.it("ALB, HTTP :80 listener, TG on app port with health checks")
    def test_alb_listener_and_target_group(self) -> None:
        self.template.resource_count_is(
            "AWS::ElasticLoadBalancingV2::LoadBalancer", 1
        )
        self.template.resource_count_is(
            "AWS::ElasticLoadBalancingV2::TargetGroup", 1
        )
        # HTTP listener :80 (no HTTPS)
        self.template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener",
            {"Port": 80, "Protocol": "HTTP"},
        )
        # TargetGroup: HTTP 8080 with health check enabled (path /health)
        self.template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            Match.object_like(
                {
                    "Protocol": "HTTP",
                    "Port": 8080,
                    "TargetType": "instance",
                    "HealthCheckEnabled": True,
                    "HealthCheckPath": "/health",
                }
            ),
        )

    # ---------- ASG / Launch Template ----------

    @pytest.mark.it("ASG and LaunchTemplate exist with min/desired/max 1/1/3")
    def test_asg_and_launch_template(self) -> None:
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        self.template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        self.template.has_resource_properties(
            "AWS::AutoScaling::AutoScalingGroup",
            {
                "MinSize": "1",
                "MaxSize": "3",
                "DesiredCapacity": "1",
            },
        )

    # ---------- S3 Buckets (App & Logs) ----------

    @pytest.mark.it("S3 buckets: app is versioned + KMS; logs bucket has CloudTrail write ACL condition")
    def test_s3_buckets_encryption_versioning_and_policies(self) -> None:
        # Two buckets: app + logs
        self.template.resource_count_is("AWS::S3::Bucket", 2)

        # App bucket versioning enabled + SSE KMS
        self.template.has_resource_properties(
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
        self.template.has_resource_properties(
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
        self.template.has_resource_properties(
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

    @pytest.mark.it("DynamoDB table uses PAY_PER_REQUEST")
    def test_dynamodb_pay_per_request(self) -> None:
        self.template.has_resource_properties(
            "AWS::DynamoDB::Table", {"BillingMode": "PAY_PER_REQUEST"}
        )

    # ---------- KMS Key ----------

    @pytest.mark.it("KMS key has rotation enabled")
    def test_kms_key_rotation_enabled(self) -> None:
        self.template.has_resource_properties(
            "AWS::KMS::Key", {"EnableKeyRotation": True}
        )

    # ---------- SSM Parameters & Secret ----------

    @pytest.mark.it("Four SSM parameters under env path + one Secrets Manager secret")
    def test_ssm_parameters_and_secret_exist(self) -> None:
        self.template.resource_count_is("AWS::SSM::Parameter", 4)
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

        # Spot-check one parameter path prefix is present (APP_ENV)
        self.template.has_resource_properties(
            "AWS::SSM::Parameter",
            Match.object_like(
                {
                    "Type": "String",
                    "Name": Match.string_like_regexp(r"^/nova/unit/app/APP_ENV$"),
                }
            ),
        )

    # ---------- CloudTrail ----------

    @pytest.mark.it("CloudTrail is multi-region, includes global events, uses KMS and logs to logs bucket")
    def test_cloudtrail_multi_region_and_kms(self) -> None:
        # Core properties verified directly
        self.template.has_resource_properties(
            "AWS::CloudTrail::Trail",
            {
                "IsMultiRegionTrail": True,
                "IncludeGlobalServiceEvents": True,
                "S3BucketName": Match.any_value(),
            },
        )

        # KMS property name varies by CFN/CDK version: accept KmsKeyId or KMSKeyId
        trails = self.template.find_resources("AWS::CloudTrail::Trail")
        self.assertTrue(trails, "Expected at least one CloudTrail::Trail resource")
        kms_present = False
        for t in trails.values():
            props = (t or {}).get("Properties", {})
            if "KmsKeyId" in props or "KMSKeyId" in props:
                kms_present = True
                break
        self.assertTrue(
            kms_present,
            "CloudTrail must specify a KMS key id (KmsKeyId/KMSKeyId)",
        )

    # ---------- CloudWatch Logs + Alarm ----------

    @pytest.mark.it("LogGroup /nova/unit/app with 30d retention; CPU alarm threshold 70")
    def test_log_group_and_cpu_alarm(self) -> None:
        # LogGroup
        self.template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {"LogGroupName": "/nova/unit/app", "RetentionInDays": 30},
        )
        # Alarm threshold and comparison operator
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            Match.object_like(
                {
                    "Threshold": 70,
                    "ComparisonOperator": "GreaterThanOrEqualToThreshold",
                }
            ),
        )

    # ---------- IAM Role ----------

    @pytest.mark.it("Instance role has SSM core + CW agent + scoped inline policies")
    def test_instance_role_policies_minimum_required(self) -> None:
        # Role exists with EC2 assume-role and description
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            Match.object_like(
                {
                    "Description": "IAM role for Nova application instances",
                    "AssumeRolePolicyDocument": {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {"Principal": {"Service": "ec2.amazonaws.com"}}
                                )
                            ]
                        )
                    },
                }
            ),
        )

        # Managed policies (check by substring due to Fn::Join/Sub)
        roles = self.template.find_resources("AWS::IAM::Role")
        found_ssm = any(
            "AmazonSSMManagedInstanceCore" in str(r) for r in roles.values()
        )
        found_cw_agent = any(
            "CloudWatchAgentServerPolicy" in str(r) for r in roles.values()
        )
        self.assertTrue(
            found_ssm,
            "EC2 role must include AmazonSSMManagedInstanceCore managed policy",
        )
        self.assertTrue(
            found_cw_agent,
            "EC2 role must include CloudWatchAgentServerPolicy managed policy",
        )

        # Inline policy attached to the *instance* role: verify SSM + Logs via matchers
        self.template.has_resource_properties(
            "AWS::IAM::Policy",
            Match.object_like(
                {
                    # Narrow to the instance-role inline policy to avoid matching CloudTrail's policy
                    "PolicyName": Match.string_like_regexp(
                        r"^NovaInstanceRoleDefaultPolicy"
                    ),
                    "PolicyDocument": {
                        "Statement": Match.array_with(
                            [
                                # SSM parameter gets (prefix-scoped)
                                Match.object_like(
                                    {
                                        "Effect": "Allow",
                                        "Action": Match.array_with(
                                            [
                                                "ssm:GetParameter",
                                                "ssm:GetParameters",
                                                "ssm:GetParametersByPath",
                                            ]
                                        ),
                                    }
                                ),
                                # CloudWatch Logs writes
                                Match.object_like(
                                    {
                                        "Effect": "Allow",
                                        "Action": Match.array_with(
                                            [
                                                "logs:CreateLogGroup",
                                                "logs:CreateLogStream",
                                                "logs:PutLogEvents",
                                            ]
                                        ),
                                    }
                                ),
                            ]
                        )
                    },
                    "Roles": Match.any_value(),
                }
            ),
        )

        # Secrets Manager read MUST be present, but CDK may render Action as string or list.
        policies = self.template.find_resources("AWS::IAM::Policy")

        # Find the inline policy attached to the instance role
        inst_policy = None
        for _, pol in policies.items():
            props = (pol or {}).get("Properties", {})
            pname = props.get("PolicyName", "")
            if isinstance(pname, str) and pname.startswith(
                "NovaInstanceRoleDefaultPolicy"
            ):
                inst_policy = pol
                break
        self.assertIsNotNone(
            inst_policy, "Could not find inline policy for NovaInstanceRole"
        )

        statements = (
            inst_policy.get("Properties", {})
            .get("PolicyDocument", {})
            .get("Statement", [])
            or []
        )

        has_secret = False
        for st in statements:
            actions = st.get("Action")
            if isinstance(actions, list) and any(
                a == "secretsmanager:GetSecretValue" for a in actions
            ):
                has_secret = True
                break
            if isinstance(actions, str) and actions == "secretsmanager:GetSecretValue":
                has_secret = True
                break

        self.assertTrue(
            has_secret,
            "EC2 role inline policy must allow secretsmanager:GetSecretValue (string or list).",
        )

    # ---------- Outputs ----------

    @pytest.mark.it("Critical stack outputs are present")
    def test_stack_outputs_exist(self) -> None:
        outputs = self.template.to_json().get("Outputs", {})
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
        for key in expected:
            self.assertIn(key, outputs, f"Missing output: {key}")
            self.assertIn("Value", outputs[key], f"Output {key} missing Value")
