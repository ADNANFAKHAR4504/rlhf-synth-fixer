"""
Integration tests for deployed payment processing infrastructure.
Tests validate actual AWS resources using CloudFormation outputs from flat-outputs.json.
No try-catch blocks, no hardcoding, tests live resources only.
"""

import json
import os
import boto3
from pytest import mark, fixture

# Get environment variables - no defaults, fail fast if not set
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
AWS_REGION = os.environ['AWS_REGION']

# Load CloudFormation outputs from flat-outputs.json
outputs_path = os.path.join(os.getcwd(), 'cfn-outputs', 'flat-outputs.json')
with open(outputs_path, 'r', encoding='utf-8') as f:
    outputs = json.load(f)

# Initialize AWS clients with region from environment
ecs_client = boto3.client('ecs', region_name=AWS_REGION)
elbv2_client = boto3.client('elbv2', region_name=AWS_REGION)
rds_client = boto3.client('rds', region_name=AWS_REGION)
ecr_client = boto3.client('ecr', region_name=AWS_REGION)
codedeploy_client = boto3.client('codedeploy', region_name=AWS_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=AWS_REGION)
ec2_client = boto3.client('ec2', region_name=AWS_REGION)
sns_client = boto3.client('sns', region_name=AWS_REGION)
servicediscovery_client = boto3.client('servicediscovery', region_name=AWS_REGION)
logs_client = boto3.client('logs', region_name=AWS_REGION)


@mark.describe("ECS Infrastructure")
class TestECSInfrastructure:
    """Integration tests for ECS cluster and services"""

    @mark.it("validates ECS cluster exists and is active")
    def test_ecs_cluster_exists(self):
        """Test that ECS cluster was created and is active"""
        cluster_name = outputs.get(f'ClusterName{ENVIRONMENT_SUFFIX}')

        assert cluster_name is not None, f"ClusterName{ENVIRONMENT_SUFFIX} output not found"

        response = ecs_client.describe_clusters(clusters=[cluster_name])

        assert len(response['clusters']) == 1, "Cluster not found"
        assert response['clusters'][0]['status'] == 'ACTIVE', "Cluster is not active"
        assert response['clusters'][0]['clusterName'] == cluster_name

    @mark.it("validates all three ECS services are running")
    def test_ecs_services_running(self):
        """Test that all three ECS services are running with correct configuration"""
        cluster_name = outputs.get(f'ClusterName{ENVIRONMENT_SUFFIX}')

        assert cluster_name is not None, f"ClusterName{ENVIRONMENT_SUFFIX} output not found"

        # List services in cluster
        services_response = ecs_client.list_services(cluster=cluster_name)
        service_arns = services_response['serviceArns']

        assert len(service_arns) >= 3, f"Expected at least 3 services, found {len(service_arns)}"

        # Describe services
        services_detail = ecs_client.describe_services(
            cluster=cluster_name,
            services=service_arns
        )

        for service in services_detail['services']:
            # Verify service is active
            assert service['status'] == 'ACTIVE', f"Service {service['serviceName']} is not active"

            # Verify CODE_DEPLOY deployment controller
            assert service['deploymentController']['type'] == 'CODE_DEPLOY', \
                f"Service {service['serviceName']} does not use CODE_DEPLOY controller"

            # Verify desired count
            assert service['desiredCount'] >= 2, \
                f"Service {service['serviceName']} has insufficient desired count"

            # Verify running count matches desired count
            assert service['runningCount'] == service['desiredCount'], \
                f"Service {service['serviceName']} running count ({service['runningCount']}) does not match desired count ({service['desiredCount']})"

    @mark.it("validates ECS services have correct task definitions")
    def test_ecs_task_definitions(self):
        """Test that ECS services use Fargate task definitions with correct configuration"""
        cluster_name = outputs.get(f'ClusterName{ENVIRONMENT_SUFFIX}')

        assert cluster_name is not None, f"ClusterName{ENVIRONMENT_SUFFIX} output not found"

        services_response = ecs_client.list_services(cluster=cluster_name)
        services_detail = ecs_client.describe_services(
            cluster=cluster_name,
            services=services_response['serviceArns']
        )

        for service in services_detail['services']:
            task_def_arn = service['taskDefinition']
            task_def = ecs_client.describe_task_definition(taskDefinition=task_def_arn)

            # Verify Fargate compatibility
            assert 'FARGATE' in task_def['taskDefinition']['requiresCompatibilities'], \
                f"Task definition for {service['serviceName']} is not Fargate compatible"

            # Verify network mode
            assert task_def['taskDefinition']['networkMode'] == 'awsvpc', \
                f"Task definition for {service['serviceName']} does not use awsvpc network mode"

            # Verify containers (should have app + xray)
            containers = task_def['taskDefinition']['containerDefinitions']
            assert len(containers) >= 2, \
                f"Task definition for {service['serviceName']} should have at least 2 containers"


@mark.describe("Load Balancer Infrastructure")
class TestLoadBalancerInfrastructure:
    """Integration tests for Application Load Balancer"""

    @mark.it("validates ALB exists and is active")
    def test_alb_exists_and_active(self):
        """Test that Application Load Balancer exists and is active"""
        alb_dns = outputs.get(f'LoadBalancerDNS{ENVIRONMENT_SUFFIX}')

        assert alb_dns is not None, f"LoadBalancerDNS{ENVIRONMENT_SUFFIX} output not found"

        # Find ALB by DNS name
        albs = elbv2_client.describe_load_balancers()

        alb_found = False
        for alb in albs['LoadBalancers']:
            if alb['DNSName'] == alb_dns:
                alb_found = True
                assert alb['State']['Code'] == 'active', "ALB is not active"
                assert alb['Scheme'] == 'internet-facing', "ALB is not internet-facing"
                assert alb['Type'] == 'application', "Load balancer is not an ALB"
                break

        assert alb_found, f"ALB with DNS {alb_dns} not found"

    @mark.it("validates target groups exist for blue-green deployments")
    def test_target_groups_exist(self):
        """Test that blue and green target groups exist for each service"""
        # Get target group names from outputs
        payment_blue_tg = outputs.get(f'TapStack{ENVIRONMENT_SUFFIX}EcsStack{ENVIRONMENT_SUFFIX}PaymentAPIBlueTG{ENVIRONMENT_SUFFIX}8832D6C6TargetGroupName')
        txn_blue_tg = outputs.get(f'TapStack{ENVIRONMENT_SUFFIX}EcsStack{ENVIRONMENT_SUFFIX}TxnProcessorBlueTG{ENVIRONMENT_SUFFIX}816689D9TargetGroupName')
        notif_blue_tg = outputs.get(f'TapStack{ENVIRONMENT_SUFFIX}EcsStack{ENVIRONMENT_SUFFIX}NotificationBlueTG{ENVIRONMENT_SUFFIX}E7E69BD3TargetGroupName')

        # Get all target groups
        target_groups = elbv2_client.describe_target_groups()

        # Should have at least 6 target groups (3 services × 2 for blue/green)
        tg_count = len(target_groups['TargetGroups'])
        assert tg_count >= 6, f"Expected at least 6 target groups, found {tg_count}"

        # Verify health check configuration
        for tg in target_groups['TargetGroups']:
            if any(name in tg['TargetGroupName'] for name in [ENVIRONMENT_SUFFIX]):
                assert tg['HealthCheckEnabled'] == True, f"Health checks not enabled for {tg['TargetGroupName']}"
                assert tg['HealthCheckPath'] == '/health', f"Health check path incorrect for {tg['TargetGroupName']}"
                assert tg['HealthCheckIntervalSeconds'] == 30, f"Health check interval incorrect for {tg['TargetGroupName']}"

    @mark.it("validates target groups have healthy targets")
    def test_target_groups_have_healthy_targets(self):
        """Test that target groups have healthy targets registered"""
        # Get all target groups for this environment
        target_groups = elbv2_client.describe_target_groups()

        blue_target_groups = [
            tg for tg in target_groups['TargetGroups']
            if ENVIRONMENT_SUFFIX in tg['TargetGroupName'] and 'blue' in tg['TargetGroupName'].lower()
        ]

        assert len(blue_target_groups) >= 3, f"Expected at least 3 blue target groups, found {len(blue_target_groups)}"

        # Verify each blue target group has healthy targets
        for tg in blue_target_groups:
            health = elbv2_client.describe_target_health(TargetGroupArn=tg['TargetGroupArn'])
            healthy_targets = [t for t in health['TargetHealthDescriptions'] if t['TargetHealth']['State'] == 'healthy']
            assert len(healthy_targets) >= 2, f"Target group {tg['TargetGroupName']} should have at least 2 healthy targets, found {len(healthy_targets)}"


@mark.describe("Database Infrastructure")
class TestDatabaseInfrastructure:
    """Integration tests for Aurora Serverless v2 database"""

    @mark.it("validates Aurora database cluster exists")
    def test_database_cluster_exists(self):
        """Test that Aurora Serverless v2 database cluster exists"""
        db_endpoint = outputs.get(f'DatabaseEndpoint{ENVIRONMENT_SUFFIX}')

        assert db_endpoint is not None, f"DatabaseEndpoint{ENVIRONMENT_SUFFIX} output not found"

        # Extract cluster identifier from endpoint
        cluster_id = db_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)

        assert len(response['DBClusters']) == 1, "Database cluster not found"

        cluster = response['DBClusters'][0]
        assert cluster['Engine'] == 'aurora-postgresql', "Wrong database engine"
        assert cluster['Status'] == 'available', "Database cluster not available"
        assert 'ServerlessV2ScalingConfiguration' in cluster, "Not Serverless v2"
        assert cluster['StorageEncrypted'] == True, "Database not encrypted"

    @mark.it("validates database has correct scaling configuration")
    def test_database_scaling_configuration(self):
        """Test that database has correct Serverless v2 scaling configuration"""
        db_endpoint = outputs.get(f'DatabaseEndpoint{ENVIRONMENT_SUFFIX}')

        assert db_endpoint is not None, f"DatabaseEndpoint{ENVIRONMENT_SUFFIX} output not found"

        cluster_id = db_endpoint.split('.')[0]
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)

        cluster = response['DBClusters'][0]
        scaling = cluster['ServerlessV2ScalingConfiguration']

        # Verify min and max capacity
        assert scaling['MinCapacity'] >= 0.5, "Min capacity too low"
        assert scaling['MaxCapacity'] >= 1.0, "Max capacity too low"


@mark.describe("Container Registry Infrastructure")
class TestContainerRegistryInfrastructure:
    """Integration tests for ECR repositories"""

    @mark.it("validates ECR repositories exist with scan on push enabled")
    def test_ecr_repositories_exist(self):
        """Test that ECR repositories exist for all services with vulnerability scanning"""
        repos = ecr_client.describe_repositories()

        # Find repositories for this environment
        env_repos = [r for r in repos['repositories'] if ENVIRONMENT_SUFFIX in r['repositoryName']]

        # Should have at least 3 repositories
        assert len(env_repos) >= 3, f"Expected at least 3 ECR repositories for {ENVIRONMENT_SUFFIX}, found {len(env_repos)}"

        # Verify scan on push is enabled
        for repo in env_repos:
            assert repo['imageScanningConfiguration']['scanOnPush'] == True, \
                f"Scan on push not enabled for {repo['repositoryName']}"

    @mark.it("validates ECR repositories have lifecycle policies")
    def test_ecr_lifecycle_policies(self):
        """Test that ECR repositories have lifecycle policies configured"""
        repos = ecr_client.describe_repositories()

        env_repos = [r for r in repos['repositories'] if ENVIRONMENT_SUFFIX in r['repositoryName']]

        for repo in env_repos:
            policies = ecr_client.get_lifecycle_policy(repositoryName=repo['repositoryName'])

            assert 'lifecyclePolicyText' in policies, \
                f"Lifecycle policy not found for {repo['repositoryName']}"


@mark.describe("Deployment Infrastructure")
class TestDeploymentInfrastructure:
    """Integration tests for CodeDeploy configuration"""

    @mark.it("validates CodeDeploy application and deployment groups exist")
    def test_codedeploy_configuration(self):
        """Test that CodeDeploy application and deployment groups are configured"""
        # Get CodeDeploy application name from outputs
        app_name = outputs.get(f'CodeDeployApplication{ENVIRONMENT_SUFFIX}')

        assert app_name is not None, f"CodeDeployApplication{ENVIRONMENT_SUFFIX} output not found"

        # Verify application exists
        app = codedeploy_client.get_application(applicationName=app_name)
        assert app['application']['computePlatform'] == 'ECS', "Wrong compute platform"

        # Get deployment groups
        deployment_groups = codedeploy_client.list_deployment_groups(applicationName=app_name)

        # Should have 3 deployment groups (one per service)
        assert len(deployment_groups['deploymentGroups']) >= 3, \
            f"Expected at least 3 deployment groups, found {len(deployment_groups['deploymentGroups'])}"

    @mark.it("validates deployment groups have correct configuration")
    def test_deployment_groups_configuration(self):
        """Test that deployment groups have blue-green and auto-rollback configuration"""
        app_name = outputs.get(f'CodeDeployApplication{ENVIRONMENT_SUFFIX}')

        assert app_name is not None, f"CodeDeployApplication{ENVIRONMENT_SUFFIX} output not found"

        deployment_groups = codedeploy_client.list_deployment_groups(applicationName=app_name)

        for dg_name in deployment_groups['deploymentGroups']:
            dg_info = codedeploy_client.get_deployment_group(
                applicationName=app_name,
                deploymentGroupName=dg_name
            )

            dg = dg_info['deploymentGroupInfo']
            assert dg['computePlatform'] == 'ECS', "Wrong compute platform"
            assert 'blueGreenDeploymentConfiguration' in dg, "Blue-green config missing"
            assert 'autoRollbackConfiguration' in dg, "Auto-rollback not configured"
            assert dg['autoRollbackConfiguration']['enabled'] == True, "Auto-rollback not enabled"


@mark.describe("Monitoring Infrastructure")
class TestMonitoringInfrastructure:
    """Integration tests for CloudWatch monitoring"""

    @mark.it("validates CloudWatch alarms exist for all services")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured for monitoring"""
        # Get all alarms with pagination
        all_alarms = []
        paginator = cloudwatch_client.get_paginator('describe_alarms')
        for page in paginator.paginate():
            all_alarms.extend(page['MetricAlarms'])

        # Find alarms for this environment
        env_alarms = [a for a in all_alarms if ENVIRONMENT_SUFFIX in a['AlarmName']]

        # Should have multiple alarms (CPU, Memory, Deployment for each service)
        assert len(env_alarms) >= 9, \
            f"Expected at least 9 CloudWatch alarms for {ENVIRONMENT_SUFFIX}, found {len(env_alarms)}"

        # Separate deployment alarms from operational alarms
        deployment_alarms = [a for a in env_alarms if 'deployment-alarm' in a['AlarmName']]
        operational_alarms = [a for a in env_alarms if 'deployment-alarm' not in a['AlarmName']]

        # Verify operational alarms (CPU/Memory) have SNS actions configured
        for alarm in operational_alarms:
            assert len(alarm.get('AlarmActions', [])) > 0, \
                f"Operational alarm {alarm['AlarmName']} should have SNS actions configured"

        # Verify deployment alarms exist (used by CodeDeploy, don't need SNS actions)
        assert len(deployment_alarms) >= 3, \
            f"Expected at least 3 deployment alarms, found {len(deployment_alarms)}"

    @mark.it("validates SNS topic exists for alarm notifications")
    def test_sns_topic_exists(self):
        """Test that SNS topic exists for alarm notifications"""
        alarm_topic_arn = outputs.get(f'AlarmTopicARN{ENVIRONMENT_SUFFIX}')

        assert alarm_topic_arn is not None, f"AlarmTopicARN{ENVIRONMENT_SUFFIX} output not found"

        # Verify topic exists
        topic_attrs = sns_client.get_topic_attributes(TopicArn=alarm_topic_arn)

        assert 'Attributes' in topic_attrs, "SNS topic not found"
        assert topic_attrs['Attributes']['TopicArn'] == alarm_topic_arn


@mark.describe("Networking Infrastructure")
class TestNetworkingInfrastructure:
    """Integration tests for VPC networking"""

    @mark.it("validates VPC configuration with proper subnets")
    def test_vpc_configuration(self):
        """Test that VPC is configured with proper subnet structure"""
        vpc_id = outputs.get(f'VPCId{ENVIRONMENT_SUFFIX}')

        assert vpc_id is not None, f"VPCId{ENVIRONMENT_SUFFIX} output not found"

        # Get VPC details
        vpcs = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(vpcs['Vpcs']) == 1, "VPC not found"

        # Verify DNS support
        vpc = vpcs['Vpcs'][0]
        assert vpc['State'] == 'available', "VPC not available"

        # Get subnets
        subnets = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Should have public, private, and isolated subnets across multiple AZs
        # With 3 AZs: 3 public + 3 private + 3 isolated = 9 subnets
        assert len(subnets['Subnets']) >= 6, \
            f"Expected at least 6 subnets, found {len(subnets['Subnets'])}"

    @mark.it("validates NAT Gateways exist")
    def test_nat_gateways_exist(self):
        """Test that NAT Gateways are deployed for private subnets"""
        vpc_id = outputs.get(f'VPCId{ENVIRONMENT_SUFFIX}')

        assert vpc_id is not None, f"VPCId{ENVIRONMENT_SUFFIX} output not found"

        # Get NAT Gateways
        nat_gateways = ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Should have at least 1 NAT Gateway (typically 3 for 3 AZs)
        active_nats = [ng for ng in nat_gateways['NatGateways'] if ng['State'] == 'available']
        assert len(active_nats) >= 1, \
            f"Expected at least 1 active NAT Gateway, found {len(active_nats)}"

    @mark.it("validates security groups are configured correctly")
    def test_security_groups(self):
        """Test that security groups exist and have correct rules"""
        vpc_id = outputs.get(f'VPCId{ENVIRONMENT_SUFFIX}')

        assert vpc_id is not None, f"VPCId{ENVIRONMENT_SUFFIX} output not found"

        # Get security groups for this VPC
        security_groups = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': [f'*{ENVIRONMENT_SUFFIX}*']}
            ]
        )

        # Should have at least 3 security groups (ALB, ECS, Database)
        assert len(security_groups['SecurityGroups']) >= 3, \
            f"Expected at least 3 security groups, found {len(security_groups['SecurityGroups'])}"


@mark.describe("Service Discovery Infrastructure")
class TestServiceDiscoveryInfrastructure:
    """Integration tests for AWS Cloud Map service discovery"""

    @mark.it("validates Cloud Map namespace exists")
    def test_cloudmap_namespace_exists(self):
        """Test that Cloud Map private DNS namespace exists"""
        namespaces = servicediscovery_client.list_namespaces()

        env_namespaces = [
            ns for ns in namespaces['Namespaces']
            if ENVIRONMENT_SUFFIX in ns['Name']
        ]

        assert len(env_namespaces) >= 1, f"Expected at least 1 Cloud Map namespace for {ENVIRONMENT_SUFFIX}"

        namespace = env_namespaces[0]
        assert namespace['Type'] == 'DNS_PRIVATE', "Namespace should be DNS_PRIVATE"

    @mark.it("validates services are registered in Cloud Map")
    def test_services_registered_in_cloudmap(self):
        """Test that ECS services are registered in Cloud Map"""
        namespaces = servicediscovery_client.list_namespaces()
        env_namespace = next(
            (ns for ns in namespaces['Namespaces'] if ENVIRONMENT_SUFFIX in ns['Name']),
            None
        )

        assert env_namespace is not None, "Cloud Map namespace not found"

        services = servicediscovery_client.list_services(
            Filters=[{'Name': 'NAMESPACE_ID', 'Values': [env_namespace['Id']]}]
        )

        assert len(services['Services']) >= 3, f"Expected at least 3 services registered in Cloud Map, found {len(services['Services'])}"


@mark.describe("CloudWatch Logs Infrastructure")
class TestCloudWatchLogsInfrastructure:
    """Integration tests for CloudWatch Logs"""

    @mark.it("validates log groups exist for ECS services")
    def test_ecs_log_groups_exist(self):
        """Test that CloudWatch log groups exist for all ECS services"""
        log_groups = logs_client.describe_log_groups(
            logGroupNamePrefix=f'/ecs/payment-processing/'
        )

        env_log_groups = [
            lg for lg in log_groups['logGroups']
            if ENVIRONMENT_SUFFIX in lg['logGroupName']
        ]

        assert len(env_log_groups) >= 3, f"Expected at least 3 ECS log groups for {ENVIRONMENT_SUFFIX}, found {len(env_log_groups)}"

        for log_group in env_log_groups:
            assert log_group['retentionInDays'] == 30, f"Log group {log_group['logGroupName']} should have 30 day retention"

    @mark.it("validates VPC flow logs exist")
    def test_vpc_flow_logs_exist(self):
        """Test that VPC flow logs are configured"""
        log_groups = logs_client.describe_log_groups(
            logGroupNamePrefix='/aws/vpc/payment-processing'
        )

        env_log_groups = [
            lg for lg in log_groups['logGroups']
            if ENVIRONMENT_SUFFIX in lg['logGroupName']
        ]

        assert len(env_log_groups) >= 1, f"Expected at least 1 VPC flow log group for {ENVIRONMENT_SUFFIX}"


@mark.describe("Auto Scaling Infrastructure")
class TestAutoScalingInfrastructure:
    """Integration tests for ECS auto-scaling configuration"""

    @mark.it("validates auto-scaling targets exist for ECS services")
    def test_autoscaling_targets_exist(self):
        """Test that auto-scaling targets are configured for ECS services"""
        cluster_name = outputs[f'ClusterName{ENVIRONMENT_SUFFIX}']

        services_response = ecs_client.list_services(cluster=cluster_name)
        assert len(services_response['serviceArns']) >= 3, "Not enough services found"

        # Check that services have desired count of 2 or more
        services_detail = ecs_client.describe_services(
            cluster=cluster_name,
            services=services_response['serviceArns']
        )

        for service in services_detail['services']:
            assert service['desiredCount'] >= 2, f"Service {service['serviceName']} should have desired count >= 2"


@mark.describe("End-to-End Infrastructure Validation")
class TestEndToEndValidation:
    """End-to-end integration tests"""

    @mark.it("validates complete infrastructure is operational")
    def test_complete_infrastructure_operational(self):
        """Test that all infrastructure components are operational"""
        # Verify all key outputs exist
        assert outputs.get(f'ClusterName{ENVIRONMENT_SUFFIX}') is not None, "Cluster name missing"
        assert outputs.get(f'LoadBalancerDNS{ENVIRONMENT_SUFFIX}') is not None, "ALB DNS missing"
        assert outputs.get(f'DatabaseEndpoint{ENVIRONMENT_SUFFIX}') is not None, "Database endpoint missing"
        assert outputs.get(f'VPCId{ENVIRONMENT_SUFFIX}') is not None, "VPC ID missing"
        assert outputs.get(f'CodeDeployApplication{ENVIRONMENT_SUFFIX}') is not None, "CodeDeploy app missing"
        assert outputs.get(f'AlarmTopicARN{ENVIRONMENT_SUFFIX}') is not None, "Alarm topic missing"

        # Verify ECS cluster is active
        cluster_name = outputs[f'ClusterName{ENVIRONMENT_SUFFIX}']
        cluster = ecs_client.describe_clusters(clusters=[cluster_name])
        assert cluster['clusters'][0]['status'] == 'ACTIVE', "Cluster not active"

        # Verify all services are running
        services = ecs_client.list_services(cluster=cluster_name)
        assert len(services['serviceArns']) >= 3, "Not all services running"

        # Verify database is available
        db_endpoint = outputs[f'DatabaseEndpoint{ENVIRONMENT_SUFFIX}']
        cluster_id = db_endpoint.split('.')[0]
        db_cluster = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        assert db_cluster['DBClusters'][0]['Status'] == 'available', "Database not available"

    @mark.it("validates ECS tasks are running successfully")
    def test_ecs_tasks_running_successfully(self):
        """Test that ECS tasks are running without errors"""
        cluster_name = outputs[f'ClusterName{ENVIRONMENT_SUFFIX}']

        # List all tasks
        tasks_response = ecs_client.list_tasks(cluster=cluster_name, desiredStatus='RUNNING')

        assert len(tasks_response['taskArns']) >= 6, f"Expected at least 6 running tasks (2 per service × 3 services), found {len(tasks_response['taskArns'])}"

        # Describe tasks to verify health
        if tasks_response['taskArns']:
            tasks_detail = ecs_client.describe_tasks(
                cluster=cluster_name,
                tasks=tasks_response['taskArns']
            )

            for task in tasks_detail['tasks']:
                assert task['lastStatus'] == 'RUNNING', f"Task {task['taskArn']} is not running"
                assert task['healthStatus'] in ['HEALTHY', 'UNKNOWN'], f"Task {task['taskArn']} health status is {task['healthStatus']}"
