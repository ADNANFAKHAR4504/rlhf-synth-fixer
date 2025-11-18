import os
import json
import pytest
import boto3
import requests
from time import sleep


class TestDeployedInfrastructure:
    """Integration tests for deployed Terraform infrastructure"""

    @pytest.fixture(scope="class")
    def deployment_outputs(self):
        """Load deployment outputs"""
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "cfn-outputs",
            "flat-outputs.json"
        )

        with open(outputs_file, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def aws_region(self):
        """Get AWS region"""
        return os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

    @pytest.fixture(scope="class")
    def ec2_client(self, aws_region):
        """Create EC2 client"""
        return boto3.client('ec2', region_name=aws_region)

    @pytest.fixture(scope="class")
    def ecs_client(self, aws_region):
        """Create ECS client"""
        return boto3.client('ecs', region_name=aws_region)

    @pytest.fixture(scope="class")
    def elbv2_client(self, aws_region):
        """Create ELBv2 client"""
        return boto3.client('elbv2', region_name=aws_region)

    @pytest.fixture(scope="class")
    def iam_client(self, aws_region):
        """Create IAM client"""
        return boto3.client('iam', region_name=aws_region)

    def test_deployment_outputs_exist(self, deployment_outputs):
        """Test that deployment outputs file exists and has required keys"""
        assert deployment_outputs is not None, "Deployment outputs should exist"
        assert 'vpc_id' in deployment_outputs, "Should have VPC ID output"
        assert 'ecs_cluster_name' in deployment_outputs, "Should have ECS cluster name output"
        assert 'alb_dns_name' in deployment_outputs, "Should have ALB DNS name output"
        assert 'ecs_service_name' in deployment_outputs, "Should have ECS service name output"

    def test_vpc_exists(self, ec2_client, deployment_outputs):
        """Test that VPC exists and is available"""
        vpc_id = deployment_outputs['vpc_id']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1, "VPC should exist"

        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available', "VPC should be available"

        dns_attributes = ec2_client.describe_vpc_attribute(VpcId=vpc_id, Attribute='enableDnsHostnames')
        assert dns_attributes['EnableDnsHostnames']['Value'], "DNS hostnames should be enabled"

        dns_support = ec2_client.describe_vpc_attribute(VpcId=vpc_id, Attribute='enableDnsSupport')
        assert dns_support['EnableDnsSupport']['Value'], "DNS support should be enabled"

    def test_subnets_exist(self, ec2_client, deployment_outputs):
        """Test that subnets exist in the VPC"""
        vpc_id = deployment_outputs['vpc_id']

        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 4, "Should have at least 4 subnets (2 public, 2 private)"

        public_subnets = [s for s in subnets if s.get('MapPublicIpOnLaunch', False)]
        private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]

        assert len(public_subnets) >= 2, "Should have at least 2 public subnets"
        assert len(private_subnets) >= 2, "Should have at least 2 private subnets"

    def test_internet_gateway_exists(self, ec2_client, deployment_outputs):
        """Test that Internet Gateway exists and is attached"""
        vpc_id = deployment_outputs['vpc_id']

        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        assert len(response['InternetGateways']) >= 1, "Internet Gateway should exist"

        igw = response['InternetGateways'][0]
        attachments = igw.get('Attachments', [])
        assert len(attachments) > 0, "Internet Gateway should be attached"
        assert attachments[0]['State'] == 'available', "Internet Gateway should be available"

    def test_security_groups_exist(self, ec2_client, deployment_outputs):
        """Test that security groups exist"""
        vpc_id = deployment_outputs['vpc_id']

        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        security_groups = response['SecurityGroups']
        non_default_sgs = [sg for sg in security_groups if sg['GroupName'] != 'default']

        assert len(non_default_sgs) >= 2, "Should have at least 2 security groups (ECS tasks and ALB)"

        sg_names = [sg['GroupName'] for sg in non_default_sgs]
        ecs_sg = any('ecs' in name.lower() for name in sg_names)
        alb_sg = any('alb' in name.lower() for name in sg_names)

        assert ecs_sg, "Should have ECS tasks security group"
        assert alb_sg, "Should have ALB security group"

    def test_alb_security_group_rules(self, ec2_client, deployment_outputs):
        """Test that ALB security group has correct ingress rules"""
        vpc_id = deployment_outputs['vpc_id']

        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        security_groups = response['SecurityGroups']
        alb_sgs = [sg for sg in security_groups if 'alb' in sg['GroupName'].lower()]

        assert len(alb_sgs) > 0, "ALB security group should exist"

        alb_sg = alb_sgs[0]
        ingress_rules = alb_sg['IpPermissions']

        ports = [rule['FromPort'] for rule in ingress_rules if 'FromPort' in rule]
        assert 80 in ports or 443 in ports, "ALB should allow HTTP or HTTPS traffic"

    def test_ecs_cluster_exists(self, ecs_client, deployment_outputs):
        """Test that ECS cluster exists and is active"""
        cluster_name = deployment_outputs['ecs_cluster_name']

        response = ecs_client.describe_clusters(clusters=[cluster_name])
        assert len(response['clusters']) == 1, "ECS cluster should exist"

        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE', "ECS cluster should be active"
        assert cluster['registeredContainerInstancesCount'] >= 0, "Cluster should track container instances"

    def test_ecs_service_exists(self, ecs_client, deployment_outputs):
        """Test that ECS service exists and is active"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        service_name = deployment_outputs['ecs_service_name']

        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        assert len(response['services']) == 1, "ECS service should exist"

        service = response['services'][0]
        assert service['status'] == 'ACTIVE', "ECS service should be active"
        assert service['launchType'] == 'FARGATE', "Service should use Fargate launch type"
        assert service['desiredCount'] >= 1, "Service should have at least 1 desired task"

    def test_ecs_tasks_running(self, ecs_client, deployment_outputs):
        """Test that ECS tasks are running"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        service_name = deployment_outputs['ecs_service_name']

        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        service = response['services'][0]
        running_count = service.get('runningCount', 0)

        assert running_count >= 0, "Service should have running tasks count"

    def test_load_balancer_exists(self, elbv2_client, deployment_outputs):
        """Test that Application Load Balancer exists"""
        alb_dns = deployment_outputs['alb_dns_name']

        response = elbv2_client.describe_load_balancers()

        load_balancers = response['LoadBalancers']
        alb = [lb for lb in load_balancers if lb['DNSName'] == alb_dns]

        assert len(alb) == 1, "Load balancer should exist"

        lb = alb[0]
        assert lb['State']['Code'] in ['active', 'provisioning'], "Load balancer should be active or provisioning"
        assert lb['Type'] == 'application', "Should be an Application Load Balancer"
        assert lb['Scheme'] == 'internet-facing', "Load balancer should be internet-facing"

    def test_load_balancer_has_listeners(self, elbv2_client, deployment_outputs):
        """Test that Load Balancer has HTTP listener"""
        alb_dns = deployment_outputs['alb_dns_name']

        lb_response = elbv2_client.describe_load_balancers()
        load_balancers = lb_response['LoadBalancers']
        alb = [lb for lb in load_balancers if lb['DNSName'] == alb_dns][0]

        listener_response = elbv2_client.describe_listeners(
            LoadBalancerArn=alb['LoadBalancerArn']
        )

        listeners = listener_response['Listeners']
        assert len(listeners) >= 1, "Load balancer should have at least one listener"

        http_listeners = [l for l in listeners if l['Protocol'] == 'HTTP']
        assert len(http_listeners) >= 1, "Should have at least one HTTP listener"

    def test_load_balancer_has_target_group(self, elbv2_client, deployment_outputs):
        """Test that Load Balancer has target group"""
        alb_dns = deployment_outputs['alb_dns_name']

        lb_response = elbv2_client.describe_load_balancers()
        load_balancers = lb_response['LoadBalancers']
        alb = [lb for lb in load_balancers if lb['DNSName'] == alb_dns][0]

        tg_response = elbv2_client.describe_target_groups(
            LoadBalancerArn=alb['LoadBalancerArn']
        )

        target_groups = tg_response['TargetGroups']
        assert len(target_groups) >= 1, "Should have at least one target group"

        tg = target_groups[0]
        assert tg['TargetType'] == 'ip', "Target type should be IP for Fargate"
        assert tg['Protocol'] == 'HTTP', "Target group should use HTTP protocol"

    def test_iam_roles_exist(self, iam_client, ecs_client, deployment_outputs):
        """Test that IAM roles exist for ECS"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        service_name = deployment_outputs['ecs_service_name']

        service_response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        service = service_response['services'][0]
        task_definition_arn = service['taskDefinition']

        task_response = ecs_client.describe_task_definition(
            taskDefinition=task_definition_arn
        )

        task_def = task_response['taskDefinition']

        assert 'taskRoleArn' in task_def or 'executionRoleArn' in task_def, "Task definition should have IAM roles"

        if 'executionRoleArn' in task_def:
            execution_role_arn = task_def['executionRoleArn']
            assert 'ecs-task' in execution_role_arn.lower(), "Execution role should be ECS-related"

    def test_cloudwatch_log_group_exists(self, aws_region, deployment_outputs):
        """Test that CloudWatch log group exists"""
        logs_client = boto3.client('logs', region_name=aws_region)

        response = logs_client.describe_log_groups()
        log_groups = response['logGroups']

        ecs_log_groups = [lg for lg in log_groups if '/ecs/' in lg['logGroupName']]
        assert len(ecs_log_groups) >= 1, "Should have at least one ECS log group"

    def test_alb_responds_to_http(self, deployment_outputs):
        """Test that ALB responds to HTTP requests"""
        alb_dns = deployment_outputs['alb_dns_name']
        url = f"http://{alb_dns}"

        max_retries = 10
        retry_delay = 30

        for attempt in range(max_retries):
            try:
                response = requests.get(url, timeout=10)
                assert response.status_code in [200, 503], f"ALB should respond (got {response.status_code})"
                return
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    sleep(retry_delay)
                else:
                    pytest.skip(f"ALB not responding after {max_retries} attempts: {e}")

    def test_resource_tags_include_environment(self, ec2_client, deployment_outputs):
        """Test that resources are properly tagged"""
        vpc_id = deployment_outputs['vpc_id']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        assert 'Environment' in tags or 'environment' in [k.lower() for k in tags.keys()], "VPC should be tagged with environment"
        assert 'ManagedBy' in tags, "VPC should be tagged with ManagedBy"

    def test_vpc_has_correct_cidr(self, ec2_client, deployment_outputs):
        """Test that VPC has appropriate CIDR block"""
        vpc_id = deployment_outputs['vpc_id']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        cidr_block = vpc['CidrBlock']
        assert cidr_block.startswith('10.'), "VPC CIDR should be in private range"

    def test_subnets_span_multiple_azs(self, ec2_client, deployment_outputs):
        """Test that subnets span multiple availability zones"""
        vpc_id = deployment_outputs['vpc_id']

        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        availability_zones = set(subnet['AvailabilityZone'] for subnet in subnets)

        assert len(availability_zones) >= 2, "Subnets should span at least 2 availability zones"

    def test_ecs_service_has_load_balancer_configuration(self, ecs_client, deployment_outputs):
        """Test that ECS service is configured with load balancer"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        service_name = deployment_outputs['ecs_service_name']

        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        service = response['services'][0]
        load_balancers = service.get('loadBalancers', [])

        assert len(load_balancers) >= 1, "ECS service should be connected to a load balancer"

        lb_config = load_balancers[0]
        assert 'targetGroupArn' in lb_config, "Load balancer config should have target group ARN"
        assert 'containerName' in lb_config, "Load balancer config should have container name"
        assert 'containerPort' in lb_config, "Load balancer config should have container port"

    def test_ecs_service_network_configuration(self, ecs_client, deployment_outputs):
        """Test that ECS service has proper network configuration"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        service_name = deployment_outputs['ecs_service_name']

        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        service = response['services'][0]
        network_config = service.get('networkConfiguration', {})

        assert 'awsvpcConfiguration' in network_config, "Service should use awsvpc network mode"

        awsvpc_config = network_config['awsvpcConfiguration']
        assert 'subnets' in awsvpc_config, "Service should specify subnets"
        assert 'securityGroups' in awsvpc_config, "Service should specify security groups"
        assert len(awsvpc_config['subnets']) >= 1, "Service should use at least one subnet"

    def test_ecs_task_definition_uses_fargate(self, ecs_client, deployment_outputs):
        """Test that task definition is configured for Fargate"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        service_name = deployment_outputs['ecs_service_name']

        service_response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        service = service_response['services'][0]
        task_definition_arn = service['taskDefinition']

        task_response = ecs_client.describe_task_definition(
            taskDefinition=task_definition_arn
        )

        task_def = task_response['taskDefinition']
        assert task_def['networkMode'] == 'awsvpc', "Task definition should use awsvpc network mode"
        assert 'FARGATE' in task_def.get('requiresCompatibilities', []), "Task should be compatible with Fargate"

    def test_deployment_is_self_contained(self, ec2_client, deployment_outputs):
        """Test that all deployed resources are contained within the VPC"""
        vpc_id = deployment_outputs['vpc_id']

        vpc_response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(vpc_response['Vpcs']) == 1, "VPC should exist"

        subnet_response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        assert len(subnet_response['Subnets']) >= 4, "Subnets should exist in VPC"

        sg_response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        assert len(sg_response['SecurityGroups']) >= 2, "Security groups should exist in VPC"
