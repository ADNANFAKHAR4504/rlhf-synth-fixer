from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceLoadBalancer, EcsServiceNetworkConfiguration
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from constructs import Construct

class ComputeModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 networking, security, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # Primary ECS Cluster
        self.primary_cluster = EcsCluster(self, "primary-ecs-cluster",
            provider=primary_provider,
            name=f"payment-ecs-cluster-primary-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={
                "Name": f"payment-ecs-cluster-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Primary ALB
        self.primary_alb = Lb(self, "primary-alb",
            provider=primary_provider,
            name=f"payment-alb-primary-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[networking.primary_alb_sg.id],
            subnets=[s.id for s in networking.primary_subnets],
            enable_deletion_protection=False,
            tags={
                "Name": f"payment-alb-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Primary Target Groups (for blue-green deployment)
        self.primary_tg_blue = LbTargetGroup(self, "primary-tg-blue",
            provider=primary_provider,
            name=f"payment-tg-blue-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=networking.primary_vpc.id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "interval": 30,
                "timeout": 5,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3
            },
            tags={
                "Name": f"payment-tg-blue-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.primary_tg_green = LbTargetGroup(self, "primary-tg-green",
            provider=primary_provider,
            name=f"payment-tg-green-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=networking.primary_vpc.id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "interval": 30,
                "timeout": 5,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3
            },
            tags={
                "Name": f"payment-tg-green-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ALB Listener
        self.primary_listener = LbListener(self, "primary-listener",
            provider=primary_provider,
            load_balancer_arn=self.primary_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=self.primary_tg_blue.arn
            )],
            tags={
                "Name": f"payment-listener-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ECS Task Definition
        self.task_definition = EcsTaskDefinition(self, "task-definition",
            provider=primary_provider,
            family=f"payment-task-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=security.ecs_execution_role.arn,
            task_role_arn=security.ecs_task_role.arn,
            container_definitions='''[
                {
                    "name": "payment-api",
                    "image": "nginx:latest",
                    "cpu": 256,
                    "memory": 512,
                    "essential": true,
                    "portMappings": [
                        {
                            "containerPort": 8080,
                            "protocol": "tcp"
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": "/ecs/payment-api",
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "ecs"
                        }
                    }
                }
            ]''',
            tags={
                "Name": f"payment-task-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ECS Service
        self.primary_service = EcsService(self, "primary-service",
            provider=primary_provider,
            name=f"payment-service-primary-{environment_suffix}",
            cluster=self.primary_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            deployment_controller={"type": "CODE_DEPLOY"},  # ISSUE: Should use CODE_DEPLOY for blue-green
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[s.id for s in networking.primary_subnets],
                security_groups=[networking.primary_ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=self.primary_tg_blue.arn,
                container_name="payment-api",
                container_port=8080
            )],
            tags={
                "Name": f"payment-service-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )


        # FIXED: Secondary region ECS resources
        self.secondary_cluster = EcsCluster(self, "secondary-ecs-cluster",
            provider=secondary_provider,
            name=f"payment-ecs-cluster-secondary-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={
                "Name": f"payment-ecs-cluster-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_alb = Lb(self, "secondary-alb",
            provider=secondary_provider,
            name=f"payment-alb-secondary-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[networking.secondary_alb_sg.id],
            subnets=[s.id for s in networking.secondary_subnets],
            enable_deletion_protection=False,
            tags={
                "Name": f"payment-alb-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_tg_blue = LbTargetGroup(self, "secondary-tg-blue",
            provider=secondary_provider,
            name=f"payment-tg-blue-sec-{environment_suffix}"[:32],
            port=8080,
            protocol="HTTP",
            vpc_id=networking.secondary_vpc.id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "interval": 30,
                "timeout": 5,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3
            },
            tags={
                "Name": f"payment-tg-blue-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_tg_green = LbTargetGroup(self, "secondary-tg-green",
            provider=secondary_provider,
            name=f"payment-tg-green-sec-{environment_suffix}"[:32],
            port=8080,
            protocol="HTTP",
            vpc_id=networking.secondary_vpc.id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "interval": 30,
                "timeout": 5,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3
            },
            tags={
                "Name": f"payment-tg-green-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_listener = LbListener(self, "secondary-listener",
            provider=secondary_provider,
            load_balancer_arn=self.secondary_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=self.secondary_tg_blue.arn
            )],
            tags={
                "Name": f"payment-listener-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Secondary ECS Task Definition
        self.secondary_task_definition = EcsTaskDefinition(self, "secondary-task-definition",
            provider=secondary_provider,
            family=f"payment-task-secondary-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=security.ecs_execution_role.arn,
            task_role_arn=security.ecs_task_role.arn,
            container_definitions='''[
                {
                    "name": "payment-api",
                    "image": "nginx:latest",
                    "cpu": 256,
                    "memory": 512,
                    "essential": true,
                    "portMappings": [
                        {
                            "containerPort": 8080,
                            "protocol": "tcp"
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": "/ecs/payment-api-secondary",
                            "awslogs-region": "us-east-2",
                            "awslogs-stream-prefix": "ecs"
                        }
                    }
                }
            ]''',
            tags={
                "Name": f"payment-task-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_service = EcsService(self, "secondary-service",
            provider=secondary_provider,
            name=f"payment-service-secondary-{environment_suffix}",
            cluster=self.secondary_cluster.id,
            task_definition=self.secondary_task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            deployment_controller={"type": "CODE_DEPLOY"},
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[s.id for s in networking.secondary_subnets],
                security_groups=[networking.secondary_ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=self.secondary_tg_blue.arn,
                container_name="payment-api",
                container_port=8080
            )],
            tags={
                "Name": f"payment-service-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

