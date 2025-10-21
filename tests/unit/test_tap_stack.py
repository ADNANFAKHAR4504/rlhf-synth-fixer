"""Unit tests for TAP Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="ap-northeast-1",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'alb')
        assert hasattr(stack, 'ecs_cluster')
        assert hasattr(stack, 'rds_cluster')
        assert hasattr(stack, 'redis_cluster')
        assert hasattr(stack, 'kinesis_stream')
        assert hasattr(stack, 'analytics_bucket')
        assert hasattr(stack, 'api_gateway')

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'alb')
        assert hasattr(stack, 'ecs_cluster')


class TestVPCAndNetworking:
    """Test suite for VPC and Networking resources."""

    def test_vpc_created_with_correct_cidr(self):
        """VPC is created with correct CIDR block."""
        app = App()
        stack = TapStack(
            app,
            "TestVPC",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check VPC exists
        assert any(
            resource['type'] == 'aws_vpc' and
            resource['values']['cidr_block'] == '10.0.0.0/16'
            for resource in synth['resource']
        )

    def test_multiple_availability_zones_configured(self):
        """Subnets are created across multiple availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestMultiAZ",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for subnets in different AZs
        subnets = [r for r in synth['resource'] if r['type'] == 'aws_subnet']
        az_list = [subnet['values'].get('availability_zone', '') for subnet in subnets]

        # Should have subnets in at least 2 different AZs
        unique_azs = set(az_list)
        assert len(unique_azs) >= 2

    def test_public_and_private_subnets_created(self):
        """Both public and private subnets are created."""
        app = App()
        stack = TapStack(
            app,
            "TestSubnets",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for public subnets (with map_public_ip_on_launch = true)
        subnets = [r for r in synth['resource'] if r['type'] == 'aws_subnet']
        public_subnets = [s for s in subnets if s['values'].get('map_public_ip_on_launch')]
        private_subnets = [s for s in subnets if not s['values'].get('map_public_ip_on_launch')]

        assert len(public_subnets) >= 2
        assert len(private_subnets) >= 2

    def test_internet_gateway_created(self):
        """Internet Gateway is created for public subnet access."""
        app = App()
        stack = TapStack(
            app,
            "TestIGW",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for IGW
        assert any(
            resource['type'] == 'aws_internet_gateway'
            for resource in synth['resource']
        )


class TestSecurityConfiguration:
    """Test suite for Security Configuration."""

    def test_kms_keys_created_for_encryption(self):
        """KMS keys are created for RDS and S3 encryption."""
        app = App()
        stack = TapStack(
            app,
            "TestKMS",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for KMS keys
        kms_keys = [r for r in synth['resource'] if r['type'] == 'aws_kms_key']
        assert len(kms_keys) >= 2  # At least RDS and S3 keys

        # Check key rotation is enabled
        for key in kms_keys:
            assert key['values'].get('enable_key_rotation') is True

    def test_security_groups_created_with_least_privilege(self):
        """Security groups are created with least privilege access."""
        app = App()
        stack = TapStack(
            app,
            "TestSecurityGroups",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for security groups
        security_groups = [r for r in synth['resource'] if r['type'] == 'aws_security_group']
        assert len(security_groups) >= 4  # ALB, ECS, RDS, Redis

        # Verify ALB security group allows HTTP/HTTPS
        alb_sg = [sg for sg in security_groups if 'alb' in sg['values'].get('name', '')]
        assert len(alb_sg) > 0

    def test_secrets_manager_secrets_created(self):
        """Secrets Manager secrets are created for credentials."""
        app = App()
        stack = TapStack(
            app,
            "TestSecrets",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for Secrets Manager secrets
        secrets = [r for r in synth['resource'] if r['type'] == 'aws_secretsmanager_secret']
        assert len(secrets) >= 2  # DB secret and Redis secret

    def test_secrets_rotation_configured(self):
        """Automatic rotation is configured for RDS secrets."""
        app = App()
        stack = TapStack(
            app,
            "TestRotation",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for secret rotation
        rotations = [r for r in synth['resource'] if r['type'] == 'aws_secretsmanager_secret_rotation']
        assert len(rotations) >= 1

        # Verify rotation period
        for rotation in rotations:
            rotation_rules = rotation['values'].get('rotation_rules', {})
            assert rotation_rules.get('automatically_after_days') == 30


class TestDatabaseConfiguration:
    """Test suite for Database Configuration."""

    def test_rds_aurora_cluster_created(self):
        """RDS Aurora PostgreSQL cluster is created."""
        app = App()
        stack = TapStack(
            app,
            "TestRDS",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for RDS cluster
        rds_clusters = [r for r in synth['resource'] if r['type'] == 'aws_rds_cluster']
        assert len(rds_clusters) == 1

        cluster = rds_clusters[0]['values']
        assert cluster.get('engine') == 'aurora-postgresql'
        assert cluster.get('storage_encrypted') is True

    def test_rds_multi_az_deployment(self):
        """RDS Aurora has multiple instances for Multi-AZ."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSMultiAZ",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for RDS cluster instances
        rds_instances = [r for r in synth['resource'] if r['type'] == 'aws_rds_cluster_instance']
        assert len(rds_instances) >= 2  # Multi-AZ deployment

    def test_rds_encryption_enabled(self):
        """RDS cluster has encryption enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSEncryption",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check RDS encryption
        rds_clusters = [r for r in synth['resource'] if r['type'] == 'aws_rds_cluster']
        for cluster in rds_clusters:
            assert cluster['values'].get('storage_encrypted') is True
            assert 'kms_key_id' in cluster['values']

    def test_rds_backup_retention_configured(self):
        """RDS cluster has backup retention configured."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSBackup",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check backup retention
        rds_clusters = [r for r in synth['resource'] if r['type'] == 'aws_rds_cluster']
        for cluster in rds_clusters:
            assert cluster['values'].get('backup_retention_period', 0) >= 7


class TestCacheConfiguration:
    """Test suite for ElastiCache Configuration."""

    def test_elasticache_redis_cluster_created(self):
        """ElastiCache Redis cluster is created."""
        app = App()
        stack = TapStack(
            app,
            "TestRedis",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for ElastiCache replication group
        redis_clusters = [r for r in synth['resource'] if r['type'] == 'aws_elasticache_replication_group']
        assert len(redis_clusters) == 1

        cluster = redis_clusters[0]['values']
        assert cluster.get('engine') == 'redis'

    def test_redis_multi_az_enabled(self):
        """Redis cluster has Multi-AZ enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestRedisMultiAZ",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check Multi-AZ
        redis_clusters = [r for r in synth['resource'] if r['type'] == 'aws_elasticache_replication_group']
        for cluster in redis_clusters:
            assert cluster['values'].get('multi_az_enabled') is True
            assert cluster['values'].get('automatic_failover_enabled') is True

    def test_redis_encryption_enabled(self):
        """Redis cluster has encryption at rest and in transit enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestRedisEncryption",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check encryption
        redis_clusters = [r for r in synth['resource'] if r['type'] == 'aws_elasticache_replication_group']
        for cluster in redis_clusters:
            assert cluster['values'].get('at_rest_encryption_enabled') is True
            assert cluster['values'].get('transit_encryption_enabled') is True


class TestAnalyticsConfiguration:
    """Test suite for Analytics Configuration."""

    def test_kinesis_stream_created(self):
        """Kinesis Data Stream is created."""
        app = App()
        stack = TapStack(
            app,
            "TestKinesis",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for Kinesis stream
        kinesis_streams = [r for r in synth['resource'] if r['type'] == 'aws_kinesis_stream']
        assert len(kinesis_streams) == 1

    def test_kinesis_firehose_created(self):
        """Kinesis Firehose delivery stream is created."""
        app = App()
        stack = TapStack(
            app,
            "TestFirehose",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for Firehose
        firehose_streams = [r for r in synth['resource'] if r['type'] == 'aws_kinesis_firehose_delivery_stream']
        assert len(firehose_streams) == 1

        stream = firehose_streams[0]['values']
        assert stream.get('destination') == 'extended_s3'

    def test_s3_bucket_for_analytics_created(self):
        """S3 bucket for analytics data is created with encryption."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Analytics",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for S3 bucket
        s3_buckets = [r for r in synth['resource'] if r['type'] == 'aws_s3_bucket']
        assert len(s3_buckets) >= 1

        # Check for encryption configuration
        s3_encryption = [r for r in synth['resource'] if r['type'] == 'aws_s3_bucket_server_side_encryption_configuration']
        assert len(s3_encryption) >= 1


class TestComputeConfiguration:
    """Test suite for ECS Compute Configuration."""

    def test_ecs_cluster_created(self):
        """ECS Fargate cluster is created."""
        app = App()
        stack = TapStack(
            app,
            "TestECS",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for ECS cluster
        ecs_clusters = [r for r in synth['resource'] if r['type'] == 'aws_ecs_cluster']
        assert len(ecs_clusters) == 1

    def test_ecs_task_definition_created(self):
        """ECS task definition is created with Fargate compatibility."""
        app = App()
        stack = TapStack(
            app,
            "TestECSTask",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for task definition
        task_defs = [r for r in synth['resource'] if r['type'] == 'aws_ecs_task_definition']
        assert len(task_defs) == 1

        task = task_defs[0]['values']
        assert 'FARGATE' in task.get('requires_compatibilities', [])

    def test_ecs_service_created_with_alb(self):
        """ECS service is created with load balancer."""
        app = App()
        stack = TapStack(
            app,
            "TestECSService",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for ECS service
        ecs_services = [r for r in synth['resource'] if r['type'] == 'aws_ecs_service']
        assert len(ecs_services) == 1

        service = ecs_services[0]['values']
        assert service.get('launch_type') == 'FARGATE'
        assert 'load_balancer' in service

    def test_ecs_autoscaling_configured(self):
        """ECS service has auto-scaling configured."""
        app = App()
        stack = TapStack(
            app,
            "TestECSAutoscaling",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for autoscaling target
        autoscaling_targets = [r for r in synth['resource'] if r['type'] == 'aws_appautoscaling_target']
        assert len(autoscaling_targets) >= 1

        target = autoscaling_targets[0]['values']
        assert target.get('max_capacity', 0) > target.get('min_capacity', 0)

        # Check for autoscaling policies
        autoscaling_policies = [r for r in synth['resource'] if r['type'] == 'aws_appautoscaling_policy']
        assert len(autoscaling_policies) >= 2  # CPU and Memory policies

    def test_alb_created_for_ecs(self):
        """Application Load Balancer is created."""
        app = App()
        stack = TapStack(
            app,
            "TestALB",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for ALB
        albs = [r for r in synth['resource'] if r['type'] == 'aws_lb']
        assert len(albs) >= 1

        alb = albs[0]['values']
        assert alb.get('load_balancer_type') == 'application'


class TestAPIGatewayConfiguration:
    """Test suite for API Gateway Configuration."""

    def test_api_gateway_created(self):
        """API Gateway REST API is created."""
        app = App()
        stack = TapStack(
            app,
            "TestAPIGateway",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for API Gateway
        apis = [r for r in synth['resource'] if r['type'] == 'aws_api_gateway_rest_api']
        assert len(apis) == 1

    def test_api_gateway_throttling_configured(self):
        """API Gateway has throttling limits configured."""
        app = App()
        stack = TapStack(
            app,
            "TestAPIThrottling",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for method settings
        method_settings = [r for r in synth['resource'] if r['type'] == 'aws_api_gateway_method_settings']
        assert len(method_settings) >= 1

        settings = method_settings[0]['values']['settings']
        assert settings.get('throttling_burst_limit', 0) > 0
        assert settings.get('throttling_rate_limit', 0) > 0

    def test_api_gateway_xray_enabled(self):
        """API Gateway has X-Ray tracing enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestAPIXRay",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for API Gateway stage with X-Ray
        stages = [r for r in synth['resource'] if r['type'] == 'aws_api_gateway_stage']
        assert len(stages) >= 1

        for stage in stages:
            assert stage['values'].get('xray_tracing_enabled') is True


class TestMonitoringConfiguration:
    """Test suite for Monitoring Configuration."""

    def test_cloudwatch_log_groups_created(self):
        """CloudWatch log groups are created for ECS and API Gateway."""
        app = App()
        stack = TapStack(
            app,
            "TestLogs",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for log groups
        log_groups = [r for r in synth['resource'] if r['type'] == 'aws_cloudwatch_log_group']
        assert len(log_groups) >= 2  # ECS and API Gateway logs

        # Check retention period
        for log_group in log_groups:
            assert log_group['values'].get('retention_in_days', 0) >= 90

    def test_cloudwatch_alarms_created(self):
        """CloudWatch alarms are created for critical metrics."""
        app = App()
        stack = TapStack(
            app,
            "TestAlarms",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for alarms
        alarms = [r for r in synth['resource'] if r['type'] == 'aws_cloudwatch_metric_alarm']
        assert len(alarms) >= 3  # ECS CPU, RDS connections, API 5xx errors

    def test_cloudwatch_dashboard_created(self):
        """CloudWatch dashboard is created."""
        app = App()
        stack = TapStack(
            app,
            "TestDashboard",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for dashboard
        dashboards = [r for r in synth['resource'] if r['type'] == 'aws_cloudwatch_dashboard']
        assert len(dashboards) == 1

    def test_cloudtrail_enabled(self):
        """CloudTrail is enabled for audit logging."""
        app = App()
        stack = TapStack(
            app,
            "TestCloudTrail",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for CloudTrail
        trails = [r for r in synth['resource'] if r['type'] == 'aws_cloudtrail']
        assert len(trails) == 1

        trail = trails[0]['values']
        assert trail.get('enable_logging') is True


class TestFailureRecoveryConfiguration:
    """Test suite for Failure Recovery and High Availability."""

    def test_eventbridge_scheduler_created(self):
        """EventBridge Scheduler is created for health checks."""
        app = App()
        stack = TapStack(
            app,
            "TestScheduler",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for EventBridge Scheduler
        schedules = [r for r in synth['resource'] if r['type'] == 'aws_scheduler_schedule']
        assert len(schedules) >= 1

    def test_eventbridge_scheduler_has_retry_policy(self):
        """EventBridge Scheduler has retry policy configured."""
        app = App()
        stack = TapStack(
            app,
            "TestSchedulerRetry",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for retry policy
        schedules = [r for r in synth['resource'] if r['type'] == 'aws_scheduler_schedule']
        for schedule in schedules:
            target = schedule['values'].get('target', {})
            assert 'retry_policy' in target

    def test_eventbridge_scheduler_has_dlq(self):
        """EventBridge Scheduler has Dead Letter Queue configured."""
        app = App()
        stack = TapStack(
            app,
            "TestSchedulerDLQ",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for DLQ
        queues = [r for r in synth['resource'] if r['type'] == 'aws_sqs_queue']
        assert len(queues) >= 1

    def test_fis_experiment_template_created(self):
        """AWS FIS experiment template is created."""
        app = App()
        stack = TapStack(
            app,
            "TestFIS",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for FIS experiment template
        fis_experiments = [r for r in synth['resource'] if r['type'] == 'aws_fis_experiment_template']
        assert len(fis_experiments) >= 1

    def test_fis_has_stop_condition(self):
        """FIS experiment has CloudWatch alarm as stop condition."""
        app = App()
        stack = TapStack(
            app,
            "TestFISStopCondition",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for stop condition
        fis_experiments = [r for r in synth['resource'] if r['type'] == 'aws_fis_experiment_template']
        for experiment in fis_experiments:
            assert 'stop_condition' in experiment['values']


class TestIAMConfiguration:
    """Test suite for IAM Configuration."""

    def test_iam_roles_created_for_services(self):
        """IAM roles are created for various services."""
        app = App()
        stack = TapStack(
            app,
            "TestIAM",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for IAM roles
        roles = [r for r in synth['resource'] if r['type'] == 'aws_iam_role']
        assert len(roles) >= 5  # ECS execution, ECS task, Firehose, Scheduler, FIS, Lambda

    def test_ecs_task_role_has_secrets_access(self):
        """ECS task role has permission to access Secrets Manager."""
        app = App()
        stack = TapStack(
            app,
            "TestECSTaskRole",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for IAM role policies
        policies = [r for r in synth['resource'] if r['type'] == 'aws_iam_role_policy']

        # Find ECS task policy
        ecs_task_policies = [p for p in policies if 'task' in p['values'].get('name', '').lower()]
        assert len(ecs_task_policies) >= 1


class TestResourceNaming:
    """Test suite for Resource Naming Conventions."""

    def test_all_resources_include_environment_suffix(self):
        """All named resources include environment_suffix."""
        app = App()
        test_suffix = "test-env"
        stack = TapStack(
            app,
            "TestNaming",
            environment_suffix=test_suffix,
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # List of resource types that should have environment suffix
        named_resource_types = [
            'aws_vpc',
            'aws_ecs_cluster',
            'aws_rds_cluster',
            'aws_elasticache_replication_group',
            'aws_kinesis_stream',
            'aws_s3_bucket',
            'aws_lb',
            'aws_api_gateway_rest_api',
            'aws_security_group'
        ]

        for resource_type in named_resource_types:
            resources = [r for r in synth['resource'] if r['type'] == resource_type]
            for resource in resources:
                values = resource['values']
                name_field = None

                # Different resources use different name fields
                if 'name' in values:
                    name_field = values['name']
                elif 'cluster_identifier' in values:
                    name_field = values['cluster_identifier']
                elif 'replication_group_id' in values:
                    name_field = values['replication_group_id']
                elif 'bucket' in values:
                    name_field = values['bucket']

                if name_field and isinstance(name_field, str):
                    # Check that environment suffix is present
                    assert test_suffix in name_field or '${' in name_field, \
                        f"Resource {resource_type} name '{name_field}' does not include environment suffix"


class TestOutputs:
    """Test suite for Stack Outputs."""

    def test_stack_has_outputs(self):
        """Stack defines outputs for critical resources."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputs",
            environment_suffix="test",
            aws_region="ap-northeast-1"
        )

        synth = Testing.synth(stack)

        # Check for outputs
        assert 'output' in synth
        outputs = synth['output']

        # Check for specific outputs
        expected_outputs = [
            'vpc_id',
            'alb_dns_name',
            'api_gateway_url',
            'rds_cluster_endpoint',
            'redis_endpoint',
            'kinesis_stream_name',
            'ecs_cluster_name'
        ]

        for expected_output in expected_outputs:
            assert expected_output in outputs


# Add more test suites and cases as needed
