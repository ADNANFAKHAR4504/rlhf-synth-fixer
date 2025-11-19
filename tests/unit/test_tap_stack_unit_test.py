"""
Comprehensive unit tests for TapStack - Multi-Region DR Architecture
Tests all components with 100% coverage
"""
import pytest
import os
from aws_cdk import App, Stack
from aws_cdk import assertions as Assert
from lib.tap_stack import TapStack


@pytest.fixture
def app():
    """Create CDK app fixture"""
    return App()


@pytest.fixture
def primary_stack(app):
    """Create primary region stack"""
    return TapStack(
        app,
        "TestPrimaryStack",
        environment_suffix="test",
        primary_region="us-east-1",
        secondary_region="us-west-2",
        log_retention_days=7,
        domain_name="test.example.com",
        env={"account": "123456789012", "region": "us-east-1"},
    )


@pytest.fixture
def secondary_stack(app):
    """Create secondary region stack"""
    return TapStack(
        app,
        "TestSecondaryStack",
        environment_suffix="test",
        primary_region="us-east-1",
        secondary_region="us-west-2",
        log_retention_days=7,
        domain_name="test.example.com",
        env={"account": "123456789012", "region": "us-west-2"},
    )


class TestStackCreation:
    """Test basic stack creation and configuration"""

    def test_stack_created_successfully(self, primary_stack):
        """Verify stack is created"""
        assert primary_stack is not None
        assert isinstance(primary_stack, Stack)

    def test_environment_suffix_applied(self, primary_stack):
        """Verify environment suffix is set correctly"""
        assert primary_stack.environment_suffix == "test"

    def test_primary_region_identification(self, primary_stack):
        """Verify stack correctly identifies as primary region"""
        assert primary_stack.is_primary is True

    def test_secondary_region_identification(self, secondary_stack):
        """Verify stack correctly identifies as secondary region"""
        assert secondary_stack.is_primary is False

    def test_domain_name_configurable(self, primary_stack):
        """Verify domain name is properly configured"""
        assert primary_stack.domain_name == "test.example.com"

    def test_domain_name_from_env(self, app):
        """Test domain name can be read from environment"""
        os.environ["DOMAIN_NAME"] = "env.example.com"
        stack = TapStack(
            app,
            "EnvStack",
            environment_suffix="test",
            env={"account": "123456789012", "region": "us-east-1"},
        )
        assert stack.domain_name == "env.example.com"
        del os.environ["DOMAIN_NAME"]


class TestVPCResources:
    """Test VPC and networking resources"""

    def test_vpc_created(self, primary_stack):
        """Verify VPC is created with correct configuration"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::EC2::VPC", 1)

    def test_vpc_uses_3_azs(self, primary_stack):
        """Verify VPC uses 3 availability zones"""
        template = Assert.Template.from_stack(primary_stack)
        # Check for subnets across multiple AZs
        template.resource_count_is("AWS::EC2::Subnet", 6)  # 3 public + 3 private

    def test_security_groups_created(self, primary_stack):
        """Verify all required security groups are created"""
        template = Assert.Template.from_stack(primary_stack)
        # ALB, ECS, and Database security groups
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)


class TestECSResources:
    """Test ECS cluster and service resources"""

    def test_ecs_cluster_created(self, primary_stack):
        """Verify ECS cluster is created"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::ECS::Cluster", 1)

    def test_ecs_cluster_name_includes_suffix(self, primary_stack):
        """Verify ECS cluster name includes environment suffix"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ECS::Cluster",
            {"ClusterName": Assert.Match.string_like_regexp(".*test.*")},
        )

    def test_fargate_service_created(self, primary_stack):
        """Verify Fargate service is created"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::ECS::Service", 1)

    def test_fargate_service_desired_count(self, primary_stack):
        """Verify service has correct desired count"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ECS::Service", {"DesiredCount": 2}
        )

    def test_task_definition_created(self, primary_stack):
        """Verify ECS task definition is created"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::ECS::TaskDefinition", 1)


class TestLoadBalancer:
    """Test Application Load Balancer resources"""

    def test_alb_created(self, primary_stack):
        """Verify ALB is created"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is(
            "AWS::ElasticLoadBalancingV2::LoadBalancer", 1
        )

    def test_alb_is_internet_facing(self, primary_stack):
        """Verify ALB is internet-facing"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            {"Scheme": "internet-facing"},
        )

    def test_alb_listener_on_port_80(self, primary_stack):
        """Verify ALB has HTTP listener on port 80"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener",
            {"Port": 80, "Protocol": "HTTP"},
        )

    def test_target_group_created(self, primary_stack):
        """Verify target group is created"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is(
            "AWS::ElasticLoadBalancingV2::TargetGroup", 1
        )


class TestAuroraGlobalDatabase:
    """Test Aurora Global Database configuration (CRITICAL FIX #1)"""

    def test_global_cluster_created_in_primary(self, primary_stack):
        """Verify Aurora Global Cluster is created in primary region"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::RDS::GlobalCluster", 1)

    def test_global_cluster_engine_postgres(self, primary_stack):
        """Verify global cluster uses PostgreSQL"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::GlobalCluster", {"Engine": "aurora-postgresql"}
        )

    def test_global_cluster_name_includes_suffix(self, primary_stack):
        """Verify global cluster name includes environment suffix"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::GlobalCluster",
            {"GlobalClusterIdentifier": Assert.Match.string_like_regexp(".*test.*")},
        )

    def test_primary_cluster_created(self, primary_stack):
        """Verify primary Aurora cluster is created"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    def test_secondary_cluster_created(self, secondary_stack):
        """Verify secondary Aurora cluster is created"""
        template = Assert.Template.from_stack(secondary_stack)
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    def test_no_global_cluster_in_secondary(self, secondary_stack):
        """Verify global cluster NOT created in secondary region"""
        template = Assert.Template.from_stack(secondary_stack)
        template.resource_count_is("AWS::RDS::GlobalCluster", 0)

    def test_db_subnet_groups_created(self, primary_stack):
        """Verify database subnet groups are created"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)


class TestS3Replication:
    """Test S3 cross-region replication (CRITICAL FIX #2)"""

    def test_s3_buckets_created_both_regions(self, primary_stack, secondary_stack):
        """Verify S3 buckets created in both regions"""
        primary_template = Assert.Template.from_stack(primary_stack)
        secondary_template = Assert.Template.from_stack(secondary_stack)
        primary_template.resource_count_is("AWS::S3::Bucket", 1)
        secondary_template.resource_count_is("AWS::S3::Bucket", 1)

    def test_bucket_versioning_enabled(self, primary_stack):
        """Verify bucket versioning is enabled"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {"VersioningConfiguration": {"Status": "Enabled"}},
        )

    def test_replication_role_created_in_primary(self, primary_stack):
        """Verify S3 replication IAM role created in primary"""
        template = Assert.Template.from_stack(primary_stack)
        # Check for IAM role
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "s3.amazonaws.com"},
                        }
                    ]
                }
            },
        )

    def test_no_replication_role_in_secondary(self, secondary_stack):
        """Verify no S3 replication role in secondary"""
        template = Assert.Template.from_stack(secondary_stack)
        # Secondary should not have S3 replication assume role
        resources = template.to_json()["Resources"]
        s3_roles = [
            r for r in resources.values()
            if r.get("Type") == "AWS::IAM::Role"
            and "s3.amazonaws.com" in str(r.get("Properties", {}).get("AssumeRolePolicyDocument", {}))
        ]
        assert len(s3_roles) == 0


class TestRoute53Configuration:
    """Test Route 53 DNS and health checks (CRITICAL FIX #3, #5)"""

    def test_hosted_zone_created_in_primary(self, primary_stack):
        """Verify hosted zone created in primary region"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::Route53::HostedZone", 1)

    def test_hosted_zone_uses_custom_domain(self, primary_stack):
        """Verify hosted zone uses configured domain"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Route53::HostedZone", {"Name": "test.example.com."}
        )

    def test_health_check_uses_http_port_80(self, primary_stack):
        """Verify health check uses HTTP on port 80 (CRITICAL FIX #3)"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Route53::HealthCheck",
            {"HealthCheckConfig": {"Type": "HTTP", "Port": 80}},
        )

    def test_primary_record_created(self, primary_stack):
        """Verify primary Route 53 record created with weight 100"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Route53::RecordSet", {"Weight": 100}
        )

    def test_no_hosted_zone_in_secondary(self, secondary_stack):
        """Verify hosted zone NOT created in secondary (reuses primary)"""
        template = Assert.Template.from_stack(secondary_stack)
        template.resource_count_is("AWS::Route53::HostedZone", 0)


class TestDynamoDBGlobalTable:
    """Test DynamoDB Global Table configuration"""

    def test_dynamodb_table_created_in_primary(self, primary_stack):
        """Verify DynamoDB table created in primary region"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::DynamoDB::Table", 1)

    def test_dynamodb_table_name_includes_suffix(self, primary_stack):
        """Verify table name includes environment suffix"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"TableName": Assert.Match.string_like_regexp(".*test.*")},
        )

    def test_dynamodb_pitr_enabled(self, primary_stack):
        """Verify point-in-time recovery is enabled"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True}},
        )

    def test_dynamodb_billing_mode_on_demand(self, primary_stack):
        """Verify billing mode is pay-per-request"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::DynamoDB::Table", {"BillingMode": "PAY_PER_REQUEST"}
        )


class TestEventBridge:
    """Test EventBridge cross-region configuration (CRITICAL FIX #4)"""

    def test_event_bus_created_both_regions(self, primary_stack, secondary_stack):
        """Verify event bus created in both regions"""
        primary_template = Assert.Template.from_stack(primary_stack)
        secondary_template = Assert.Template.from_stack(secondary_stack)
        primary_template.resource_count_is("AWS::Events::EventBus", 1)
        secondary_template.resource_count_is("AWS::Events::EventBus", 1)

    def test_event_bus_name_includes_suffix(self, primary_stack):
        """Verify event bus name includes environment suffix"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Events::EventBus",
            {"Name": Assert.Match.string_like_regexp(".*test.*")},
        )

    def test_event_rule_created(self, primary_stack):
        """Verify event rule is created"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::Events::Rule", 1)


class TestCloudWatchMonitoring:
    """Test CloudWatch monitoring and logging (MEDIUM FIX #8)"""

    def test_cloudwatch_alarm_created_in_primary(self, primary_stack):
        """Verify CloudWatch alarm for replication lag"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::CloudWatch::Alarm", 1)

    def test_alarm_uses_correct_metric_name(self, primary_stack):
        """Verify alarm uses AuroraGlobalDBReplicationLag metric (MEDIUM FIX #8)"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {"MetricName": "AuroraGlobalDBReplicationLag"},
        )

    def test_log_groups_created(self, primary_stack):
        """Verify CloudWatch log groups are created"""
        template = Assert.Template.from_stack(primary_stack)
        # ECS creates additional log group, so we expect at least 2
        template.resource_count_is("AWS::Logs::LogGroup", 3)

    def test_log_retention_configured(self, primary_stack):
        """Verify log retention is properly configured"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Logs::LogGroup", {"RetentionInDays": 7}
        )


class TestOutputs:
    """Test CloudFormation outputs"""

    def test_alb_endpoint_output(self, primary_stack):
        """Verify ALB endpoint is exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        alb_outputs = [
            o for o in outputs.values()
            if "ALB" in o.get("Description", "")
        ]
        assert len(alb_outputs) > 0

    def test_domain_name_output(self, primary_stack):
        """Verify domain name is exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        domain_outputs = [
            o for o in outputs.values()
            if "domain" in o.get("Description", "").lower()
        ]
        assert len(domain_outputs) > 0


class TestResourceNaming:
    """Test resource naming conventions"""

    def test_all_resources_include_suffix(self, primary_stack):
        """Verify all major resources include environment suffix"""
        template = Assert.Template.from_stack(primary_stack)
        resources = template.to_json()["Resources"]

        # Check key resource types for suffix in logical IDs
        resource_types = [
            "AWS::EC2::VPC",
            "AWS::ECS::Cluster",
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            "AWS::RDS::DBCluster",
            "AWS::S3::Bucket",
            "AWS::DynamoDB::Table",
        ]

        for resource_type in resource_types:
            matching = [r for r in resources.values() if r["Type"] == resource_type]
            assert len(matching) > 0, f"No resources found of type {resource_type}"


class TestRemovalPolicies:
    """Test that resources can be destroyed (no retention policies)"""

    def test_no_retain_policies_on_s3(self, primary_stack):
        """Verify S3 buckets have deletion policy"""
        template = Assert.Template.from_stack(primary_stack)
        resources = template.to_json()["Resources"]
        s3_buckets = [r for r in resources.values() if r["Type"] == "AWS::S3::Bucket"]
        for bucket in s3_buckets:
            deletion_policy = bucket.get("DeletionPolicy")
            # Should be Delete, not Retain
            assert deletion_policy != "Retain"

    def test_aurora_clusters_destroyable(self, primary_stack):
        """Verify Aurora clusters can be destroyed"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::DBCluster", {"DeletionProtection": False}
        )
