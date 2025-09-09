# tests/unit/test_tap_stack.py
import json
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


ACCOUNT = "123456789012"
REGION = "us-west-2"  # <<< changed
ENV = cdk.Environment(account=ACCOUNT, region=REGION)


def _new_app():
    # Provide a cert arn so the ALB is HTTPS-only during tests
    return cdk.App(
        context={
            "acm_cert_arn": f"arn:aws:acm:{REGION}:{ACCOUNT}:certificate/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",  # <<< region in ARN updated
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

    def test_s3_buckets_properties_and_logging(self):
        stack = self._mk_stack("testenv")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::S3::Bucket", 2)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "VersioningConfiguration": {"Status": "Enabled"},
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
                "LoggingConfiguration": {
                    "DestinationBucketName": Match.any_value(),
                    "LogFilePrefix": "data-bucket-logs/",
                },
            },
        )

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "VersioningConfiguration": {"Status": "Enabled"},
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
                "LoggingConfiguration": Match.absent(),
            },
        )

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

    def test_vpc_endpoints_exist_for_s3_dynamodb_and_ssm_family(self):
        stack = self._mk_stack("testenv")
        template = Template.from_stack(stack)

        gw_eps = template.find_resources(
            "AWS::EC2::VPCEndpoint", {"VpcEndpointType": "Gateway"}
        )
        if_eps = template.find_resources(
            "AWS::EC2::VPCEndpoint", {"VpcEndpointType": "Interface"}
        )

        self.assertGreaterEqual(len(gw_eps), 2, "Expected >=2 Gateway endpoints (S3, DynamoDB)")
        self.assertGreaterEqual(len(if_eps), 3, "Expected >=3 Interface endpoints (SSM, SSMMessages, EC2Messages)")

        gw_service_json = [json.dumps(res.get("Properties", {}).get("ServiceName")) for res in gw_eps.values()]
        self.assertTrue(any("s3" in s for s in gw_service_json), "No S3 gateway endpoint found")
        self.assertTrue(any("dynamodb" in s for s in gw_service_json), "No DynamoDB gateway endpoint found")

        if_service_json = [json.dumps(res.get("Properties", {}).get("ServiceName")) for res in if_eps.values()]
        self.assertTrue(any("ssm" in s for s in if_service_json), "No SSM interface endpoint found")
        self.assertTrue(any("ssmmessages" in s for s in if_service_json), "No SSMMessages interface endpoint found")
        self.assertTrue(any("ec2messages" in s for s in if_service_json), "No EC2Messages interface endpoint found")

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

    def test_lambda_runs_in_vpc_and_has_memory(self):
        stack = self._mk_stack("stage")
        template = Template.from_stack(stack)

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

    def test_alb_https_listener_only(self):
        stack = self._mk_stack("prod")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener",
            {"Port": 443, "Protocol": "HTTPS", "Certificates": Match.any_value()},
        )
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
