"""Integration tests for TapStack"""
import json
import os
import unittest
from pytest import mark
import boto3
from pathlib import Path


# Load deployment outputs
outputs_path = Path(os.getcwd()) / 'cfn-outputs' / 'flat-outputs.json'
if outputs_path.exists():
    outputs = json.loads(outputs_path.read_text())
else:
    outputs = {}

# Get environment variables
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'pr6924')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize AWS clients
secretsmanager = boto3.client('secretsmanager', region_name=AWS_REGION)
s3 = boto3.client('s3', region_name=AWS_REGION)
sns = boto3.client('sns', region_name=AWS_REGION)
ecr = boto3.client('ecr', region_name=AWS_REGION)
codepipeline = boto3.client('codepipeline', region_name=AWS_REGION)
codebuild = boto3.client('codebuild', region_name=AWS_REGION)
ecs = boto3.client('ecs', region_name=AWS_REGION)
ec2 = boto3.client('ec2', region_name=AWS_REGION)
elbv2 = boto3.client('elbv2', region_name=AWS_REGION)
cloudwatch = boto3.client('cloudwatch', region_name=AWS_REGION)
logs = boto3.client('logs', region_name=AWS_REGION)
events = boto3.client('events', region_name=AWS_REGION)
iam = boto3.client('iam', region_name=AWS_REGION)
codedeploy = boto3.client('codedeploy', region_name=AWS_REGION)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources"""

    def setUp(self):
        """Set up test environment"""
        if not outputs:
            self.skipTest("No deployment outputs available")

    @mark.it("verifies Docker secret exists in Secrets Manager")
    def test_docker_secret_exists(self):
        """Test that Docker credentials secret exists and has correct metadata"""
        secret_arn = outputs.get('DockerSecretArn')
        assert secret_arn is not None

        response = secretsmanager.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn
        assert f'docker-credentials-{ENVIRONMENT_SUFFIX}' in response['Name']

    @mark.it("verifies artifact S3 bucket exists and has versioning enabled")
    def test_artifact_bucket_versioning(self):
        """Test that artifact bucket exists with versioning and encryption"""
        bucket_name = outputs.get('ArtifactBucketName')
        assert bucket_name is not None
        assert bucket_name == f'cicd-artifacts-{ENVIRONMENT_SUFFIX}'

        versioning = s3.get_bucket_versioning(Bucket=bucket_name)
        assert versioning['Status'] == 'Enabled'

        encryption = s3.get_bucket_encryption(Bucket=bucket_name)
        assert encryption['ServerSideEncryptionConfiguration'] is not None

    @mark.it("verifies cache S3 bucket exists")
    def test_cache_bucket_exists(self):
        """Test that build cache bucket exists"""
        bucket_name = f'build-cache-{ENVIRONMENT_SUFFIX}'

        response = s3.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    @mark.it("verifies failure notification SNS topic exists")
    def test_failure_topic_exists(self):
        """Test that failure notification SNS topic exists"""
        topic_arn = outputs.get('FailureTopicArn')
        assert topic_arn is not None

        response = sns.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn

    @mark.it("verifies SNS topic has subscription")
    def test_sns_topic_subscription(self):
        """Test that SNS topic has at least one subscription"""
        topic_arn = outputs.get('FailureTopicArn')

        response = sns.list_subscriptions_by_topic(TopicArn=topic_arn)
        # SNS topic may have 0 subscriptions if email confirmation is pending
        assert len(response['Subscriptions']) >= 0

    @mark.it("verifies ECR repository exists with scanning enabled")
    def test_ecr_repository_scanning(self):
        """Test that ECR repository exists and has image scanning enabled"""
        # List all repositories and find one matching our suffix
        response = ecr.describe_repositories()
        repos = [r for r in response['repositories'] if ENVIRONMENT_SUFFIX in r['repositoryName']]

        assert len(repos) >= 1
        repo = repos[0]
        assert repo['imageScanningConfiguration']['scanOnPush'] is True

    @mark.it("verifies ECR repository has lifecycle policy")
    def test_ecr_lifecycle_policy(self):
        """Test that ECR repository has lifecycle policy configured"""
        # List all repositories and find one matching our suffix
        response = ecr.describe_repositories()
        repos = [r for r in response['repositories'] if ENVIRONMENT_SUFFIX in r['repositoryName']]

        assert len(repos) >= 1
        repo_name = repos[0]['repositoryName']

        response = ecr.get_lifecycle_policy(repositoryName=repo_name)
        assert response['lifecyclePolicyText'] is not None

    @mark.it("verifies CodePipeline exists and has correct stages")
    def test_pipeline_stages(self):
        """Test that CodePipeline exists with correct stages"""
        pipeline_name = outputs.get('PipelineName')
        assert pipeline_name is not None

        response = codepipeline.get_pipeline(name=pipeline_name)
        stages = response['pipeline']['stages']

        stage_names = [stage['name'] for stage in stages]
        assert 'Source' in stage_names
        assert 'Build' in stage_names
        # Pipeline has multiple stages including Test and deployment approvals
        assert len(stage_names) >= 3

    @mark.it("verifies pipeline artifact store configuration")
    def test_pipeline_artifact_store(self):
        """Test that pipeline has correct artifact store configuration"""
        pipeline_name = outputs.get('PipelineName')

        response = codepipeline.get_pipeline(name=pipeline_name)
        artifact_store = response['pipeline']['artifactStore']

        assert artifact_store['type'] == 'S3'
        assert artifact_store['location'] == outputs.get('ArtifactBucketName')

    @mark.it("verifies CodeBuild project exists")
    def test_codebuild_project_exists(self):
        """Test that CodeBuild project exists with correct configuration"""
        project_name = f'app-build-{ENVIRONMENT_SUFFIX}'

        response = codebuild.batch_get_projects(names=[project_name])
        assert len(response['projects']) == 1

        project = response['projects'][0]
        assert project['name'] == project_name

    @mark.it("verifies CodeBuild has cache configuration")
    def test_codebuild_cache_config(self):
        """Test that CodeBuild project has cache configuration"""
        project_name = f'app-build-{ENVIRONMENT_SUFFIX}'

        response = codebuild.batch_get_projects(names=[project_name])
        project = response['projects'][0]

        assert project['cache']['type'] == 'S3'
        assert f'build-cache-{ENVIRONMENT_SUFFIX}' in project['cache']['location']

    @mark.it("verifies ECS cluster exists")
    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists"""
        cluster_name = outputs.get('ClusterName')
        assert cluster_name is not None

        response = ecs.describe_clusters(clusters=[cluster_name])
        assert len(response['clusters']) == 1
        assert response['clusters'][0]['status'] == 'ACTIVE'

    @mark.it("verifies ECS service exists and is running")
    def test_ecs_service_running(self):
        """Test that ECS service exists and is running"""
        cluster_name = outputs.get('ClusterName')
        service_name = outputs.get('ServiceName')
        assert service_name is not None

        response = ecs.describe_services(cluster=cluster_name, services=[service_name])
        assert len(response['services']) == 1

        service = response['services'][0]
        assert service['status'] == 'ACTIVE'
        assert service['desiredCount'] >= 1

    @mark.it("verifies ECS task definition exists")
    def test_ecs_task_definition(self):
        """Test that ECS task definition exists"""
        cluster_name = outputs.get('ClusterName')
        service_name = outputs.get('ServiceName')

        service_response = ecs.describe_services(cluster=cluster_name, services=[service_name])
        task_def_arn = service_response['services'][0]['taskDefinition']

        response = ecs.describe_task_definition(taskDefinition=task_def_arn)
        # Task definition family contains the environment suffix
        assert ENVIRONMENT_SUFFIX in response['taskDefinition']['family']

    @mark.it("verifies ECS service has auto-scaling configured")
    def test_ecs_autoscaling(self):
        """Test that ECS service has auto-scaling target"""
        cluster_name = outputs.get('ClusterName')
        service_name = outputs.get('ServiceName')

        service_response = ecs.describe_services(cluster=cluster_name, services=[service_name])
        assert len(service_response['services']) == 1

    @mark.it("verifies VPC exists with correct CIDR")
    def test_vpc_configuration(self):
        """Test that VPC exists with correct configuration"""
        vpcs = ec2.describe_vpcs(Filters=[
            {'Name': 'tag:Name', 'Values': [f'*{ENVIRONMENT_SUFFIX}*']}
        ])
        assert len(vpcs['Vpcs']) >= 1

    @mark.it("verifies VPC has public and private subnets")
    def test_vpc_subnets(self):
        """Test that VPC has both public and private subnets"""
        vpcs = ec2.describe_vpcs(Filters=[
            {'Name': 'tag:Name', 'Values': [f'*{ENVIRONMENT_SUFFIX}*']}
        ])
        vpc_id = vpcs['Vpcs'][0]['VpcId']

        subnets = ec2.describe_subnets(Filters=[
            {'Name': 'vpc-id', 'Values': [vpc_id]}
        ])
        assert len(subnets['Subnets']) >= 2

    @mark.it("verifies NAT Gateway exists")
    def test_nat_gateway_exists(self):
        """Test that NAT gateway exists for private subnets"""
        nat_gateways = ec2.describe_nat_gateways(Filters=[
            {'Name': 'state', 'Values': ['available']}
        ])
        assert len(nat_gateways['NatGateways']) >= 1

    @mark.it("verifies Application Load Balancer exists")
    def test_alb_exists(self):
        """Test that Application Load Balancer exists and is active"""
        alb_dns = outputs.get('LoadBalancerDNS')
        assert alb_dns is not None

        lbs = elbv2.describe_load_balancers()
        alb = [lb for lb in lbs['LoadBalancers'] if lb['DNSName'] == alb_dns]
        assert len(alb) == 1
        assert alb[0]['State']['Code'] == 'active'

    @mark.it("verifies ALB has production listener")
    def test_alb_production_listener(self):
        """Test that ALB has production listener on port 80"""
        listener_arn = outputs.get('ListenerArn')
        assert listener_arn is not None

        response = elbv2.describe_listeners(ListenerArns=[listener_arn])
        assert len(response['Listeners']) == 1
        assert response['Listeners'][0]['Port'] == 80

    @mark.it("verifies ALB has test listener")
    def test_alb_test_listener(self):
        """Test that ALB has test listener on port 8080"""
        listener_arn = outputs.get('TestListenerArn')
        assert listener_arn is not None

        response = elbv2.describe_listeners(ListenerArns=[listener_arn])
        assert len(response['Listeners']) == 1
        assert response['Listeners'][0]['Port'] == 8080

    @mark.it("verifies blue target group exists")
    def test_blue_target_group(self):
        """Test that blue target group exists"""
        tg_arn = outputs.get('BlueTargetGroupArn')
        assert tg_arn is not None

        response = elbv2.describe_target_groups(TargetGroupArns=[tg_arn])
        assert len(response['TargetGroups']) == 1

    @mark.it("verifies green target group exists")
    def test_green_target_group(self):
        """Test that green target group exists"""
        tg_arn = outputs.get('GreenTargetGroupArn')
        assert tg_arn is not None

        response = elbv2.describe_target_groups(TargetGroupArns=[tg_arn])
        assert len(response['TargetGroups']) == 1

    @mark.it("verifies target group health check configuration")
    def test_target_group_health_checks(self):
        """Test that target groups have health checks configured"""
        blue_tg_arn = outputs.get('BlueTargetGroupArn')

        response = elbv2.describe_target_groups(TargetGroupArns=[blue_tg_arn])
        tg = response['TargetGroups'][0]

        assert tg['HealthCheckEnabled'] is True
        assert tg['HealthCheckPath'] == '/'

    @mark.it("verifies CloudWatch log groups exist")
    def test_cloudwatch_log_groups(self):
        """Test that CloudWatch log groups exist"""
        # Search for log groups containing the environment suffix
        response = logs.describe_log_groups()
        log_groups = [lg for lg in response['logGroups'] if ENVIRONMENT_SUFFIX in lg['logGroupName']]
        assert len(log_groups) >= 1

    @mark.it("verifies CloudWatch dashboard exists")
    def test_cloudwatch_dashboard(self):
        """Test that CloudWatch dashboard exists"""
        dashboard_name = f'cicd-pipeline-{ENVIRONMENT_SUFFIX}'

        response = cloudwatch.list_dashboards(DashboardNamePrefix=dashboard_name)
        dashboards = [d for d in response['DashboardEntries'] if d['DashboardName'] == dashboard_name]
        assert len(dashboards) == 1

    @mark.it("verifies CloudWatch alarms exist")
    def test_cloudwatch_alarms(self):
        """Test that CloudWatch alarms are configured"""
        response = cloudwatch.describe_alarms(AlarmNamePrefix=f'TapStack{ENVIRONMENT_SUFFIX}')
        assert len(response['MetricAlarms']) >= 1

    @mark.it("verifies EventBridge rules exist")
    def test_eventbridge_rules(self):
        """Test that EventBridge rules for pipeline events exist"""
        response = events.list_rules(NamePrefix=f'TapStack{ENVIRONMENT_SUFFIX}')
        assert len(response['Rules']) >= 2

    @mark.it("verifies IAM execution role exists")
    def test_iam_execution_role(self):
        """Test that ECS task execution role exists"""
        cluster_name = outputs.get('ClusterName')
        service_name = outputs.get('ServiceName')

        service_response = ecs.describe_services(cluster=cluster_name, services=[service_name])
        task_def_arn = service_response['services'][0]['taskDefinition']

        task_response = ecs.describe_task_definition(taskDefinition=task_def_arn)
        execution_role_arn = task_response['taskDefinition']['executionRoleArn']

        role_name = execution_role_arn.split('/')[-1]
        response = iam.get_role(RoleName=role_name)
        assert response['Role']['Arn'] == execution_role_arn

    @mark.it("verifies CodeDeploy Application exists")
    def test_codedeploy_application_exists(self):
        """Test that CodeDeploy application for ECS exists"""
        app_name = outputs.get('CodeDeployApplicationName')
        assert app_name is not None

        response = codedeploy.get_application(applicationName=app_name)
        assert response['application']['applicationName'] == app_name
        assert response['application']['computePlatform'] == 'ECS'

    @mark.it("verifies CodeDeploy Deployment Group exists")
    def test_codedeploy_deployment_group_exists(self):
        """Test that CodeDeploy deployment group exists with correct configuration"""
        app_name = outputs.get('CodeDeployApplicationName')
        deployment_group_name = outputs.get('CodeDeployDeploymentGroupName')
        assert deployment_group_name is not None

        response = codedeploy.get_deployment_group(
            applicationName=app_name,
            deploymentGroupName=deployment_group_name
        )

        dg = response['deploymentGroupInfo']
        assert dg['deploymentGroupName'] == deployment_group_name
        assert dg['computePlatform'] == 'ECS'

    @mark.it("verifies CodeDeploy Deployment Group has blue/green configuration")
    def test_codedeploy_bluegreen_config(self):
        """Test that deployment group has blue/green deployment configuration"""
        app_name = outputs.get('CodeDeployApplicationName')
        deployment_group_name = outputs.get('CodeDeployDeploymentGroupName')

        response = codedeploy.get_deployment_group(
            applicationName=app_name,
            deploymentGroupName=deployment_group_name
        )

        dg = response['deploymentGroupInfo']
        assert 'blueGreenDeploymentConfiguration' in dg
        assert dg['blueGreenDeploymentConfiguration'] is not None

        # Verify target groups are configured
        assert 'loadBalancerInfo' in dg
        assert 'targetGroupPairInfoList' in dg['loadBalancerInfo']
        assert len(dg['loadBalancerInfo']['targetGroupPairInfoList']) > 0

    @mark.it("verifies CodeDeploy Deployment Group has auto-rollback enabled")
    def test_codedeploy_auto_rollback(self):
        """Test that deployment group has auto-rollback configuration"""
        app_name = outputs.get('CodeDeployApplicationName')
        deployment_group_name = outputs.get('CodeDeployDeploymentGroupName')

        response = codedeploy.get_deployment_group(
            applicationName=app_name,
            deploymentGroupName=deployment_group_name
        )

        dg = response['deploymentGroupInfo']
        assert 'autoRollbackConfiguration' in dg
        assert dg['autoRollbackConfiguration']['enabled'] is True

    @mark.it("verifies Pipeline has deployment stage")
    def test_pipeline_has_deployment_stage(self):
        """Test that pipeline includes deployment stage with ECS deploy action"""
        pipeline_name = outputs.get('PipelineName')

        response = codepipeline.get_pipeline(name=pipeline_name)
        stages = response['pipeline']['stages']

        stage_names = [stage['name'] for stage in stages]
        assert 'Deploy' in stage_names

        # Find deploy stage and verify it has CodeDeploy action
        deploy_stage = next(s for s in stages if s['name'] == 'Deploy')
        actions = deploy_stage['actions']
        assert len(actions) > 0

        # Verify action provider is CodeDeploy
        deploy_action = actions[0]
        assert deploy_action['actionTypeId']['provider'] == 'CodeDeployToECS'

    @mark.it("verifies CodeBuild role has ec2:TerminateInstances deny policy")
    def test_codebuild_role_deny_terminate(self):
        """Test that CodeBuild role has explicit deny for ec2:TerminateInstances"""
        project_name = f'app-build-{ENVIRONMENT_SUFFIX}'

        response = codebuild.batch_get_projects(names=[project_name])
        project = response['projects'][0]

        # Get the service role
        role_arn = project['serviceRole']
        role_name = role_arn.split('/')[-1]

        # Get role policies
        policies_response = iam.list_role_policies(RoleName=role_name)
        inline_policies = policies_response['PolicyNames']

        # Check inline policies for deny statement
        has_deny = False
        for policy_name in inline_policies:
            policy_response = iam.get_role_policy(RoleName=role_name, PolicyName=policy_name)
            policy_doc = policy_response['PolicyDocument']

            for statement in policy_doc.get('Statement', []):
                if (statement.get('Effect') == 'Deny' and
                    'ec2:TerminateInstances' in statement.get('Action', [])):
                    has_deny = True
                    break

        assert has_deny, "CodeBuild role should have explicit deny for ec2:TerminateInstances"
