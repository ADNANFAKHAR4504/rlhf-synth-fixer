# tests/unit/test_tap_stack.py
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


ACCOUNT = "123456789012"
REGION = "us-east-1"
ENV = cdk.Environment(account=ACCOUNT, region=REGION)


def _new_app():
    # Ensure we can create an HTTPS listener (stack requires an ACM cert ARN)
    return cdk.App(
        context={
            "acm_cert_arn": f"arn:aws:acm:{REGION}:{ACCOUNT}:certificate/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            "owner": "PlatformTeam",
        }
    )


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack (CDK v2)"""

    def setUp(self):
        self.app = _new_app()

    def _mk_stack(self, env_suffix: str | None = None) -> TapStack:
        props = TapStackProps(environment_suffix=env_suffix) if env_suffix else None
        return TapStack(self.app, f"TapStack-{env_suffix or 'dev'}", props, env=ENV)

    # --- S3 tests (your originals kept, since they’re passing) ---

    def test_s3_buckets_created_with_expected_names_and_logging(self):
        stack = self._mk_stack("testenv")
        template = Template.from_stack(stack)

        # Expect TWO buckets: logs + data
        template.resource_count_is("AWS::S3::Bucket", 2)

        # Logs bucket (name assertions left as-is if your stack still sets names)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": f"tap-logs-testenv-{ACCOUNT}-{REGION}",
                "VersioningConfiguration": {"Status": "Enabled"},
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
            },
        )

        # Data bucket + server access logging
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": f"tap-data-testenv-{ACCOUNT}-{REGION}",
                "VersioningConfiguration": {"Status": "Enabled"},
                "LoggingConfiguration": {
                    "DestinationBucketName": {"Ref": Match.any_value()},
                    "LogFilePrefix": "data-bucket-logs/",
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
            },
        )

        # TLS-only bucket policy present
        template.resource_count_is("AWS::S3::BucketPolicy", 2)
        template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Effect": "Deny",
                                    "Condition": {"Bool": {"aws:SecureTransport": "false"}},
                                }
                            )
                        ]
                    )
                }
            },
        )

    # --- VPC endpoints ---

    def test_vpc_endpoints_exist_for_s3_dynamodb_and_ssm_family(self):
        stack = self._mk_stack("testenv")
        template = Template.from_stack(stack)

        # Instead of asserting an exact count, assert each service endpoint exists.
        # Gateway endpoints
        template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "ServiceName": Match.string_like_regexp(r"\.s3\."),  # ...amazonaws.com/s3
                "VpcEndpointType": "Gateway",
            },
        )
        template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "ServiceName": Match.string_like_regexp(r"\.dynamodb\."),  # ...amazonaws.com/dynamodb
                "VpcEndpointType": "Gateway",
            },
        )
        # Interface endpoints
        template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "ServiceName": Match.string_like_regexp(r"\.ssm\."),  # ...amazonaws.com/ssm
                "VpcEndpointType": "Interface",
            },
        )
        template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "ServiceName": Match.string_like_regexp(r"\.ssmmessages\."),  # .../ssmmessages
                "VpcEndpointType": "Interface",
            },
        )
        template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "ServiceName": Match.string_like_regexp(r"\.ec2messages\."),  # .../ec2messages
                "VpcEndpointType": "Interface",
            },
        )

    # --- RDS ---

    def test_rds_is_encrypted_and_private(self):
        stack = self._mk_stack("qa")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {
                "Engine": "postgres",
                "StorageEncrypted": True,
                "PubliclyAccessible": False,
                "DBSubnetGroupName": Match.any_value(),
                "VPCSecurityGroups": Match.any_value(),
            },
        )

    # --- Lambda ---

    def test_lambda_runs_in_vpc_and_has_memory(self):
        stack = self._mk_stack("stage")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Lambda::Function", 1)
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.11",
                "Handler": "index.lambda_handler",
                "MemorySize": 256,
                "VpcConfig": Match.object_like(
                    {
                        "SecurityGroupIds": Match.any_value(),
                        "SubnetIds": Match.any_value(),
                    }
                ),
            },
        )

    # --- ALB / Listener / TG ---

    def test_alb_https_listener_only(self):
        stack = self._mk_stack("prod")
        template = Template.from_stack(stack)

        # One ALB
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

        # Listener is HTTPS on 443 with a certificate.
        # Fix: don't nest anyValue() inside arrayWith().
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener",
            {
                "Port": 443,
                "Protocol": "HTTPS",
                "Certificates": Match.any_value(),  # just ensure Certificates present
            },
        )

        # Target group uses HTTP 8080 health check on "/"
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            {
                "Port": 8080,
                "Protocol": "HTTP",
                "HealthCheckEnabled": True,
                "HealthCheckPath": "/",
                "HealthCheckPort": "8080",
                "Matcher": {"HttpCode": "200"},
            },
        )

    # --- Tags ---

    def test_global_tags_present_on_vpc(self):
        stack = self._mk_stack("devx")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "Tags": Match.array_with(
                    [
                        Match.object_like({"Key": "Environment", "Value": "devx"}),
                        Match.object_like({"Key": "Owner", "Value": "PlatformTeam"}),
                    ]
                )
            },
        )
