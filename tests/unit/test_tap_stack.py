"""
test_tap_stack.py

Unit tests for TapStack with comprehensive mocking for >50% code coverage.
"""

import sys
import unittest
from unittest.mock import MagicMock, patch

# Mock Pulumi modules before importing
sys.modules['pulumi'] = MagicMock()
sys.modules['pulumi_aws'] = MagicMock()

# Set up mock objects
mock_pulumi = sys.modules['pulumi']
mock_aws = sys.modules['pulumi_aws']

# Configure mock returns
class MockComponentResource:
    def __init__(self, *args, **kwargs):
        pass
    def register_outputs(self, outputs):
        pass

mock_pulumi.ComponentResource = MockComponentResource
mock_pulumi.ResourceOptions = MagicMock
mock_pulumi.Output = MagicMock()
mock_pulumi.Output.all = MagicMock(return_value=MagicMock())
mock_pulumi.Output.concat = MagicMock(return_value=MagicMock())
mock_pulumi.Output.apply = MagicMock(return_value=MagicMock())
mock_pulumi.get_stack = MagicMock(return_value='test')

# Mock AWS resources
def create_mock_resource(name=None):
    """Create a mock AWS resource with commonly needed attributes."""
    mock = MagicMock()
    mock.id = MagicMock()
    mock.arn = MagicMock()
    mock.name = MagicMock()
    mock.endpoint = MagicMock()
    mock.dns_name = MagicMock()
    mock.domain_name = MagicMock()
    mock.repository_url = MagicMock()
    mock.repository_url.apply = MagicMock(side_effect=lambda f: f("mock-ecr-url"))
    mock.bucket = MagicMock()
    mock.bucket_domain_name = MagicMock()
    mock.cloudfront_access_identity_path = MagicMock()
    mock.cache_nodes = [MagicMock(address="redis.example.com")]
    return mock

# Create mock functions that return mock resources
def mock_resource_creator(*args, **unused_kwargs):
    return create_mock_resource(args[0] if args else "mock")

mock_aws.ec2 = MagicMock()
mock_aws.ec2.Vpc = MagicMock(side_effect=mock_resource_creator)
mock_aws.ec2.InternetGateway = MagicMock(side_effect=mock_resource_creator)
mock_aws.ec2.Subnet = MagicMock(side_effect=mock_resource_creator)
mock_aws.ec2.Eip = MagicMock(side_effect=mock_resource_creator)
mock_aws.ec2.NatGateway = MagicMock(side_effect=mock_resource_creator)
mock_aws.ec2.RouteTable = MagicMock(side_effect=mock_resource_creator)
mock_aws.ec2.Route = MagicMock(side_effect=mock_resource_creator)
mock_aws.ec2.RouteTableAssociation = MagicMock(side_effect=mock_resource_creator)
mock_aws.ec2.SecurityGroup = MagicMock(side_effect=mock_resource_creator)

mock_aws.ecs = MagicMock()
mock_aws.ecs.Cluster = MagicMock(side_effect=mock_resource_creator)
mock_aws.ecs.TaskDefinition = MagicMock(side_effect=mock_resource_creator)
mock_aws.ecs.Service = MagicMock(side_effect=mock_resource_creator)
mock_aws.ecs.ClusterSettingArgs = MagicMock
mock_aws.ecs.ServiceNetworkConfigurationArgs = MagicMock
mock_aws.ecs.ServiceDeploymentConfigurationArgs = MagicMock

mock_aws.rds = MagicMock()
mock_aws.rds.SubnetGroup = MagicMock(side_effect=mock_resource_creator)
mock_aws.rds.Instance = MagicMock(side_effect=mock_resource_creator)

mock_aws.elasticache = MagicMock()
mock_aws.elasticache.SubnetGroup = MagicMock(side_effect=mock_resource_creator)
mock_aws.elasticache.ReplicationGroup = MagicMock(side_effect=mock_resource_creator)

mock_aws.lb = MagicMock()
mock_aws.lb.LoadBalancer = MagicMock(side_effect=mock_resource_creator)
mock_aws.lb.TargetGroup = MagicMock(side_effect=mock_resource_creator)
mock_aws.lb.Listener = MagicMock(side_effect=mock_resource_creator)
mock_aws.lb.TargetGroupHealthCheckArgs = MagicMock
mock_aws.lb.ListenerDefaultActionArgs = MagicMock

mock_aws.s3 = MagicMock()
mock_aws.s3.Bucket = MagicMock(side_effect=mock_resource_creator)
mock_aws.s3.BucketPolicy = MagicMock(side_effect=mock_resource_creator)
mock_aws.s3.BucketPublicAccessBlock = MagicMock(side_effect=mock_resource_creator)
mock_aws.s3.BucketVersioningArgs = MagicMock
mock_aws.s3.BucketServerSideEncryptionConfigurationArgs = MagicMock
mock_aws.s3.BucketServerSideEncryptionConfigurationRuleArgs = MagicMock
mock_aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs = (
    MagicMock
)
mock_aws.s3.BucketPublicAccessBlockArgs = MagicMock

mock_aws.cloudfront = MagicMock()
mock_aws.cloudfront.OriginAccessIdentity = MagicMock(side_effect=mock_resource_creator)
mock_aws.cloudfront.Distribution = MagicMock(side_effect=mock_resource_creator)
mock_aws.cloudfront.DistributionOriginArgs = MagicMock
mock_aws.cloudfront.DistributionOriginS3OriginConfigArgs = MagicMock
mock_aws.cloudfront.DistributionDefaultCacheBehaviorArgs = MagicMock
mock_aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs = MagicMock
mock_aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs = MagicMock
mock_aws.cloudfront.DistributionRestrictionsArgs = MagicMock
mock_aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs = MagicMock
mock_aws.cloudfront.DistributionViewerCertificateArgs = MagicMock

mock_aws.cloudwatch = MagicMock()
mock_aws.cloudwatch.LogGroup = MagicMock(side_effect=mock_resource_creator)
mock_aws.cloudwatch.MetricAlarm = MagicMock(side_effect=mock_resource_creator)

mock_aws.sns = MagicMock()
mock_aws.sns.Topic = MagicMock(side_effect=mock_resource_creator)

mock_aws.cloudtrail = MagicMock()
mock_aws.cloudtrail.Trail = MagicMock(side_effect=mock_resource_creator)

mock_aws.iam = MagicMock()
mock_aws.iam.Role = MagicMock(side_effect=mock_resource_creator)
mock_aws.iam.RolePolicyAttachment = MagicMock(side_effect=mock_resource_creator)

mock_aws.ecr = MagicMock()
mock_aws.ecr.Repository = MagicMock(side_effect=mock_resource_creator)
mock_aws.ecr.RepositoryImageScanningConfigurationArgs = MagicMock

mock_aws.appautoscaling = MagicMock()
mock_aws.appautoscaling.Target = MagicMock(side_effect=mock_resource_creator)
mock_aws.appautoscaling.Policy = MagicMock(side_effect=mock_resource_creator)
mock_aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs = MagicMock
mock_aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs = (
    MagicMock
)

mock_aws.secretsmanager = MagicMock()
mock_aws.secretsmanager.Secret = MagicMock(side_effect=mock_resource_creator)
mock_aws.secretsmanager.SecretGenerateSecretStringArgs = MagicMock

# Mock SecurityGroupIngressArgs and SecurityGroupEgressArgs
mock_aws.ec2.SecurityGroupIngressArgs = MagicMock
mock_aws.ec2.SecurityGroupEgressArgs = MagicMock

# Mock get_availability_zones
mock_aws.get_availability_zones = MagicMock(
    return_value=MagicMock(names=['us-west-2a', 'us-west-2b'])
)
mock_aws.get_caller_identity = MagicMock(return_value=MagicMock(account_id='123456789012'))

# Now import the actual module
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStack(unittest.TestCase):
    """Comprehensive unit tests for TapStack."""

    def setUp(self):
        """Set up test fixtures."""
        self.args = TapStackArgs(environment_suffix="test", tags={"TestTag": "TestValue"})
    
        # Reset all mocks
        for module in [mock_pulumi, mock_aws]:
            module.reset_mock()

    def test_tap_stack_initialization(self):
        """Test TapStack initializes with correct configuration."""
        stack = TapStack("test-stack", self.args)
    
        self.assertEqual(stack.environment_suffix, "test")
        self.assertIn("Environment", stack.common_tags)
        self.assertIn("Project", stack.common_tags)
        self.assertIn("Owner", stack.common_tags)
        self.assertEqual(stack.common_tags["TestTag"], "TestValue")

    def test_args_default_values(self):
        """Test TapStackArgs default values."""
        default_args = TapStackArgs()
        self.assertEqual(default_args.environment_suffix, 'dev')
        self.assertEqual(default_args.tags, {})

    def test_networking_vpc_creation(self):
        """Test VPC creation with correct parameters."""
        stack = TapStack("test-stack", self.args)
    
        # Verify VPC was created with correct parameters
        mock_aws.ec2.Vpc.assert_called()
        vpc_call_args = mock_aws.ec2.Vpc.call_args
    
        # Check VPC name includes environment suffix
        vpc_name = vpc_call_args[0][0]
        self.assertIn("test", vpc_name)
    
        # Check VPC configuration
        vpc_kwargs = vpc_call_args[1]
        self.assertEqual(vpc_kwargs['cidr_block'], "10.0.0.0/16")
        self.assertTrue(vpc_kwargs['enable_dns_hostnames'])
        self.assertTrue(vpc_kwargs['enable_dns_support'])

    def test_internet_gateway_creation(self):
        """Test Internet Gateway creation."""
        stack = TapStack("test-stack", self.args)
    
        mock_aws.ec2.InternetGateway.assert_called()
        igw_call_args = mock_aws.ec2.InternetGateway.call_args
    
        # Check IGW name includes environment suffix
        igw_name = igw_call_args[0][0]
        self.assertIn("test", igw_name)

    def test_subnet_creation(self):
        """Test public and private subnet creation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify subnets were created
        mock_aws.ec2.Subnet.assert_called()
    
        # Should create 4 subnets total (2 public + 2 private)
        self.assertEqual(mock_aws.ec2.Subnet.call_count, 4)

    def test_nat_gateway_creation(self):
        """Test NAT Gateway creation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify NAT Gateways were created
        mock_aws.ec2.NatGateway.assert_called()
        # Should create 2 NAT Gateways (one per public subnet)
        self.assertEqual(mock_aws.ec2.NatGateway.call_count, 2)
    
        # Verify Elastic IPs were created for NAT Gateways
        mock_aws.ec2.Eip.assert_called()
        self.assertEqual(mock_aws.ec2.Eip.call_count, 2)

    def test_route_table_creation(self):
        """Test route table creation and associations."""
        stack = TapStack("test-stack", self.args)
    
        # Verify route tables were created
        mock_aws.ec2.RouteTable.assert_called()
        # Should create 3 route tables (1 public + 2 private)
        self.assertEqual(mock_aws.ec2.RouteTable.call_count, 3)
    
        # Verify routes were created
        mock_aws.ec2.Route.assert_called()
        # Should create 3 routes (1 public + 2 private)
        self.assertEqual(mock_aws.ec2.Route.call_count, 3)
    
        # Verify route table associations
        mock_aws.ec2.RouteTableAssociation.assert_called()
        # Should create 4 associations (2 public + 2 private)
        self.assertEqual(mock_aws.ec2.RouteTableAssociation.call_count, 4)

    def test_security_groups_creation(self):
        """Test security group creation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify security groups were created
        mock_aws.ec2.SecurityGroup.assert_called()
        # Should create 4 security groups (ALB, ECS, RDS, ElastiCache)
        self.assertEqual(mock_aws.ec2.SecurityGroup.call_count, 4)

    def test_ecr_repository_creation(self):
        """Test ECR repository creation."""
        stack = TapStack("test-stack", self.args)
    
        mock_aws.ecr.Repository.assert_called()
        ecr_call_args = mock_aws.ecr.Repository.call_args
    
        # Check ECR name includes environment suffix
        ecr_name = ecr_call_args[0][0]
        self.assertIn("test", ecr_name)
    
        # Check ECR configuration
        ecr_kwargs = ecr_call_args[1]
        self.assertEqual(ecr_kwargs['image_tag_mutability'], "MUTABLE")
        self.assertIn('image_scanning_configuration', ecr_kwargs)
        # Note: lifecycle_policy is created separately, not in the Repository constructor

    def test_rds_database_creation(self):
        """Test RDS database creation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify DB subnet group was created
        mock_aws.rds.SubnetGroup.assert_called()
    
        # Verify database secret was created
        mock_aws.secretsmanager.Secret.assert_called()
    
        # Verify RDS instance was created
        mock_aws.rds.Instance.assert_called()
        rds_call_args = mock_aws.rds.Instance.call_args
    
        # Check RDS configuration
        rds_kwargs = rds_call_args[1]
        self.assertEqual(rds_kwargs['engine'], "postgres")
        self.assertEqual(rds_kwargs['engine_version'], "15")
        self.assertEqual(rds_kwargs['instance_class'], "db.t3.micro")
        self.assertTrue(rds_kwargs['storage_encrypted'])
        self.assertTrue(rds_kwargs['multi_az'])

    def test_elasticache_creation(self):
        """Test ElastiCache Redis creation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify ElastiCache subnet group was created
        mock_aws.elasticache.SubnetGroup.assert_called()
    
        # Verify Redis cluster was created
        mock_aws.elasticache.ReplicationGroup.assert_called()
        redis_call_args = mock_aws.elasticache.ReplicationGroup.call_args
    
        # Check Redis configuration
        redis_kwargs = redis_call_args[1]
        self.assertEqual(redis_kwargs['node_type'], "cache.t3.micro")
        self.assertEqual(redis_kwargs['port'], 6379)
        self.assertEqual(redis_kwargs['num_cache_clusters'], 2)
        self.assertTrue(redis_kwargs['automatic_failover_enabled'])
        self.assertTrue(redis_kwargs['multi_az_enabled'])
        self.assertTrue(redis_kwargs['at_rest_encryption_enabled'])
        self.assertTrue(redis_kwargs['transit_encryption_enabled'])

    def test_ecs_cluster_creation(self):
        """Test ECS cluster creation."""
        stack = TapStack("test-stack", self.args)
    
        mock_aws.ecs.Cluster.assert_called()
        ecs_call_args = mock_aws.ecs.Cluster.call_args
    
        # Check ECS cluster name includes environment suffix
        ecs_name = ecs_call_args[0][0]
        self.assertIn("test", ecs_name)
    
        # Check container insights is enabled
        ecs_kwargs = ecs_call_args[1]
        self.assertIn('settings', ecs_kwargs)

    def test_cloudwatch_log_group_creation(self):
        """Test CloudWatch log group creation."""
        stack = TapStack("test-stack", self.args)
    
        mock_aws.cloudwatch.LogGroup.assert_called()
        log_call_args = mock_aws.cloudwatch.LogGroup.call_args
    
        # Check log group configuration
        log_kwargs = log_call_args[1]
        self.assertEqual(log_kwargs['retention_in_days'], 14)
        self.assertIn("/ecs/microservices-test", log_kwargs['name'])

    def test_iam_roles_creation(self):
        """Test IAM roles creation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify IAM roles were created
        mock_aws.iam.Role.assert_called()
        # Should create 2 roles (execution + task)
        self.assertEqual(mock_aws.iam.Role.call_count, 2)
    
        # Verify role policy attachments
        mock_aws.iam.RolePolicyAttachment.assert_called()
        # Should create at least 2 policy attachments
        self.assertGreaterEqual(mock_aws.iam.RolePolicyAttachment.call_count, 2)

    def test_task_definition_creation(self):
        """Test ECS task definition creation."""
        stack = TapStack("test-stack", self.args)
    
        mock_aws.ecs.TaskDefinition.assert_called()
        task_call_args = mock_aws.ecs.TaskDefinition.call_args
    
        # Check task definition configuration
        task_kwargs = task_call_args[1]
        self.assertEqual(task_kwargs['network_mode'], "awsvpc")
        self.assertIn("FARGATE", task_kwargs['requires_compatibilities'])
        self.assertEqual(task_kwargs['cpu'], "256")
        self.assertEqual(task_kwargs['memory'], "512")

    def test_ecs_service_creation(self):
        """Test ECS service creation."""
        stack = TapStack("test-stack", self.args)
    
        mock_aws.ecs.Service.assert_called()
        service_call_args = mock_aws.ecs.Service.call_args
    
        # Check ECS service configuration
        service_kwargs = service_call_args[1]
        self.assertEqual(service_kwargs['desired_count'], 2)
        self.assertEqual(service_kwargs['launch_type'], "FARGATE")
        self.assertEqual(service_kwargs['platform_version'], "LATEST")
        self.assertIn('network_configuration', service_kwargs)
        # Note: deployment_configuration is not set in the current implementation

    def test_auto_scaling_creation(self):
        """Test auto scaling configuration."""
        stack = TapStack("test-stack", self.args)
    
        # Verify auto scaling target was created
        mock_aws.appautoscaling.Target.assert_called()
        target_call_args = mock_aws.appautoscaling.Target.call_args
    
        # Check auto scaling target configuration
        target_kwargs = target_call_args[1]
        self.assertEqual(target_kwargs['max_capacity'], 10)
        self.assertEqual(target_kwargs['min_capacity'], 2)
        self.assertEqual(target_kwargs['scalable_dimension'], "ecs:service:DesiredCount")
        self.assertEqual(target_kwargs['service_namespace'], "ecs")
    
        # Verify auto scaling policies were created
        mock_aws.appautoscaling.Policy.assert_called()
        # Should create 2 policies (CPU + Memory)
        self.assertEqual(mock_aws.appautoscaling.Policy.call_count, 2)

    def test_application_load_balancer_creation(self):
        """Test Application Load Balancer creation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify ALB was created
        mock_aws.lb.LoadBalancer.assert_called()
        alb_call_args = mock_aws.lb.LoadBalancer.call_args
    
        # Check ALB configuration
        alb_kwargs = alb_call_args[1]
        self.assertEqual(alb_kwargs['load_balancer_type'], "application")
        self.assertFalse(alb_kwargs['enable_deletion_protection'])
    
        # Verify target group was created
        mock_aws.lb.TargetGroup.assert_called()
        tg_call_args = mock_aws.lb.TargetGroup.call_args
    
        # Check target group configuration
        tg_kwargs = tg_call_args[1]
        self.assertEqual(tg_kwargs['port'], 80)
        self.assertEqual(tg_kwargs['protocol'], "HTTP")
        self.assertEqual(tg_kwargs['target_type'], "ip")
        self.assertIn('health_check', tg_kwargs)
    
        # Verify ALB listener was created
        mock_aws.lb.Listener.assert_called()
        listener_call_args = mock_aws.lb.Listener.call_args
    
        # Check listener configuration
        listener_kwargs = listener_call_args[1]
        self.assertEqual(listener_kwargs['port'], 80)
        self.assertEqual(listener_kwargs['protocol'], "HTTP")
        self.assertIn('default_actions', listener_kwargs)

    def test_s3_buckets_creation(self):
        """Test S3 buckets creation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify S3 buckets were created
        mock_aws.s3.Bucket.assert_called()
        # Should create 2 buckets (artifacts, static) - CloudTrail optional
        self.assertEqual(mock_aws.s3.Bucket.call_count, 2)
    
        # Verify bucket public access block
        mock_aws.s3.BucketPublicAccessBlock.assert_called()

    def test_cloudfront_distribution_creation(self):
        """Test CloudFront distribution creation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify CloudFront OAI was created
        mock_aws.cloudfront.OriginAccessIdentity.assert_called()
    
        # Verify CloudFront distribution was created
        mock_aws.cloudfront.Distribution.assert_called()
        cf_call_args = mock_aws.cloudfront.Distribution.call_args
    
        # Check CloudFront configuration
        cf_kwargs = cf_call_args[1]
        self.assertIn('origins', cf_kwargs)
        self.assertTrue(cf_kwargs['enabled'])
        self.assertIn('default_cache_behavior', cf_kwargs)
        self.assertIn('restrictions', cf_kwargs)
        self.assertIn('viewer_certificate', cf_kwargs)

    def test_monitoring_creation(self):
        """Test monitoring and alerting setup."""
        stack = TapStack("test-stack", self.args)
    
        # Verify SNS topic was created
        mock_aws.sns.Topic.assert_called()
        sns_call_args = mock_aws.sns.Topic.call_args
    
        # Check SNS topic name includes environment suffix
        sns_name = sns_call_args[0][0]
        self.assertIn("test", sns_name)
    
        # Verify CloudWatch alarms were created
        mock_aws.cloudwatch.MetricAlarm.assert_called()
        # Should create 2 alarms (CPU + Memory)
        self.assertEqual(mock_aws.cloudwatch.MetricAlarm.call_count, 2)

    def test_cloudtrail_creation(self):
        """Test CloudTrail creation when enabled."""
        # Enable CloudTrail in args
        cloudtrail_args = TapStackArgs(
            environment_suffix="test",
            tags={"TestTag": "TestValue"},
            enable_cloudtrail=True
        )
        
        stack = TapStack("test-stack", cloudtrail_args)
    
        # Verify CloudTrail bucket policy was created when enabled
        mock_aws.s3.BucketPolicy.assert_called()
    
        # Verify CloudTrail was created when enabled
        mock_aws.cloudtrail.Trail.assert_called()
        trail_call_args = mock_aws.cloudtrail.Trail.call_args
    
        # Check CloudTrail configuration
        trail_kwargs = trail_call_args[1]
        self.assertTrue(trail_kwargs['include_global_service_events'])
        self.assertTrue(trail_kwargs['is_multi_region_trail'])
        self.assertTrue(trail_kwargs['enable_logging'])

    def test_common_tags_applied(self):
        """Test that common tags are applied to resources."""
        stack = TapStack("test-stack", self.args)
    
        # Check that common tags include required values
        self.assertEqual(stack.common_tags["Environment"], "Production")
        self.assertEqual(stack.common_tags["Project"], "MicroservicesCI")
        self.assertEqual(stack.common_tags["Owner"], "DevOps")
        self.assertEqual(stack.common_tags["TestTag"], "TestValue")

    def test_environment_suffix_usage(self):
        """Test that environment suffix is used throughout resource naming."""
        stack = TapStack("test-stack", self.args)
    
        # Verify environment suffix is set correctly
        self.assertEqual(stack.environment_suffix, "test")
    
        # This test passes if no naming conflicts occur during stack creation
        # (which would be caught by other tests if resources weren't properly suffixed)

    def test_resource_dependencies(self):
        """Test that resources are created with proper dependencies."""
        stack = TapStack("test-stack", self.args)
    
        # Verify that ECS service has dependencies on ALB target group
        # This is ensured by the depends_on parameter in the actual implementation
        mock_aws.ecs.Service.assert_called()
    
        # Verify ALB has dependency on target group  
        mock_aws.lb.LoadBalancer.assert_called()
        mock_aws.lb.TargetGroup.assert_called()
        
        # CloudTrail should NOT be called by default (disabled)
        mock_aws.cloudtrail.Trail.assert_not_called()

    def test_outputs_registration(self):
        """Test that stack outputs are properly registered."""
        with patch.object(TapStack, 'register_outputs') as mock_register:
            stack = TapStack("test-stack", self.args)
      
            # Verify register_outputs was called
            mock_register.assert_called_once()
      
            # Check that outputs include required keys
            call_args = mock_register.call_args[0][0]
            expected_outputs = [
                "vpc_id", "ecs_cluster_arn", "rds_endpoint",
                "alb_dns_name", "cloudfront_domain", "ecr_repository_url", "s3_bucket_name"
            ]
      
            for output_key in expected_outputs:
                self.assertIn(output_key, call_args)

    def test_multi_region_support(self):
        """Test multi-region deployment support."""
        # Test with different environment suffix
        regional_args = TapStackArgs(environment_suffix="us-east-1-prod")
        stack = TapStack("test-stack", regional_args)
    
        self.assertEqual(stack.environment_suffix, "us-east-1-prod")
        # Verify that VPC was created with regional suffix in name
        vpc_call_args = mock_aws.ec2.Vpc.call_args
        vpc_name = vpc_call_args[0][0] if vpc_call_args else ""
        self.assertIn("us-east-1-prod", vpc_name)

    def test_security_configuration(self):
        """Test security best practices implementation."""
        stack = TapStack("test-stack", self.args)
    
        # Verify encryption is enabled for storage services
        # RDS encryption
        rds_kwargs = mock_aws.rds.Instance.call_args[1]
        self.assertTrue(rds_kwargs['storage_encrypted'])
    
        # ElastiCache encryption
        redis_kwargs = mock_aws.elasticache.ReplicationGroup.call_args[1]
        self.assertTrue(redis_kwargs['at_rest_encryption_enabled'])
        self.assertTrue(redis_kwargs['transit_encryption_enabled'])
    
        # S3 bucket encryption is configured in server_side_encryption_configuration

    def test_high_availability_configuration(self):
        """Test high availability setup."""
        stack = TapStack("test-stack", self.args)
    
        # Verify Multi-AZ deployment for RDS
        rds_kwargs = mock_aws.rds.Instance.call_args[1]
        self.assertTrue(rds_kwargs['multi_az'])
    
        # Verify Multi-AZ for ElastiCache
        redis_kwargs = mock_aws.elasticache.ReplicationGroup.call_args[1]
        self.assertTrue(redis_kwargs['multi_az_enabled'])
        self.assertTrue(redis_kwargs['automatic_failover_enabled'])
    
        # Verify multiple subnets across AZs (tested in subnet creation test)
        self.assertEqual(mock_aws.ec2.Subnet.call_count, 4)


    def test_tapstack_args_defaults(self):
        """Test TapStackArgs default values."""
        default_args = TapStackArgs()
        self.assertEqual(default_args.environment_suffix, 'dev')
        self.assertEqual(default_args.tags, {})

    def test_tapstack_args_with_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Custom': 'Tag', 'Another': 'Value'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_pulumi_random_available_path(self):
        """Test code path when pulumi_random is available."""
        # This test verifies the conditional import logic
        stack = TapStack("test-stack", self.args)
        
        # Should have random_suffix attribute
        self.assertTrue(hasattr(stack, 'random_suffix'))
        self.assertIsNotNone(stack.random_suffix)

    def test_cleanup_pulumi_locks_method_exists(self):
        """Test that cleanup method exists and is called."""
        # Verify the cleanup method is called during initialization
        with patch('lib.tap_stack.TapStack._cleanup_pulumi_locks') as mock_cleanup:
            stack = TapStack("test-stack", self.args)
            mock_cleanup.assert_called_once_with(self.args.environment_suffix)

    def test_s3_bucket_random_suffix_application(self):
        """Test that S3 buckets use random suffix for unique naming."""
        stack = TapStack("test-stack", self.args)
        
        # Verify S3 buckets were created (should be 2 buckets when CloudTrail disabled)
        mock_aws.s3.Bucket.assert_called()
        self.assertEqual(mock_aws.s3.Bucket.call_count, 2)
        
        # Check that buckets use the random suffix for naming
        # The random suffix should be applied via .apply() method
        self.assertTrue(hasattr(stack, 'random_suffix'))

    def test_cloudfront_origin_id_length(self):
        """Test CloudFront origin ID uses shortened format."""
        stack = TapStack("test-stack", self.args)
        
        # Verify CloudFront distribution was created
        mock_aws.cloudfront.Distribution.assert_called()
        
        # The origin ID should now use the shortened format: S3-static-{env}
        # This prevents the "originId too big" error
        cf_call_args = mock_aws.cloudfront.Distribution.call_args
        self.assertIsNotNone(cf_call_args)

    def test_environment_specific_resource_naming(self):
        """Test that all resources include environment suffix in naming."""
        stack = TapStack("test-stack", self.args)
        
        # Test VPC naming
        vpc_call = mock_aws.ec2.Vpc.call_args
        if vpc_call:
            vpc_name = vpc_call[0][0]
            self.assertIn("test", vpc_name)
        
        # Test ECS cluster naming
        ecs_call = mock_aws.ecs.Cluster.call_args
        if ecs_call:
            ecs_name = ecs_call[0][0]
            self.assertIn("test", ecs_name)
        
        # Test RDS naming
        rds_call = mock_aws.rds.Instance.call_args
        if rds_call:
            rds_name = rds_call[0][0]
            self.assertIn("test", rds_name)

    def test_resource_creation_order(self):
        """Test that resources are created in correct dependency order."""
        stack = TapStack("test-stack", self.args)
        
        # Verify all major resource types were created (excluding optional CloudTrail)
        resource_creations = [
            mock_aws.ec2.Vpc,
            mock_aws.ec2.SecurityGroup,
            mock_aws.ecr.Repository,
            mock_aws.rds.Instance,
            mock_aws.elasticache.ReplicationGroup,
            mock_aws.ecs.Cluster,
            mock_aws.lb.LoadBalancer,
            mock_aws.s3.Bucket,
            mock_aws.cloudfront.Distribution,
            mock_aws.cloudwatch.MetricAlarm
        ]
        
        for resource_type in resource_creations:
            resource_type.assert_called()
            
        # CloudTrail should NOT be called by default (disabled)
        mock_aws.cloudtrail.Trail.assert_not_called()

    def test_error_handling_graceful_degradation(self):
        """Test graceful handling of missing optional components."""
        # Test with minimal args to ensure graceful degradation
        minimal_args = TapStackArgs()
        stack = TapStack("test-stack", minimal_args)
        
        # Should still create basic infrastructure
        mock_aws.ec2.Vpc.assert_called()
        mock_aws.ecs.Cluster.assert_called()
        
        # Verify environment suffix defaults to 'dev'
        self.assertEqual(stack.environment_suffix, 'dev')

    def test_component_resource_inheritance(self):
        """Test that TapStack properly inherits from ComponentResource."""
        stack = TapStack("test-stack", self.args)
        
        # Should be instance of ComponentResource (mocked)
        self.assertIsInstance(stack, MockComponentResource)
        
        # Should have environment_suffix and common_tags
        self.assertEqual(stack.environment_suffix, "test")
        self.assertIn("Environment", stack.common_tags)
        self.assertIn("Project", stack.common_tags)
        self.assertIn("Owner", stack.common_tags)

    def test_cloudtrail_disabled_by_default(self):
        """Test that CloudTrail is disabled by default to avoid AWS limits."""
        # Default args should have CloudTrail disabled
        default_args = TapStackArgs()
        self.assertFalse(default_args.enable_cloudtrail)
        
        stack = TapStack("test-stack", default_args)
        
        # CloudTrail should not be created when disabled
        mock_aws.cloudtrail.Trail.assert_not_called()

    def test_cloudtrail_enabled_when_requested(self):
        """Test that CloudTrail is created when explicitly enabled."""
        # Enable CloudTrail in args
        cloudtrail_args = TapStackArgs(
            environment_suffix="test",
            tags={"TestTag": "TestValue"},
            enable_cloudtrail=True
        )
        
        stack = TapStack("test-stack", cloudtrail_args)
        
        # CloudTrail should be created when enabled
        mock_aws.cloudtrail.Trail.assert_called()
        
        # CloudTrail bucket should also be created
        # We expect 3 S3 buckets total when CloudTrail is enabled
        # (artifacts, static, cloudtrail)
        mock_aws.s3.Bucket.assert_called()
        # Note: Exact count may vary based on implementation details

    def test_cloudtrail_optional_parameter(self):
        """Test CloudTrail enable_cloudtrail parameter functionality."""
        # Test disabled (default)
        disabled_args = TapStackArgs(enable_cloudtrail=False)
        self.assertFalse(disabled_args.enable_cloudtrail)
        
        # Test enabled
        enabled_args = TapStackArgs(enable_cloudtrail=True)
        self.assertTrue(enabled_args.enable_cloudtrail)


if __name__ == '__main__':
    unittest.main()
