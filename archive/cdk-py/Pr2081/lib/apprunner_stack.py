"""apprunner_stack.py
AWS AppRunner service configuration for containerized applications.
"""

import aws_cdk as cdk
from aws_cdk import aws_apprunner as apprunner, aws_iam as iam, aws_ec2 as ec2
from constructs import Construct


class AppRunnerStack(cdk.NestedStack):
    """Creates AWS AppRunner service for containerized workloads."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # IAM role for AppRunner (not needed for GitHub source)

        # Instance role for AppRunner
        apprunner_instance_role = iam.Role(
            self, f"prod-apprunner-instance-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
            role_name=f"prod-apprunner-instance-role-{environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchLogsFullAccess")
            ]
        )

        # VPC Connector for AppRunner
        vpc_connector = apprunner.CfnVpcConnector(
            self, f"prod-apprunner-vpc-connector-{environment_suffix}",
            subnets=vpc.select_subnets(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ).subnet_ids,
            vpc_connector_name=f"prod-apprunner-vpc-connector-{environment_suffix}"
        )

        # AppRunner Service
        self.apprunner_service = apprunner.CfnService(
            self, f"prod-apprunner-service-{environment_suffix}",
            service_name=f"prod-apprunner-service-{environment_suffix}",
            source_configuration=apprunner.CfnService.SourceConfigurationProperty(
                auto_deployments_enabled=False,  # Disable auto-deployments for public repo
                image_repository=apprunner.CfnService.ImageRepositoryProperty(
                    image_identifier="public.ecr.aws/aws-containers/hello-app-runner:latest",
                    image_configuration=apprunner.CfnService.ImageConfigurationProperty(
                        port="8000"
                    ),
                    image_repository_type="ECR_PUBLIC"
                )
            ),
            instance_configuration=apprunner.CfnService.InstanceConfigurationProperty(
                cpu="0.25 vCPU",
                memory="0.5 GB",
                instance_role_arn=apprunner_instance_role.role_arn
            ),
            network_configuration=apprunner.CfnService.NetworkConfigurationProperty(
                egress_configuration=apprunner.CfnService.EgressConfigurationProperty(
                    egress_type="VPC",
                    vpc_connector_arn=vpc_connector.attr_vpc_connector_arn
                )
            ),
            health_check_configuration=apprunner.CfnService.HealthCheckConfigurationProperty(
                protocol="HTTP",
                path="/",
                interval=10,
                timeout=5,
                healthy_threshold=1,
                unhealthy_threshold=5
            ),
            auto_scaling_configuration_arn=apprunner.CfnAutoScalingConfiguration(
                self, f"prod-apprunner-scaling-{environment_suffix}",
                auto_scaling_configuration_name=f"prod-apprunner-scaling-{environment_suffix}",
                max_concurrency=100,
                max_size=10,
                min_size=1
            ).attr_auto_scaling_configuration_arn
        )

        # Output the AppRunner service URL
        cdk.CfnOutput(
            self, "AppRunnerServiceUrl",
            value=f"https://{self.apprunner_service.attr_service_url}",
            description="AppRunner service URL"
        )
