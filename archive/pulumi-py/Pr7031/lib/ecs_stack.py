"""
ECS Stack - Fargate Cluster, Task Definition, Service with Auto-scaling
"""

import pulumi
import pulumi_aws as aws
import json
from typing import Dict, List


class EcsStackArgs:
    """Arguments for EcsStack"""

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: pulumi.Input[str],
        private_subnet_ids: List[pulumi.Input[str]],
        ecs_sg_id: pulumi.Input[str],
        target_group_arn: pulumi.Input[str],
        task_role_arn: pulumi.Input[str],
        execution_role_arn: pulumi.Input[str],
        log_group_name: pulumi.Input[str],
        db_endpoint: pulumi.Input[str],
        tags: Dict[str, str] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        self.ecs_sg_id = ecs_sg_id
        self.target_group_arn = target_group_arn
        self.task_role_arn = task_role_arn
        self.execution_role_arn = execution_role_arn
        self.log_group_name = log_group_name
        self.db_endpoint = db_endpoint
        self.tags = tags or {}


class EcsStack(pulumi.ComponentResource):
    """
    ECS Fargate infrastructure for loan processing application.
    """

    def __init__(
        self,
        name: str,
        args: EcsStackArgs,
        opts: pulumi.ResourceOptions = None
    ):
        super().__init__("custom:ecs:EcsStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Create ECS Cluster
        self.cluster = aws.ecs.Cluster(
            f"loan-ecs-cluster-{self.environment_suffix}",
            name=f"loan-ecs-cluster-{self.environment_suffix}",
            settings=[aws.ecs.ClusterSettingArgs(
                name="containerInsights",
                value="enabled"
            )],
            tags={**self.tags, "Name": f"loan-ecs-cluster-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Task Definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"loan-task-{self.environment_suffix}",
            family=f"loan-task-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            task_role_arn=args.task_role_arn,
            execution_role_arn=args.execution_role_arn,
            container_definitions=pulumi.Output.all(
                args.log_group_name,
                args.db_endpoint
            ).apply(lambda vals: json.dumps([{
                "name": "loan-app",
                "image": "nginx:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "DB_ENDPOINT", "value": vals[1]},
                    {"name": "ENVIRONMENT", "value": self.environment_suffix}
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": vals[0],
                        "awslogs-region": "eu-west-2",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }])),
            tags={**self.tags, "Name": f"loan-task-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # ECS Service
        self.service = aws.ecs.Service(
            f"loan-service-{self.environment_suffix}",
            name=f"loan-service-{self.environment_suffix}",
            cluster=self.cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            platform_version="LATEST",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=args.private_subnet_ids,
                security_groups=[args.ecs_sg_id]
            ),
            load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=args.target_group_arn,
                container_name="loan-app",
                container_port=8080
            )],
            health_check_grace_period_seconds=60,
            tags={**self.tags, "Name": f"loan-service-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.task_definition])
        )

        # Auto-scaling Target
        self.scaling_target = aws.appautoscaling.Target(
            f"loan-ecs-target-{self.environment_suffix}",
            max_capacity=10,
            min_capacity=2,
            resource_id=pulumi.Output.concat("service/", self.cluster.name, "/", self.service.name),
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs",
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.service])
        )

        # CPU-based Auto-scaling Policy
        self.cpu_policy = aws.appautoscaling.Policy(
            f"loan-ecs-cpu-policy-{self.environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.scaling_target.resource_id,
            scalable_dimension=self.scaling_target.scalable_dimension,
            service_namespace=self.scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=(
                aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                    predefined_metric_specification=(
                        aws.appautoscaling.
                        PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                            predefined_metric_type="ECSServiceAverageCPUUtilization"
                        )
                    ),
                    target_value=70.0,
                    scale_in_cooldown=300,
                    scale_out_cooldown=60
                )
            ),
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.scaling_target])
        )

        # Memory-based Auto-scaling Policy
        self.memory_policy = aws.appautoscaling.Policy(
            f"loan-ecs-memory-policy-{self.environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.scaling_target.resource_id,
            scalable_dimension=self.scaling_target.scalable_dimension,
            service_namespace=self.scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=(
                aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                    predefined_metric_specification=(
                        aws.appautoscaling.
                        PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                            predefined_metric_type="ECSServiceAverageMemoryUtilization"
                        )
                    ),
                    target_value=80.0,
                    scale_in_cooldown=300,
                    scale_out_cooldown=60
                )
            ),
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.scaling_target])
        )

        self.register_outputs({
            "cluster_name": self.cluster.name,
            "service_name": self.service.name,
            "task_definition_arn": self.task_definition.arn
        })
