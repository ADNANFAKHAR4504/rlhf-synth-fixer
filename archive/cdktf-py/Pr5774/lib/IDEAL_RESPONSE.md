# ECS Fargate Customer Portal Deployment - Production Ready

This is the corrected, production-ready CDKTF Python implementation for deploying a containerized web application on AWS ECS Fargate with load balancing and auto-scaling.

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure - ECS Fargate deployment."""

from cdktf import TerraformStack, S3Backend, Fn, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster, EcsClusterSetting
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck, LbTargetGroupStickinessConfig
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy, AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration, AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for ECS Fargate Customer Portal."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with ECS Fargate infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'ap-southeast-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Merge default tags with required tags
        all_tags = {
            **default_tags,
            'Environment': 'production',
            'Application': 'customer-portal'
        }

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[all_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Get availability zones
        azs = [f"{aws_region}a", f"{aws_region}b"]

        # Create VPC
        vpc = Vpc(
            self,
            f"vpc_{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={'Name': f"vpc-{environment_suffix}"}
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            f"igw_{environment_suffix}",
            vpc_id=vpc.id,
            tags={'Name': f"igw-{environment_suffix}"}
        )

        # Create public subnets
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"public_subnet_{i}_{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={'Name': f"public-subnet-{i}-{environment_suffix}"}
            )
            public_subnets.append(subnet)

        # Create private subnets
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"private_subnet_{i}_{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={'Name': f"private-subnet-{i}-{environment_suffix}"}
            )
            private_subnets.append(subnet)

        # Create Elastic IP for NAT Gateway (depends on IGW)
        nat_eip = Eip(
            self,
            f"nat_eip_{environment_suffix}",
            domain="vpc",
            tags={'Name': f"nat-eip-{environment_suffix}"},
            depends_on=[igw]
        )

        # Create NAT Gateway in first public subnet
        nat_gateway = NatGateway(
            self,
            f"nat_gateway_{environment_suffix}",
            allocation_id=nat_eip.id,
            subnet_id=public_subnets[0].id,
            tags={'Name': f"nat-gateway-{environment_suffix}"},
            depends_on=[igw]
        )

        # Create public route table
        public_rt = RouteTable(
            self,
            f"public_rt_{environment_suffix}",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={'Name': f"public-rt-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Create private route table
        private_rt = RouteTable(
            self,
            f"private_rt_{environment_suffix}",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id
            )],
            tags={'Name': f"private-rt-{environment_suffix}"}
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # Create ALB security group (without inline rules to avoid circular dependency)
        alb_sg = SecurityGroup(
            self,
            f"alb_sg_{environment_suffix}",
            name=f"alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            tags={'Name': f"alb-sg-{environment_suffix}"}
        )

        # Create ECS tasks security group (without inline rules)
        ecs_sg = SecurityGroup(
            self,
            f"ecs_sg_{environment_suffix}",
            name=f"ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc.id,
            tags={'Name': f"ecs-sg-{environment_suffix}"}
        )

        # Add ingress rules after both security groups are created
        # This avoids circular dependency issues
        from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule

        SecurityGroupRule(
            self,
            f"alb_sg_ingress_{environment_suffix}",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=alb_sg.id,
            description="Allow HTTP from internet"
        )

        SecurityGroupRule(
            self,
            f"alb_sg_egress_{environment_suffix}",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=alb_sg.id,
            description="Allow all outbound"
        )

        SecurityGroupRule(
            self,
            f"ecs_sg_ingress_{environment_suffix}",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            source_security_group_id=alb_sg.id,
            security_group_id=ecs_sg.id,
            description="Allow HTTP from ALB"
        )

        SecurityGroupRule(
            self,
            f"ecs_sg_egress_{environment_suffix}",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=ecs_sg.id,
            description="Allow all outbound"
        )

        # Create CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            f"ecs_log_group_{environment_suffix}",
            name=f"/ecs/customer-portal-{environment_suffix}",
            retention_in_days=7,
            tags={'Name': f"ecs-log-group-{environment_suffix}"}
        )

        # Create ECS Task Execution Role
        task_execution_role = IamRole(
            self,
            f"ecs_task_execution_role_{environment_suffix}",
            name=f"ecs-task-exec-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Effect": "Allow",
                    "Sid": ""
                }]
            }),
            tags={'Name': f"ecs-task-execution-role-{environment_suffix}"}
        )

        # Attach AmazonECSTaskExecutionRolePolicy
        IamRolePolicyAttachment(
            self,
            f"ecs_task_execution_policy_{environment_suffix}",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Create ECS Task Role
        task_role = IamRole(
            self,
            f"ecs_task_role_{environment_suffix}",
            name=f"ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Effect": "Allow",
                    "Sid": ""
                }]
            }),
            tags={'Name': f"ecs-task-role-{environment_suffix}"}
        )

        # Create ECS Cluster
        ecs_cluster = EcsCluster(
            self,
            f"ecs_cluster_{environment_suffix}",
            name=f"customer-portal-cluster-{environment_suffix}",
            setting=[EcsClusterSetting(
                name="containerInsights",
                value="enabled"
            )],
            tags={'Name': f"ecs-cluster-{environment_suffix}"}
        )

        # Create Application Load Balancer (name must be <= 32 chars)
        alb_name = f"cp-alb-{environment_suffix}"
        if len(alb_name) > 32:
            alb_name = f"cp-alb-{environment_suffix[:20]}"

        alb = Lb(
            self,
            f"alb_{environment_suffix}",
            name=alb_name,
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet.id for subnet in public_subnets],
            tags={'Name': f"alb-{environment_suffix}"}
        )

        # Create Target Group (name must be <= 32 chars)
        tg_name = f"cp-tg-{environment_suffix}"
        if len(tg_name) > 32:
            tg_name = f"cp-tg-{environment_suffix[:25]}"

        target_group = LbTargetGroup(
            self,
            f"target_group_{environment_suffix}",
            name=tg_name,
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            deregistration_delay=30,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                port="traffic-port",
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                matcher="200"
            ),
            stickiness=LbTargetGroupStickinessConfig(
                type="lb_cookie",
                enabled=True,
                cookie_duration=3600
            ),
            tags={'Name': f"target-group-{environment_suffix}"}
        )

        # Create ALB Listener
        alb_listener = LbListener(
            self,
            f"alb_listener_{environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=target_group.arn
            )]
        )

        # Create ECS Task Definition
        container_definitions = [{
            "name": "customer-portal",
            "image": f"account-id.dkr.ecr.{aws_region}.amazonaws.com/webapp:latest",
            "cpu": 512,
            "memory": 1024,
            "essential": True,
            "portMappings": [{
                "containerPort": 80,
                "protocol": "tcp"
            }],
            "environment": [
                {"name": "API_ENDPOINT", "value": "https://api.example.com"},
                {"name": "DB_CONNECTION_STRING", "value": "postgresql://dbhost:5432/mydb"},
                {"name": "REDIS_HOST", "value": "redis.example.com"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group.name,
                    "awslogs-region": aws_region,
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }]

        task_definition = EcsTaskDefinition(
            self,
            f"task_definition_{environment_suffix}",
            family=f"customer-portal-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="512",
            memory="1024",
            execution_role_arn=task_execution_role.arn,
            task_role_arn=task_role.arn,
            container_definitions=json.dumps(container_definitions),
            tags={'Name': f"task-definition-{environment_suffix}"}
        )

        # Create ECS Service
        ecs_service = EcsService(
            self,
            f"ecs_service_{environment_suffix}",
            name=f"customer-portal-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            platform_version="1.4.0",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[subnet.id for subnet in private_subnets],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=target_group.arn,
                container_name="customer-portal",
                container_port=80
            )],
            depends_on=[alb_listener],
            tags={'Name': f"ecs-service-{environment_suffix}"}
        )

        # Create Auto Scaling Target
        scaling_target = AppautoscalingTarget(
            self,
            f"ecs_scaling_target_{environment_suffix}",
            service_namespace="ecs",
            resource_id=f"service/{ecs_cluster.name}/{ecs_service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            min_capacity=2,
            max_capacity=10
        )

        # Create Target Tracking Scaling Policy
        AppautoscalingPolicy(
            self,
            f"scale_policy_{environment_suffix}",
            name=f"cpu-scaling-policy-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            service_namespace=scaling_target.service_namespace,
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=70.0,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=300
            )
        )

        # Outputs
        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="ALB DNS name for accessing the application"
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=ecs_cluster.name,
            description="ECS Cluster name"
        )

        TerraformOutput(
            self,
            "ecs_service_name",
            value=ecs_service.name,
            description="ECS Service name"
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )
```

## Key Improvements Over MODEL_RESPONSE

1. **Fixed Security Group Circular Dependency**: Used separate `SecurityGroupRule` resources instead of inline rules to avoid circular dependencies between ALB and ECS security groups.

2. **Added Resource Dependencies**: NAT Gateway and EIP now properly depend on Internet Gateway to ensure correct creation order.

3. **Fixed ALB Name Length**: Added validation to ensure ALB and target group names don't exceed AWS 32-character limit.

4. **Improved ECS Service Dependencies**: ECS Service now depends on ALB Listener instead of just target group for proper lifecycle management.

5. **Added TerraformOutput**: Included outputs for ALB DNS name, cluster name, service name, and VPC ID for easier access and integration testing.

6. **Fixed Construct IDs**: Used underscores instead of hyphens in construct IDs to follow Python naming conventions and avoid Terraform issues.

7. **Shortened IAM Role Name**: Task execution role name shortened to fit within IAM limits when combined with environment suffix.

## Deployment Instructions

1. Initialize CDKTF:
```bash
cdktf get
```

2. Deploy the stack:
```bash
cdktf deploy
```

3. Access the application using the ALB DNS output:
```bash
# Output will show: alb_dns_name = <dns-name>
http://<alb-dns-name>
```

## Architecture Overview

- **VPC**: 10.0.0.0/16 with 2 AZs
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24 (for ALB)
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24 (for ECS tasks)
- **NAT Gateway**: Single NAT in first public subnet with proper IGW dependency
- **ECS Cluster**: Fargate with container insights enabled
- **ECS Service**: 2-10 tasks with CPU-based auto-scaling
- **ALB**: HTTP listener on port 80 with health checks and session stickiness
- **CloudWatch**: Logs with 7-day retention
- **Security**: Proper security group rules without circular dependencies

## Cost Optimization

- Single NAT Gateway (not per AZ) - ~$32/month
- Fargate for serverless container management
- 7-day log retention
- Auto-scaling between 2-10 tasks based on actual load
- Session stickiness reduces backend load

## Security Features

- Private subnets for ECS tasks (no public IPs)
- Security groups with least-privilege access
- IAM roles for task execution and operations
- All traffic from internet only through ALB
- Container logs encrypted in CloudWatch
- All resources properly tagged for tracking and governance
