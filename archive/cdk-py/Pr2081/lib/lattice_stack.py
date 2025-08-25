"""lattice_stack.py
Amazon VPC Lattice configuration for service-to-service networking.
"""

import aws_cdk as cdk
from aws_cdk import aws_vpclattice as lattice, aws_ec2 as ec2
from constructs import Construct


class LatticeStack(cdk.NestedStack):
    """Creates VPC Lattice service network for microservices communication."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Service Network
        self.service_network = lattice.CfnServiceNetwork(
            self, f"prod-lattice-network-{environment_suffix}",
            name=f"prod-lattice-network-{environment_suffix}",
            auth_type="AWS_IAM"
        )

        # VPC Association
        lattice.CfnServiceNetworkVpcAssociation(
            self, f"prod-lattice-vpc-association-{environment_suffix}",
            service_network_identifier=self.service_network.ref,
            vpc_identifier=vpc.vpc_id
        )

        # Example Service for web application
        web_service = lattice.CfnService(
            self, f"prod-lattice-web-service-{environment_suffix}",
            name=f"prod-lattice-web-service-{environment_suffix}",
            auth_type="AWS_IAM"
        )

        # Associate service with service network
        lattice.CfnServiceNetworkServiceAssociation(
            self, f"prod-lattice-service-association-{environment_suffix}",
            service_network_identifier=self.service_network.ref,
            service_identifier=web_service.ref
        )

        # Target Group (placeholder - would point to actual targets)
        target_group = lattice.CfnTargetGroup(
            self, f"prod-lattice-target-group-{environment_suffix}",
            name=f"prod-lattice-target-group-{environment_suffix}",
            type="INSTANCE",
            config=lattice.CfnTargetGroup.TargetGroupConfigProperty(
                port=80,
                protocol="HTTP",
                vpc_identifier=vpc.vpc_id,
                health_check=lattice.CfnTargetGroup.HealthCheckConfigProperty(
                    enabled=True,
                    path="/health",
                    protocol="HTTP",
                    healthy_threshold_count=2,
                    unhealthy_threshold_count=3
                )
            )
        )

        # Listener for the service
        lattice.CfnListener(
            self, f"prod-lattice-listener-{environment_suffix}",
            service_identifier=web_service.ref,
            protocol="HTTP",
            port=80,
            default_action=lattice.CfnListener.DefaultActionProperty(
                forward=lattice.CfnListener.ForwardProperty(
                    target_groups=[
                        lattice.CfnListener.WeightedTargetGroupProperty(
                            target_group_identifier=target_group.ref,
                            weight=100
                        )
                    ]
                )
            )
        )

        # Outputs
        cdk.CfnOutput(
            self, "ServiceNetworkArn",
            value=self.service_network.attr_arn,
            description="VPC Lattice Service Network ARN"
        )

        cdk.CfnOutput(
            self, "ServiceNetworkId",
            value=self.service_network.attr_id,
            description="VPC Lattice Service Network ID"
        )
