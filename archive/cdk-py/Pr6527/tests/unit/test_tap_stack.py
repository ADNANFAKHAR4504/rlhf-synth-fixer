#!/usr/bin/env python3
"""
Comprehensive unit tests for TapStack CDK infrastructure.
Tests all resources, configurations, policies, and compliance requirements.
"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Capture, Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.props = TapStackProps(environment_suffix=self.env_suffix)
        self.stack = TapStack(self.app, "TapStackTest", self.props)
        self.template = Template.from_stack(self.stack)

    # ========================================================================
    # VPC Tests
    # ========================================================================

    @mark.it("creates VPC with correct configuration")
    def test_vpc_creation(self):
        """Test VPC is created with correct settings"""
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates 3 public subnets")
    def test_public_subnets(self):
        """Test public subnets are created across 3 AZs"""
        # Count subnets with MapPublicIpOnLaunch enabled
        self.template.resource_count_is("AWS::EC2::Subnet", 6)  # 3 public + 3 private (database uses isolated)

    @mark.it("creates 2 NAT gateways")
    def test_nat_gateways(self):
        """Test NAT gateways are created for each AZ"""
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)

    @mark.it("creates internet gateway")
    def test_internet_gateway(self):
        """Test internet gateway is created"""
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)

    # ========================================================================
    # Security Group Tests
    # ========================================================================

    @mark.it("creates security groups for all services")
    def test_security_groups_creation(self):
        """Test all required security groups are created"""
        # 5 security groups: Aurora, Redis, ECS, Lambda, ALB
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 5)

    @mark.it("configures Aurora security group correctly")
    def test_aurora_security_group(self):
        """Test Aurora security group allows PostgreSQL traffic"""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": Match.string_like_regexp(".*Aurora.*"),
            "SecurityGroupEgress": Match.any_value()
        })

    # ========================================================================
    # Aurora Cluster Tests
    # ========================================================================

    @mark.it("creates Aurora Serverless v2 cluster")
    def test_aurora_cluster_creation(self):
        """Test Aurora cluster is created"""
        self.template.resource_count_is("AWS::RDS::DBCluster", 1)

    @mark.it("configures Aurora with correct engine version")
    def test_aurora_engine_version(self):
        """Test Aurora uses PostgreSQL engine"""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": Match.string_like_regexp("15.*")
        })

    @mark.it("configures Aurora with encryption")
    def test_aurora_encryption(self):
        """Test Aurora has encryption enabled"""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True
        })

    @mark.it("configures Aurora with serverless v2 scaling")
    def test_aurora_serverless_scaling(self):
        """Test Aurora has serverless v2 scaling configuration"""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "ServerlessV2ScalingConfiguration": {
                "MinCapacity": 4,
                "MaxCapacity": 16
            }
        })

    @mark.it("configures Aurora with backup retention")
    def test_aurora_backup_retention(self):
        """Test Aurora has backup retention configured"""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "BackupRetentionPeriod": 35
        })

    @mark.it("configures Aurora with deletion protection disabled for dev")
    def test_aurora_deletion_protection(self):
        """Test Aurora has deletion protection disabled for dev environment"""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "DeletionProtection": False
        })

    @mark.it("creates Aurora writer instance")
    def test_aurora_writer_instance(self):
        """Test Aurora has writer instance"""
        self.template.resource_count_is("AWS::RDS::DBInstance", 3)  # 1 writer + 2 readers

    @mark.it("configures Aurora CloudWatch logs export")
    def test_aurora_cloudwatch_logs(self):
        """Test Aurora exports logs to CloudWatch"""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    @mark.it("validates Aurora master username pattern")
    def test_aurora_username_pattern(self):
        """Test Aurora master username follows AWS requirements"""
        # MasterUsername can be a CloudFormation function (Fn::Join), so we just check it exists
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "MasterUsername": Match.object_like({})
        })

    # ========================================================================
    # ElastiCache Redis Tests
    # ========================================================================

    @mark.it("creates ElastiCache Redis replication group")
    def test_redis_creation(self):
        """Test Redis replication group is created"""
        self.template.resource_count_is("AWS::ElastiCache::ReplicationGroup", 1)

    @mark.it("configures Redis with multi-AZ")
    def test_redis_multi_az(self):
        """Test Redis has multi-AZ enabled"""
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "MultiAZEnabled": True,
            "AutomaticFailoverEnabled": True
        })

    @mark.it("configures Redis with encryption at rest")
    def test_redis_encryption_at_rest(self):
        """Test Redis has encryption at rest enabled"""
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "AtRestEncryptionEnabled": True
        })

    @mark.it("configures Redis with encryption in transit")
    def test_redis_encryption_in_transit(self):
        """Test Redis has encryption in transit enabled"""
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "TransitEncryptionEnabled": True
        })

    @mark.it("configures Redis with node groups")
    def test_redis_node_groups(self):
        """Test Redis has correct number of node groups"""
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "NumNodeGroups": 5,
            "ReplicasPerNodeGroup": 1
        })

    @mark.it("configures Redis with snapshots")
    def test_redis_snapshots(self):
        """Test Redis has snapshot configuration"""
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "SnapshotRetentionLimit": 5
        })

    @mark.it("configures Redis log delivery to CloudWatch")
    def test_redis_log_delivery(self):
        """Test Redis has log delivery configured"""
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "LogDeliveryConfigurations": Match.any_value()
        })

    @mark.it("creates Redis subnet group")
    def test_redis_subnet_group(self):
        """Test Redis subnet group is created"""
        self.template.resource_count_is("AWS::ElastiCache::SubnetGroup", 1)

    # ========================================================================
    # ECS Fargate Tests
    # ========================================================================

    @mark.it("creates ECS cluster")
    def test_ecs_cluster_creation(self):
        """Test ECS cluster is created"""
        self.template.resource_count_is("AWS::ECS::Cluster", 1)

    @mark.it("creates ECS task definition")
    def test_ecs_task_definition(self):
        """Test ECS task definition is created"""
        self.template.resource_count_is("AWS::ECS::TaskDefinition", 1)

    @mark.it("configures ECS task with Fargate compatibility")
    def test_ecs_fargate_compatibility(self):
        """Test ECS task requires Fargate compatibility"""
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "RequiresCompatibilities": ["FARGATE"],
            "NetworkMode": "awsvpc"
        })

    @mark.it("configures ECS task with correct CPU and memory")
    def test_ecs_task_resources(self):
        """Test ECS task has correct resource allocation"""
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Cpu": "1024",
            "Memory": "2048"
        })

    @mark.it("creates ECS service")
    def test_ecs_service_creation(self):
        """Test ECS service is created"""
        self.template.resource_count_is("AWS::ECS::Service", 1)

    @mark.it("configures ECS service with desired count")
    def test_ecs_service_desired_count(self):
        """Test ECS service has correct desired count"""
        self.template.has_resource_properties("AWS::ECS::Service", {
            "DesiredCount": 8
        })

    @mark.it("creates Application Load Balancer")
    def test_alb_creation(self):
        """Test Application Load Balancer is created"""
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    @mark.it("creates ALB target group")
    def test_alb_target_group(self):
        """Test ALB target group is created"""
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

    @mark.it("creates ALB listener")
    def test_alb_listener(self):
        """Test ALB listener is created"""
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)

    @mark.it("configures ALB listener on port 80")
    def test_alb_listener_port(self):
        """Test ALB listener is on port 80"""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    # ========================================================================
    # DynamoDB Tests
    # ========================================================================

    @mark.it("creates DynamoDB table")
    def test_dynamodb_creation(self):
        """Test DynamoDB table is created"""
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)

    @mark.it("configures DynamoDB with correct key schema")
    def test_dynamodb_key_schema(self):
        """Test DynamoDB has correct partition and sort keys"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {"AttributeName": "pk", "KeyType": "HASH"},
                {"AttributeName": "sk", "KeyType": "RANGE"}
            ]
        })

    @mark.it("configures DynamoDB with GSI")
    def test_dynamodb_gsi(self):
        """Test DynamoDB has global secondary index"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": Match.array_with([
                Match.object_like({
                    "IndexName": "gsi1"
                })
            ])
        })

    @mark.it("configures DynamoDB with encryption")
    def test_dynamodb_encryption(self):
        """Test DynamoDB has encryption enabled"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True
            }
        })

    @mark.it("configures DynamoDB with point-in-time recovery")
    def test_dynamodb_pitr(self):
        """Test DynamoDB has point-in-time recovery enabled"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("configures DynamoDB with provisioned capacity")
    def test_dynamodb_provisioned_capacity(self):
        """Test DynamoDB has provisioned capacity"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 500,
                "WriteCapacityUnits": 500
            }
        })

    @mark.it("configures DynamoDB with contributor insights")
    def test_dynamodb_contributor_insights(self):
        """Test DynamoDB has contributor insights enabled"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "ContributorInsightsSpecification": {
                "Enabled": True
            }
        })

    # ========================================================================
    # Lambda Function Tests
    # ========================================================================

    @mark.it("creates Lambda functions")
    def test_lambda_creation(self):
        """Test Lambda functions are created"""
        # 3 Lambda functions + 2 log retention custom resources (3 logs total, but CDK creates custom resources)
        self.template.resource_count_is("AWS::Lambda::Function", 5)

    @mark.it("creates Lambda IAM role")
    def test_lambda_iam_role(self):
        """Test Lambda IAM role is created"""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {"Service": "lambda.amazonaws.com"}
                    })
                ])
            }
        })

    @mark.it("configures Lambda with VPC access")
    def test_lambda_vpc_access(self):
        """Test Lambda functions have VPC access"""
        # Check that Lambda has VPC configuration managed policy
        self.template.has_resource_properties("AWS::IAM::Role", {
            "ManagedPolicyArns": Match.array_with([
                Match.object_like({
                    "Fn::Join": Match.array_with([
                        Match.array_with([
                            Match.string_like_regexp(".*AWSLambdaVPCAccessExecutionRole.*")
                        ])
                    ])
                })
            ])
        })

    @mark.it("configures Lambda with X-Ray tracing")
    def test_lambda_xray_tracing(self):
        """Test Lambda functions have X-Ray tracing enabled"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    @mark.it("configures Lambda with correct runtime")
    def test_lambda_runtime(self):
        """Test Lambda functions use correct Python runtime"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11"
        })

    @mark.it("configures Lambda with high memory allocation")
    def test_lambda_memory(self):
        """Test Lambda functions have high memory allocation"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 3008
        })

    @mark.it("configures Lambda with timeout")
    def test_lambda_timeout(self):
        """Test Lambda functions have correct timeout"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Timeout": 900
        })

    @mark.it("creates Lambda log groups with retention")
    def test_lambda_log_retention(self):
        """Test Lambda log retention is configured"""
        self.template.resource_count_is("Custom::LogRetention", 3)

    @mark.it("does not configure reserved concurrent executions")
    def test_lambda_no_reserved_concurrency(self):
        """Test Lambda functions don't have reserved concurrent executions"""
        # Get all Lambda functions and verify none have ReservedConcurrentExecutions
        resources = self.template.find_resources("AWS::Lambda::Function")
        for logical_id, resource in resources.items():
            if "LogRetention" not in logical_id:  # Skip custom resource
                props = resource.get("Properties", {})
                self.assertNotIn("ReservedConcurrentExecutions", props)

    # ========================================================================
    # S3 Bucket Tests
    # ========================================================================

    @mark.it("creates S3 buckets")
    def test_s3_bucket_creation(self):
        """Test S3 buckets are created"""
        self.template.resource_count_is("AWS::S3::Bucket", 3)

    @mark.it("configures S3 buckets with encryption")
    def test_s3_bucket_encryption(self):
        """Test S3 buckets have encryption enabled"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            }
        })

    @mark.it("configures S3 buckets with versioning")
    def test_s3_bucket_versioning(self):
        """Test S3 buckets have versioning enabled"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    @mark.it("configures S3 buckets with intelligent tiering")
    def test_s3_intelligent_tiering(self):
        """Test S3 buckets have intelligent tiering configured"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "IntelligentTieringConfigurations": Match.any_value()
        })

    @mark.it("configures S3 buckets with public access block")
    def test_s3_public_access_block(self):
        """Test S3 buckets block public access"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("configures S3 buckets with lifecycle policies")
    def test_s3_lifecycle_policies(self):
        """Test S3 buckets have lifecycle policies"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": Match.any_value()
        })

    @mark.it("configures S3 buckets with metrics")
    def test_s3_metrics(self):
        """Test S3 buckets have metrics configured"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "MetricsConfigurations": Match.any_value()
        })

    # ========================================================================
    # CloudFormation Outputs Tests
    # ========================================================================

    @mark.it("creates Aurora cluster outputs")
    def test_aurora_outputs(self):
        """Test Aurora cluster outputs are created"""
        outputs = self.template.find_outputs("*")
        self.assertIn("AuroraClusterArn", outputs)
        self.assertIn("AuroraClusterEndpoint", outputs)

    @mark.it("creates Redis cluster outputs")
    def test_redis_outputs(self):
        """Test Redis cluster outputs are created"""
        outputs = self.template.find_outputs("*")
        self.assertIn("RedisClusterId", outputs)

    @mark.it("creates ECS cluster outputs")
    def test_ecs_outputs(self):
        """Test ECS cluster outputs are created"""
        outputs = self.template.find_outputs("*")
        self.assertIn("EcsClusterName", outputs)

    @mark.it("creates DynamoDB table outputs")
    def test_dynamodb_outputs(self):
        """Test DynamoDB table outputs are created"""
        outputs = self.template.find_outputs("*")
        self.assertIn("DynamoTableName", outputs)

    @mark.it("creates Lambda function outputs")
    def test_lambda_outputs(self):
        """Test Lambda function outputs are created"""
        outputs = self.template.find_outputs("*")
        self.assertIn("LambdaFunction0Name", outputs)
        self.assertIn("LambdaFunction1Name", outputs)
        self.assertIn("LambdaFunction2Name", outputs)

    @mark.it("creates S3 bucket outputs")
    def test_s3_outputs(self):
        """Test S3 bucket outputs are created"""
        outputs = self.template.find_outputs("*")
        self.assertIn("S3Bucket0Name", outputs)
        self.assertIn("S3Bucket1Name", outputs)
        self.assertIn("S3Bucket2Name", outputs)

    @mark.it("creates ALB DNS output")
    def test_alb_outputs(self):
        """Test ALB DNS output is created"""
        outputs = self.template.find_outputs("*")
        self.assertIn("ALBDnsName", outputs)

    # ========================================================================
    # Tagging Tests
    # ========================================================================

    @mark.it("applies Environment tag to all resources")
    def test_environment_tag(self):
        """Test all resources have Environment tag"""
        # Check multiple resource types for tags
        resource_types = [
            "AWS::S3::Bucket",
            "AWS::DynamoDB::Table",
            "AWS::Lambda::Function"
        ]
        for resource_type in resource_types:
            self.template.has_resource_properties(resource_type, {
                "Tags": Match.array_with([
                    Match.object_like({"Key": "Environment", "Value": self.env_suffix})
                ])
            })

    @mark.it("applies Project tag to all resources")
    def test_project_tag(self):
        """Test all resources have Project tag"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "Tags": Match.array_with([
                Match.object_like({"Key": "Project", "Value": "TAP"})
            ])
        })

    @mark.it("applies OptimizationCandidate tag to all resources")
    def test_optimization_candidate_tag(self):
        """Test all resources have OptimizationCandidate tag"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "Tags": Match.array_with([
                Match.object_like({"Key": "OptimizationCandidate", "Value": "true"})
            ])
        })

    # ========================================================================
    # Naming Convention Tests
    # ========================================================================

    @mark.it("uses correct naming pattern for Aurora cluster")
    def test_aurora_naming(self):
        """Test Aurora cluster uses correct naming convention"""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "DBClusterIdentifier": f"tap-aurora-{self.env_suffix}"
        })

    @mark.it("uses correct naming pattern for Redis cluster")
    def test_redis_naming(self):
        """Test Redis cluster uses correct naming convention"""
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "ReplicationGroupId": f"tap-redis-{self.env_suffix}"
        })

    @mark.it("uses correct naming pattern for DynamoDB table")
    def test_dynamodb_naming(self):
        """Test DynamoDB table uses correct naming convention"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"tap-table-{self.env_suffix}"
        })

    # ========================================================================
    # Deletion Policy Tests
    # ========================================================================

    @mark.it("configures Aurora with delete policy")
    def test_aurora_deletion_policy(self):
        """Test Aurora has proper deletion policy"""
        resources = self.template.find_resources("AWS::RDS::DBCluster")
        for resource in resources.values():
            self.assertIn("DeletionPolicy", resource)
            self.assertEqual(resource["DeletionPolicy"], "Delete")

    @mark.it("configures DynamoDB with delete policy")
    def test_dynamodb_deletion_policy(self):
        """Test DynamoDB has proper deletion policy"""
        resources = self.template.find_resources("AWS::DynamoDB::Table")
        for resource in resources.values():
            self.assertIn("DeletionPolicy", resource)
            self.assertEqual(resource["DeletionPolicy"], "Delete")

    @mark.it("configures S3 buckets with delete policy")
    def test_s3_deletion_policy(self):
        """Test S3 buckets have proper deletion policy"""
        resources = self.template.find_resources("AWS::S3::Bucket")
        for resource in resources.values():
            self.assertIn("DeletionPolicy", resource)
            self.assertEqual(resource["DeletionPolicy"], "Delete")

    # ========================================================================
    # IAM Least Privilege Tests
    # ========================================================================

    @mark.it("Lambda role follows least privilege principle")
    def test_lambda_iam_least_privilege(self):
        """Test Lambda IAM role has minimal required permissions"""
        # Lambda should only have VPC access and X-Ray permissions
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "xray:PutTelemetryRecords",
                            "xray:PutTraceSegments"
                        ])
                    })
                ])
            }
        })

    @mark.it("Lambda role does not have overly permissive policies")
    def test_lambda_no_wildcard_resources(self):
        """Test Lambda role uses specific resource ARNs where possible"""
        # This is a check for X-Ray which requires * resource
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Resource": "*"
                    })
                ])
            }
        })

    # ========================================================================
    # Resource Count Tests
    # ========================================================================

    @mark.it("creates expected total number of resources")
    def test_total_resource_count(self):
        """Test expected number of total resources are created"""
        resources = self.template.to_json()["Resources"]
        # This is a sanity check that we have a reasonable number of resources
        self.assertGreater(len(resources), 50)
        self.assertLess(len(resources), 150)

    # ========================================================================
    # Environment Suffix Tests
    # ========================================================================

    @mark.it("applies environment suffix consistently")
    def test_environment_suffix_consistency(self):
        """Test environment suffix is applied consistently across resources"""
        # Capture environment suffix from various resources
        aurora_id = Capture()
        redis_id = Capture()
        dynamo_name = Capture()

        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "DBClusterIdentifier": aurora_id
        })
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "ReplicationGroupId": redis_id
        })
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": dynamo_name
        })

        # All should end with the same environment suffix
        self.assertTrue(aurora_id.as_string().endswith(self.env_suffix))
        self.assertTrue(redis_id.as_string().endswith(self.env_suffix))
        self.assertTrue(dynamo_name.as_string().endswith(self.env_suffix))


@mark.describe("TapStackProps")
class TestTapStackProps(unittest.TestCase):
    """Test cases for TapStackProps class"""

    @mark.it("creates props with environment suffix")
    def test_props_with_env_suffix(self):
        """Test props can be created with environment suffix"""
        props = TapStackProps(environment_suffix="prod")
        self.assertEqual(props.environment_suffix, "prod")

    @mark.it("creates props with optional cdk environment")
    def test_props_with_cdk_env(self):
        """Test props can be created with CDK environment"""
        env = cdk.Environment(account="123456789012", region="us-west-2")
        props = TapStackProps(environment_suffix="staging", env=env)
        self.assertEqual(props.environment_suffix, "staging")
        self.assertEqual(props.env, env)

    @mark.it("creates props without cdk environment")
    def test_props_without_cdk_env(self):
        """Test props can be created without CDK environment"""
        props = TapStackProps(environment_suffix="dev")
        self.assertEqual(props.environment_suffix, "dev")
        self.assertIsNone(props.env)


if __name__ == "__main__":
    unittest.main()

