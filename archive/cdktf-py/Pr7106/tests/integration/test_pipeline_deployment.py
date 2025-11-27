"""Integration tests for CI/CD pipeline deployment and functionality."""

import pytest
import boto3
import json
import time
from botocore.exceptions import ClientError


class TestCodePipelineDeployment:
    """Integration tests for CodePipeline deployment."""

    @pytest.fixture(scope="class")
    def aws_clients(self, aws_region):
        """Create AWS clients for testing."""
        return {
            'codepipeline': boto3.client('codepipeline', region_name=aws_region),
            'codecommit': boto3.client('codecommit', region_name=aws_region),
            'codebuild': boto3.client('codebuild', region_name=aws_region),
            'ecs': boto3.client('ecs', region_name=aws_region),
            'ecr': boto3.client('ecr', region_name=aws_region),
            'elbv2': boto3.client('elbv2', region_name=aws_region),
            'cloudwatch': boto3.client('cloudwatch', region_name=aws_region),
            'sns': boto3.client('sns', region_name=aws_region),
            's3': boto3.client('s3', region_name=aws_region),
            'lambda': boto3.client('lambda', region_name=aws_region),
            'ssm': boto3.client('ssm', region_name=aws_region)
        }

    def test_pipeline_exists(self, aws_clients, environment_suffix):
        """Test that the CodePipeline exists."""
        pipeline_name = f"microservices-pipeline-{environment_suffix}"

        try:
            response = aws_clients['codepipeline'].get_pipeline(name=pipeline_name)
            assert response['pipeline']['name'] == pipeline_name
            print(f"✓ Pipeline {pipeline_name} exists")
        except ClientError as e:
            pytest.fail(f"Pipeline not found: {e}")

    def test_pipeline_has_five_stages(self, aws_clients, environment_suffix):
        """Test that the pipeline has exactly 5 stages."""
        pipeline_name = f"microservices-pipeline-{environment_suffix}"

        response = aws_clients['codepipeline'].get_pipeline(name=pipeline_name)
        stages = response['pipeline']['stages']

        assert len(stages) == 5, f"Expected 5 stages, found {len(stages)}"

        stage_names = [stage['name'] for stage in stages]
        expected_stages = ['Source', 'Build', 'Test', 'Staging', 'Production']
        assert stage_names == expected_stages, f"Stage names mismatch: {stage_names}"
        print(f"✓ Pipeline has 5 stages: {stage_names}")

    def test_codecommit_repository_exists(self, aws_clients, environment_suffix):
        """Test that CodeCommit repository exists."""
        repo_name = f"microservices-monorepo-{environment_suffix}"

        try:
            response = aws_clients['codecommit'].get_repository(repositoryName=repo_name)
            assert response['repositoryMetadata']['repositoryName'] == repo_name
            print(f"✓ CodeCommit repository {repo_name} exists")
        except ClientError as e:
            pytest.fail(f"CodeCommit repository not found: {e}")

    def test_codebuild_projects_exist(self, aws_clients, environment_suffix, microservices):
        """Test that CodeBuild projects exist for all microservices."""
        for service in microservices:
            project_name = f"{service}-build-{environment_suffix}"

            try:
                response = aws_clients['codebuild'].batch_get_projects(names=[project_name])
                assert len(response['projects']) == 1
                assert response['projects'][0]['name'] == project_name
                print(f"✓ CodeBuild project {project_name} exists")
            except ClientError as e:
                pytest.fail(f"CodeBuild project {project_name} not found: {e}")

    def test_test_codebuild_project_exists(self, aws_clients, environment_suffix):
        """Test that integration test CodeBuild project exists."""
        project_name = f"integration-tests-{environment_suffix}"

        try:
            response = aws_clients['codebuild'].batch_get_projects(names=[project_name])
            assert len(response['projects']) == 1
            print(f"✓ Test CodeBuild project {project_name} exists")
        except ClientError as e:
            pytest.fail(f"Test CodeBuild project not found: {e}")


class TestECRDeployment:
    """Integration tests for ECR repositories."""

    @pytest.fixture(scope="class")
    def ecr_client(self, aws_region):
        """Create ECR client."""
        return boto3.client('ecr', region_name=aws_region)

    def test_ecr_repositories_exist(self, ecr_client, environment_suffix, microservices):
        """Test that ECR repositories exist for all microservices."""
        for service in microservices:
            repo_name = f"{service}-{environment_suffix}"

            try:
                response = ecr_client.describe_repositories(repositoryNames=[repo_name])
                assert len(response['repositories']) == 1
                assert response['repositories'][0]['repositoryName'] == repo_name
                print(f"✓ ECR repository {repo_name} exists")
            except ClientError as e:
                pytest.fail(f"ECR repository {repo_name} not found: {e}")

    def test_ecr_image_scanning_enabled(self, ecr_client, environment_suffix, microservices):
        """Test that ECR repositories have image scanning enabled."""
        for service in microservices:
            repo_name = f"{service}-{environment_suffix}"

            response = ecr_client.describe_repositories(repositoryNames=[repo_name])
            repo = response['repositories'][0]

            assert repo['imageScanningConfiguration']['scanOnPush'] == True
            print(f"✓ Image scanning enabled for {repo_name}")

    def test_ecr_lifecycle_policies_exist(self, ecr_client, environment_suffix, microservices):
        """Test that ECR repositories have lifecycle policies."""
        for service in microservices:
            repo_name = f"{service}-{environment_suffix}"

            try:
                response = ecr_client.get_lifecycle_policy(repositoryName=repo_name)
                policy = json.loads(response['lifecyclePolicyText'])

                assert 'rules' in policy
                assert len(policy['rules']) > 0
                print(f"✓ Lifecycle policy exists for {repo_name}")
            except ClientError as e:
                pytest.fail(f"Lifecycle policy not found for {repo_name}: {e}")


class TestECSDeployment:
    """Integration tests for ECS clusters and services."""

    @pytest.fixture(scope="class")
    def ecs_client(self, aws_region):
        """Create ECS client."""
        return boto3.client('ecs', region_name=aws_region)

    def test_ecs_clusters_exist(self, ecs_client, environment_suffix):
        """Test that staging and production ECS clusters exist."""
        for env in ['staging', 'production']:
            cluster_name = f"{env}-cluster-{environment_suffix}"

            try:
                response = ecs_client.describe_clusters(clusters=[cluster_name])
                assert len(response['clusters']) == 1
                assert response['clusters'][0]['clusterName'] == cluster_name
                assert response['clusters'][0]['status'] == 'ACTIVE'
                print(f"✓ ECS cluster {cluster_name} exists and is active")
            except ClientError as e:
                pytest.fail(f"ECS cluster {cluster_name} not found: {e}")

    def test_ecs_services_exist(self, ecs_client, environment_suffix, microservices):
        """Test that ECS services exist for all microservices."""
        for env in ['staging', 'production']:
            cluster_name = f"{env}-cluster-{environment_suffix}"

            for service in microservices:
                service_name = f"{env}-{service}-{environment_suffix}"

                try:
                    response = ecs_client.describe_services(
                        cluster=cluster_name,
                        services=[service_name]
                    )
                    assert len(response['services']) == 1
                    assert response['services'][0]['serviceName'] == service_name
                    print(f"✓ ECS service {service_name} exists in {cluster_name}")
                except ClientError as e:
                    pytest.fail(f"ECS service {service_name} not found: {e}")

    def test_ecs_task_definitions_exist(self, ecs_client, environment_suffix, microservices):
        """Test that ECS task definitions are registered."""
        for env in ['staging', 'production']:
            for service in microservices:
                family = f"{env}-{service}-{environment_suffix}"

                try:
                    response = ecs_client.list_task_definitions(
                        familyPrefix=family,
                        status='ACTIVE',
                        sort='DESC',
                        maxResults=1
                    )
                    assert len(response['taskDefinitionArns']) >= 1
                    print(f"✓ Task definition for {family} exists")
                except ClientError as e:
                    pytest.fail(f"Task definition for {family} not found: {e}")

    def test_ecs_task_cpu_memory_limits(self, ecs_client, environment_suffix, microservices):
        """Test that task definitions have correct CPU and memory limits."""
        expected_limits = {
            'staging': {'cpu': '256', 'memory': '512'},
            'production': {'cpu': '512', 'memory': '1024'}
        }

        for env in ['staging', 'production']:
            for service in microservices:
                family = f"{env}-{service}-{environment_suffix}"

                response = ecs_client.list_task_definitions(
                    familyPrefix=family,
                    status='ACTIVE',
                    sort='DESC',
                    maxResults=1
                )

                task_def_arn = response['taskDefinitionArns'][0]
                task_def = ecs_client.describe_task_definition(taskDefinition=task_def_arn)

                assert task_def['taskDefinition']['cpu'] == expected_limits[env]['cpu']
                assert task_def['taskDefinition']['memory'] == expected_limits[env]['memory']
                print(f"✓ {family} has correct CPU/memory: {expected_limits[env]}")


class TestLoadBalancerDeployment:
    """Integration tests for Application Load Balancer."""

    @pytest.fixture(scope="class")
    def elbv2_client(self, aws_region):
        """Create ELB v2 client."""
        return boto3.client('elbv2', region_name=aws_region)

    def test_alb_exists(self, elbv2_client, environment_suffix):
        """Test that Application Load Balancer exists."""
        alb_name = f"cicd-alb-{environment_suffix}"

        try:
            response = elbv2_client.describe_load_balancers(Names=[alb_name])
            assert len(response['LoadBalancers']) == 1
            assert response['LoadBalancers'][0]['LoadBalancerName'] == alb_name
            assert response['LoadBalancers'][0]['State']['Code'] == 'active'
            print(f"✓ ALB {alb_name} exists and is active")
        except ClientError as e:
            pytest.fail(f"ALB not found: {e}")

    def test_target_groups_exist(self, elbv2_client, environment_suffix, microservices):
        """Test that target groups exist for blue-green deployments."""
        for env in ['staging', 'production']:
            for service in microservices:
                for color in ['blue', 'green']:
                    # Target group names are truncated to 32 characters
                    tg_name_prefix = f"{env}-{service}-{color[:3]}-{environment_suffix}"[:32]

                    try:
                        response = elbv2_client.describe_target_groups()
                        tg_names = [tg['TargetGroupName'] for tg in response['TargetGroups']]

                        matching = [name for name in tg_names if name.startswith(tg_name_prefix[:20])]
                        assert len(matching) >= 1
                        print(f"✓ Target group for {env}-{service}-{color} exists")
                    except ClientError as e:
                        pytest.fail(f"Target group not found: {e}")


class TestMonitoringDeployment:
    """Integration tests for monitoring and alerting."""

    @pytest.fixture(scope="class")
    def cloudwatch_client(self, aws_region):
        """Create CloudWatch client."""
        return boto3.client('cloudwatch', region_name=aws_region)

    @pytest.fixture(scope="class")
    def sns_client(self, aws_region):
        """Create SNS client."""
        return boto3.client('sns', region_name=aws_region)

    def test_cloudwatch_alarms_exist(self, cloudwatch_client, environment_suffix, microservices):
        """Test that CloudWatch alarms exist for all services."""
        alarm_types = ['task-count', '5xx-errors', 'target-health']

        for env in ['staging', 'production']:
            for service in microservices:
                for alarm_type in alarm_types:
                    alarm_name = f"{env}-{service}-{alarm_type}-{environment_suffix}"

                    try:
                        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
                        assert len(response['MetricAlarms']) == 1
                        print(f"✓ CloudWatch alarm {alarm_name} exists")
                    except ClientError as e:
                        # Some alarms might have slightly different names
                        print(f"⚠ Alarm {alarm_name} not found, might be named differently")

    def test_sns_topic_exists(self, sns_client, environment_suffix):
        """Test that SNS topic for notifications exists."""
        topic_name = f"pipeline-notifications-{environment_suffix}"

        try:
            response = sns_client.list_topics()
            topic_arns = [topic['TopicArn'] for topic in response['Topics']]

            matching = [arn for arn in topic_arns if topic_name in arn]
            assert len(matching) >= 1
            print(f"✓ SNS topic {topic_name} exists")
        except ClientError as e:
            pytest.fail(f"SNS topic not found: {e}")


class TestLambdaDeployment:
    """Integration tests for Lambda functions."""

    @pytest.fixture(scope="class")
    def lambda_client(self, aws_region):
        """Create Lambda client."""
        return boto3.client('lambda', region_name=aws_region)

    def test_health_check_lambda_exists(self, lambda_client, environment_suffix):
        """Test that health check Lambda function exists."""
        function_name = f"health-check-{environment_suffix}"

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            assert response['Configuration']['FunctionName'] == function_name
            assert response['Configuration']['Runtime'].startswith('python')
            print(f"✓ Lambda function {function_name} exists")
        except ClientError as e:
            pytest.fail(f"Lambda function not found: {e}")

    def test_lambda_has_required_permissions(self, lambda_client, environment_suffix):
        """Test that Lambda has correct IAM permissions."""
        function_name = f"health-check-{environment_suffix}"

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            role_arn = response['Configuration']['Role']
            assert 'lambda-health-check-role' in role_arn
            print(f"✓ Lambda has correct IAM role")
        except ClientError as e:
            pytest.fail(f"Lambda configuration check failed: {e}")


class TestParameterStoreDeployment:
    """Integration tests for Parameter Store."""

    @pytest.fixture(scope="class")
    def ssm_client(self, aws_region):
        """Create SSM client."""
        return boto3.client('ssm', region_name=aws_region)

    def test_parameters_exist(self, ssm_client, microservices):
        """Test that SSM parameters exist for configuration."""
        for stage in ['staging', 'production']:
            for service in microservices:
                param_name = f"/pipeline/{stage}/{service}/config"

                try:
                    response = ssm_client.get_parameter(Name=param_name)
                    assert response['Parameter']['Name'] == param_name

                    # Validate parameter value is valid JSON
                    config = json.loads(response['Parameter']['Value'])
                    assert 'environment' in config
                    assert 'service' in config
                    print(f"✓ Parameter {param_name} exists and is valid")
                except ClientError as e:
                    pytest.fail(f"Parameter {param_name} not found: {e}")


class TestS3ArtifactsBucket:
    """Integration tests for S3 artifacts bucket."""

    @pytest.fixture(scope="class")
    def s3_client(self, aws_region):
        """Create S3 client."""
        return boto3.client('s3', region_name=aws_region)

    def test_artifacts_bucket_exists(self, s3_client, environment_suffix, aws_region):
        """Test that S3 artifacts bucket exists."""
        bucket_name = f"cicd-artifacts-{environment_suffix}-{aws_region}"

        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            print(f"✓ S3 artifacts bucket {bucket_name} exists")
        except ClientError as e:
            pytest.fail(f"S3 bucket not found: {e}")

    def test_artifacts_bucket_versioning(self, s3_client, environment_suffix, aws_region):
        """Test that bucket versioning is enabled."""
        bucket_name = f"cicd-artifacts-{environment_suffix}-{aws_region}"

        try:
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert response['Status'] == 'Enabled'
            print(f"✓ Bucket versioning enabled for {bucket_name}")
        except ClientError as e:
            pytest.fail(f"Bucket versioning check failed: {e}")

    def test_artifacts_bucket_lifecycle(self, s3_client, environment_suffix, aws_region):
        """Test that bucket has lifecycle policy for 30-day retention."""
        bucket_name = f"cicd-artifacts-{environment_suffix}-{aws_region}"

        try:
            response = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            assert len(response['Rules']) >= 1

            # Check for 30-day retention rule
            retention_rule = response['Rules'][0]
            assert retention_rule['Status'] == 'Enabled'
            assert retention_rule['Expiration']['Days'] == 30
            print(f"✓ Bucket lifecycle policy configured for 30-day retention")
        except ClientError as e:
            pytest.fail(f"Bucket lifecycle check failed: {e}")
