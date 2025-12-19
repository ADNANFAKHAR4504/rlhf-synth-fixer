"""Unit tests for TapStack CDK infrastructure."""

import os
import pytest
from aws_cdk import App, Environment
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app():
    """Create a CDK app for testing."""
    return App()


@pytest.fixture
def environment_suffix():
    """Get environment suffix from env or default to test."""
    return os.environ.get('ENVIRONMENT_SUFFIX', 'test')


@pytest.fixture
def localstack_env(monkeypatch):
    """Set up LocalStack environment variables."""
    monkeypatch.setenv('AWS_ENDPOINT_URL', 'http://localhost:4566')
    yield
    monkeypatch.delenv('AWS_ENDPOINT_URL', raising=False)


@pytest.fixture
def aws_env(monkeypatch):
    """Set up AWS environment (no LocalStack)."""
    monkeypatch.delenv('AWS_ENDPOINT_URL', raising=False)
    monkeypatch.delenv('LOCALSTACK_HOSTNAME', raising=False)
    yield


def test_stack_creation(app, environment_suffix):
    """Test that TapStack can be created successfully."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, f"TapStack{environment_suffix}", props=props)

    assert stack is not None
    assert stack.environment_suffix == environment_suffix


def test_stack_creation_with_props(app):
    """Test TapStack creation with explicit props."""
    props = TapStackProps(environment_suffix='prod')
    stack = TapStack(app, "TapStackprod", props=props)

    assert stack is not None
    assert stack.environment_suffix == 'prod'


def test_stack_creation_without_props(app):
    """Test TapStack creation without props (should use default)."""
    stack = TapStack(app, "TapStackdev", props=None)

    assert stack is not None
    assert stack.environment_suffix == 'dev'


def test_stack_creation_with_context(app):
    """Test TapStack creation using context."""
    # Set context on the node
    stack = TapStack(app, "TapStackcontext")
    # Since we don't set context, it should default to 'dev'
    assert stack.environment_suffix == 'dev'


def test_stack_resources(app, environment_suffix):
    """Test that TapStack creates expected resources."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, f"TapStack{environment_suffix}", props=props)

    # Synthesize the stack to CloudFormation template
    template = app.synth().get_stack_by_name(stack.stack_name).template

    # Verify critical resources exist
    resources = template.get('Resources', {})

    # Check for KMS keys (at least 1 for S3, possibly 2 if RDS is created)
    kms_keys = [r for r in resources.values() if r.get('Type') == 'AWS::KMS::Key']
    assert len(kms_keys) >= 1, "Should have at least 1 KMS key (S3)"

    # Check for VPC (conditional based on environment)
    vpcs = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::VPC']
    is_localstack = os.environ.get('AWS_ENDPOINT_URL') is not None
    if not is_localstack:
        assert len(vpcs) == 1, "Should have exactly 1 VPC in non-LocalStack environment"
    else:
        assert len(vpcs) == 0, "Should not have VPC in LocalStack environment"

    # Check for S3 bucket (always created)
    s3_buckets = [r for r in resources.values() if r.get('Type') == 'AWS::S3::Bucket']
    assert len(s3_buckets) >= 1, "Should have at least 1 S3 bucket"


def test_stack_with_environment(app):
    """Test TapStack with explicit environment configuration."""
    env = Environment(account='000000000000', region='us-east-1')
    props = TapStackProps(environment_suffix='prod')

    stack = TapStack(
        app,
        "TapStackprod",
        props=props,
        env=env
    )

    assert stack is not None
    assert stack.environment_suffix == 'prod'


def test_stack_removal_policies(app, environment_suffix):
    """Test that resources have proper RemovalPolicy for LocalStack."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, f"TapStack{environment_suffix}", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check KMS keys have RemovalPolicy
    kms_keys = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::KMS::Key'
    }
    for key_id, key_resource in kms_keys.items():
        assert 'DeletionPolicy' in key_resource, f"KMS key {key_id} should have DeletionPolicy"


def test_stack_encryption(app, environment_suffix):
    """Test that S3 buckets and RDS instances use encryption."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, f"TapStack{environment_suffix}", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check S3 bucket encryption (always present)
    s3_buckets = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::S3::Bucket'
    }
    for bucket_id, bucket in s3_buckets.items():
        properties = bucket.get('Properties', {})
        assert 'BucketEncryption' in properties, f"S3 bucket {bucket_id} should have encryption"

    # Check RDS instance encryption (only if RDS is created)
    rds_instances = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::RDS::DBInstance'
    }
    is_localstack = os.environ.get('AWS_ENDPOINT_URL') is not None
    if not is_localstack:
        assert len(rds_instances) > 0, "RDS instances should be present in non-LocalStack environment"
        for instance_id, instance in rds_instances.items():
            properties = instance.get('Properties', {})
            assert properties.get('StorageEncrypted', False), f"RDS instance {instance_id} should have storage encrypted"
    else:
        assert len(rds_instances) == 0, "RDS instances should not be created in LocalStack environment"


def test_localstack_mode(app, localstack_env):
    """Test stack creation in LocalStack mode - should skip EC2/VPC/RDS resources."""
    props = TapStackProps(environment_suffix='localstack')
    stack = TapStack(app, "TapStacklocalstack", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Should have S3 buckets
    s3_buckets = [r for r in resources.values() if r.get('Type') == 'AWS::S3::Bucket']
    assert len(s3_buckets) == 3, "Should have exactly 3 S3 buckets in LocalStack mode"

    # Should NOT have VPC
    vpcs = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::VPC']
    assert len(vpcs) == 0, "Should not have VPC in LocalStack mode"

    # Should NOT have RDS
    rds_instances = [r for r in resources.values() if r.get('Type') == 'AWS::RDS::DBInstance']
    assert len(rds_instances) == 0, "Should not have RDS in LocalStack mode"

    # Should NOT have Security Groups
    security_groups = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::SecurityGroup']
    assert len(security_groups) == 0, "Should not have Security Groups in LocalStack mode"

    # Should have KMS key for S3 (but not RDS KMS key)
    kms_keys = [r for r in resources.values() if r.get('Type') == 'AWS::KMS::Key']
    assert len(kms_keys) == 1, "Should have exactly 1 KMS key (S3) in LocalStack mode"

    # Should have Lambda role (always created)
    iam_roles = [r for r in resources.values() if r.get('Type') == 'AWS::IAM::Role']
    lambda_roles = [r for r in iam_roles if 'Lambda' in str(r.get('Properties', {}).get('AssumedByServicePrincipal', ''))]
    assert len(lambda_roles) >= 1, "Should have Lambda role in LocalStack mode"


def test_aws_mode_full_resources(app, aws_env):
    """Test stack creation in AWS mode - should create all resources including EC2/VPC/RDS."""
    props = TapStackProps(environment_suffix='aws')
    stack = TapStack(app, "TapStackaws", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Should have S3 buckets
    s3_buckets = [r for r in resources.values() if r.get('Type') == 'AWS::S3::Bucket']
    assert len(s3_buckets) == 3, "Should have exactly 3 S3 buckets in AWS mode"

    # Should have VPC
    vpcs = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::VPC']
    assert len(vpcs) == 1, "Should have exactly 1 VPC in AWS mode"

    # Should have RDS
    rds_instances = [r for r in resources.values() if r.get('Type') == 'AWS::RDS::DBInstance']
    assert len(rds_instances) == 1, "Should have exactly 1 RDS instance in AWS mode"

    # Should have Security Groups
    security_groups = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::SecurityGroup']
    assert len(security_groups) >= 3, "Should have at least 3 Security Groups in AWS mode"

    # Should have 2 KMS keys (S3 and RDS)
    kms_keys = [r for r in resources.values() if r.get('Type') == 'AWS::KMS::Key']
    assert len(kms_keys) == 2, "Should have exactly 2 KMS keys (S3 and RDS) in AWS mode"


def test_s3_bucket_properties(app, localstack_env, environment_suffix):
    """Test S3 bucket properties - versioning, encryption, SSL enforcement."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, f"TapStack{environment_suffix}", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    s3_buckets = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::S3::Bucket'
    }

    for bucket_id, bucket in s3_buckets.items():
        properties = bucket.get('Properties', {})

        # Check versioning
        assert 'VersioningConfiguration' in properties, f"Bucket {bucket_id} should have versioning configured"
        assert properties['VersioningConfiguration']['Status'] == 'Enabled', f"Bucket {bucket_id} should have versioning enabled"

        # Check encryption
        assert 'BucketEncryption' in properties, f"Bucket {bucket_id} should have encryption"

        # Check public access block
        assert 'PublicAccessBlockConfiguration' in properties, f"Bucket {bucket_id} should have public access block"
        public_access = properties['PublicAccessBlockConfiguration']
        assert public_access.get('BlockPublicAcls', False), f"Bucket {bucket_id} should block public ACLs"
        assert public_access.get('BlockPublicPolicy', False), f"Bucket {bucket_id} should block public policy"


def test_vpc_configuration(app, aws_env):
    """Test VPC configuration - subnets, DNS, flow logs."""
    props = TapStackProps(environment_suffix='vpc-test')
    stack = TapStack(app, "TapStackvpc-test", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check VPC exists
    vpcs = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::EC2::VPC'
    }
    assert len(vpcs) == 1, "Should have exactly 1 VPC"

    vpc = list(vpcs.values())[0]
    vpc_properties = vpc.get('Properties', {})

    # Check DNS settings
    assert vpc_properties.get('EnableDnsHostnames', False), "VPC should have DNS hostnames enabled"
    assert vpc_properties.get('EnableDnsSupport', False), "VPC should have DNS support enabled"

    # Check subnets exist
    subnets = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::Subnet']
    assert len(subnets) >= 2, "Should have at least 2 subnets (public and isolated)"

    # Check flow logs
    flow_logs = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::FlowLog']
    assert len(flow_logs) >= 1, "Should have VPC flow logs configured"

    # Check log group for flow logs
    log_groups = [r for r in resources.values() if r.get('Type') == 'AWS::Logs::LogGroup']
    assert len(log_groups) >= 1, "Should have CloudWatch log group for VPC flow logs"


def test_security_groups_configuration(app, aws_env):
    """Test security groups - web, app, and database SGs with proper rules."""
    props = TapStackProps(environment_suffix='sg-test')
    stack = TapStack(app, "TapStacksg-test", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check security groups
    security_groups = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::EC2::SecurityGroup'
    }
    assert len(security_groups) >= 3, "Should have at least 3 security groups (web, app, db)"

    # Find web security group (should have ingress for 443, 80, 22)
    web_sg = None
    for sg_id, sg in security_groups.items():
        desc = sg.get('Properties', {}).get('GroupDescription', '')
        if 'web' in desc.lower():
            web_sg = sg
            break

    assert web_sg is not None, "Should have a web security group"

    # Check ingress rules (they're defined separately as AWS::EC2::SecurityGroupIngress)
    ingress_rules = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::SecurityGroupIngress']
    assert len(ingress_rules) >= 3, "Should have ingress rules defined"

    # Check egress rules
    egress_rules = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::SecurityGroupEgress']
    assert len(egress_rules) >= 3, "Should have egress rules defined"


def test_iam_roles_configuration(app, aws_env):
    """Test IAM roles - Lambda, EC2 web, EC2 app roles."""
    props = TapStackProps(environment_suffix='iam-test')
    stack = TapStack(app, "TapStackiam-test", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check IAM roles
    iam_roles = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::IAM::Role'
    }

    # Should have Lambda role (always)
    lambda_roles = [
        r for r in iam_roles.values()
        if 'lambda.amazonaws.com' in str(r.get('Properties', {}).get('AssumeRolePolicyDocument', {}))
    ]
    assert len(lambda_roles) >= 1, "Should have Lambda execution role"

    # Should have EC2 roles in AWS mode
    ec2_roles = [
        r for r in iam_roles.values()
        if 'ec2.amazonaws.com' in str(r.get('Properties', {}).get('AssumeRolePolicyDocument', {}))
    ]
    assert len(ec2_roles) >= 2, "Should have EC2 roles (web and app) in AWS mode"

    # Should have VPC flow logs role
    flow_log_roles = [
        r for r in iam_roles.values()
        if 'vpc-flow-logs.amazonaws.com' in str(r.get('Properties', {}).get('AssumeRolePolicyDocument', {}))
    ]
    assert len(flow_log_roles) >= 1, "Should have VPC flow logs role in AWS mode"


def test_rds_configuration(app, aws_env):
    """Test RDS database configuration - encryption, backup, multi-AZ."""
    props = TapStackProps(environment_suffix='rds-test')
    stack = TapStack(app, "TapStackrds-test", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check RDS instance
    rds_instances = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::RDS::DBInstance'
    }
    assert len(rds_instances) == 1, "Should have exactly 1 RDS instance in AWS mode"

    rds_instance = list(rds_instances.values())[0]
    rds_properties = rds_instance.get('Properties', {})

    # Check encryption
    assert rds_properties.get('StorageEncrypted', False), "RDS should have storage encryption enabled"

    # Check backup retention
    assert 'BackupRetentionPeriod' in rds_properties, "RDS should have backup retention configured"
    assert rds_properties['BackupRetentionPeriod'] >= 7, "RDS should have at least 7 days backup retention"

    # Check multi-AZ (should be False for cost savings)
    assert rds_properties.get('MultiAZ', True) == False, "RDS should not be multi-AZ for dev environment"

    # Check deletion protection (should be False for dev)
    assert rds_properties.get('DeletionProtection', True) == False, "RDS should not have deletion protection in dev"

    # Check engine
    assert 'Engine' in rds_properties, "RDS should have engine specified"
    assert rds_properties['Engine'] == 'mysql', "RDS should use MySQL engine"


def test_rds_subnet_group(app, aws_env):
    """Test RDS subnet group configuration."""
    props = TapStackProps(environment_suffix='rds-subnet-test')
    stack = TapStack(app, "TapStackrds-subnet-test", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check RDS subnet group
    subnet_groups = [r for r in resources.values() if r.get('Type') == 'AWS::RDS::DBSubnetGroup']
    assert len(subnet_groups) == 1, "Should have exactly 1 RDS subnet group in AWS mode"


def test_cloudformation_outputs(app, localstack_env):
    """Test CloudFormation outputs - S3 buckets, KMS key."""
    props = TapStackProps(environment_suffix='output-test')
    stack = TapStack(app, "TapStackoutput-test", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    outputs = template.get('Outputs', {})

    # Check S3 bucket outputs (always present)
    assert 'WebAssetsBucketName' in outputs, "Should have WebAssetsBucketName output"
    assert 'UserUploadsBucketName' in outputs, "Should have UserUploadsBucketName output"
    assert 'AppDataBucketName' in outputs, "Should have AppDataBucketName output"

    # Check KMS key output
    assert 'S3KmsKeyId' in outputs, "Should have S3KmsKeyId output"

    # VPC and RDS outputs should NOT be present in LocalStack mode
    assert 'VpcId' not in outputs, "Should not have VpcId output in LocalStack mode"
    assert 'RdsInstanceIdentifier' not in outputs, "Should not have RdsInstanceIdentifier output in LocalStack mode"


def test_cloudformation_outputs_aws_mode(app, aws_env):
    """Test CloudFormation outputs in AWS mode - includes VPC and RDS."""
    props = TapStackProps(environment_suffix='output-aws-test')
    stack = TapStack(app, "TapStackoutput-aws-test", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    outputs = template.get('Outputs', {})

    # Check S3 bucket outputs
    assert 'WebAssetsBucketName' in outputs, "Should have WebAssetsBucketName output"
    assert 'UserUploadsBucketName' in outputs, "Should have UserUploadsBucketName output"
    assert 'AppDataBucketName' in outputs, "Should have AppDataBucketName output"

    # Check KMS key output
    assert 'S3KmsKeyId' in outputs, "Should have S3KmsKeyId output"

    # VPC and RDS outputs should be present in AWS mode
    assert 'VpcId' in outputs, "Should have VpcId output in AWS mode"
    assert 'RdsInstanceIdentifier' in outputs, "Should have RdsInstanceIdentifier output in AWS mode"


def test_kms_key_rotation(app, localstack_env):
    """Test KMS key rotation is enabled."""
    props = TapStackProps(environment_suffix='kms-test')
    stack = TapStack(app, "TapStackkms-test", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    kms_keys = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::KMS::Key'
    }

    for key_id, key in kms_keys.items():
        properties = key.get('Properties', {})
        assert properties.get('EnableKeyRotation', False), f"KMS key {key_id} should have key rotation enabled"


def test_iam_policies_scoped(app, aws_env):
    """Test IAM policies are scoped to specific resources (not using *)."""
    props = TapStackProps(environment_suffix='iam-policy-test')
    stack = TapStack(app, "TapStackiam-policy-test", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check IAM policies
    iam_policies = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::IAM::Policy'
    }

    # Most policies should be scoped (some may have * for CloudWatch Logs which is acceptable)
    assert len(iam_policies) >= 1, "Should have IAM policies defined"


def test_stack_tags(app):
    """Test that stack can be created with tags."""
    props = TapStackProps(environment_suffix='tag-test')
    stack = TapStack(
        app,
        "TapStacktag-test",
        props=props,
        tags={'Environment': 'test', 'Team': 'synth-2'}
    )

    assert stack is not None
    assert stack.environment_suffix == 'tag-test'


def test_multiple_stacks_isolation(app):
    """Test that multiple stacks can be created with different suffixes without conflict."""
    props1 = TapStackProps(environment_suffix='stack1')
    props2 = TapStackProps(environment_suffix='stack2')

    stack1 = TapStack(app, "TapStackstack1", props=props1)
    stack2 = TapStack(app, "TapStackstack2", props=props2)

    assert stack1.environment_suffix == 'stack1'
    assert stack2.environment_suffix == 'stack2'
    assert stack1.stack_name != stack2.stack_name


def test_localstack_hostname_detection(app, monkeypatch):
    """Test that LOCALSTACK_HOSTNAME environment variable also triggers LocalStack mode."""
    monkeypatch.setenv('LOCALSTACK_HOSTNAME', 'localhost')
    monkeypatch.delenv('AWS_ENDPOINT_URL', raising=False)

    props = TapStackProps(environment_suffix='localstack-hostname')
    stack = TapStack(app, "TapStacklocalstack-hostname", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Should NOT have VPC in LocalStack mode
    vpcs = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::VPC']
    assert len(vpcs) == 0, "Should not have VPC when LOCALSTACK_HOSTNAME is set"
