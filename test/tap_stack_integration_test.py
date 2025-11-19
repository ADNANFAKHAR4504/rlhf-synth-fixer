"""
Integration tests for CI/CD Pipeline Infrastructure
Tests validate actual deployed AWS resources and their configurations
"""

import json
import os
import boto3
import pytest
from botocore.exceptions import ClientError

# Get deployment outputs
OUTPUTS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cfn-outputs', 'flat-outputs.json')

@pytest.fixture(scope='module')
def deployment_outputs():
    """Load deployment outputs from flat-outputs.json"""
    if not os.path.exists(OUTPUTS_FILE):
        pytest.skip("Deployment outputs not found")

    with open(OUTPUTS_FILE, 'r') as f:
        return json.load(f)

@pytest.fixture(scope='module')
def aws_region():
    """Get AWS region from environment or default"""
    return os.environ.get('AWS_REGION', 'us-east-1')

@pytest.fixture(scope='module')
def s3_client(aws_region):
    """Create S3 client"""
    return boto3.client('s3', region_name=aws_region)

@pytest.fixture(scope='module')
def dynamodb_client(aws_region):
    """Create DynamoDB client"""
    return boto3.client('dynamodb', region_name=aws_region)

@pytest.fixture(scope='module')
def codepipeline_client(aws_region):
    """Create CodePipeline client"""
    return boto3.client('codepipeline', region_name=aws_region)

@pytest.fixture(scope='module')
def codebuild_client(aws_region):
    """Create CodeBuild client"""
    return boto3.client('codebuild', region_name=aws_region)

@pytest.fixture(scope='module')
def sns_client(aws_region):
    """Create SNS client"""
    return boto3.client('sns', region_name=aws_region)

@pytest.fixture(scope='module')
def cloudwatch_logs_client(aws_region):
    """Create CloudWatch Logs client"""
    return boto3.client('logs', region_name=aws_region)

@pytest.fixture(scope='module')
def cloudwatch_events_client(aws_region):
    """Create CloudWatch Events client"""
    return boto3.client('events', region_name=aws_region)

@pytest.fixture(scope='module')
def codestar_client(aws_region):
    """Create CodeStar Connections client"""
    return boto3.client('codestar-connections', region_name=aws_region)

@pytest.fixture(scope='module')
def iam_client(aws_region):
    """Create IAM client"""
    return boto3.client('iam', region_name=aws_region)


class TestS3Resources:
    """Test S3 bucket resources"""

    def test_artifact_bucket_exists(self, s3_client, deployment_outputs):
        """Test that pipeline artifacts bucket exists"""
        bucket_name = deployment_outputs.get('artifact_bucket_name')
        assert bucket_name is not None, "Artifact bucket name not in outputs"

        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        except ClientError as e:
            pytest.fail(f"Artifact bucket {bucket_name} does not exist: {e}")

    def test_state_bucket_exists(self, s3_client, deployment_outputs):
        """Test that Terraform state bucket exists"""
        bucket_name = deployment_outputs.get('state_bucket_name')
        assert bucket_name is not None, "State bucket name not in outputs"

        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        except ClientError as e:
            pytest.fail(f"State bucket {bucket_name} does not exist: {e}")

    def test_artifact_bucket_encryption(self, s3_client, deployment_outputs):
        """Test that artifact bucket has encryption enabled"""
        bucket_name = deployment_outputs['artifact_bucket_name']

        try:
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            assert len(rules) > 0, "No encryption rules configured"
            assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']
        except ClientError as e:
            pytest.fail(f"Failed to get encryption config for {bucket_name}: {e}")

    def test_state_bucket_encryption(self, s3_client, deployment_outputs):
        """Test that state bucket has encryption enabled"""
        bucket_name = deployment_outputs['state_bucket_name']

        try:
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            assert len(rules) > 0, "No encryption rules configured"
            assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']
        except ClientError as e:
            pytest.fail(f"Failed to get encryption config for {bucket_name}: {e}")

    def test_artifact_bucket_versioning(self, s3_client, deployment_outputs):
        """Test that artifact bucket has versioning enabled"""
        bucket_name = deployment_outputs['artifact_bucket_name']

        try:
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert response.get('Status') == 'Enabled', "Versioning not enabled"
        except ClientError as e:
            pytest.fail(f"Failed to get versioning config for {bucket_name}: {e}")

    def test_state_bucket_versioning(self, s3_client, deployment_outputs):
        """Test that state bucket has versioning enabled"""
        bucket_name = deployment_outputs['state_bucket_name']

        try:
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert response.get('Status') == 'Enabled', "Versioning not enabled"
        except ClientError as e:
            pytest.fail(f"Failed to get versioning config for {bucket_name}: {e}")

    def test_buckets_block_public_access(self, s3_client, deployment_outputs):
        """Test that buckets block public access"""
        buckets = [
            deployment_outputs['artifact_bucket_name'],
            deployment_outputs['state_bucket_name']
        ]

        for bucket_name in buckets:
            try:
                response = s3_client.get_public_access_block(Bucket=bucket_name)
                config = response['PublicAccessBlockConfiguration']
                assert config['BlockPublicAcls'] == True
                assert config['BlockPublicPolicy'] == True
                assert config['IgnorePublicAcls'] == True
                assert config['RestrictPublicBuckets'] == True
            except ClientError as e:
                pytest.fail(f"Failed to get public access block for {bucket_name}: {e}")


class TestDynamoDBResources:
    """Test DynamoDB resources"""

    def test_state_lock_table_exists(self, dynamodb_client, deployment_outputs):
        """Test that state lock table exists"""
        table_name = deployment_outputs.get('state_lock_table_name')
        assert table_name is not None, "State lock table name not in outputs"

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            assert response['Table']['TableStatus'] in ['ACTIVE', 'UPDATING']
        except ClientError as e:
            pytest.fail(f"State lock table {table_name} does not exist: {e}")

    def test_state_lock_table_billing(self, dynamodb_client, deployment_outputs):
        """Test that state lock table uses PAY_PER_REQUEST billing"""
        table_name = deployment_outputs['state_lock_table_name']

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            billing_mode = response['Table']['BillingModeSummary']['BillingMode']
            assert billing_mode == 'PAY_PER_REQUEST', f"Expected PAY_PER_REQUEST, got {billing_mode}"
        except ClientError as e:
            pytest.fail(f"Failed to get billing mode for {table_name}: {e}")

    def test_state_lock_table_key_schema(self, dynamodb_client, deployment_outputs):
        """Test that state lock table has correct key schema"""
        table_name = deployment_outputs['state_lock_table_name']

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            key_schema = response['Table']['KeySchema']
            assert len(key_schema) == 1, "Expected 1 key"
            assert key_schema[0]['AttributeName'] == 'LockID'
            assert key_schema[0]['KeyType'] == 'HASH'
        except ClientError as e:
            pytest.fail(f"Failed to get key schema for {table_name}: {e}")

    def test_state_lock_table_pitr(self, dynamodb_client, deployment_outputs):
        """Test that point-in-time recovery is enabled"""
        table_name = deployment_outputs['state_lock_table_name']

        try:
            response = dynamodb_client.describe_continuous_backups(TableName=table_name)
            pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
            assert pitr_status == 'ENABLED', f"PITR not enabled, status: {pitr_status}"
        except ClientError as e:
            pytest.fail(f"Failed to get PITR status for {table_name}: {e}")


class TestCodePipelineResources:
    """Test CodePipeline resources"""

    def test_pipeline_exists(self, codepipeline_client, deployment_outputs):
        """Test that pipeline exists"""
        pipeline_name = deployment_outputs.get('pipeline_name')
        assert pipeline_name is not None, "Pipeline name not in outputs"

        try:
            response = codepipeline_client.get_pipeline(name=pipeline_name)
            assert response['pipeline']['name'] == pipeline_name
        except ClientError as e:
            pytest.fail(f"Pipeline {pipeline_name} does not exist: {e}")

    def test_pipeline_stages(self, codepipeline_client, deployment_outputs):
        """Test that pipeline has all required stages"""
        pipeline_name = deployment_outputs['pipeline_name']

        try:
            response = codepipeline_client.get_pipeline(name=pipeline_name)
            stages = response['pipeline']['stages']
            stage_names = [stage['name'] for stage in stages]

            required_stages = ['Source', 'Validate', 'Plan', 'Approval', 'Apply']
            for required_stage in required_stages:
                assert required_stage in stage_names, f"Stage {required_stage} not found"
        except ClientError as e:
            pytest.fail(f"Failed to get pipeline stages: {e}")

    def test_pipeline_manual_approval_stage(self, codepipeline_client, deployment_outputs):
        """Test that pipeline has manual approval stage configured"""
        pipeline_name = deployment_outputs['pipeline_name']

        try:
            response = codepipeline_client.get_pipeline(name=pipeline_name)
            stages = response['pipeline']['stages']

            approval_stage = [s for s in stages if s['name'] == 'Approval']
            assert len(approval_stage) == 1, "Approval stage not found"

            actions = approval_stage[0]['actions']
            assert len(actions) > 0, "No actions in Approval stage"
            assert actions[0]['actionTypeId']['category'] == 'Approval'
            assert actions[0]['actionTypeId']['provider'] == 'Manual'
        except ClientError as e:
            pytest.fail(f"Failed to verify approval stage: {e}")


class TestCodeBuildResources:
    """Test CodeBuild resources"""

    def test_validate_project_exists(self, codebuild_client, deployment_outputs):
        """Test that validate CodeBuild project exists"""
        project_name = deployment_outputs.get('validate_project_name')
        assert project_name is not None, "Validate project name not in outputs"

        try:
            response = codebuild_client.batch_get_projects(names=[project_name])
            assert len(response['projects']) == 1
            assert response['projects'][0]['name'] == project_name
        except ClientError as e:
            pytest.fail(f"Validate project {project_name} does not exist: {e}")

    def test_plan_project_exists(self, codebuild_client, deployment_outputs):
        """Test that plan CodeBuild project exists"""
        project_name = deployment_outputs.get('plan_project_name')
        assert project_name is not None, "Plan project name not in outputs"

        try:
            response = codebuild_client.batch_get_projects(names=[project_name])
            assert len(response['projects']) == 1
            assert response['projects'][0]['name'] == project_name
        except ClientError as e:
            pytest.fail(f"Plan project {project_name} does not exist: {e}")

    def test_apply_project_exists(self, codebuild_client, deployment_outputs):
        """Test that apply CodeBuild project exists"""
        project_name = deployment_outputs.get('apply_project_name')
        assert project_name is not None, "Apply project name not in outputs"

        try:
            response = codebuild_client.batch_get_projects(names=[project_name])
            assert len(response['projects']) == 1
            assert response['projects'][0]['name'] == project_name
        except ClientError as e:
            pytest.fail(f"Apply project {project_name} does not exist: {e}")

    def test_codebuild_projects_have_logs(self, codebuild_client, deployment_outputs):
        """Test that CodeBuild projects have CloudWatch Logs configured"""
        project_names = [
            deployment_outputs['validate_project_name'],
            deployment_outputs['plan_project_name'],
            deployment_outputs['apply_project_name']
        ]

        try:
            response = codebuild_client.batch_get_projects(names=project_names)
            for project in response['projects']:
                logs_config = project.get('logsConfig', {})
                cloudwatch_logs = logs_config.get('cloudWatchLogs', {})
                assert cloudwatch_logs.get('status') == 'ENABLED', f"CloudWatch Logs not enabled for {project['name']}"
        except ClientError as e:
            pytest.fail(f"Failed to verify CodeBuild logs configuration: {e}")


class TestSNSResources:
    """Test SNS resources"""

    def test_sns_topic_exists(self, sns_client, deployment_outputs):
        """Test that SNS topic exists"""
        topic_arn = deployment_outputs.get('sns_topic_arn')
        assert topic_arn is not None, "SNS topic ARN not in outputs"

        try:
            response = sns_client.get_topic_attributes(TopicArn=topic_arn)
            assert response['Attributes']['TopicArn'] == topic_arn
        except ClientError as e:
            pytest.fail(f"SNS topic {topic_arn} does not exist: {e}")

    def test_sns_topic_has_policy(self, sns_client, deployment_outputs):
        """Test that SNS topic has access policy"""
        topic_arn = deployment_outputs['sns_topic_arn']

        try:
            response = sns_client.get_topic_attributes(TopicArn=topic_arn)
            policy = response['Attributes'].get('Policy')
            assert policy is not None, "SNS topic policy not set"

            policy_doc = json.loads(policy)
            assert 'Statement' in policy_doc, "Policy has no statements"
            assert len(policy_doc['Statement']) > 0, "Policy has no statements"
        except ClientError as e:
            pytest.fail(f"Failed to get SNS topic policy: {e}")


class TestCodeStarResources:
    """Test CodeStar Connections resources"""

    def test_codestar_connection_exists(self, codestar_client, deployment_outputs):
        """Test that CodeStar Connection exists"""
        connection_arn = deployment_outputs.get('codestar_connection_arn')
        assert connection_arn is not None, "CodeStar connection ARN not in outputs"

        try:
            response = codestar_client.get_connection(ConnectionArn=connection_arn)
            assert response['Connection']['ConnectionArn'] == connection_arn
        except ClientError as e:
            pytest.fail(f"CodeStar connection {connection_arn} does not exist: {e}")

    def test_codestar_connection_provider(self, codestar_client, deployment_outputs):
        """Test that CodeStar Connection is for GitHub"""
        connection_arn = deployment_outputs['codestar_connection_arn']

        try:
            response = codestar_client.get_connection(ConnectionArn=connection_arn)
            provider_type = response['Connection']['ProviderType']
            assert provider_type == 'GitHub', f"Expected GitHub provider, got {provider_type}"
        except ClientError as e:
            pytest.fail(f"Failed to get CodeStar connection provider: {e}")


class TestCloudWatchResources:
    """Test CloudWatch resources"""

    def test_validate_log_group_exists(self, cloudwatch_logs_client):
        """Test that validate log group exists"""
        log_group_pattern = '/aws/codebuild/validate-'

        try:
            response = cloudwatch_logs_client.describe_log_groups(logGroupNamePrefix=log_group_pattern)
            assert len(response['logGroups']) > 0, f"No log groups found with prefix {log_group_pattern}"
        except ClientError as e:
            pytest.fail(f"Failed to find validate log group: {e}")

    def test_plan_log_group_exists(self, cloudwatch_logs_client):
        """Test that plan log group exists"""
        log_group_pattern = '/aws/codebuild/plan-'

        try:
            response = cloudwatch_logs_client.describe_log_groups(logGroupNamePrefix=log_group_pattern)
            assert len(response['logGroups']) > 0, f"No log groups found with prefix {log_group_pattern}"
        except ClientError as e:
            pytest.fail(f"Failed to find plan log group: {e}")

    def test_apply_log_group_exists(self, cloudwatch_logs_client):
        """Test that apply log group exists"""
        log_group_pattern = '/aws/codebuild/apply-'

        try:
            response = cloudwatch_logs_client.describe_log_groups(logGroupNamePrefix=log_group_pattern)
            assert len(response['logGroups']) > 0, f"No log groups found with prefix {log_group_pattern}"
        except ClientError as e:
            pytest.fail(f"Failed to find apply log group: {e}")

    def test_pipeline_failure_event_rule_exists(self, cloudwatch_events_client):
        """Test that pipeline failure event rule exists"""
        rule_pattern = 'pipeline-failure-'

        try:
            response = cloudwatch_events_client.list_rules(NamePrefix=rule_pattern)
            assert len(response['Rules']) > 0, f"No event rules found with prefix {rule_pattern}"
        except ClientError as e:
            pytest.fail(f"Failed to find pipeline failure event rule: {e}")


class TestResourceNaming:
    """Test resource naming conventions"""

    def test_resource_names_include_suffix(self, deployment_outputs):
        """Test that all resource names include environment suffix"""
        # Extract suffix from pipeline name
        pipeline_name = deployment_outputs['pipeline_name']
        # Pipeline name format: terraform-pipeline-{suffix}
        suffix = pipeline_name.split('-')[-1]

        assert suffix, "Could not extract environment suffix from pipeline name"

        # Check all resource names include the suffix
        resource_names = [
            deployment_outputs['pipeline_name'],
            deployment_outputs['artifact_bucket_name'],
            deployment_outputs['state_bucket_name'],
            deployment_outputs['state_lock_table_name'],
            deployment_outputs['validate_project_name'],
            deployment_outputs['plan_project_name'],
            deployment_outputs['apply_project_name']
        ]

        for resource_name in resource_names:
            assert suffix in resource_name, f"Resource {resource_name} does not include suffix {suffix}"
