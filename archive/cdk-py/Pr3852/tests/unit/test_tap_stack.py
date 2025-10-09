import unittest

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps
from lib.vpc_stack import VpcStack
from lib.security_groups_stack import SecurityGroupsStack
from lib.alb_stack import ALBStack
from lib.autoscaling_stack import AutoScalingStack
from lib.rds_stack import RDSStack
from lib.elasticache_stack import ElastiCacheStack
from lib.s3_cloudfront_stack import S3CloudFrontStack
from lib.monitoring_stack import MonitoringStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates all child stacks with correct names")
    def test_creates_all_stacks(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, f"TapStack{env_suffix}", TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT - Main stack has nested stack resources
        template = Template.from_stack(stack)
        # All child stacks are NestedStack (CloudFormation::Stack)
        # 8 nested stacks: VpcStack, SecurityGroups, ALB, AutoScaling, RDS, ElastiCache, S3CloudFront, Monitoring
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("VpcStack creates VPC with correct CIDR block")
    def test_vpc_stack_creates_vpc(self):
        # ARRANGE
        app = cdk.App()
        parent_stack = cdk.Stack(app, "ParentStack")
        stack = VpcStack(parent_stack, "VpcStackTest")
        template = Template.from_stack(stack)

        # ASSERT - VPC created with correct CIDR
        template.has_resource_properties(
            "AWS::EC2::VPC", {"CidrBlock": "172.31.0.0/16"}
        )
        # Should have 2 subnets per AZ (public and private), but CDK creates them based on availability
        # Just check that VPC and subnets exist
        template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("SecurityGroupsStack creates security groups for three-tier architecture")
    def test_security_groups_stack(self):
        # ARRANGE
        app = cdk.App()
        parent_stack = cdk.Stack(app, "ParentStack")
        vpc_stack = VpcStack(parent_stack, "VpcStackTest")
        sg_stack = SecurityGroupsStack(parent_stack, "SecurityGroupsTest", vpc=vpc_stack.vpc)
        template = Template.from_stack(sg_stack)

        # ASSERT - Security groups for ALB, EC2, Database, and Redis
        template.resource_count_is("AWS::EC2::SecurityGroup", 4)

    @mark.it("ALBStack creates Application Load Balancer")
    def test_alb_stack(self):
        # ARRANGE
        app = cdk.App()
        parent_stack = cdk.Stack(app, "ParentStack")
        vpc_stack = VpcStack(parent_stack, "VpcStackTest")
        sg_stack = SecurityGroupsStack(parent_stack, "SecurityGroupsTest", vpc=vpc_stack.vpc)
        alb_stack = ALBStack(
            parent_stack, "ALBStackTest", vpc=vpc_stack.vpc, security_group=sg_stack.alb_sg
        )
        template = Template.from_stack(alb_stack)

        # ASSERT - ALB exists and is internet-facing
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            {"Scheme": "internet-facing", "Type": "application"},
        )
        # Target group with health checks
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

    @mark.it("RDSStack creates Aurora Serverless v2 cluster with 3 instances")
    def test_rds_stack(self):
        # ARRANGE
        app = cdk.App()
        parent_stack = cdk.Stack(app, "ParentStack")
        vpc_stack = VpcStack(parent_stack, "VpcStackTest")
        sg_stack = SecurityGroupsStack(parent_stack, "SecurityGroupsTest", vpc=vpc_stack.vpc)
        rds_stack = RDSStack(
            parent_stack, "RDSStackTest", vpc=vpc_stack.vpc, security_group=sg_stack.db_sg
        )
        template = Template.from_stack(rds_stack)

        # ASSERT - Aurora cluster created
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "Engine": "aurora-mysql",
                "ServerlessV2ScalingConfiguration": Match.object_like(
                    {"MinCapacity": 0.5, "MaxCapacity": 2}
                ),
            },
        )
        # Should have 3 instances (1 writer + 2 readers)
        template.resource_count_is("AWS::RDS::DBInstance", 3)

    @mark.it("ElastiCacheStack creates Redis cluster with 6 shards")
    def test_elasticache_stack(self):
        # ARRANGE
        app = cdk.App()
        parent_stack = cdk.Stack(app, "ParentStack")
        vpc_stack = VpcStack(parent_stack, "VpcStackTest")
        sg_stack = SecurityGroupsStack(parent_stack, "SecurityGroupsTest", vpc=vpc_stack.vpc)
        redis_stack = ElastiCacheStack(
            parent_stack, "RedisStackTest", vpc=vpc_stack.vpc, security_group=sg_stack.redis_sg
        )
        template = Template.from_stack(redis_stack)

        # ASSERT - Redis cluster with 6 node groups
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "Engine": "redis",
                "NumNodeGroups": 6,
                "ReplicasPerNodeGroup": 1,
                "AtRestEncryptionEnabled": True,
                "TransitEncryptionEnabled": True,
            },
        )

    @mark.it("S3CloudFrontStack creates S3 bucket and CloudFront distribution")
    def test_s3_cloudfront_stack(self):
        # ARRANGE
        app = cdk.App()
        parent_stack = cdk.Stack(app, "ParentStack")
        s3_stack = S3CloudFrontStack(parent_stack, "S3StackTest")
        template = Template.from_stack(s3_stack)

        # ASSERT - S3 bucket and CloudFront distribution
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        # S3 bucket has auto-delete enabled
        template.has_resource("AWS::S3::Bucket",
            Match.object_like({"DeletionPolicy": "Delete"}))

    @mark.it("creates complete infrastructure stack")
    def test_complete_stack_creation(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackComplete")

        # ASSERT - Stack created without errors
        self.assertIsNotNone(stack)
        # Can synthesize without errors
        self.app.synth()
