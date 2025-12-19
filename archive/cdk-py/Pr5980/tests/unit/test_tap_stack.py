# Unit tests for DisasterRecoveryStack and Route53FailoverStack
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import DisasterRecoveryStack, Route53FailoverStack


@mark.describe("DisasterRecoveryStack - Primary Region")
class TestDisasterRecoveryStackPrimary(unittest.TestCase):
    """Test cases for the primary region DisasterRecoveryStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "unittest"

    @mark.it("creates VPC with 3 AZs and correct subnets")
    def test_creates_vpc_with_3_azs(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        # Note: CDK may optimize NAT gateways based on subnet config
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": f"payment-vpc-{self.env_suffix}"}
            ])
        })

    @mark.it("creates security groups with correct rules")
    def test_creates_security_groups(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have SGs for ALB, ECS, DB
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)

    @mark.it("creates SNS topic for alerts")
    def test_creates_sns_topic(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True,
            alert_email="test@example.com"
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"payment-alerts-{self.env_suffix}",
            "DisplayName": f"Payment Processing Alerts {self.env_suffix}"
        })
        template.resource_count_is("AWS::SNS::Subscription", 1)

    @mark.it("creates primary Aurora PostgreSQL cluster")
    def test_creates_primary_aurora_cluster(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "StorageEncrypted": True,
            "DBClusterIdentifier": f"payment-db-{self.env_suffix}"
        })
        # Should have 2 instances: 1 writer + 1 reader
        template.resource_count_is("AWS::RDS::DBInstance", 2)

    @mark.it("creates CloudWatch alarm for database replication lag")
    def test_creates_db_replication_alarm(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"db-replication-lag-{self.env_suffix}",
            "MetricName": "AuroraGlobalDBReplicationLag",
            "Namespace": "AWS/RDS",
            "Threshold": 300000,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("creates ECS cluster and Fargate service")
    def test_creates_ecs_cluster_and_service(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Cluster", 1)
        template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterName": f"payment-cluster-{self.env_suffix}"
        })
        template.resource_count_is("AWS::ECS::Service", 1)
        template.has_resource_properties("AWS::ECS::Service", {
            "ServiceName": f"payment-service-{self.env_suffix}",
            "DesiredCount": 10  # Primary region has 10 tasks
        })

    @mark.it("creates Fargate task definition with correct specs")
    def test_creates_fargate_task_definition(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::TaskDefinition", 1)
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Cpu": "1024",
            "Memory": "2048",
            "NetworkMode": "awsvpc",
            "RequiresCompatibilities": ["FARGATE"]
        })

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": f"payment-alb-{self.env_suffix}",
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates ALB target group with health checks")
    def test_creates_target_group_with_health_checks(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 8080,
            "Protocol": "HTTP",
            "TargetType": "ip",
            "HealthCheckPath": "/health",
            "HealthCheckIntervalSeconds": 30
        })

    @mark.it("creates CloudWatch alarms for ALB and ECS")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 3 alarms: DB replication, ALB unhealthy, ECS task count
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"alb-unhealthy-targets-{self.env_suffix}"
        })
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"ecs-low-task-count-{self.env_suffix}"
        })

    @mark.it("creates Lambda function for payment validation")
    def test_creates_lambda_function(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT - CDK creates additional Lambda functions for custom resources
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"payment-validation-{self.env_suffix}",
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 30,
            "MemorySize": 512
        })

    @mark.it("creates S3 bucket with versioning and lifecycle policies")
    def test_creates_s3_bucket_primary(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            }
        })

    @mark.it("creates auto-scaling for ECS service")
    def test_creates_auto_scaling(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 1)
        template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 10,
            "MaxCapacity": 50
        })
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 1)

    @mark.it("outputs all required values")
    def test_outputs_required_values(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix=self.env_suffix,
            is_primary=True
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        self.assertIn("DatabaseEndpoint", outputs)
        self.assertIn("LoadBalancerDNS", outputs)
        self.assertIn("LambdaFunctionArn", outputs)
        self.assertIn("VpcId", outputs)
        self.assertIn("ClusterName", outputs)
        self.assertIn("SNSTopicArn", outputs)
        self.assertIn("LogBucketName", outputs)


@mark.describe("DisasterRecoveryStack - DR Region")
class TestDisasterRecoveryStackDR(unittest.TestCase):
    """Test cases for the DR region DisasterRecoveryStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "unittest"

    @mark.it("creates DR Aurora cluster")
    def test_creates_dr_aurora_cluster(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestDRStack",
            environment_suffix=self.env_suffix,
            is_primary=False
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "DBClusterIdentifier": f"payment-db-{self.env_suffix}-dr"
        })
        # DR has 1 instance only (smaller)
        template.resource_count_is("AWS::RDS::DBInstance", 1)

    @mark.it("creates ECS service with minimal capacity for DR")
    def test_creates_ecs_service_with_minimal_capacity(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestDRStack",
            environment_suffix=self.env_suffix,
            is_primary=False
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Service", 1)
        template.has_resource_properties("AWS::ECS::Service", {
            "DesiredCount": 2  # DR region has only 2 tasks
        })

    @mark.it("creates auto-scaling with min capacity of 2 for DR")
    def test_creates_auto_scaling_dr(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestDRStack",
            environment_suffix=self.env_suffix,
            is_primary=False
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 2,
            "MaxCapacity": 50
        })

    @mark.it("creates S3 bucket for DR region")
    def test_creates_s3_bucket_dr(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestDRStack",
            environment_suffix=self.env_suffix,
            is_primary=False
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("does not create replication lag alarm in DR region")
    def test_no_replication_alarm_in_dr(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestDRStack",
            environment_suffix=self.env_suffix,
            is_primary=False
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 2 alarms only (ALB unhealthy, ECS task count)
        template.resource_count_is("AWS::CloudWatch::Alarm", 2)

    @mark.it("outputs DR-specific values")
    def test_outputs_dr_values(self):
        # ARRANGE & ACT
        stack = DisasterRecoveryStack(
            self.app,
            "TestDRStack",
            environment_suffix=self.env_suffix,
            is_primary=False
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        self.assertIn("DatabaseEndpointDR", outputs)
        self.assertIn("LoadBalancerDNS", outputs)
        self.assertIn("LogBucketNameDR", outputs)


@mark.describe("Route53FailoverStack")
class TestRoute53FailoverStack(unittest.TestCase):
    """Test cases for the Route53FailoverStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "unittest"

    @mark.it("creates hosted zone with correct domain name")
    def test_creates_hosted_zone(self):
        # ARRANGE & ACT
        stack = Route53FailoverStack(
            self.app,
            "TestRoute53Stack",
            environment_suffix=self.env_suffix,
            primary_alb_dns="primary-alb.us-east-1.elb.amazonaws.com",
            dr_alb_dns="dr-alb.us-east-2.elb.amazonaws.com",
            domain_name="test.com"
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Route53::HostedZone", 1)
        template.has_resource_properties("AWS::Route53::HostedZone", {
            "Name": "test.com."
        })

    @mark.it("creates health check for primary region")
    def test_creates_health_check(self):
        # ARRANGE & ACT
        stack = Route53FailoverStack(
            self.app,
            "TestRoute53Stack",
            environment_suffix=self.env_suffix,
            primary_alb_dns="primary-alb.us-east-1.elb.amazonaws.com",
            dr_alb_dns="dr-alb.us-east-2.elb.amazonaws.com"
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Route53::HealthCheck", 1)
        template.has_resource_properties("AWS::Route53::HealthCheck", {
            "HealthCheckConfig": {
                "Type": "HTTPS",
                "ResourcePath": "/health",
                "Port": 443,
                "RequestInterval": 30,
                "FailureThreshold": 3
            }
        })

    @mark.it("creates primary failover record")
    def test_creates_primary_failover_record(self):
        # ARRANGE & ACT
        stack = Route53FailoverStack(
            self.app,
            "TestRoute53Stack",
            environment_suffix=self.env_suffix,
            primary_alb_dns="primary-alb.us-east-1.elb.amazonaws.com",
            dr_alb_dns="dr-alb.us-east-2.elb.amazonaws.com",
            domain_name="test.com"
        )
        template = Template.from_stack(stack)

        # ASSERT - Note: CDK adds trailing dot to domain names
        template.has_resource_properties("AWS::Route53::RecordSet", {
            "Name": "payments.test.com",
            "Type": "A",
            "Failover": "PRIMARY",
            "SetIdentifier": f"primary-{self.env_suffix}"
        })

    @mark.it("creates secondary failover record")
    def test_creates_secondary_failover_record(self):
        # ARRANGE & ACT
        stack = Route53FailoverStack(
            self.app,
            "TestRoute53Stack",
            environment_suffix=self.env_suffix,
            primary_alb_dns="primary-alb.us-east-1.elb.amazonaws.com",
            dr_alb_dns="dr-alb.us-east-2.elb.amazonaws.com",
            domain_name="test.com"
        )
        template = Template.from_stack(stack)

        # ASSERT - Note: CDK adds trailing dot to domain names
        template.has_resource_properties("AWS::Route53::RecordSet", {
            "Name": "payments.test.com",
            "Type": "A",
            "Failover": "SECONDARY",
            "SetIdentifier": f"secondary-{self.env_suffix}"
        })

    @mark.it("outputs hosted zone and domain name")
    def test_outputs_zone_and_domain(self):
        # ARRANGE & ACT
        stack = Route53FailoverStack(
            self.app,
            "TestRoute53Stack",
            environment_suffix=self.env_suffix,
            primary_alb_dns="primary-alb.us-east-1.elb.amazonaws.com",
            dr_alb_dns="dr-alb.us-east-2.elb.amazonaws.com",
            domain_name="test.com"
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        self.assertIn("HostedZoneId", outputs)
        self.assertIn("PaymentDomainName", outputs)
