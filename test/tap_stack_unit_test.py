"""
Unit tests for CI/CD Pipeline Terraform Infrastructure
Tests validate resource configuration, naming conventions, security settings, and compliance
"""

import json
import os
import sys
import pytest
import hcl2

# Get the lib directory path
LIB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'lib')

class TestInfrastructureConfiguration:
    """Test suite for Terraform infrastructure configuration"""

    @pytest.fixture(scope='class')
    def terraform_files(self):
        """Load all Terraform configuration files"""
        tf_files = {}
        for filename in os.listdir(LIB_DIR):
            if filename.endswith('.tf'):
                filepath = os.path.join(LIB_DIR, filename)
                with open(filepath, 'r') as f:
                    try:
                        tf_files[filename] = hcl2.load(f)
                    except Exception as e:
                        print(f"Error loading {filename}: {e}")
                        tf_files[filename] = None
        return tf_files

    @pytest.fixture(scope='class')
    def outputs_data(self):
        """Load deployment outputs"""
        outputs_file = os.path.join(os.path.dirname(LIB_DIR), 'cfn-outputs', 'flat-outputs.json')
        if os.path.exists(outputs_file):
            with open(outputs_file, 'r') as f:
                return json.load(f)
        return {}

    def test_terraform_files_loaded(self, terraform_files):
        """Test that all Terraform files are loaded successfully"""
        assert len(terraform_files) > 0, "No Terraform files found"
        for filename, content in terraform_files.items():
            assert content is not None, f"Failed to load {filename}"

    def test_provider_configuration(self, terraform_files):
        """Test AWS provider configuration"""
        main_tf = terraform_files.get('main.tf', {})
        assert 'provider' in main_tf, "Provider configuration missing"

        providers = main_tf['provider']
        assert len(providers) > 0, "No provider configured"

        # Provider structure: [{'aws': {...}}]
        aws_provider_block = providers[0]
        assert 'aws' in aws_provider_block, "AWS provider not found"
        aws_provider = aws_provider_block['aws']
        assert 'region' in aws_provider or 'default_tags' in aws_provider, "AWS provider not properly configured"

    def test_required_providers(self, terraform_files):
        """Test required providers are specified"""
        main_tf = terraform_files.get('main.tf', {})
        assert 'terraform' in main_tf, "Terraform block missing"

        terraform_block = main_tf['terraform'][0]
        assert 'required_providers' in terraform_block, "Required providers not specified"
        assert 'aws' in terraform_block['required_providers'][0], "AWS provider not in required providers"

    def test_variables_defined(self, terraform_files):
        """Test that all required variables are defined"""
        variables_tf = terraform_files.get('variables.tf', {})
        assert 'variable' in variables_tf, "No variables defined"

        variables = variables_tf['variable']
        required_vars = ['environment_suffix', 'aws_region', 'github_repository_id',
                        'github_branch', 'notification_email']

        defined_vars = [list(v.keys())[0] for v in variables]
        for req_var in required_vars:
            assert req_var in defined_vars, f"Required variable {req_var} not defined"

    def test_outputs_defined(self, terraform_files):
        """Test that all required outputs are defined"""
        outputs_tf = terraform_files.get('outputs.tf', {})
        assert 'output' in outputs_tf, "No outputs defined"

        outputs = outputs_tf['output']
        required_outputs = ['pipeline_name', 'pipeline_arn', 'artifact_bucket_name',
                           'state_bucket_name', 'state_lock_table_name', 'codestar_connection_arn']

        defined_outputs = [list(o.keys())[0] for o in outputs]
        for req_output in required_outputs:
            assert req_output in defined_outputs, f"Required output {req_output} not defined"

    def test_s3_buckets_configuration(self, terraform_files):
        """Test S3 bucket configurations"""
        s3_tf = terraform_files.get('s3.tf', {})
        assert 'resource' in s3_tf, "No resources defined in s3.tf"

        resources = s3_tf['resource']
        s3_buckets = [r for r in resources if 'aws_s3_bucket' in r]

        assert len(s3_buckets) >= 2, "Expected at least 2 S3 buckets"

        # Check force_destroy is set
        for bucket in s3_buckets:
            bucket_config = list(bucket.values())[0]
            bucket_data = list(bucket_config.values())[0]
            assert bucket_data.get('force_destroy') == True, "S3 bucket must have force_destroy=true"

    def test_s3_encryption_enabled(self, terraform_files):
        """Test S3 bucket encryption is enabled"""
        s3_tf = terraform_files.get('s3.tf', {})
        resources = s3_tf.get('resource', [])

        encryption_configs = [r for r in resources if 'aws_s3_bucket_server_side_encryption_configuration' in r]
        assert len(encryption_configs) >= 2, "Expected encryption configuration for all S3 buckets"

    def test_s3_public_access_blocked(self, terraform_files):
        """Test S3 buckets block public access"""
        s3_tf = terraform_files.get('s3.tf', {})
        resources = s3_tf.get('resource', [])

        public_access_blocks = [r for r in resources if 'aws_s3_bucket_public_access_block' in r]
        assert len(public_access_blocks) >= 2, "Expected public access block for all S3 buckets"

        for block in public_access_blocks:
            block_config = list(block.values())[0]
            block_data = list(block_config.values())[0]
            assert block_data.get('block_public_acls') == True, "block_public_acls must be true"
            assert block_data.get('block_public_policy') == True, "block_public_policy must be true"
            assert block_data.get('ignore_public_acls') == True, "ignore_public_acls must be true"
            assert block_data.get('restrict_public_buckets') == True, "restrict_public_buckets must be true"

    def test_dynamodb_table_configuration(self, terraform_files):
        """Test DynamoDB table configuration"""
        dynamodb_tf = terraform_files.get('dynamodb.tf', {})
        assert 'resource' in dynamodb_tf, "No resources defined in dynamodb.tf"

        resources = dynamodb_tf['resource']
        dynamodb_tables = [r for r in resources if 'aws_dynamodb_table' in r]

        assert len(dynamodb_tables) >= 1, "Expected at least 1 DynamoDB table"

        table = dynamodb_tables[0]
        table_config = list(table.values())[0]
        table_data = list(table_config.values())[0]

        assert table_data.get('billing_mode') == 'PAY_PER_REQUEST', "DynamoDB should use PAY_PER_REQUEST billing"
        assert table_data.get('hash_key') == 'LockID', "DynamoDB hash_key should be LockID"

    def test_dynamodb_pitr_enabled(self, terraform_files):
        """Test DynamoDB point-in-time recovery is enabled"""
        dynamodb_tf = terraform_files.get('dynamodb.tf', {})
        resources = dynamodb_tf.get('resource', [])

        dynamodb_tables = [r for r in resources if 'aws_dynamodb_table' in r]
        table = dynamodb_tables[0]
        table_config = list(table.values())[0]
        table_data = list(table_config.values())[0]

        assert 'point_in_time_recovery' in table_data, "PITR configuration missing"
        pitr = table_data['point_in_time_recovery'][0]
        assert pitr.get('enabled') == True, "Point-in-time recovery must be enabled"

    def test_codepipeline_configuration(self, terraform_files):
        """Test CodePipeline configuration"""
        main_tf = terraform_files.get('main.tf', {})
        resources = main_tf.get('resource', [])

        pipelines = [r for r in resources if 'aws_codepipeline' in r]
        assert len(pipelines) >= 1, "Expected at least 1 CodePipeline"

        pipeline = pipelines[0]
        pipeline_config = list(pipeline.values())[0]
        pipeline_data = list(pipeline_config.values())[0]

        assert 'stage' in pipeline_data, "Pipeline stages not defined"
        stages = pipeline_data['stage']

        # Check for required stages
        stage_names = [s['name'] for s in stages]
        assert 'Source' in stage_names, "Source stage missing"
        assert 'Validate' in stage_names, "Validate stage missing"
        assert 'Plan' in stage_names, "Plan stage missing"
        assert 'Approval' in stage_names, "Approval (manual) stage missing"
        assert 'Apply' in stage_names, "Apply stage missing"

    def test_codepipeline_manual_approval(self, terraform_files):
        """Test CodePipeline has manual approval stage"""
        main_tf = terraform_files.get('main.tf', {})
        resources = main_tf.get('resource', [])

        pipelines = [r for r in resources if 'aws_codepipeline' in r]
        pipeline = pipelines[0]
        pipeline_config = list(pipeline.values())[0]
        pipeline_data = list(pipeline_config.values())[0]

        stages = pipeline_data['stage']
        approval_stage = [s for s in stages if s['name'] == 'Approval'][0]

        assert approval_stage is not None, "Approval stage not found"
        action = approval_stage['action'][0]
        assert action['category'] == 'Approval', "Approval stage not configured correctly"
        assert action['provider'] == 'Manual', "Manual approval provider not configured"

    def test_codebuild_projects(self, terraform_files):
        """Test CodeBuild projects are configured"""
        codebuild_tf = terraform_files.get('codebuild.tf', {})
        resources = codebuild_tf.get('resource', [])

        codebuild_projects = [r for r in resources if 'aws_codebuild_project' in r]
        assert len(codebuild_projects) >= 3, "Expected at least 3 CodeBuild projects"

        project_names = []
        for project in codebuild_projects:
            project_config = list(project.values())[0]
            project_name = list(project_config.keys())[0]
            project_names.append(project_name)

        assert 'validate' in project_names, "Validate CodeBuild project missing"
        assert 'plan' in project_names, "Plan CodeBuild project missing"
        assert 'apply' in project_names, "Apply CodeBuild project missing"

    def test_codestar_connection(self, terraform_files):
        """Test CodeStar Connection for GitHub is configured"""
        main_tf = terraform_files.get('main.tf', {})
        resources = main_tf.get('resource', [])

        codestar_connections = [r for r in resources if 'aws_codestarconnections_connection' in r]
        assert len(codestar_connections) >= 1, "CodeStar Connection not configured"

        connection = codestar_connections[0]
        connection_config = list(connection.values())[0]
        connection_data = list(connection_config.values())[0]

        assert connection_data.get('provider_type') == 'GitHub', "CodeStar Connection must be for GitHub"

    def test_iam_roles_configured(self, terraform_files):
        """Test IAM roles are configured"""
        iam_tf = terraform_files.get('iam.tf', {})
        resources = iam_tf.get('resource', [])

        iam_roles = [r for r in resources if 'aws_iam_role' in r]
        assert len(iam_roles) >= 2, "Expected at least 2 IAM roles"

        role_names = []
        for role in iam_roles:
            role_config = list(role.values())[0]
            role_name = list(role_config.keys())[0]
            role_names.append(role_name)

        assert 'codepipeline_role' in role_names, "CodePipeline IAM role missing"
        assert 'codebuild_role' in role_names, "CodeBuild IAM role missing"

    def test_sns_topic_configured(self, terraform_files):
        """Test SNS topic for notifications is configured"""
        sns_tf = terraform_files.get('sns.tf', {})
        resources = sns_tf.get('resource', [])

        sns_topics = [r for r in resources if 'aws_sns_topic' in r]
        assert len(sns_topics) >= 1, "SNS topic not configured"

    def test_sns_email_subscription(self, terraform_files):
        """Test SNS email subscription is configured"""
        sns_tf = terraform_files.get('sns.tf', {})
        resources = sns_tf.get('resource', [])

        subscriptions = [r for r in resources if 'aws_sns_topic_subscription' in r]
        assert len(subscriptions) >= 1, "SNS email subscription not configured"

        subscription = subscriptions[0]
        subscription_config = list(subscription.values())[0]
        subscription_data = list(subscription_config.values())[0]

        assert subscription_data.get('protocol') == 'email', "SNS subscription protocol must be email"

    def test_cloudwatch_log_groups(self, terraform_files):
        """Test CloudWatch Log Groups are configured"""
        cloudwatch_tf = terraform_files.get('cloudwatch.tf', {})
        resources = cloudwatch_tf.get('resource', [])

        log_groups = [r for r in resources if 'aws_cloudwatch_log_group' in r]
        assert len(log_groups) >= 3, "Expected at least 3 CloudWatch Log Groups"

    def test_cloudwatch_event_rule(self, terraform_files):
        """Test CloudWatch Event Rule for pipeline failures"""
        cloudwatch_tf = terraform_files.get('cloudwatch.tf', {})
        resources = cloudwatch_tf.get('resource', [])

        event_rules = [r for r in resources if 'aws_cloudwatch_event_rule' in r]
        assert len(event_rules) >= 1, "CloudWatch Event Rule not configured"

    def test_resource_naming_convention(self, terraform_files):
        """Test that resources follow naming convention with environment_suffix"""
        files_to_check = ['main.tf', 's3.tf', 'dynamodb.tf', 'iam.tf', 'codebuild.tf',
                         'cloudwatch.tf', 'sns.tf']

        for filename in files_to_check:
            tf_file = terraform_files.get(filename, {})
            resources = tf_file.get('resource', [])

            for resource in resources:
                resource_type = list(resource.keys())[0]
                resource_configs = resource[resource_type]

                for resource_name, resource_data in resource_configs.items():
                    # Check if resource has a name or bucket attribute
                    if 'name' in resource_data:
                        name_value = resource_data['name']
                        if isinstance(name_value, str) and not name_value.startswith('/aws/'):
                            assert '${var.environment_suffix}' in name_value or \
                                   'aws_' in name_value, \
                                   f"Resource {resource_name} name should include environment_suffix variable"

                    if 'bucket' in resource_data:
                        bucket_value = resource_data['bucket']
                        if isinstance(bucket_value, str):
                            assert '${var.environment_suffix}' in bucket_value or \
                                   'aws_s3_bucket' in bucket_value, \
                                   f"S3 bucket {resource_name} should include environment_suffix variable"

    def test_no_deletion_protection(self, terraform_files):
        """Test that no resources have deletion protection enabled"""
        all_tf_files = terraform_files.values()

        for tf_file in all_tf_files:
            if tf_file is None:
                continue
            resources = tf_file.get('resource', [])

            for resource in resources:
                resource_configs = list(resource.values())[0]
                for resource_data in resource_configs.values():
                    assert resource_data.get('deletion_protection') != True, \
                        "Resources must not have deletion_protection enabled"
                    assert resource_data.get('prevent_destroy') != True, \
                        "Resources must not have prevent_destroy enabled"

    def test_deployment_outputs_exist(self, outputs_data):
        """Test that deployment outputs are available"""
        if outputs_data:
            required_outputs = ['pipeline_name', 'artifact_bucket_name', 'state_bucket_name']
            for output in required_outputs:
                assert output in outputs_data, f"Output {output} not found in deployment outputs"

    def test_codebuild_environment_variables(self, terraform_files):
        """Test CodeBuild projects have required environment variables"""
        codebuild_tf = terraform_files.get('codebuild.tf', {})
        resources = codebuild_tf.get('resource', [])

        codebuild_projects = [r for r in resources if 'aws_codebuild_project' in r]

        for project in codebuild_projects:
            project_config = list(project.values())[0]
            project_name = list(project_config.keys())[0]
            project_data = list(project_config.values())[0]

            assert 'environment' in project_data, f"Environment not configured for {project_name}"
            env = project_data['environment'][0]

            assert 'compute_type' in env, f"Compute type not specified for {project_name}"
            assert 'image' in env, f"Build image not specified for {project_name}"
            assert 'type' in env, f"Environment type not specified for {project_name}"

    def test_codebuild_logs_config(self, terraform_files):
        """Test CodeBuild projects have CloudWatch Logs configured"""
        codebuild_tf = terraform_files.get('codebuild.tf', {})
        resources = codebuild_tf.get('resource', [])

        codebuild_projects = [r for r in resources if 'aws_codebuild_project' in r]

        for project in codebuild_projects:
            project_config = list(project.values())[0]
            project_name = list(project_config.keys())[0]
            project_data = list(project_config.values())[0]

            assert 'logs_config' in project_data, f"Logs configuration missing for {project_name}"

    def test_tags_configured(self, terraform_files):
        """Test that resources have appropriate tags"""
        files_with_tags = ['main.tf', 's3.tf', 'dynamodb.tf', 'iam.tf', 'codebuild.tf',
                          'cloudwatch.tf', 'sns.tf']

        for filename in files_with_tags:
            tf_file = terraform_files.get(filename, {})
            resources = tf_file.get('resource', [])

            for resource in resources:
                resource_type = list(resource.keys())[0]
                # Skip resources that don't support tags
                if resource_type in ['aws_iam_role_policy', 'aws_s3_bucket_versioning',
                                    'aws_s3_bucket_server_side_encryption_configuration',
                                    'aws_s3_bucket_public_access_block',
                                    'aws_s3_bucket_lifecycle_configuration',
                                    'aws_sns_topic_policy', 'aws_sns_topic_subscription',
                                    'aws_cloudwatch_event_target']:
                    continue

                resource_configs = resource[resource_type]
                for resource_name, resource_data in resource_configs.items():
                    assert 'tags' in resource_data or resource_type.startswith('aws_iam_role_policy'), \
                        f"Resource {resource_name} should have tags"
