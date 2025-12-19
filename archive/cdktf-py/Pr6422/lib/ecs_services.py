"""ECS services, task definitions, and auto-scaling."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
import json


class EcsServicesStack(Construct):
    """ECS services for payment processing microservices."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        aws_region: str,
        cluster_id: str,
        cluster_name: str,
        private_subnet_ids: list,
        task_execution_role_arn: str,
        task_role_arn: str,
        alb_target_group_arn: str,
        alb_security_group_id: str,
        vpc_id: str,
        log_group_names: dict,
    ):
        super().__init__(scope, construct_id)

        self.services_config = {
            "payment-api": {
                "port": 80,
                "image": "public.ecr.aws/nginx/nginx:latest",
                "attach_alb": True,
            },
            "fraud-detection": {
                "port": 80,
                "image": "public.ecr.aws/nginx/nginx:latest",
                "attach_alb": False,
            },
            "notification-service": {
                "port": 80,
                "image": "public.ecr.aws/nginx/nginx:latest",
                "attach_alb": False,
            },
        }

        # Create security group for ECS tasks
        self.ecs_sg = SecurityGroup(
            self,
            "ecs_security_group",
            name=f"payment-ecs-sg-{environment_suffix}",
            description="Security group for payment processing ECS tasks",
            vpc_id=vpc_id,
            tags={
                "Name": f"payment-ecs-sg-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Allow inbound traffic from ALB
        SecurityGroupRule(
            self,
            "ecs_ingress_alb",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            source_security_group_id=alb_security_group_id,
            security_group_id=self.ecs_sg.id,
        )

        # Allow inter-service communication on port 80
        SecurityGroupRule(
            self,
            "ecs_ingress_80",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            self_attribute=True,
            security_group_id=self.ecs_sg.id,
        )

        # Allow outbound traffic
        SecurityGroupRule(
            self,
            "ecs_egress_all",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.ecs_sg.id,
        )

        # Create task definitions and services for each microservice
        for service_name, config in self.services_config.items():
            self._create_service(
                service_name=service_name,
                config=config,
                environment_suffix=environment_suffix,
                aws_region=aws_region,
                cluster_id=cluster_id,
                cluster_name=cluster_name,
                private_subnet_ids=private_subnet_ids,
                task_execution_role_arn=task_execution_role_arn,
                task_role_arn=task_role_arn,
                alb_target_group_arn=alb_target_group_arn if config["attach_alb"] else None,
                log_group_name=log_group_names[service_name],
            )

    def _create_service(
        self,
        *,
        service_name: str,
        config: dict,
        environment_suffix: str,
        aws_region: str,
        cluster_id: str,
        cluster_name: str,
        private_subnet_ids: list,
        task_execution_role_arn: str,
        task_role_arn: str,
        alb_target_group_arn: str,
        log_group_name: str,
    ):
        """Create ECS task definition and service for a microservice."""

        # Create task definition
        container_definitions = json.dumps([{
            "name": service_name,
            "image": config["image"],
            "cpu": 1024,
            "memory": 2048,
            "essential": True,
            "portMappings": [{
                "containerPort": config["port"],
                "protocol": "tcp",
            }],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group_name,
                    "awslogs-region": aws_region,
                    "awslogs-stream-prefix": "ecs",
                },
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:80/ || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60,
            },
        }])

        task_def = EcsTaskDefinition(
            self,
            f"{service_name}_task_def",
            family=f"{service_name}-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            execution_role_arn=task_execution_role_arn,
            task_role_arn=task_role_arn,
            container_definitions=container_definitions,
            runtime_platform={
                "operating_system_family": "LINUX",
                "cpu_architecture": "X86_64",
            },
            tags={
                "Name": f"{service_name}-task-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
                "Service": service_name,
            },
        )

        # Create ECS service
        service_config = {
            "name": f"{service_name}-{environment_suffix}",
            "cluster": cluster_id,
            "task_definition": task_def.arn,
            "desired_count": 3,
            "launch_type": "FARGATE",
            "platform_version": "1.4.0",
            "network_configuration": {
                "subnets": private_subnet_ids,
                "security_groups": [self.ecs_sg.id],
                "assign_public_ip": False,
            },
            "tags": {
                "Name": f"{service_name}-service-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
                "Service": service_name,
            },
        }

        # Add load balancer configuration for payment-api
        if alb_target_group_arn:
            from cdktf_cdktf_provider_aws.ecs_service import EcsServiceLoadBalancer
            service_config["load_balancer"] = [
                EcsServiceLoadBalancer(
                    target_group_arn=alb_target_group_arn,
                    container_name=service_name,
                    container_port=config["port"],
                )
            ]

        service = EcsService(
            self,
            f"{service_name}_service",
            **service_config,
        )

        # Create auto-scaling target
        scaling_target = AppautoscalingTarget(
            self,
            f"{service_name}_scaling_target",
            service_namespace="ecs",
            resource_id=f"service/{cluster_name}/{service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            min_capacity=3,
            max_capacity=10,
        )

        # Create CPU-based auto-scaling policy
        AppautoscalingPolicy(
            self,
            f"{service_name}_cpu_scaling_policy",
            name=f"{service_name}-cpu-scaling-{environment_suffix}",
            service_namespace="ecs",
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration={
                "target_value": 70.0,
                "predefined_metric_specification": {
                    "predefined_metric_type": "ECSServiceAverageCPUUtilization",
                },
                "scale_in_cooldown": 300,
                "scale_out_cooldown": 60,
            },
        )

        # Create memory-based auto-scaling policy
        AppautoscalingPolicy(
            self,
            f"{service_name}_memory_scaling_policy",
            name=f"{service_name}-memory-scaling-{environment_suffix}",
            service_namespace="ecs",
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration={
                "target_value": 80.0,
                "predefined_metric_specification": {
                    "predefined_metric_type": "ECSServiceAverageMemoryUtilization",
                },
                "scale_in_cooldown": 300,
                "scale_out_cooldown": 60,
            },
        )
