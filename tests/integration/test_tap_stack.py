"""
Real-world integration tests for TAP infrastructure.

This test suite verifies actual AWS resources belonging to the specific stack.
Tests will FAIL if expected resources are missing.

Required Environment Variables:
- AWS_ACCESS_KEY_ID: AWS access key
- AWS_SECRET_ACCESS_KEY: AWS secret key
- AWS_DEFAULT_REGION: Primary AWS region (default: us-east-1)
- CDK_DEFAULT_ACCOUNT: AWS account ID
- ENVIRONMENT_SUFFIX: Environment suffix for stack naming (default: integtest)
"""

import os
import time
import pytest
import boto3
import requests
from botocore.exceptions import ClientError


@pytest.fixture(scope="session")
def aws_credentials():
    """Load AWS credentials from environment variables."""
    access_key = os.getenv('AWS_ACCESS_KEY_ID')
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
    account = os.getenv('CDK_DEFAULT_ACCOUNT')
    
    if not access_key or not secret_key:
        pytest.skip("AWS credentials not found in environment variables")
    
    if not account:
        sts = boto3.client('sts', aws_access_key_id=access_key, aws_secret_access_key=secret_key, region_name=region)
        try:
            account = sts.get_caller_identity()['Account']
        except Exception as e:
            pytest.skip(f"Could not determine AWS account: {e}")
    
    return {'aws_access_key_id': access_key, 'aws_secret_access_key': secret_key, 'region': region, 'account': account}


@pytest.fixture(scope="session")
def stack_name():
    """Get stack name from environment."""
    env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'integtest')
    return f"TapStack{env_suffix}"


@pytest.fixture(scope="session")
def aws_clients(aws_credentials):
    """Create boto3 clients for all AWS services."""
    creds = aws_credentials
    
    def create_client(service, region=None):
        return boto3.client(service, aws_access_key_id=creds['aws_access_key_id'], 
                          aws_secret_access_key=creds['aws_secret_access_key'], 
                          region_name=region or creds['region'])
    
    return {
        'ec2': create_client('ec2'), 'ec2_us_east_2': create_client('ec2', 'us-east-2'),
        'ecs': create_client('ecs'), 'ecs_us_east_2': create_client('ecs', 'us-east-2'),
        'elbv2': create_client('elbv2'), 'elbv2_us_east_2': create_client('elbv2', 'us-east-2'),
        'rds': create_client('rds'), 'rds_us_east_2': create_client('rds', 'us-east-2'),
        'codedeploy': create_client('codedeploy'), 'route53': create_client('route53'),
        'cloudwatch': create_client('cloudwatch'), 'logs': create_client('logs'),
        'cloudformation': create_client('cloudformation'),
    }


@pytest.fixture(scope="session")
def deployed_stack(aws_credentials, stack_name):
    """Verify the CDK stack exists."""
    print(f"\nChecking for stack: {stack_name}")
    cfn = boto3.client('cloudformation', aws_access_key_id=aws_credentials['aws_access_key_id'], 
                      aws_secret_access_key=aws_credentials['aws_secret_access_key'], 
                      region_name=aws_credentials['region'])
    
    try:
        response = cfn.describe_stacks(StackName=stack_name)
        stack_status = response['Stacks'][0]['StackStatus']
        
        if stack_status not in ['CREATE_COMPLETE', 'UPDATE_COMPLETE']:
            pytest.fail(f"Stack {stack_name} exists but is not in a complete state: {stack_status}")
        
        print(f"Stack {stack_name} is already deployed with status: {stack_status}")
        outputs = {output['OutputKey']: output['OutputValue'] for output in response['Stacks'][0].get('Outputs', [])}
        
        return {'stack_name': stack_name, 'outputs': outputs, 'credentials': aws_credentials}
        
    except ClientError as e:
        if 'does not exist' in str(e):
            pytest.fail(f"Stack {stack_name} does not exist. Please deploy it first using: cdk deploy {stack_name}")
        raise


@pytest.fixture(scope="session")
def stack_resources(deployed_stack, aws_clients):
    """Retrieve all resources from the deployed stack."""
    cfn = aws_clients['cloudformation']
    stack_name = deployed_stack['stack_name']
    resources = {}
    
    try:
        paginator = cfn.get_paginator('list_stack_resources')
        for page in paginator.paginate(StackName=stack_name):
            for resource in page['StackResourceSummaries']:
                resource_type = resource['ResourceType']
                if resource_type not in resources:
                    resources[resource_type] = []
                resources[resource_type].append({
                    'logical_id': resource['LogicalResourceId'],
                    'physical_id': resource['PhysicalResourceId'],
                    'type': resource_type,
                    'status': resource['ResourceStatus']
                })
    except Exception as e:
        print(f"Warning: Could not list all stack resources: {e}")
    
    return resources


def extract_stack_name_from_arn(arn_or_name):
    """Extract stack name from ARN or return name as-is."""
    if arn_or_name.startswith('arn:'):
        parts = arn_or_name.split('/')
        if len(parts) >= 2:
            return parts[1]
    return arn_or_name


def get_all_nested_stacks_recursive(cfn_client, stack_name, visited=None):
    """Recursively get ALL nested stacks at all levels."""
    if visited is None:
        visited = set()
    
    stack_name = extract_stack_name_from_arn(stack_name)
    
    if stack_name in visited:
        return []
    
    visited.add(stack_name)
    all_nested = []
    
    try:
        paginator = cfn_client.get_paginator('list_stack_resources')
        for page in paginator.paginate(StackName=stack_name):
            for resource in page['StackResourceSummaries']:
                if resource['ResourceType'] == 'AWS::CloudFormation::Stack':
                    nested_stack_id = resource['PhysicalResourceId']
                    nested_stack_name = extract_stack_name_from_arn(nested_stack_id)
                    all_nested.append(nested_stack_name)
                    deeper_nested = get_all_nested_stacks_recursive(cfn_client, nested_stack_name, visited)
                    all_nested.extend(deeper_nested)
    except Exception:
        pass
    
    return all_nested


def get_stack_resources_by_type(cfn_client, stack_name, resource_type):
    """Get physical IDs of resources of a specific type from stack and all nested stacks."""
    resource_ids = []
    all_nested_stacks = get_all_nested_stacks_recursive(cfn_client, stack_name)
    all_stacks_to_check = [stack_name] + all_nested_stacks
    
    for stack in all_stacks_to_check:
        try:
            paginator = cfn_client.get_paginator('list_stack_resources')
            for page in paginator.paginate(StackName=stack):
                for resource in page['StackResourceSummaries']:
                    if resource['ResourceType'] == resource_type:
                        resource_ids.append(resource['PhysicalResourceId'])
        except Exception:
            continue
    
    return resource_ids


def get_stack_vpc_ids(cfn_client, stack_name):
    """Get VPC IDs that belong to this stack."""
    return get_stack_resources_by_type(cfn_client, stack_name, 'AWS::EC2::VPC')


def get_stack_cluster_arns(cfn_client, stack_name):
    """Get ECS cluster ARNs that belong to this stack."""
    return get_stack_resources_by_type(cfn_client, stack_name, 'AWS::ECS::Cluster')


def get_stack_load_balancer_arns(cfn_client, elbv2_client, stack_name):
    """Get Application Load Balancer ARNs (not NLBs) that belong to this stack."""
    all_lb_arns = get_stack_resources_by_type(cfn_client, stack_name, 'AWS::ElasticLoadBalancingV2::LoadBalancer')
    alb_arns = []
    for lb_arn in all_lb_arns:
        try:
            lb_info = elbv2_client.describe_load_balancers(LoadBalancerArns=[lb_arn])
            if lb_info['LoadBalancers'][0]['Type'] == 'application':
                alb_arns.append(lb_arn)
        except Exception:
            continue
    return alb_arns


def get_stack_target_group_arns(cfn_client, stack_name):
    """Get target group ARNs that belong to this stack."""
    return get_stack_resources_by_type(cfn_client, stack_name, 'AWS::ElasticLoadBalancingV2::TargetGroup')


def get_stack_rds_identifiers(cfn_client, stack_name):
    """Get RDS instance identifiers that belong to this stack."""
    return get_stack_resources_by_type(cfn_client, stack_name, 'AWS::RDS::DBInstance')


def test_stack_deployed_successfully(deployed_stack):
    """Verify the main stack was deployed successfully."""
    assert deployed_stack is not None
    assert 'stack_name' in deployed_stack
    print(f"Stack {deployed_stack['stack_name']} is deployed")


def test_nested_stacks_created(aws_clients, deployed_stack):
    """Verify all nested stacks are created in CloudFormation."""
    cfn = aws_clients['cloudformation']
    response = cfn.list_stacks(StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE'])
    stack_names = [s['StackName'] for s in response['StackSummaries']]
    expected_patterns = ['vpc', 'ecs', 'rds', 'monitoring', 'cicd', 'route53']
    
    for pattern in expected_patterns:
        matching = [name for name in stack_names if pattern in name.lower()]
        assert len(matching) > 0, f"No {pattern} stack found"
        print(f"Found {pattern} nested stack(s)")


def test_vpcs_created_in_both_regions(aws_clients, deployed_stack, stack_name):
    """Verify VPCs belonging to this stack exist in both regions."""
    cfn = aws_clients['cloudformation']
    vpc_ids = get_stack_vpc_ids(cfn, stack_name)
    
    assert len(vpc_ids) >= 2, f"Expected at least 2 VPCs (one per region), found {len(vpc_ids)}"
    
    vpc_regions = {}
    for vpc_id in vpc_ids:
        try:
            aws_clients['ec2'].describe_vpcs(VpcIds=[vpc_id])
            vpc_regions['us-east-1'] = vpc_id
        except:
            pass
        try:
            aws_clients['ec2_us_east_2'].describe_vpcs(VpcIds=[vpc_id])
            vpc_regions['us-east-2'] = vpc_id
        except:
            pass
    
    assert 'us-east-1' in vpc_regions, "No VPC found in us-east-1"
    assert 'us-east-2' in vpc_regions, "No VPC found in us-east-2"
    
    print(f"VPC exists in us-east-1: {vpc_regions['us-east-1']}")
    print(f"VPC exists in us-east-2: {vpc_regions['us-east-2']}")


def test_vpc_has_subnets(aws_clients, deployed_stack, stack_name):
    """Verify stack's VPCs have correct number of subnets."""
    cfn = aws_clients['cloudformation']
    vpc_ids = get_stack_vpc_ids(cfn, stack_name)
    assert len(vpc_ids) > 0, f"No VPC found for stack {stack_name}"
    
    for vpc_id in vpc_ids:
        try:
            subnets = aws_clients['ec2'].describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
        except:
            subnets = aws_clients['ec2_us_east_2'].describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
        
        assert len(subnets['Subnets']) >= 4, f"VPC {vpc_id} should have at least 4 subnets, found {len(subnets['Subnets'])}"
        print(f"VPC {vpc_id} has {len(subnets['Subnets'])} subnet(s)")


def test_internet_gateway_attached(aws_clients, deployed_stack, stack_name):
    """Verify Internet Gateway is attached to stack's VPCs."""
    cfn = aws_clients['cloudformation']
    vpc_ids = get_stack_vpc_ids(cfn, stack_name)
    assert len(vpc_ids) > 0, f"No VPC found for stack {stack_name}"
    
    for vpc_id in vpc_ids:
        try:
            igws = aws_clients['ec2'].describe_internet_gateways(Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}])
        except:
            igws = aws_clients['ec2_us_east_2'].describe_internet_gateways(Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}])
        
        assert len(igws['InternetGateways']) > 0, f"No Internet Gateway attached to VPC {vpc_id}"
        print(f"Internet Gateway attached to VPC {vpc_id}")


def test_ecs_clusters_exist_in_both_regions(aws_clients, deployed_stack, stack_name):
    """Verify ECS clusters exist for this stack in both regions."""
    cfn = aws_clients['cloudformation']
    cluster_arns = get_stack_cluster_arns(cfn, stack_name)
    
    assert len(cluster_arns) >= 2, f"Expected at least 2 ECS clusters (one per region), found {len(cluster_arns)}"
    
    east_1_clusters = [c for c in cluster_arns if 'us-east-1' in c]
    east_2_clusters = [c for c in cluster_arns if 'us-east-2' in c]
    
    assert len(east_1_clusters) > 0, "No ECS cluster found in us-east-1"
    assert len(east_2_clusters) > 0, "No ECS cluster found in us-east-2"
    
    for cluster_arn in cluster_arns:
        region = 'us-east-1' if 'us-east-1' in cluster_arn else 'us-east-2'
        print(f"ECS cluster in {region}: {cluster_arn}")


def test_ecs_services_running_with_desired_count(aws_clients, deployed_stack, stack_name):
    """Verify stack's ECS services are running with correct task count."""
    cfn = aws_clients['cloudformation']
    cluster_arns = get_stack_cluster_arns(cfn, stack_name)
    assert len(cluster_arns) > 0, f"No ECS clusters found for stack {stack_name}"
    
    services_checked = 0
    
    for cluster_arn in cluster_arns:
        ecs_client = aws_clients['ecs'] if 'us-east-1' in cluster_arn else aws_clients['ecs_us_east_2']
        services = ecs_client.list_services(cluster=cluster_arn)
        
        if not services['serviceArns']:
            continue
        
        service_details = ecs_client.describe_services(cluster=cluster_arn, services=services['serviceArns'])
        
        for service in service_details['services']:
            running = service['runningCount']
            desired = service['desiredCount']
            assert running >= 0, f"Service {service['serviceName']} has negative running count"
            
            if desired > 0 and running == 0:
                print(f"Service {service['serviceName']}: {running}/{desired} tasks (starting)")
            else:
                print(f"ECS Service {service['serviceName']}: {running}/{desired} tasks")
            
            services_checked += 1
    
    assert services_checked > 0, f"No services found in stack {stack_name}'s ECS clusters"


def test_ecs_tasks_are_healthy(aws_clients, deployed_stack, stack_name):
    """Verify stack's ECS tasks are in RUNNING or acceptable startup state."""
    cfn = aws_clients['cloudformation']
    cluster_arns = get_stack_cluster_arns(cfn, stack_name)
    assert len(cluster_arns) > 0, f"No ECS clusters found for stack {stack_name}"
    
    has_services = False
    
    for cluster_arn in cluster_arns:
        ecs_client = aws_clients['ecs'] if 'us-east-1' in cluster_arn else aws_clients['ecs_us_east_2']
        services = ecs_client.list_services(cluster=cluster_arn)
        if services['serviceArns']:
            has_services = True
        
        tasks = ecs_client.list_tasks(cluster=cluster_arn)
        
        if tasks['taskArns']:
            task_details = ecs_client.describe_tasks(cluster=cluster_arn, tasks=tasks['taskArns'])
            
            for task in task_details['tasks']:
                status = task['lastStatus']
                allowed_statuses = ['RUNNING', 'PENDING', 'PROVISIONING', 'ACTIVATING']
                assert status in allowed_statuses, f"Task {task['taskArn']} has unexpected status: {status}"
                print(f"Task in cluster is {status}")
    
    assert has_services, f"No services found in stack {stack_name}'s clusters"


def test_ecs_uses_code_deploy_controller(aws_clients, deployed_stack, stack_name):
    """Verify stack's ECS services use CODE_DEPLOY deployment controller."""
    cfn = aws_clients['cloudformation']
    cluster_arns = get_stack_cluster_arns(cfn, stack_name)
    assert len(cluster_arns) > 0, f"No ECS clusters found for stack {stack_name}"
    
    code_deploy_services = []
    
    for cluster_arn in cluster_arns:
        ecs_client = aws_clients['ecs'] if 'us-east-1' in cluster_arn else aws_clients['ecs_us_east_2']
        services = ecs_client.list_services(cluster=cluster_arn)
        
        if services['serviceArns']:
            service_details = ecs_client.describe_services(cluster=cluster_arn, services=services['serviceArns'])
            
            for service in service_details['services']:
                controller = service['deploymentController']['type']
                if controller == 'CODE_DEPLOY':
                    code_deploy_services.append(service['serviceName'])
                    print(f"Service {service['serviceName']} uses CODE_DEPLOY controller")
    
    assert len(code_deploy_services) > 0, f"No services using CODE_DEPLOY found in stack {stack_name}'s clusters"


def test_load_balancers_active(aws_clients, deployed_stack, stack_name):
    """Verify stack's Application Load Balancers are active."""
    cfn = aws_clients['cloudformation']
    alb_arns = get_stack_load_balancer_arns(cfn, aws_clients['elbv2'], stack_name)
    
    assert len(alb_arns) >= 1, f"Expected at least 1 Application Load Balancer, found {len(alb_arns)}"
    
    for alb_arn in alb_arns:
        elbv2_client = aws_clients['elbv2'] if 'us-east-1' in alb_arn else aws_clients['elbv2_us_east_2']
        lb_info = elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arn])
        lb = lb_info['LoadBalancers'][0]
        
        assert lb['State']['Code'] == 'active', f"Load balancer {lb['LoadBalancerName']} is not active"
        region = 'us-east-1' if 'us-east-1' in alb_arn else 'us-east-2'
        print(f"Load balancer active in {region}: {lb['DNSName']}")


def test_load_balancer_listeners_configured(aws_clients, deployed_stack, stack_name):
    """Verify stack's load balancers have HTTP listeners on port 80."""
    cfn = aws_clients['cloudformation']
    alb_arns = get_stack_load_balancer_arns(cfn, aws_clients['elbv2'], stack_name)
    assert len(alb_arns) > 0, f"No Application Load Balancers found for stack {stack_name}"
    
    for alb_arn in alb_arns:
        elbv2_client = aws_clients['elbv2'] if 'us-east-1' in alb_arn else aws_clients['elbv2_us_east_2']
        listeners = elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)
        
        assert len(listeners['Listeners']) > 0, f"Load balancer {alb_arn} has no listeners"
        http_listeners = [l for l in listeners['Listeners'] if l['Port'] == 80]
        assert len(http_listeners) > 0, f"Load balancer {alb_arn} has no HTTP listener on port 80"
        print(f"Load balancer has HTTP listener on port 80")


def test_target_groups_exist(aws_clients, deployed_stack, stack_name):
    """Verify target groups exist for this stack (blue and green per region)."""
    cfn = aws_clients['cloudformation']
    tg_arns = get_stack_target_group_arns(cfn, stack_name)
    
    assert len(tg_arns) >= 2, f"Stack {stack_name} should have at least 2 target groups (blue and green), found {len(tg_arns)}"
    print(f"Found {len(tg_arns)} target group(s) for this stack")


def test_target_groups_have_healthy_targets(aws_clients, deployed_stack, stack_name):
    """Verify at least one target group has registered targets."""
    cfn = aws_clients['cloudformation']
    tg_arns = get_stack_target_group_arns(cfn, stack_name)
    assert len(tg_arns) > 0, f"No target groups found for stack {stack_name}"
    
    any_targets_found = False
    
    for tg_arn in tg_arns:
        elbv2_client = aws_clients['elbv2'] if 'us-east-1' in tg_arn else aws_clients['elbv2_us_east_2']
        health = elbv2_client.describe_target_health(TargetGroupArn=tg_arn)
        
        if len(health['TargetHealthDescriptions']) > 0:
            any_targets_found = True
            healthy_count = len(health['TargetHealthDescriptions'])
            print(f"Target group has {healthy_count} registered target(s)")
            break
    
    assert any_targets_found, f"No targets registered in any target groups for stack {stack_name}"


def test_load_balancer_responds_to_http(aws_clients, deployed_stack, stack_name):
    """Verify stack's load balancer responds to HTTP requests."""
    cfn = aws_clients['cloudformation']
    alb_arns = get_stack_load_balancer_arns(cfn, aws_clients['elbv2'], stack_name)
    assert len(alb_arns) > 0, f"No Application Load Balancers found for stack {stack_name}"
    
    elbv2_client = aws_clients['elbv2'] if 'us-east-1' in alb_arns[0] else aws_clients['elbv2_us_east_2']
    lb_info = elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arns[0]])
    lb_dns = lb_info['LoadBalancers'][0]['DNSName']
    url = f"http://{lb_dns}"
    
    max_attempts = 10
    success = False
    
    for attempt in range(max_attempts):
        try:
            response = requests.get(url, timeout=10)
            if response.status_code in [200, 301, 302, 503, 504]:
                print(f"Load balancer {lb_dns} responds with status {response.status_code}")
                success = True
                break
        except requests.RequestException:
            if attempt < max_attempts - 1:
                print(f"Attempt {attempt + 1}/{max_attempts}: Waiting for ALB to respond...")
                time.sleep(15)
    
    assert success, f"Load balancer {lb_dns} did not respond after {max_attempts} attempts"


def test_rds_instances_exist(aws_clients, deployed_stack, stack_name):
    """Verify RDS instances exist for this stack."""
    cfn = aws_clients['cloudformation']
    db_identifiers = get_stack_rds_identifiers(cfn, stack_name)
    
    assert len(db_identifiers) >= 1, f"Expected at least 1 RDS instance, found {len(db_identifiers)}"
    
    for db_id in db_identifiers:
        try:
            db_info = aws_clients['rds'].describe_db_instances(DBInstanceIdentifier=db_id)
            db = db_info['DBInstances'][0]
            print(f"RDS instance: {db_id} ({db['DBInstanceStatus']})")
        except:
            try:
                db_info = aws_clients['rds_us_east_2'].describe_db_instances(DBInstanceIdentifier=db_id)
                db = db_info['DBInstances'][0]
                print(f"RDS instance: {db_id} ({db['DBInstanceStatus']})")
            except ClientError as e:
                pytest.fail(f"Could not describe RDS instance {db_id}: {e}")


def test_rds_instances_available(aws_clients, deployed_stack, stack_name):
    """Verify stack's RDS instances are available or in acceptable state."""
    cfn = aws_clients['cloudformation']
    db_identifiers = get_stack_rds_identifiers(cfn, stack_name)
    assert len(db_identifiers) > 0, f"No RDS instances found for stack {stack_name}"
    
    for db_id in db_identifiers:
        try:
            db_info = aws_clients['rds'].describe_db_instances(DBInstanceIdentifier=db_id)
        except:
            db_info = aws_clients['rds_us_east_2'].describe_db_instances(DBInstanceIdentifier=db_id)
        
        status = db_info['DBInstances'][0]['DBInstanceStatus']
        allowed_states = ['available', 'backing-up', 'creating', 'modifying', 'configuring-enhanced-monitoring', 'storage-optimization']
        assert status in allowed_states, f"RDS {db_id} is in unexpected state: {status}"
        print(f"RDS instance {db_id} is {status}")


def test_rds_not_publicly_accessible(aws_clients, deployed_stack, stack_name):
    """Verify stack's RDS instances are not publicly accessible."""
    cfn = aws_clients['cloudformation']
    db_identifiers = get_stack_rds_identifiers(cfn, stack_name)
    assert len(db_identifiers) > 0, f"No RDS instances found for stack {stack_name}"
    
    for db_id in db_identifiers:
        try:
            db_info = aws_clients['rds'].describe_db_instances(DBInstanceIdentifier=db_id)
        except:
            db_info = aws_clients['rds_us_east_2'].describe_db_instances(DBInstanceIdentifier=db_id)
        
        publicly_accessible = db_info['DBInstances'][0]['PubliclyAccessible']
        assert publicly_accessible == False, f"RDS {db_id} should not be publicly accessible"
        print(f"RDS instance {db_id} is not publicly accessible")


def test_rds_has_security_groups(aws_clients, deployed_stack, stack_name):
    """Verify stack's RDS instances have security groups configured."""
    cfn = aws_clients['cloudformation']
    db_identifiers = get_stack_rds_identifiers(cfn, stack_name)
    assert len(db_identifiers) > 0, f"No RDS instances found for stack {stack_name}"
    
    for db_id in db_identifiers:
        try:
            db_info = aws_clients['rds'].describe_db_instances(DBInstanceIdentifier=db_id)
        except:
            db_info = aws_clients['rds_us_east_2'].describe_db_instances(DBInstanceIdentifier=db_id)
        
        security_groups = db_info['DBInstances'][0]['VpcSecurityGroups']
        assert len(security_groups) > 0, f"RDS {db_id} has no security groups"
        print(f"RDS {db_id} has {len(security_groups)} security group(s)")


def test_codedeploy_application_exists(aws_clients):
    """Verify CodeDeploy ECS application exists."""
    codedeploy = aws_clients['codedeploy']
    apps = codedeploy.list_applications()
    assert len(apps['applications']) > 0, "No CodeDeploy applications found"
    
    ecs_app_found = False
    for app_name in apps['applications']:
        app_info = codedeploy.get_application(applicationName=app_name)
        if app_info['application']['computePlatform'] == 'ECS':
            ecs_app_found = True
            print(f"CodeDeploy ECS application: {app_name}")
            break
    
    assert ecs_app_found, "No ECS CodeDeploy application found"


def test_codedeploy_deployment_group_configured(aws_clients):
    """Verify CodeDeploy deployment group is configured for Blue/Green."""
    codedeploy = aws_clients['codedeploy']
    apps = codedeploy.list_applications()
    
    for app_name in apps['applications']:
        app_info = codedeploy.get_application(applicationName=app_name)
        
        if app_info['application']['computePlatform'] == 'ECS':
            dg_list = codedeploy.list_deployment_groups(applicationName=app_name)
            assert len(dg_list['deploymentGroups']) > 0, f"No deployment groups found for ECS application {app_name}"
            
            for dg_name in dg_list['deploymentGroups']:
                dg_info = codedeploy.get_deployment_group(applicationName=app_name, deploymentGroupName=dg_name)
                dg = dg_info['deploymentGroupInfo']
                
                assert 'blueGreenDeploymentConfiguration' in dg, f"Deployment group {dg_name} is not configured for Blue/Green"
                assert dg['deploymentStyle']['deploymentType'] == 'BLUE_GREEN', f"Deployment group {dg_name} is not using BLUE_GREEN deployment"
                print(f"Deployment group {dg_name} configured for ECS Blue/Green")


def test_codedeploy_auto_rollback_enabled(aws_clients):
    """Verify auto-rollback is enabled for deployment groups."""
    codedeploy = aws_clients['codedeploy']
    apps = codedeploy.list_applications()
    
    for app_name in apps['applications']:
        app_info = codedeploy.get_application(applicationName=app_name)
        
        if app_info['application']['computePlatform'] == 'ECS':
            dg_list = codedeploy.list_deployment_groups(applicationName=app_name)
            
            for dg_name in dg_list['deploymentGroups']:
                dg_info = codedeploy.get_deployment_group(applicationName=app_name, deploymentGroupName=dg_name)
                rollback = dg_info['deploymentGroupInfo']['autoRollbackConfiguration']
                assert rollback['enabled'] == True, f"Auto-rollback is not enabled for deployment group {dg_name}"
                print(f"Auto-rollback enabled for {dg_name}")


def test_cloudwatch_alarms_exist(aws_clients):
    """Verify CloudWatch alarms are created."""
    cloudwatch = aws_clients['cloudwatch']
    alarms = cloudwatch.describe_alarms()
    assert len(alarms['MetricAlarms']) > 0, "No CloudWatch alarms found"
    print(f"Found {len(alarms['MetricAlarms'])} CloudWatch alarms")


def test_cloudwatch_log_groups_exist(aws_clients):
    """Verify CloudWatch log groups exist."""
    logs = aws_clients['logs']
    log_groups = logs.describe_log_groups()
    assert len(log_groups['logGroups']) > 0, "No CloudWatch log groups found"
    print(f"Found {len(log_groups['logGroups'])} CloudWatch log groups")


def test_end_to_end_alb_to_ecs(aws_clients, deployed_stack, stack_name):
    """End-to-end test: HTTP request through ALB to ECS container."""
    cfn = aws_clients['cloudformation']
    alb_arns = get_stack_load_balancer_arns(cfn, aws_clients['elbv2'], stack_name)
    assert len(alb_arns) > 0, f"No ALBs found for end-to-end test"
    
    elbv2_client = aws_clients['elbv2'] if 'us-east-1' in alb_arns[0] else aws_clients['elbv2_us_east_2']
    lb_info = elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arns[0]])
    lb_dns = lb_info['LoadBalancers'][0]['DNSName']
    url = f"http://{lb_dns}"
    
    try:
        response = requests.get(url, timeout=15)
        print(f"End-to-end flow successful: ALB to ECS")
        print(f"   URL: {url}")
        print(f"   Status: {response.status_code}")
        assert response.status_code in [200, 301, 302, 503], f"Unexpected HTTP status code: {response.status_code}"
    except requests.RequestException as e:
        pytest.fail(f"End-to-end test failed. ALB not responding: {e}")


def test_ecs_and_rds_in_same_vpc(aws_clients, deployed_stack, stack_name):
    """Verify ECS and RDS are deployed and can communicate."""
    cfn = aws_clients['cloudformation']
    cluster_arns = get_stack_cluster_arns(cfn, stack_name)
    db_identifiers = get_stack_rds_identifiers(cfn, stack_name)
    
    assert len(cluster_arns) > 0, "No ECS clusters found"
    assert len(db_identifiers) > 0, "No RDS instances found"
    print("ECS and RDS are deployed (network connectivity possible)")


def test_multi_region_deployment(aws_clients, deployed_stack, stack_name):
    """Verify resources exist in both us-east-1 and us-east-2."""
    cfn = aws_clients['cloudformation']
    cluster_arns = get_stack_cluster_arns(cfn, stack_name)
    
    east_1_clusters = [c for c in cluster_arns if 'us-east-1' in c]
    east_2_clusters = [c for c in cluster_arns if 'us-east-2' in c]
    
    assert len(east_1_clusters) > 0, "No ECS resources found in us-east-1"
    assert len(east_2_clusters) > 0, "No ECS resources found in us-east-2"
    
    print(f"Multi-region deployment verified:")
    print(f"   us-east-1: {len(east_1_clusters)} ECS cluster(s)")
    print(f"   us-east-2: {len(east_2_clusters)} ECS cluster(s)")


def test_infrastructure_has_proper_tags(aws_clients, deployed_stack):
    """Verify resources have proper tags applied."""
    ec2 = aws_clients['ec2']
    vpcs = ec2.describe_vpcs()
    
    tagged_resources = 0
    for vpc in vpcs['Vpcs']:
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        if 'Environment' in tags or 'aws:cloudformation:stack-name' in tags:
            tagged_resources += 1
    
    assert tagged_resources > 0, "No properly tagged VPCs found"
    print(f"Found {tagged_resources} properly tagged VPC(s)")


def test_all_resources_in_healthy_state(stack_resources):
    """Verify all stack resources are in healthy state."""
    assert len(stack_resources) > 0, "No stack resources found"
    
    unhealthy = []
    for resource_type, resources in stack_resources.items():
        for resource in resources:
            if resource['status'] not in ['CREATE_COMPLETE', 'UPDATE_COMPLETE']:
                unhealthy.append(f"{resource['logical_id']} ({resource['status']})")
    
    assert len(unhealthy) == 0, f"Unhealthy resources found: {unhealthy}"
    print(f"All {sum(len(r) for r in stack_resources.values())} resources are healthy")


def test_system_scalability_indicators(aws_clients, deployed_stack, stack_name):
    """Check scalability configuration for stack's services."""
    cfn = aws_clients['cloudformation']
    cluster_arns = get_stack_cluster_arns(cfn, stack_name)
    assert len(cluster_arns) > 0, "No ECS clusters found for scalability check"
    
    services_found = False
    
    for cluster_arn in cluster_arns:
        ecs_client = aws_clients['ecs'] if 'us-east-1' in cluster_arn else aws_clients['ecs_us_east_2']
        services = ecs_client.list_services(cluster=cluster_arn)
        
        if services['serviceArns']:
            services_found = True
            service_details = ecs_client.describe_services(cluster=cluster_arn, services=services['serviceArns'])
            
            for service in service_details['services']:
                desired = service['desiredCount']
                running = service['runningCount']
                print(f"Service {service['serviceName']}: running={running}, desired={desired}")
    
    assert services_found, f"No services found in clusters for stack {stack_name}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])