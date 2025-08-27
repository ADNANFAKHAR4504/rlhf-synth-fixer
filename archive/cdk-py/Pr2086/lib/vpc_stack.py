"""VPC Stack for highly available web application infrastructure."""

from aws_cdk import CfnOutput, NestedStack, RemovalPolicy, Tags
from aws_cdk import aws_ec2 as ec2
from constructs import Construct


class VpcStack(NestedStack):
    """Creates VPC infrastructure with public and private subnets across multiple AZs."""
    
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str = "dev", **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.environment_suffix = environment_suffix
        
        # Create VPC with DNS support
        self.vpc = ec2.Vpc(
            self, "prod-vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="prod-public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="prod-private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
            nat_gateways=2,  # One NAT gateway per AZ for high availability
        )
        
        # Add tags
        Tags.of(self.vpc).add("Name", "prod-vpc")
        Tags.of(self.vpc).add("Environment", "production")
        
        # Create VPC Flow Logs for monitoring
        import time

        from aws_cdk import aws_logs as logs

        # Add timestamp to make log group name unique
        timestamp = int(time.time())
        
        flow_log_group = logs.LogGroup(
            self, "prod-vpc-flow-log-group",
            log_group_name=f"/aws/vpc/flowlogs-{self.environment_suffix}-{timestamp}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        flow_log_role = self._create_flow_log_role()
        ec2.FlowLog(
            self, "prod-vpc-flow-log",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                flow_log_group,
                flow_log_role
            ),
        )
        
        # Output VPC information
        CfnOutput(self, "VpcId", value=self.vpc.vpc_id)
        CfnOutput(self, "PublicSubnetIds", 
                 value=",".join([s.subnet_id for s in self.vpc.public_subnets]))
        CfnOutput(self, "PrivateSubnetIds", 
                 value=",".join([s.subnet_id for s in self.vpc.private_subnets]))
    
    def _create_flow_log_role(self):
        """Create IAM role for VPC Flow Logs."""
        from aws_cdk import aws_iam as iam
        
        return iam.Role(
            self, "prod-vpc-flow-log-role",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchLogsFullAccess"
                )
            ],
        )