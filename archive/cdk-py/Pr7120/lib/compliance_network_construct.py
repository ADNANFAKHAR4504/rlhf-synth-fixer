"""compliance_network_construct.py
VPC infrastructure for compliance Lambda functions.
"""

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_logs as logs
from constructs import Construct


class ComplianceNetworkConstruct(Construct):
    """
    Network infrastructure for compliance auditing system.

    Creates VPC with private subnets, VPC endpoints for AWS services,
    and security groups for Lambda functions.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # Create VPC with private subnets
        self.vpc = ec2.Vpc(
            self,
            "ComplianceVPC",
            vpc_name=f"compliance-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=0,  # Use VPC endpoints instead for cost optimization
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # VPC Flow Logs with specific naming convention
        flow_log_group = logs.LogGroup(
            self,
            "VPCFlowLogGroup",
            log_group_name=f"/aws/vpc/audit-flowlogs-us-east-1-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        flow_log_role = cdk.aws_iam.Role(
            self,
            "FlowLogRole",
            assumed_by=cdk.aws_iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                cdk.aws_iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchLogsFullAccess"
                )
            ]
        )

        ec2.FlowLog(
            self,
            "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                flow_log_group,
                flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        # VPC Endpoints for AWS services (cost-effective alternative to NAT)
        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        self.vpc.add_interface_endpoint(
            "SNSEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.SNS
        )

        self.vpc.add_interface_endpoint(
            "STSEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.STS
        )

        self.vpc.add_interface_endpoint(
            "ConfigEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.CONFIG
        )

        self.vpc.add_interface_endpoint(
            "CloudWatchLogsEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
        )

        # Security group for Lambda functions
        self.lambda_security_group = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=self.vpc,
            security_group_name=f"compliance-lambda-sg-{environment_suffix}",
            description="Security group for compliance Lambda functions",
            allow_all_outbound=True
        )
