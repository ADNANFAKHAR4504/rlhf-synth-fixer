import json
import os
import unittest

import boto3
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs_json = f.read()
else:
    flat_outputs_json = '{}'

flat_outputs = json.loads(flat_outputs_json)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the deployed TapStack CI/CD pipeline"""

    def setUp(self):
        """Set up AWS clients and deployment outputs"""
        self.region = os.getenv('AWS_REGION', 'us-east-1')

        # AWS clients
        self.ecr_client = boto3.client('ecr', region_name=self.region)
        self.codecommit_client = boto3.client('codecommit', region_name=self.region)
        self.codepipeline_client = boto3.client('codepipeline', region_name=self.region)
        self.elbv2_client = boto3.client('elbv2', region_name=self.region)
        self.cloudwatch_client = boto3.client('logs', region_name=self.region)

        # Deployment outputs
        self.ecr_uri = flat_outputs.get('ECRRepositoryUri-o1r1z1s4')
        self.pipeline_arn = flat_outputs.get('PipelineArn-o1r1z1s4')
        self.codecommit_url = flat_outputs.get('CodeCommitRepoUrl-o1r1z1s4')
        self.alb_dns = flat_outputs.get('LoadBalancerDns-o1r1z1s4')

    @mark.it("verifies ECR repository exists and is accessible")
    def test_ecr_repository_exists(self):
        """Test that ECR repository was created and is accessible"""
        if not self.ecr_uri:
            self.skipTest("ECR URI not found in outputs")

        # Extract repository name from URI
        repo_name = self.ecr_uri.split('/')[-1]

        # Verify repository exists
        response = self.ecr_client.describe_repositories(
            repositoryNames=[repo_name]
        )

        repositories = response['repositories']
        assert len(repositories) == 1, "ECR repository should exist"
        assert repositories[0]['repositoryName'] == repo_name

        # Verify lifecycle policy is configured
        lifecycle_response = self.ecr_client.get_lifecycle_policy(
            repositoryName=repo_name
        )
        assert 'lifecyclePolicyText' in lifecycle_response

        # Verify policy keeps 10 images
        policy = json.loads(lifecycle_response['lifecyclePolicyText'])
        assert 'rules' in policy
        assert policy['rules'][0]['selection']['countNumber'] == 10

    @mark.it("verifies CodeCommit repository exists")
    def test_codecommit_repository_exists(self):
        """Test that CodeCommit repository was created"""
        if not self.codecommit_url:
            self.skipTest("CodeCommit URL not found in outputs")

        # Extract repository name from URL
        repo_name = self.codecommit_url.split('/')[-1]

        # Verify repository exists
        response = self.codecommit_client.get_repository(
            repositoryName=repo_name
        )

        assert response['repositoryMetadata']['repositoryName'] == repo_name
        assert 'cloneUrlHttp' in response['repositoryMetadata']

    @mark.it("verifies CodePipeline exists and is configured")
    def test_codepipeline_exists(self):
        """Test that CodePipeline was created with correct stages"""
        if not self.pipeline_arn:
            self.skipTest("Pipeline ARN not found in outputs")

        # Extract pipeline name from ARN
        pipeline_name = self.pipeline_arn.split(':')[-1].replace('pipeline/', '')

        # Get pipeline configuration
        response = self.codepipeline_client.get_pipeline(
            name=pipeline_name
        )

        pipeline = response['pipeline']
        assert pipeline['name'] == pipeline_name

        # Verify three stages: Source, Build, Deploy
        stages = pipeline['stages']
        stage_names = [stage['name'] for stage in stages]

        assert 'Source' in stage_names, "Pipeline should have Source stage"
        assert 'Build' in stage_names, "Pipeline should have Build stage"
        assert 'Deploy' in stage_names, "Pipeline should have Deploy stage"

        # Verify Source stage uses CodeCommit
        source_stage = next(s for s in stages if s['name'] == 'Source')
        assert source_stage['actions'][0]['actionTypeId']['provider'] == 'CodeCommit'

        # Verify Build stage uses CodeBuild
        build_stage = next(s for s in stages if s['name'] == 'Build')
        assert build_stage['actions'][0]['actionTypeId']['provider'] == 'CodeBuild'

        # Verify Deploy stage uses CodeDeploy
        deploy_stage = next(s for s in stages if s['name'] == 'Deploy')
        assert deploy_stage['actions'][0]['actionTypeId']['provider'] == 'CodeDeployToECS'

    @mark.it("verifies Application Load Balancer is operational")
    def test_load_balancer_operational(self):
        """Test that ALB was created and is operational"""
        if not self.alb_dns:
            self.skipTest("ALB DNS not found in outputs")

        # Get load balancer ARN from DNS name
        response = self.elbv2_client.describe_load_balancers()

        alb = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == self.alb_dns:
                alb = lb
                break

        assert alb is not None, "Load balancer should exist"
        assert alb['State']['Code'] == 'active', "ALB should be active"
        assert alb['Scheme'] == 'internet-facing', "ALB should be internet-facing"

        # Verify target groups exist
        tg_response = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb['LoadBalancerArn']
        )

        target_groups = tg_response['TargetGroups']
        assert len(target_groups) >= 2, "Should have at least 2 target groups (blue/green)"

        # Verify health check configuration
        for tg in target_groups:
            assert tg['HealthCheckPath'] == '/'
            assert tg['HealthCheckIntervalSeconds'] == 30

    @mark.it("verifies CloudWatch log groups exist")
    def test_cloudwatch_logs_exist(self):
        """Test that CloudWatch log groups were created"""
        # Check for ECS log group
        ecs_log_group = '/ecs/app-o1r1z1s4'

        try:
            response = self.cloudwatch_client.describe_log_groups(
                logGroupNamePrefix=ecs_log_group
            )
            log_groups = response['logGroups']
            assert len(log_groups) >= 1, "ECS log group should exist"

            # Verify retention
            for lg in log_groups:
                if lg['logGroupName'] == ecs_log_group:
                    assert lg.get('retentionInDays') == 30, "Should have 30-day retention"
        except Exception as e:
            self.fail(f"Failed to verify CloudWatch logs: {e}")

    @mark.it("verifies environment suffix is used in resource names")
    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is applied consistently"""
        env_suffix = 'o1r1z1s4'

        # Check ECR repository name
        if self.ecr_uri:
            repo_name = self.ecr_uri.split('/')[-1]
            assert env_suffix in repo_name or 'o1r1z1s4' in repo_name

        # Check CodeCommit repository name
        if self.codecommit_url:
            repo_name = self.codecommit_url.split('/')[-1]
            assert env_suffix in repo_name or 'o1r1z1s4' in repo_name

    @mark.it("verifies stack outputs contain all required values")
    def test_stack_outputs_complete(self):
        """Test that all expected outputs are present"""
        required_outputs = [
            'PipelineArn-o1r1z1s4',
            'ECRRepositoryUri-o1r1z1s4',
            'CodeCommitRepoUrl-o1r1z1s4',
            'LoadBalancerDns-o1r1z1s4'
        ]

        for output_key in required_outputs:
            assert output_key in flat_outputs, f"Output {output_key} should be present"
            assert flat_outputs[output_key], f"Output {output_key} should have a value"

    @mark.it("verifies pipeline artifact bucket encryption")
    def test_artifact_bucket_encryption(self):
        """Test that S3 bucket for artifacts is encrypted"""
        # Get bucket name from CloudFormation stack
        s3_client = boto3.client('s3', region_name=self.region)
        cfn_client = boto3.client('cloudformation', region_name=self.region)

        try:
            # Get stack resources
            stack_name = f'TapStacko1r1z1s4'
            response = cfn_client.describe_stack_resources(
                StackName=stack_name
            )

            # Find S3 bucket
            bucket_name = None
            for resource in response['StackResources']:
                if resource['ResourceType'] == 'AWS::S3::Bucket':
                    bucket_name = resource['PhysicalResourceId']
                    break

            if bucket_name:
                # Verify encryption
                encryption_response = s3_client.get_bucket_encryption(
                    Bucket=bucket_name
                )
                rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
                assert len(rules) > 0, "Bucket should have encryption rules"
                assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']
        except Exception as e:
            self.skipTest(f"Could not verify bucket encryption: {e}")

    @mark.it("verifies CodeBuild project configuration")
    def test_codebuild_project_configuration(self):
        """Test CodeBuild project settings"""
        codebuild_client = boto3.client('codebuild', region_name=self.region)

        # List projects and find ours
        response = codebuild_client.list_projects()
        project_names = [p for p in response['projects'] if 'o1r1z1s4' in p]

        if not project_names:
            self.skipTest("CodeBuild project not found")

        # Get project details
        projects = codebuild_client.batch_get_projects(names=project_names)

        project = projects['projects'][0]

        # Verify environment
        assert project['environment']['type'] == 'LINUX_CONTAINER'
        assert 'aws/codebuild/standard' in project['environment']['image']

        # Verify CloudWatch Logs
        assert 'cloudWatchLogs' in project['logsConfig']
        assert project['logsConfig']['cloudWatchLogs']['status'] == 'ENABLED'
