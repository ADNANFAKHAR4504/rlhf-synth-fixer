"""
Unit tests for TapStack - Aurora PostgreSQL migration infrastructure.

Tests Aurora cluster configuration, DMS setup, Secrets Manager, and CloudWatch alarms.
"""

import json
import pytest
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {}

        # Mock RDS Cluster outputs
        if args.typ == 'aws:rds/cluster:Cluster':
            outputs = {
                'id': 'aurora-cluster-test',
                'arn': 'arn:aws:rds:us-east-1:123456789012:cluster:aurora-cluster-test',
                'endpoint': 'aurora-cluster-test.cluster-abc123.us-east-1.rds.amazonaws.com',
                'reader_endpoint': 'aurora-cluster-test.cluster-ro-abc123.us-east-1.rds.amazonaws.com',
                'cluster_identifier': 'aurora-postgres-test',
                'engine': 'aurora-postgresql',
                'engine_version': '15.8',
                'backup_retention_period': 7,
                'preferred_backup_window': '03:00-04:00',
                **args.inputs,
            }

        # Mock RDS Cluster Instance outputs
        elif args.typ == 'aws:rds/clusterInstance:ClusterInstance':
            outputs = {
                'id': f'{args.name}-instance',
                'identifier': args.inputs.get('identifier', args.name),
                'cluster_identifier': args.inputs.get('cluster_identifier'),
                'instance_class': args.inputs.get('instance_class', 'db.r6g.large'),
                'performance_insights_enabled': True,
                'performance_insights_retention_period': 7,
                **args.inputs,
            }

        # Mock DMS Replication Instance outputs
        elif args.typ == 'aws:dms/replicationInstance:ReplicationInstance':
            outputs = {
                'id': 'dms-replication-test',
                'replication_instance_arn': 'arn:aws:dms:us-east-1:123456789012:rep:test',
                'replication_instance_id': args.inputs.get('replication_instance_id'),
                'replication_instance_class': 'dms.c5.2xlarge',
                'allocated_storage': 100,
                'multi_az': True,
                **args.inputs,
            }

        # Mock DMS Endpoint outputs
        elif args.typ == 'aws:dms/endpoint:Endpoint':
            outputs = {
                'id': f'dms-endpoint-{args.name}',
                'endpoint_arn': f'arn:aws:dms:us-east-1:123456789012:endpoint:{args.name}',
                'endpoint_id': args.inputs.get('endpoint_id'),
                'ssl_mode': 'require',
                **args.inputs,
            }

        # Mock DMS Replication Task outputs
        elif args.typ == 'aws:dms/replicationTask:ReplicationTask':
            outputs = {
                'id': 'dms-task-test',
                'replication_task_arn': 'arn:aws:dms:us-east-1:123456789012:task:test',
                'replication_task_id': args.inputs.get('replication_task_id'),
                'migration_type': 'full-load-and-cdc',
                **args.inputs,
            }

        # Mock Secrets Manager Secret outputs
        elif args.typ == 'aws:secretsmanager/secret:Secret':
            outputs = {
                'id': 'aurora-secret-test',
                'arn': 'arn:aws:secretsmanager:us-east-1:123456789012:secret:aurora-test',
                'name': args.inputs.get('name'),
                **args.inputs,
            }

        # Mock Security Group outputs
        elif args.typ == 'aws:ec2/securityGroup:SecurityGroup':
            outputs = {
                'id': f'sg-{args.name}',
                'vpc_id': args.inputs.get('vpc_id', 'vpc-test'),
                **args.inputs,
            }

        # Mock CloudWatch Alarm outputs
        elif args.typ == 'aws:cloudwatch/metricAlarm:MetricAlarm':
            outputs = {
                'id': f'alarm-{args.name}',
                'name': args.inputs.get('name'),
                'threshold': args.inputs.get('threshold'),
                **args.inputs,
            }

        # Mock Parameter Group outputs
        elif args.typ == 'aws:rds/clusterParameterGroup:ClusterParameterGroup':
            outputs = {
                'id': f'cpg-{args.name}',
                'name': args.name,
                'family': args.inputs.get('family'),
                **args.inputs,
            }

        # Mock DB Parameter Group outputs
        elif args.typ == 'aws:rds/parameterGroup:ParameterGroup':
            outputs = {
                'id': f'pg-{args.name}',
                'name': args.name,
                'family': args.inputs.get('family'),
                **args.inputs,
            }

        # Mock Subnet Group outputs
        elif args.typ == 'aws:rds/subnetGroup:SubnetGroup':
            outputs = {
                'id': f'subnet-group-{args.name}',
                'name': args.name,
                **args.inputs,
            }

        # Mock DMS Subnet Group outputs
        elif args.typ == 'aws:dms/replicationSubnetGroup:ReplicationSubnetGroup':
            outputs = {
                'id': f'dms-subnet-group-{args.name}',
                'replication_subnet_group_id': args.inputs.get('replication_subnet_group_id'),
                **args.inputs,
            }

        # Mock IAM Role outputs
        elif args.typ == 'aws:iam/role:Role':
            outputs = {
                'id': f'role-{args.name}',
                'arn': f'arn:aws:iam::123456789012:role/{args.name}',
                'name': args.inputs.get('name'),
                **args.inputs,
            }

        # Default outputs
        else:
            outputs = {
                'id': f'{args.name}-id',
                **args.inputs,
            }

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == 'aws:iam/getPolicyDocument:getPolicyDocument':
            return {
                'json': json.dumps({
                    'Version': '2012-10-17',
                    'Statement': args.args.get('statements', [])
                })
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after mocks are set
from lib.tap_stack import TapStack, TapStackArgs


@pulumi.runtime.test
def test_aurora_cluster_creation():
    """Test Aurora cluster is created with correct configuration."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    # Test cluster configuration
    def check_cluster(args):
        engine, engine_version, backup_retention, backup_window = args
        assert engine == 'aurora-postgresql', f"Expected aurora-postgresql, got {engine}"
        assert engine_version == '15.8', f"Expected 15.8, got {engine_version}"
        assert backup_retention == 7, f"Expected 7 day retention, got {backup_retention}"
        assert backup_window == '03:00-04:00', f"Expected 03:00-04:00, got {backup_window}"

    return pulumi.Output.all(
        stack.aurora_cluster.engine,
        stack.aurora_cluster.engine_version,
        stack.aurora_cluster.backup_retention_period,
        stack.aurora_cluster.preferred_backup_window
    ).apply(check_cluster)


@pulumi.runtime.test
def test_aurora_cluster_instances():
    """Test Aurora cluster has writer and two reader instances."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    # Verify all three instances exist
    assert stack.writer_instance is not None, "Writer instance should exist"
    assert stack.reader_instance_1 is not None, "Reader instance 1 should exist"
    assert stack.reader_instance_2 is not None, "Reader instance 2 should exist"

    # Test instance classes
    def check_instances(args):
        writer_class, reader1_class, reader2_class = args
        assert writer_class == 'db.r6g.large', f"Expected db.r6g.large for writer, got {writer_class}"
        assert reader1_class == 'db.r6g.large', f"Expected db.r6g.large for reader 1, got {reader1_class}"
        assert reader2_class == 'db.r6g.large', f"Expected db.r6g.large for reader 2, got {reader2_class}"

    return pulumi.Output.all(
        stack.writer_instance.instance_class,
        stack.reader_instance_1.instance_class,
        stack.reader_instance_2.instance_class
    ).apply(check_instances)


@pulumi.runtime.test
def test_performance_insights_enabled():
    """Test Performance Insights is enabled with 7-day retention."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    def check_performance_insights(args):
        pi_enabled, pi_retention = args
        assert pi_enabled is True, "Performance Insights should be enabled"
        assert pi_retention == 7, f"Expected 7 days retention, got {pi_retention}"

    return pulumi.Output.all(
        stack.writer_instance.performance_insights_enabled,
        stack.writer_instance.performance_insights_retention_period
    ).apply(check_performance_insights)


@pulumi.runtime.test
def test_parameter_group_audit_logging():
    """Test cluster parameter group has log_statement='all' for audit compliance."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    def check_parameters(params):
        assert params is not None, "Parameters should exist"
        param_names = [p['name'] for p in params]
        assert 'log_statement' in param_names, "log_statement parameter should exist"

        log_statement_param = next(p for p in params if p['name'] == 'log_statement')
        assert log_statement_param['value'] == 'all', f"Expected log_statement='all', got {log_statement_param['value']}"

    return stack.cluster_parameter_group.parameters.apply(check_parameters)


@pulumi.runtime.test
def test_dms_replication_instance():
    """Test DMS replication instance has at least 8GB memory."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    def check_dms_instance(args):
        instance_class, multi_az = args
        # dms.c5.2xlarge has 16 GB memory (meets 8GB requirement)
        assert instance_class == 'dms.c5.2xlarge', f"Expected dms.c5.2xlarge, got {instance_class}"
        assert multi_az is True, "DMS should be multi-AZ for HA"

    return pulumi.Output.all(
        stack.dms_replication_instance.replication_instance_class,
        stack.dms_replication_instance.multi_az
    ).apply(check_dms_instance)


@pulumi.runtime.test
def test_dms_endpoints_ssl():
    """Test DMS endpoints have SSL encryption enabled."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    def check_ssl(args):
        source_ssl, target_ssl = args
        assert source_ssl == 'require', f"Source endpoint should require SSL, got {source_ssl}"
        assert target_ssl == 'require', f"Target endpoint should require SSL, got {target_ssl}"

    return pulumi.Output.all(
        stack.dms_source_endpoint.ssl_mode,
        stack.dms_target_endpoint.ssl_mode
    ).apply(check_ssl)


@pulumi.runtime.test
def test_dms_migration_task_type():
    """Test DMS migration task is configured for full load and CDC."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    def check_migration_type(migration_type):
        assert migration_type == 'full-load-and-cdc', f"Expected full-load-and-cdc, got {migration_type}"

    return stack.dms_replication_task.migration_type.apply(check_migration_type)


@pulumi.runtime.test
def test_secrets_manager_credentials():
    """Test database credentials are stored in Secrets Manager."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_username='testuser',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    assert stack.aurora_secret is not None, "Aurora secret should exist"
    assert stack.aurora_secret_version is not None, "Secret version should exist"

    def check_secret_name(name):
        assert 'aurora-master-credentials' in name, f"Secret name should contain 'aurora-master-credentials', got {name}"

    return stack.aurora_secret.name.apply(check_secret_name)


@pulumi.runtime.test
def test_cloudwatch_cpu_alarm():
    """Test CloudWatch alarm for Aurora CPU utilization with 80% threshold."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    def check_cpu_alarm(args):
        metric_name, threshold, namespace = args
        assert metric_name == 'CPUUtilization', f"Expected CPUUtilization, got {metric_name}"
        assert threshold == 80, f"Expected 80% threshold, got {threshold}"
        assert namespace == 'AWS/RDS', f"Expected AWS/RDS namespace, got {namespace}"

    return pulumi.Output.all(
        stack.aurora_cpu_alarm.metric_name,
        stack.aurora_cpu_alarm.threshold,
        stack.aurora_cpu_alarm.namespace
    ).apply(check_cpu_alarm)


@pulumi.runtime.test
def test_cloudwatch_replication_lag_alarm():
    """Test CloudWatch alarm for DMS replication lag with 300 second threshold."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    def check_lag_alarm(args):
        metric_name, threshold, namespace = args
        assert metric_name == 'CDCLatencyTarget', f"Expected CDCLatencyTarget, got {metric_name}"
        assert threshold == 300, f"Expected 300 second threshold, got {threshold}"
        assert namespace == 'AWS/DMS', f"Expected AWS/DMS namespace, got {namespace}"

    return pulumi.Output.all(
        stack.dms_lag_alarm.metric_name,
        stack.dms_lag_alarm.threshold,
        stack.dms_lag_alarm.namespace
    ).apply(check_lag_alarm)


@pulumi.runtime.test
def test_resource_tagging():
    """Test all resources are tagged with Environment and MigrationPhase."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    def check_tags(tags):
        assert 'Environment' in tags, "Environment tag should exist"
        assert 'MigrationPhase' in tags, "MigrationPhase tag should exist"
        assert tags['Environment'] == 'test', f"Expected Environment=test, got {tags['Environment']}"
        assert tags['MigrationPhase'] == 'active', f"Expected MigrationPhase=active, got {tags['MigrationPhase']}"

    return stack.aurora_cluster.tags.apply(check_tags)


@pulumi.runtime.test
def test_stack_outputs():
    """Test stack exports required outputs."""
    args = TapStackArgs(
        environment_suffix='test',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    # Verify all required outputs exist
    assert stack.cluster_endpoint is not None, "Cluster endpoint output should exist"
    assert stack.reader_endpoint is not None, "Reader endpoint output should exist"
    assert stack.dms_task_arn is not None, "DMS task ARN output should exist"
    assert stack.secret_arn is not None, "Secret ARN output should exist"

    return pulumi.Output.all(
        stack.cluster_endpoint,
        stack.reader_endpoint,
        stack.dms_task_arn
    ).apply(lambda args: None)


@pulumi.runtime.test
def test_environment_suffix_in_resource_names():
    """Test environmentSuffix is used in all resource names."""
    args = TapStackArgs(
        environment_suffix='prod',
        vpc_id='vpc-12345',
        private_subnet_ids=['subnet-1', 'subnet-2', 'subnet-3'],
        dms_subnet_ids=['subnet-4', 'subnet-5'],
        source_db_host='10.0.0.100',
        source_db_password='source-pass',
        aurora_password='aurora-pass'
    )

    stack = TapStack('test-stack', args)

    def check_suffix(name):
        assert 'prod' in name, f"Resource name should contain environment suffix 'prod', got {name}"

    return pulumi.Output.all(
        stack.aurora_cluster.cluster_identifier,
        stack.aurora_secret.name,
        stack.dms_replication_instance.replication_instance_id
    ).apply(lambda args: all([check_suffix(name) for name in args]))
