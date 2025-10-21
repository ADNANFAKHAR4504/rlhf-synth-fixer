from aws_cdk import (
    Stack,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_codedeploy as codedeploy,
    aws_iam as iam,
)
from constructs import Construct
from typing import Optional


class EcsStack(Stack):
    def __init__(self, scope: Construct, stack_id: str, *, vpc: Optional[ec2.Vpc] = None, task_image_options=None, **kwargs):
        super().__init__(scope, stack_id, **kwargs)
        self.task_image_options = task_image_options

        # Create or use an existing VPC
        # vpc = kwargs.get("vpc")
        self.vpc = vpc or ec2.Vpc(self, "MyVpc", max_azs=2)

        # Create an ECS cluster
        cluster = ecs.Cluster(self, "MyCluster", vpc=self.vpc)

        # Create a Fargate task definition
        task_definition = ecs.FargateTaskDefinition(self, "TaskDef")

        # Add container to task definition
        container = task_definition.add_container(
            "AppContainer",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            memory_limit_mib=512,
            cpu=256,
        )
        container.add_port_mappings(ecs.PortMapping(container_port=80))

        # Create Application Load Balancer
        lb = elbv2.ApplicationLoadBalancer(
            self,
            "LB",
            vpc=self.vpc,
            internet_facing=True,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Create listener
        listener = lb.add_listener("Listener", port=80)

        # Create blue and green target groups
        blue_target_group = elbv2.ApplicationTargetGroup(
            self,
            "BlueTG",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(path="/"),
        )

        green_target_group = elbv2.ApplicationTargetGroup(
            self,
            "GreenTG",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(path="/"),
        )

        # Default rule points to blue target group
        listener.add_target_groups("DefaultTG", target_groups=[blue_target_group])

        # Create Fargate service with CodeDeploy deployment controller
        ecs_service = ecs.FargateService(
            self,
            "FargateService",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            deployment_controller=ecs.DeploymentController(
                type=ecs.DeploymentControllerType.CODE_DEPLOY
            ),
            assign_public_ip=True,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Register service with blue target group
        blue_target_group.add_target(ecs_service)

        # IAM role for CodeDeploy
        codedeploy_role = iam.Role(
            self,
            "CodeDeployRole",
            assumed_by=iam.ServicePrincipal("codedeploy.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSCodeDeployRoleForECS"
                )
            ],
        )

        # CodeDeploy ECS Application
        codedeploy_app = codedeploy.EcsApplication(self, "CodeDeployApp")

        # CodeDeploy Deployment Group
        deployment_group = codedeploy.EcsDeploymentGroup(
            self,
            "CodeDeployGroup",
            service=ecs_service,
            blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
                listener=listener,
                blue_target_group=blue_target_group,
                green_target_group=green_target_group,
            ),
            deployment_config=codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
            application=codedeploy_app,
            auto_rollback=codedeploy.AutoRollbackConfig(
                failed_deployment=True,
                stopped_deployment=True,
                deployment_in_alarm=False,  # Explicitly disable alarm-based rollback
            ),
            role=codedeploy_role,
        )

        # Expose attributes for other stacks and tests
        self.ecs_service = ecs_service
        self.listener = listener
        self.load_balancer = lb
        self.blue_target_group = blue_target_group
        self.green_target_group = green_target_group
        self.codedeploy_app = codedeploy_app
        self.deployment_group = deployment_group
        self.codedeploy_role = codedeploy_role