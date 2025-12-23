import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStackUnit(unittest.TestCase):
    def setUp(self):
        self.app = cdk.App()

    @mark.it("creates expected top level resources")
    def test_creates_expected_resources(self):
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix="test")
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.resource_count_is("AWS::KMS::Key", 1)
        template.resource_count_is("AWS::SNS::Topic", 1)

        buckets = template.find_resources("AWS::S3::Bucket")
        self.assertGreaterEqual(len(buckets), 3)

        secrets = template.find_resources("AWS::SecretsManager::Secret")
        self.assertGreaterEqual(len(secrets), 2)

    @mark.it("configures KMS key rotation")
    def test_kms_key_rotation_enabled(self):
        stack = TapStack(
            self.app, "TapStackTestKms", TapStackProps(environment_suffix="test")
        )
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True,
            },
        )

    @mark.it("exports required stack outputs")
    def test_outputs_exist(self):
        stack = TapStack(
            self.app, "TapStackTestOutputs", TapStackProps(environment_suffix="test")
        )
        template = Template.from_stack(stack)

        outputs = template.find_outputs("*")
        self.assertIn("S3BucketName", outputs)
        self.assertIn("CloudFrontDomainName", outputs)
        self.assertIn("LoadBalancerDNS", outputs)

    @mark.it("enables bucket encryption")
    def test_bucket_encryption_present(self):
        stack = TapStack(
            self.app, "TapStackTestBuckets", TapStackProps(environment_suffix="test")
        )
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.any_value(),
                },
            },
        )
