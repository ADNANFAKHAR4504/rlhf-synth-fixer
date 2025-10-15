"""
Unit tests for Educational Platform CI/CD Infrastructure
"""
import importlib
import json
import os
import sys
import types
import unittest


def _create_pulumi_stub():
    """Create a minimal stub for the pulumi module to execute the program."""
    module = types.ModuleType("pulumi")
    module._exports = {}

    class Output:
        """Lightweight Output implementation used by the tests."""

        def __init__(self, value):
            self.value = value

        def apply(self, func):
            return Output(func(self.value))

        @staticmethod
        def all(*args):
            resolved = []
            for arg in args:
                if isinstance(arg, Output):
                    resolved.append(arg.value)
                else:
                    resolved.append(arg)
            return Output(resolved)

        @staticmethod
        def secret(value):
            return Output(value)

    class ResourceOptions:
        """Minimal ResourceOptions that simply stores dependencies."""

        def __init__(self, depends_on=None):
            self.depends_on = depends_on or []

    class Config:
        """Simple Config stub that returns pre-populated values."""

        def __init__(self, **values):
            self._values = values

        def get(self, key, default=None):
            return self._values.get(key, default)

    def export(name, value):
        module._exports[name] = value

    module.Output = Output
    module.ResourceOptions = ResourceOptions
    module.Config = Config
    module.export = export
    return module


def _create_pulumi_aws_stub():
    """Create a lightweight pulumi_aws stub to avoid real provider imports."""
    module = types.ModuleType("pulumi_aws")

    class _AttrDict(dict):
        """Dictionary that allows attribute-style access for convenience."""

        def __getattr__(self, item):
            try:
                return self[item]
            except KeyError as exc:
                raise AttributeError(item) from exc

        def __setattr__(self, key, value):
            self[key] = value

    class _CacheNode:
        """Simple object representing an ElastiCache node."""

        def __init__(self, address, port):
            self.address = address
            self.port = port

    class MockResource:
        """Generic AWS resource placeholder that records provided arguments."""

        def __init__(self, resource_name, *args, **kwargs):
            self.resource_name = resource_name
            self.args = args
            self.kwargs = kwargs
            self.id = kwargs.get("id", f"{resource_name}_id")
            self.arn = kwargs.get("arn", f"arn:mock::{resource_name}")
            self.endpoint = kwargs.get("endpoint", f"{resource_name}.mock.local")
            self.address = kwargs.get("address", f"{resource_name}.mock.local")
            default_cache = [_CacheNode(f"{resource_name}.mock.local", kwargs.get("port", 6379))]
            raw_nodes = kwargs.get("cache_nodes", kwargs.get("cacheNodes", default_cache))
            cache_nodes = []
            for node in raw_nodes:
                if isinstance(node, dict):
                    cache_nodes.append(_AttrDict(node))
                else:
                    cache_nodes.append(node)
            self.cache_nodes = cache_nodes
            self.cacheNodes = cache_nodes
            self.bucket = kwargs.get("bucket", f"{resource_name}-bucket")
            for key, value in kwargs.items():
                setattr(self, key, value)

    def resource_factory(name):
        return type(name, (MockResource,), {})

    def args_factory(name):
        def __init__(self, **kwargs):
            self._kwargs = kwargs
            for key, value in kwargs.items():
                setattr(self, key, value)

        return type(name, (), {"__init__": __init__})

    namespaces = {
        "kms": ["Key", "Alias"],
        "ec2": [
            "Vpc",
            "InternetGateway",
            "Subnet",
            "Eip",
            "NatGateway",
            "RouteTable",
            "RouteTableAssociation",
            "SecurityGroup",
        ],
        "rds": ["Instance", "SubnetGroup"],
        "elasticache": ["Cluster", "SubnetGroup"],
        "cloudwatch": ["LogGroup", "MetricAlarm"],
        "s3": ["Bucket", "BucketPublicAccessBlock"],
        "secretsmanager": ["Secret", "SecretVersion"],
        "iam": ["Policy", "Role", "RolePolicyAttachment"],
        "codebuild": ["Project"],
        "codepipeline": ["Pipeline"],
        "sns": ["Topic"],
    }

    for namespace, classes in namespaces.items():
        setattr(
            module,
            namespace,
            types.SimpleNamespace(**{cls_name: resource_factory(cls_name) for cls_name in classes}),
        )

    for cls_name in {
        "ProjectArtifactsArgs",
        "ProjectEnvironmentArgs",
        "ProjectSourceArgs",
        "ProjectLogsConfigArgs",
        "ProjectLogsConfigCloudwatchLogsArgs",
        "ProjectEnvironmentEnvironmentVariableArgs",
    }:
        setattr(getattr(module, "codebuild"), cls_name, args_factory(cls_name))

    for cls_name in {
        "PipelineArtifactStoreArgs",
        "PipelineArtifactStoreEncryptionKeyArgs",
        "PipelineStageArgs",
        "PipelineStageActionArgs",
    }:
        setattr(getattr(module, "codepipeline"), cls_name, args_factory(cls_name))

    for cls_name in {
        "BucketServerSideEncryptionConfigurationArgs",
        "BucketServerSideEncryptionConfigurationRuleArgs",
        "BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs",
        "BucketVersioningArgs",
    }:
        setattr(getattr(module, "s3"), cls_name, args_factory(cls_name))

    for cls_name in {"RouteTableRouteArgs", "SecurityGroupIngressArgs", "SecurityGroupEgressArgs"}:
        setattr(getattr(module, "ec2"), cls_name, args_factory(cls_name))

    class Identity:
        def __init__(self):
            self.account_id = "123456789012"

    def get_caller_identity():
        return Identity()

    module.get_caller_identity = get_caller_identity
    return module


def _load_infrastructure_module():
    """Import the Pulumi program with stubbed dependencies and return module plus stub."""
    original_modules = {name: sys.modules.get(name) for name in ("pulumi", "pulumi_aws")}
    pulumi_stub = _create_pulumi_stub()
    pulumi_aws_stub = _create_pulumi_aws_stub()

    sys.modules["pulumi"] = pulumi_stub
    sys.modules["pulumi_aws"] = pulumi_aws_stub

    module = importlib.import_module("lib.__main__")

    for name, original in original_modules.items():
        if original is not None:
            sys.modules[name] = original
        else:
            sys.modules.pop(name, None)

    return module, pulumi_stub


class TestEducationPlatformInfrastructure(unittest.TestCase):
    """Test cases for educational platform infrastructure validation"""

    @classmethod
    def setUpClass(cls):
        """Import the Pulumi program once using the stubs."""
        cls.infra_module, cls.pulumi_stub = _load_infrastructure_module()

    def setUp(self):
        """Set up test fixtures"""
        self.main_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'lib',
            '__main__.py'
        )
        with open(self.main_file, 'r', encoding='utf-8') as f:
            self.content = f.read()
        self.module = self.__class__.infra_module

    def test_infrastructure_file_exists(self):
        """Test that infrastructure files exist"""
        self.assertTrue(os.path.exists(self.main_file))
        self.assertTrue(os.path.exists(os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'Pulumi.yaml'
        )))

    def test_required_imports(self):
        """Test all required imports are present"""
        self.assertIn('import pulumi', self.content)
        self.assertIn('import pulumi_aws as aws', self.content)
        self.assertIn('import json', self.content)
        self.assertIn('import os', self.content)
        self.assertIn('from pulumi import Output, export', self.content)

    def test_environment_suffix_usage(self):
        """Test that environment suffix is used"""
        self.assertIn('environment_suffix', self.content)
        self.assertIn('ENVIRONMENT_SUFFIX', self.content)
        self.assertIn('environment_suffix}', self.content)

    def test_region_configuration(self):
        """Test region is properly configured"""
        self.assertIn('AWS_REGION', self.content)
        self.assertIn('ap-southeast-1', self.content)

    def test_kms_key_created(self):
        """Test KMS key is created with proper configuration"""
        self.assertIn('aws.kms.Key', self.content)
        self.assertIn('education-platform-key', self.content)
        self.assertIn('enable_key_rotation=True', self.content)
        self.assertIn('deletion_window_in_days=10', self.content)

    def test_kms_key_policy(self):
        """Test KMS key policy is properly configured"""
        self.assertIn('policy=json.dumps', self.content)
        self.assertIn('Enable IAM User Permissions', self.content)
        self.assertIn('Allow CloudWatch Logs', self.content)
        self.assertIn('logs.{region}.amazonaws.com', self.content)

    def test_vpc_creation(self):
        """Test VPC is created with proper configuration"""
        self.assertIn('aws.ec2.Vpc', self.content)
        self.assertIn('education-vpc', self.content)
        self.assertIn('cidr_block="10.0.0.0/16"', self.content)
        self.assertIn('enable_dns_hostnames=True', self.content)
        self.assertIn('enable_dns_support=True', self.content)

    def test_internet_gateway(self):
        """Test Internet Gateway is created"""
        self.assertIn('aws.ec2.InternetGateway', self.content)
        self.assertIn('education-igw', self.content)
        self.assertIn('vpc_id=vpc.id', self.content)

    def test_public_subnets(self):
        """Test public subnets are created in 2 AZs"""
        self.assertIn('public_subnet_1', self.content)
        self.assertIn('public_subnet_2', self.content)
        self.assertIn('10.0.1.0/24', self.content)
        self.assertIn('10.0.2.0/24', self.content)
        self.assertIn('map_public_ip_on_launch=True', self.content)
        self.assertIn('Type": "Public', self.content)

    def test_private_subnets(self):
        """Test private subnets are created in 2 AZs"""
        self.assertIn('private_subnet_1', self.content)
        self.assertIn('private_subnet_2', self.content)
        self.assertIn('10.0.10.0/24', self.content)
        self.assertIn('10.0.11.0/24', self.content)
        self.assertIn('Type": "Private', self.content)

    def test_nat_gateway(self):
        """Test NAT Gateway is created"""
        self.assertIn('aws.ec2.NatGateway', self.content)
        self.assertIn('education-nat', self.content)
        self.assertIn('aws.ec2.Eip', self.content)
        self.assertIn('allocation_id=eip.id', self.content)

    def test_route_tables(self):
        """Test route tables are properly configured"""
        self.assertIn('aws.ec2.RouteTable', self.content)
        self.assertIn('public_route_table', self.content)
        self.assertIn('private_route_table', self.content)
        self.assertIn('RouteTableAssociation', self.content)

    def test_rds_security_group(self):
        """Test RDS security group is created"""
        self.assertIn('rds_security_group', self.content)
        self.assertIn('education-rds-sg', self.content)
        self.assertIn('from_port=3306', self.content)
        self.assertIn('to_port=3306', self.content)
        self.assertIn('Allow MySQL access from VPC', self.content)

    def test_elasticache_security_group(self):
        """Test ElastiCache security group is created"""
        self.assertIn('elasticache_security_group', self.content)
        self.assertIn('education-elasticache-sg', self.content)
        self.assertIn('from_port=6379', self.content)
        self.assertIn('to_port=6379', self.content)
        self.assertIn('Allow Redis access from VPC', self.content)

    def test_rds_instance(self):
        """Test RDS MySQL instance is created"""
        self.assertIn('aws.rds.Instance', self.content)
        self.assertIn('education-rds', self.content)
        self.assertIn('engine="mysql"', self.content)
        self.assertIn('instance_class="db.t3.micro"', self.content)
        self.assertIn('storage_encrypted=True', self.content)
        self.assertIn('kms_key_id=kms_key.arn', self.content)
        self.assertIn('publicly_accessible=False', self.content)
        self.assertIn('multi_az=False', self.content)

    def test_rds_backup_configuration(self):
        """Test RDS backup configuration"""
        self.assertIn('backup_retention_period=1', self.content)
        self.assertIn('skip_final_snapshot=True', self.content)
        self.assertIn('enabled_cloudwatch_logs_exports', self.content)

    def test_secrets_manager_integration(self):
        """Test Secrets Manager integration"""
        self.assertIn('aws.secretsmanager.Secret', self.content)
        self.assertIn('education-platform-db-credentials', self.content)
        self.assertIn('db_secret', self.content)
        self.assertIn('SecretVersion', self.content)

    def test_elasticache_cluster(self):
        """Test ElastiCache Redis cluster is created"""
        self.assertIn('aws.elasticache.Cluster', self.content)
        self.assertIn('education-redis', self.content)
        self.assertIn('engine="redis"', self.content)
        self.assertIn('node_type="cache.t3.micro"', self.content)
        self.assertIn('num_cache_nodes=1', self.content)

    def test_cloudwatch_log_group(self):
        """Test CloudWatch Log Group is created"""
        self.assertIn('aws.cloudwatch.LogGroup', self.content)
        self.assertIn('education-pipeline-logs', self.content)
        self.assertIn('retention_in_days=14', self.content)
        self.assertIn('kms_key_id=kms_key.arn', self.content)

    def test_s3_artifact_bucket(self):
        """Test S3 artifact bucket is created"""
        self.assertIn('aws.s3.Bucket', self.content)
        self.assertIn('education-artifacts', self.content)
        self.assertIn('force_destroy=True', self.content)
        self.assertIn('server_side_encryption_configuration', self.content)
        self.assertIn('sse_algorithm="aws:kms"', self.content)

    def test_s3_public_access_block(self):
        """Test S3 bucket has public access blocked"""
        self.assertIn('BucketPublicAccessBlock', self.content)
        self.assertIn('block_public_acls=True', self.content)
        self.assertIn('block_public_policy=True', self.content)
        self.assertIn('ignore_public_acls=True', self.content)
        self.assertIn('restrict_public_buckets=True', self.content)

    def test_codepipeline_role(self):
        """Test CodePipeline IAM role is created"""
        self.assertIn('codepipeline_role', self.content)
        self.assertIn('education-codepipeline-role', self.content)
        self.assertIn('codepipeline.amazonaws.com', self.content)
        self.assertIn('sts:AssumeRole', self.content)

    def test_codepipeline_policy(self):
        """Test CodePipeline policy is created"""
        self.assertIn('codepipeline_policy', self.content)
        self.assertIn('s3:GetObject', self.content)
        self.assertIn('s3:PutObject', self.content)
        self.assertIn('kms:Decrypt', self.content)
        self.assertIn('codebuild:BatchGetBuilds', self.content)
        self.assertIn('codebuild:StartBuild', self.content)

    def test_codebuild_role(self):
        """Test CodeBuild IAM role is created"""
        self.assertIn('codebuild_role', self.content)
        self.assertIn('education-codebuild-role', self.content)
        self.assertIn('codebuild.amazonaws.com', self.content)

    def test_codebuild_policy(self):
        """Test CodeBuild policy includes Secrets Manager access"""
        self.assertIn('codebuild_policy', self.content)
        self.assertIn('secretsmanager:GetSecretValue', self.content)
        self.assertIn('logs:CreateLogGroup', self.content)
        self.assertIn('logs:PutLogEvents', self.content)

    def test_codebuild_staging_project(self):
        """Test CodeBuild staging project is created"""
        self.assertIn('codebuild_staging', self.content)
        self.assertIn('education-build-staging', self.content)
        self.assertIn('BUILD_GENERAL1_SMALL', self.content)
        self.assertIn('aws/codebuild/standard:7.0', self.content)
        self.assertIn('ENVIRONMENT', self.content)
        self.assertIn('staging', self.content)

    def test_codebuild_production_project(self):
        """Test CodeBuild production project is created"""
        self.assertIn('codebuild_production', self.content)
        self.assertIn('education-build-production', self.content)
        self.assertIn('production', self.content)

    def test_sns_approval_topic(self):
        """Test SNS topic for manual approval is created"""
        self.assertIn('aws.sns.Topic', self.content)
        self.assertIn('education-pipeline-approval', self.content)
        self.assertIn('kms_master_key_id=kms_key.id', self.content)

    def test_codepipeline_created(self):
        """Test CodePipeline is created"""
        self.assertIn('aws.codepipeline.Pipeline', self.content)
        self.assertIn('education-pipeline', self.content)

    def test_pipeline_stages(self):
        """Test pipeline has all required stages"""
        self.assertIn('name="Source"', self.content)
        self.assertIn('name="Staging"', self.content)
        self.assertIn('name="ManualApproval"', self.content)
        self.assertIn('name="Production"', self.content)

    def test_pipeline_manual_approval(self):
        """Test pipeline includes manual approval step"""
        self.assertIn('category="Approval"', self.content)
        self.assertIn('provider="Manual"', self.content)
        self.assertIn('ApproveProduction', self.content)
        self.assertIn('NotificationArn', self.content)

    def test_cloudwatch_alarm(self):
        """Test CloudWatch alarm for pipeline failures"""
        self.assertIn('aws.cloudwatch.MetricAlarm', self.content)
        self.assertIn('education-pipeline-failure-alarm', self.content)
        self.assertIn('PipelineExecutionFailure', self.content)
        self.assertIn('AWS/CodePipeline', self.content)

    def test_tags_applied(self):
        """Test tags are properly applied to resources"""
        self.assertIn('tags={', self.content)
        self.assertIn('"Name"', self.content)
        self.assertIn('"Environment"', self.content)
        self.assertIn('environment_suffix', self.content)

    def test_data_classification_tags(self):
        """Test data classification tags are applied"""
        self.assertIn('DataClassification', self.content)
        self.assertIn('Sensitive', self.content)

    def test_exports_defined(self):
        """Test all required outputs are exported"""
        exports = [
            'vpc_id',
            'public_subnet_1_id',
            'public_subnet_2_id',
            'private_subnet_1_id',
            'private_subnet_2_id',
            'nat_gateway_id',
            'rds_endpoint',
            'rds_arn',
            'elasticache_endpoint',
            'kms_key_id',
            'kms_key_arn',
            'artifact_bucket_name',
            'pipeline_name',
            'pipeline_arn',
            'codebuild_staging_name',
            'codebuild_production_name',
            'approval_topic_arn'
        ]
        for exp in exports:
            self.assertIn(f'export("{exp}"', self.content)
            self.assertIn(exp, self.__class__.pulumi_stub._exports)
            self.assertIsNotNone(self.__class__.pulumi_stub._exports[exp])

    def test_resource_dependencies(self):
        """Test resource dependencies are configured"""
        self.assertIn('ResourceOptions', self.content)
        self.assertIn('depends_on', self.content)

    def test_no_retain_policies(self):
        """Test no retain deletion policies"""
        self.assertNotIn('retain', self.content.lower())
        self.assertNotIn('deletion_policy', self.content.lower())

    def test_encryption_at_rest(self):
        """Test encryption at rest is configured"""
        self.assertIn('storage_encrypted=True', self.content)
        self.assertIn('kms_key_id', self.content)
        self.assertIn('kms_master_key_id', self.content)

    def test_buildspec_files_exist(self):
        """Test buildspec files exist"""
        staging_buildspec = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'lib',
            'buildspec-staging.yml'
        )
        production_buildspec = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'lib',
            'buildspec-production.yml'
        )
        self.assertTrue(os.path.exists(staging_buildspec))
        self.assertTrue(os.path.exists(production_buildspec))

    def test_pulumi_yaml_exists(self):
        """Test Pulumi.yaml configuration file exists"""
        pulumi_yaml = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'Pulumi.yaml'
        )
        self.assertTrue(os.path.exists(pulumi_yaml))

    def test_caller_identity_usage(self):
        """Test AWS caller identity is used for account ID"""
        self.assertIn('aws.get_caller_identity()', self.content)
        self.assertIn('account_id', self.content)

    def test_security_groups_cidr_restrictions(self):
        """Test security groups have CIDR restrictions"""
        self.assertIn('cidr_blocks=["10.0.0.0/16"]', self.content)

    def test_subnet_groups_created(self):
        """Test subnet groups are created for RDS and ElastiCache"""
        self.assertIn('aws.rds.SubnetGroup', self.content)
        self.assertIn('aws.elasticache.SubnetGroup', self.content)
        self.assertIn('db_subnet_group', self.content)
        self.assertIn('elasticache_subnet_group', self.content)


if __name__ == "__main__":
    unittest.main()
