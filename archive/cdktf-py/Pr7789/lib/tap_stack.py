# pylint: disable=too-many-lines
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_options import VpcPeeringConnectionOptions
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.network_acl import NetworkAcl
from cdktf_cdktf_provider_aws.network_acl_rule import NetworkAclRule
from cdktf_cdktf_provider_aws.network_acl_association import NetworkAclAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.config_configuration_recorder import ConfigConfigurationRecorder
from cdktf_cdktf_provider_aws.config_delivery_channel import ConfigDeliveryChannel
from cdktf_cdktf_provider_aws.config_configuration_recorder_status import ConfigConfigurationRecorderStatus
from cdktf_cdktf_provider_aws.config_config_rule import ConfigConfigRule
import json
import time


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, stack_id: str, environment_suffix: str = "dev", **kwargs):
        super().__init__(scope, stack_id)

        self.environment_suffix = environment_suffix
        # Generate unique suffix for S3 bucket names to avoid conflicts
        self.unique_suffix = str(int(time.time()))

        # AWS Provider for Account A (Trading)
        provider_account_a = AwsProvider(
            self,
            "aws_account_a",
            region="us-east-1",
            alias="account_a"
        )

        # AWS Provider for Account B (Analytics) - uses same credentials for demo
        # In production, configure with different assume_role
        provider_account_b = AwsProvider(
            self,
            "aws_account_b",
            region="us-east-1",
            alias="account_b"
        )

        # Trading VPC (Account A)
        trading_vpc = Vpc(
            self,
            f"trading-vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"trading-vpc-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        # Analytics VPC (Account B)
        analytics_vpc = Vpc(
            self,
            f"analytics-vpc-{environment_suffix}",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"analytics-vpc-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        # Trading VPC Private Subnets
        trading_subnet_1 = Subnet(
            self,
            f"trading-subnet-1-{environment_suffix}",
            vpc_id=trading_vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            tags={
                "Name": f"trading-subnet-1-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        trading_subnet_2 = Subnet(
            self,
            f"trading-subnet-2-{environment_suffix}",
            vpc_id=trading_vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            tags={
                "Name": f"trading-subnet-2-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        trading_subnet_3 = Subnet(
            self,
            f"trading-subnet-3-{environment_suffix}",
            vpc_id=trading_vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone="us-east-1c",
            tags={
                "Name": f"trading-subnet-3-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        # Analytics VPC Private Subnets
        analytics_subnet_1 = Subnet(
            self,
            f"analytics-subnet-1-{environment_suffix}",
            vpc_id=analytics_vpc.id,
            cidr_block="10.1.1.0/24",
            availability_zone="us-east-1a",
            tags={
                "Name": f"analytics-subnet-1-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        analytics_subnet_2 = Subnet(
            self,
            f"analytics-subnet-2-{environment_suffix}",
            vpc_id=analytics_vpc.id,
            cidr_block="10.1.2.0/24",
            availability_zone="us-east-1b",
            tags={
                "Name": f"analytics-subnet-2-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        analytics_subnet_3 = Subnet(
            self,
            f"analytics-subnet-3-{environment_suffix}",
            vpc_id=analytics_vpc.id,
            cidr_block="10.1.3.0/24",
            availability_zone="us-east-1c",
            tags={
                "Name": f"analytics-subnet-3-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        # VPC Peering Connection (initiated from Trading VPC)
        vpc_peering = VpcPeeringConnection(
            self,
            f"vpc-peering-{environment_suffix}",
            vpc_id=trading_vpc.id,
            peer_vpc_id=analytics_vpc.id,
            auto_accept=True,
            tags={
                "Name": f"trading-analytics-peering-{environment_suffix}",
                "CostCenter": "shared",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        # Configure VPC Peering Options for DNS resolution
        VpcPeeringConnectionOptions(
            self,
            f"vpc-peering-options-requester-{environment_suffix}",
            vpc_peering_connection_id=vpc_peering.id,
            requester={"allow_remote_vpc_dns_resolution": True},
            provider=provider_account_a
        )

        VpcPeeringConnectionOptions(
            self,
            f"vpc-peering-options-accepter-{environment_suffix}",
            vpc_peering_connection_id=vpc_peering.id,
            accepter={"allow_remote_vpc_dns_resolution": True},
            provider=provider_account_b
        )

        # Route Tables for Trading VPC
        trading_route_table = RouteTable(
            self,
            f"trading-route-table-{environment_suffix}",
            vpc_id=trading_vpc.id,
            tags={
                "Name": f"trading-route-table-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        # Route from Trading to Analytics through peering
        Route(
            self,
            f"trading-to-analytics-route-{environment_suffix}",
            route_table_id=trading_route_table.id,
            destination_cidr_block="10.1.0.0/16",
            vpc_peering_connection_id=vpc_peering.id,
            provider=provider_account_a
        )

        # Associate Trading Subnets with Route Table
        RouteTableAssociation(
            self,
            f"trading-subnet-1-route-association-{environment_suffix}",
            subnet_id=trading_subnet_1.id,
            route_table_id=trading_route_table.id,
            provider=provider_account_a
        )

        RouteTableAssociation(
            self,
            f"trading-subnet-2-route-association-{environment_suffix}",
            subnet_id=trading_subnet_2.id,
            route_table_id=trading_route_table.id,
            provider=provider_account_a
        )

        RouteTableAssociation(
            self,
            f"trading-subnet-3-route-association-{environment_suffix}",
            subnet_id=trading_subnet_3.id,
            route_table_id=trading_route_table.id,
            provider=provider_account_a
        )

        # Route Tables for Analytics VPC
        analytics_route_table = RouteTable(
            self,
            f"analytics-route-table-{environment_suffix}",
            vpc_id=analytics_vpc.id,
            tags={
                "Name": f"analytics-route-table-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        # Route from Analytics to Trading through peering
        Route(
            self,
            f"analytics-to-trading-route-{environment_suffix}",
            route_table_id=analytics_route_table.id,
            destination_cidr_block="10.0.0.0/16",
            vpc_peering_connection_id=vpc_peering.id,
            provider=provider_account_b
        )

        # Associate Analytics Subnets with Route Table
        RouteTableAssociation(
            self,
            f"analytics-subnet-1-route-association-{environment_suffix}",
            subnet_id=analytics_subnet_1.id,
            route_table_id=analytics_route_table.id,
            provider=provider_account_b
        )

        RouteTableAssociation(
            self,
            f"analytics-subnet-2-route-association-{environment_suffix}",
            subnet_id=analytics_subnet_2.id,
            route_table_id=analytics_route_table.id,
            provider=provider_account_b
        )

        RouteTableAssociation(
            self,
            f"analytics-subnet-3-route-association-{environment_suffix}",
            subnet_id=analytics_subnet_3.id,
            route_table_id=analytics_route_table.id,
            provider=provider_account_b
        )

        # Security Group for Trading VPC
        trading_sg = SecurityGroup(
            self,
            f"trading-sg-{environment_suffix}",
            name=f"trading-sg-{environment_suffix}",
            description="Security group for trading VPC allowing HTTPS and PostgreSQL from analytics",
            vpc_id=trading_vpc.id,
            tags={
                "Name": f"trading-sg-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        # Trading SG Rules - Ingress HTTPS from Analytics
        SecurityGroupRule(
            self,
            f"trading-sg-https-ingress-{environment_suffix}",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["10.1.0.0/16"],
            security_group_id=trading_sg.id,
            description="Allow HTTPS from analytics VPC",
            provider=provider_account_a
        )

        # Trading SG Rules - Ingress PostgreSQL from Analytics
        SecurityGroupRule(
            self,
            f"trading-sg-postgres-ingress-{environment_suffix}",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["10.1.0.0/16"],
            security_group_id=trading_sg.id,
            description="Allow PostgreSQL from analytics VPC",
            provider=provider_account_a
        )

        # Trading SG Rules - Egress to Analytics
        SecurityGroupRule(
            self,
            f"trading-sg-egress-{environment_suffix}",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["10.1.0.0/16"],
            security_group_id=trading_sg.id,
            description="Allow all outbound to analytics VPC",
            provider=provider_account_a
        )

        # Security Group for Analytics VPC
        analytics_sg = SecurityGroup(
            self,
            f"analytics-sg-{environment_suffix}",
            name=f"analytics-sg-{environment_suffix}",
            description="Security group for analytics VPC allowing HTTPS and PostgreSQL from trading",
            vpc_id=analytics_vpc.id,
            tags={
                "Name": f"analytics-sg-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        # Analytics SG Rules - Ingress HTTPS from Trading
        SecurityGroupRule(
            self,
            f"analytics-sg-https-ingress-{environment_suffix}",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],
            security_group_id=analytics_sg.id,
            description="Allow HTTPS from trading VPC",
            provider=provider_account_b
        )

        # Analytics SG Rules - Ingress PostgreSQL from Trading
        SecurityGroupRule(
            self,
            f"analytics-sg-postgres-ingress-{environment_suffix}",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],
            security_group_id=analytics_sg.id,
            description="Allow PostgreSQL from trading VPC",
            provider=provider_account_b
        )

        # Analytics SG Rules - Egress to Trading
        SecurityGroupRule(
            self,
            f"analytics-sg-egress-{environment_suffix}",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["10.0.0.0/16"],
            security_group_id=analytics_sg.id,
            description="Allow all outbound to trading VPC",
            provider=provider_account_b
        )

        # Network ACLs for Trading VPC
        trading_nacl = NetworkAcl(
            self,
            f"trading-nacl-{environment_suffix}",
            vpc_id=trading_vpc.id,
            tags={
                "Name": f"trading-nacl-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        # Trading NACL - Ingress HTTPS
        NetworkAclRule(
            self,
            f"trading-nacl-https-ingress-{environment_suffix}",
            network_acl_id=trading_nacl.id,
            rule_number=100,
            egress=False,
            protocol="tcp",
            rule_action="allow",
            cidr_block="10.1.0.0/16",
            from_port=443,
            to_port=443,
            provider=provider_account_a
        )

        # Trading NACL - Ingress PostgreSQL
        NetworkAclRule(
            self,
            f"trading-nacl-postgres-ingress-{environment_suffix}",
            network_acl_id=trading_nacl.id,
            rule_number=110,
            egress=False,
            protocol="tcp",
            rule_action="allow",
            cidr_block="10.1.0.0/16",
            from_port=5432,
            to_port=5432,
            provider=provider_account_a
        )

        # Trading NACL - Ingress Ephemeral Ports
        NetworkAclRule(
            self,
            f"trading-nacl-ephemeral-ingress-{environment_suffix}",
            network_acl_id=trading_nacl.id,
            rule_number=120,
            egress=False,
            protocol="tcp",
            rule_action="allow",
            cidr_block="10.1.0.0/16",
            from_port=1024,
            to_port=65535,
            provider=provider_account_a
        )

        # Trading NACL - Egress All to Analytics
        NetworkAclRule(
            self,
            f"trading-nacl-egress-{environment_suffix}",
            network_acl_id=trading_nacl.id,
            rule_number=100,
            egress=True,
            protocol="-1",
            rule_action="allow",
            cidr_block="10.1.0.0/16",
            from_port=0,
            to_port=0,
            provider=provider_account_a
        )

        # Associate Trading Subnets with NACL
        NetworkAclAssociation(
            self,
            f"trading-subnet-1-nacl-association-{environment_suffix}",
            subnet_id=trading_subnet_1.id,
            network_acl_id=trading_nacl.id,
            provider=provider_account_a
        )

        NetworkAclAssociation(
            self,
            f"trading-subnet-2-nacl-association-{environment_suffix}",
            subnet_id=trading_subnet_2.id,
            network_acl_id=trading_nacl.id,
            provider=provider_account_a
        )

        NetworkAclAssociation(
            self,
            f"trading-subnet-3-nacl-association-{environment_suffix}",
            subnet_id=trading_subnet_3.id,
            network_acl_id=trading_nacl.id,
            provider=provider_account_a
        )

        # Network ACLs for Analytics VPC
        analytics_nacl = NetworkAcl(
            self,
            f"analytics-nacl-{environment_suffix}",
            vpc_id=analytics_vpc.id,
            tags={
                "Name": f"analytics-nacl-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        # Analytics NACL - Ingress HTTPS
        NetworkAclRule(
            self,
            f"analytics-nacl-https-ingress-{environment_suffix}",
            network_acl_id=analytics_nacl.id,
            rule_number=100,
            egress=False,
            protocol="tcp",
            rule_action="allow",
            cidr_block="10.0.0.0/16",
            from_port=443,
            to_port=443,
            provider=provider_account_b
        )

        # Analytics NACL - Ingress PostgreSQL
        NetworkAclRule(
            self,
            f"analytics-nacl-postgres-ingress-{environment_suffix}",
            network_acl_id=analytics_nacl.id,
            rule_number=110,
            egress=False,
            protocol="tcp",
            rule_action="allow",
            cidr_block="10.0.0.0/16",
            from_port=5432,
            to_port=5432,
            provider=provider_account_b
        )

        # Analytics NACL - Ingress Ephemeral Ports
        NetworkAclRule(
            self,
            f"analytics-nacl-ephemeral-ingress-{environment_suffix}",
            network_acl_id=analytics_nacl.id,
            rule_number=120,
            egress=False,
            protocol="tcp",
            rule_action="allow",
            cidr_block="10.0.0.0/16",
            from_port=1024,
            to_port=65535,
            provider=provider_account_b
        )

        # Analytics NACL - Egress All to Trading
        NetworkAclRule(
            self,
            f"analytics-nacl-egress-{environment_suffix}",
            network_acl_id=analytics_nacl.id,
            rule_number=100,
            egress=True,
            protocol="-1",
            rule_action="allow",
            cidr_block="10.0.0.0/16",
            from_port=0,
            to_port=0,
            provider=provider_account_b
        )

        # Associate Analytics Subnets with NACL
        NetworkAclAssociation(
            self,
            f"analytics-subnet-1-nacl-association-{environment_suffix}",
            subnet_id=analytics_subnet_1.id,
            network_acl_id=analytics_nacl.id,
            provider=provider_account_b
        )

        NetworkAclAssociation(
            self,
            f"analytics-subnet-2-nacl-association-{environment_suffix}",
            subnet_id=analytics_subnet_2.id,
            network_acl_id=analytics_nacl.id,
            provider=provider_account_b
        )

        NetworkAclAssociation(
            self,
            f"analytics-subnet-3-nacl-association-{environment_suffix}",
            subnet_id=analytics_subnet_3.id,
            network_acl_id=analytics_nacl.id,
            provider=provider_account_b
        )

        # S3 Bucket for VPC Flow Logs (Trading)
        trading_flow_logs_bucket = S3Bucket(
            self,
            f"trading-flow-logs-{environment_suffix}",
            bucket=f"trading-flow-logs-{environment_suffix}-{self.unique_suffix}",
            force_destroy=True,
            tags={
                "Name": f"trading-flow-logs-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        S3BucketPublicAccessBlock(
            self,
            f"trading-flow-logs-public-access-block-{environment_suffix}",
            bucket=trading_flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            provider=provider_account_a
        )

        # S3 Bucket for VPC Flow Logs (Analytics)
        analytics_flow_logs_bucket = S3Bucket(
            self,
            f"analytics-flow-logs-{environment_suffix}",
            bucket=f"analytics-flow-logs-{environment_suffix}-{self.unique_suffix}",
            force_destroy=True,
            tags={
                "Name": f"analytics-flow-logs-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        S3BucketPublicAccessBlock(
            self,
            f"analytics-flow-logs-public-access-block-{environment_suffix}",
            bucket=analytics_flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            provider=provider_account_b
        )

        # VPC Flow Logs for Trading VPC
        FlowLog(
            self,
            f"trading-vpc-flow-log-{environment_suffix}",
            vpc_id=trading_vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=trading_flow_logs_bucket.arn,
            max_aggregation_interval=60,
            tags={
                "Name": f"trading-vpc-flow-log-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        # VPC Flow Logs for Analytics VPC
        FlowLog(
            self,
            f"analytics-vpc-flow-log-{environment_suffix}",
            vpc_id=analytics_vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=analytics_flow_logs_bucket.arn,
            max_aggregation_interval=60,
            tags={
                "Name": f"analytics-vpc-flow-log-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        # VPC Endpoints for S3 (Trading) - COMMENTED OUT DUE TO ACCOUNT LIMIT
        # Note: Account has reached the maximum number of VPC endpoints
        # If you need this, delete existing VPC endpoints or request a limit increase
        # VpcEndpoint(
        #     self,
        #     f"trading-s3-endpoint-{environment_suffix}",
        #     vpc_id=trading_vpc.id,
        #     service_name="com.amazonaws.us-east-1.s3",
        #     route_table_ids=[trading_route_table.id],
        #     tags={
        #         "Name": f"trading-s3-endpoint-{environment_suffix}",
        #         "CostCenter": "trading",
        #         "Environment": environment_suffix
        #     },
        #     provider=provider_account_a
        # )

        # VPC Endpoints for DynamoDB (Trading) - COMMENTED OUT DUE TO ACCOUNT LIMIT
        # VpcEndpoint(
        #     self,
        #     f"trading-dynamodb-endpoint-{environment_suffix}",
        #     vpc_id=trading_vpc.id,
        #     service_name="com.amazonaws.us-east-1.dynamodb",
        #     route_table_ids=[trading_route_table.id],
        #     tags={
        #         "Name": f"trading-dynamodb-endpoint-{environment_suffix}",
        #         "CostCenter": "trading",
        #         "Environment": environment_suffix
        #     },
        #     provider=provider_account_a
        # )

        # VPC Endpoints for S3 (Analytics) - COMMENTED OUT DUE TO ACCOUNT LIMIT
        # VpcEndpoint(
        #     self,
        #     f"analytics-s3-endpoint-{environment_suffix}",
        #     vpc_id=analytics_vpc.id,
        #     service_name="com.amazonaws.us-east-1.s3",
        #     route_table_ids=[analytics_route_table.id],
        #     tags={
        #         "Name": f"analytics-s3-endpoint-{environment_suffix}",
        #         "CostCenter": "analytics",
        #         "Environment": environment_suffix
        #     },
        #     provider=provider_account_b
        # )

        # VPC Endpoints for DynamoDB (Analytics) - COMMENTED OUT DUE TO ACCOUNT LIMIT
        # VpcEndpoint(
        #     self,
        #     f"analytics-dynamodb-endpoint-{environment_suffix}",
        #     vpc_id=analytics_vpc.id,
        #     service_name="com.amazonaws.us-east-1.dynamodb",
        #     route_table_ids=[analytics_route_table.id],
        #     tags={
        #         "Name": f"analytics-dynamodb-endpoint-{environment_suffix}",
        #         "CostCenter": "analytics",
        #         "Environment": environment_suffix
        #     },
        #     provider=provider_account_b
        # )

        # IAM Role for AWS Config
        config_role = IamRole(
            self,
            f"config-role-{environment_suffix}",
            name=f"config-role-{environment_suffix}-{self.unique_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"config-role-{environment_suffix}",
                "CostCenter": "shared",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        # Attach AWS managed policy for Config
        IamRolePolicyAttachment(
            self,
            f"config-role-policy-attachment-{environment_suffix}",
            role=config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            provider=provider_account_a
        )

        # S3 Bucket for AWS Config
        config_bucket = S3Bucket(
            self,
            f"config-bucket-{environment_suffix}",
            bucket=f"config-bucket-{environment_suffix}-{self.unique_suffix}",
            force_destroy=True,
            tags={
                "Name": f"config-bucket-{environment_suffix}",
                "CostCenter": "shared",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        S3BucketPublicAccessBlock(
            self,
            f"config-bucket-public-access-block-{environment_suffix}",
            bucket=config_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            provider=provider_account_a
        )

        # IAM Policy for Config to write to S3
        IamRolePolicy(
            self,
            f"config-s3-policy-{environment_suffix}",
            name=f"config-s3-policy-{environment_suffix}",
            role=config_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["s3:PutObject", "s3:GetBucketVersioning"],
                    "Resource": [
                        config_bucket.arn,
                        f"{config_bucket.arn}/*"
                    ]
                }]
            }),
            provider=provider_account_a
        )

        # AWS Config Configuration Recorder - COMMENTED OUT DUE TO ACCOUNT LIMIT
        # Note: Account has reached the maximum number of configuration recorders (1)
        # If you need this, delete existing config recorder or use existing one
        # config_recorder = ConfigConfigurationRecorder(
        #     self,
        #     f"config-recorder-{environment_suffix}",
        #     name=f"config-recorder-{environment_suffix}",
        #     role_arn=config_role.arn,
        #     recording_group={
        #         "all_supported": True,
        #         "include_global_resource_types": True
        #     },
        #     provider=provider_account_a
        # )

        # AWS Config Delivery Channel - COMMENTED OUT DUE TO CONFIG RECORDER LIMIT
        # config_delivery_channel = ConfigDeliveryChannel(
        #     self,
        #     f"config-delivery-channel-{environment_suffix}",
        #     name=f"config-delivery-channel-{environment_suffix}",
        #     s3_bucket_name=config_bucket.bucket,
        #     depends_on=[config_recorder],
        #     provider=provider_account_a
        # )

        # AWS Config Recorder Status - COMMENTED OUT DUE TO CONFIG RECORDER LIMIT
        # ConfigConfigurationRecorderStatus(
        #     self,
        #     f"config-recorder-status-{environment_suffix}",
        #     name=config_recorder.name,
        #     is_enabled=True,
        #     depends_on=[config_delivery_channel],
        #     provider=provider_account_a
        # )

        # AWS Config Rule for VPC Peering Compliance - COMMENTED OUT DUE TO CONFIG RECORDER LIMIT
        # ConfigConfigRule(
        #     self,
        #     f"vpc-peering-compliance-rule-{environment_suffix}",
        #     name=f"vpc-peering-compliance-rule-{environment_suffix}",
        #     source={
        #         "owner": "AWS",
        #         "source_identifier": "VPC_PEERING_DNS_RESOLUTION_CHECK"
        #     },
        #     depends_on=[config_recorder],
        #     provider=provider_account_a
        # )

        # CloudWatch Alarm for Unusual Network Traffic (Trading VPC)
        CloudwatchMetricAlarm(
            self,
            f"trading-vpc-high-traffic-alarm-{environment_suffix}",
            alarm_name=f"trading-vpc-high-traffic-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="BytesOut",
            namespace="AWS/VPC",
            period=300,
            statistic="Sum",
            threshold=1000000000,
            alarm_description="Alert on unusual high network traffic in trading VPC",
            dimensions={
                "VpcId": trading_vpc.id
            },
            tags={
                "Name": f"trading-vpc-high-traffic-alarm-{environment_suffix}",
                "CostCenter": "trading",
                "Environment": environment_suffix
            },
            provider=provider_account_a
        )

        # CloudWatch Alarm for Unusual Network Traffic (Analytics VPC)
        CloudwatchMetricAlarm(
            self,
            f"analytics-vpc-high-traffic-alarm-{environment_suffix}",
            alarm_name=f"analytics-vpc-high-traffic-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="BytesOut",
            namespace="AWS/VPC",
            period=300,
            statistic="Sum",
            threshold=1000000000,
            alarm_description="Alert on unusual high network traffic in analytics VPC",
            dimensions={
                "VpcId": analytics_vpc.id
            },
            tags={
                "Name": f"analytics-vpc-high-traffic-alarm-{environment_suffix}",
                "CostCenter": "analytics",
                "Environment": environment_suffix
            },
            provider=provider_account_b
        )

        # CloudWatch Dashboard for Network Monitoring
        dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/VPC", "BytesIn", {"stat": "Sum", "label": "Trading VPC BytesIn"}],
                            [".", "BytesOut", {"stat": "Sum", "label": "Trading VPC BytesOut"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-east-1",
                        "title": "Trading VPC Network Traffic",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/VPC", "BytesIn", {"stat": "Sum", "label": "Analytics VPC BytesIn"}],
                            [".", "BytesOut", {"stat": "Sum", "label": "Analytics VPC BytesOut"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-east-1",
                        "title": "Analytics VPC Network Traffic",
                        "yAxis": {"left": {"min": 0}}
                    }
                }
            ]
        })

        dashboard = CloudwatchDashboard(
            self,
            f"vpc-peering-dashboard-{environment_suffix}",
            dashboard_name=f"vpc-peering-dashboard-{environment_suffix}",
            dashboard_body=dashboard_body,
            provider=provider_account_a
        )

        # Outputs
        TerraformOutput(
            self,
            "vpc_peering_connection_id",
            value=vpc_peering.id,
            description="VPC Peering Connection ID"
        )

        TerraformOutput(
            self,
            "vpc_peering_status",
            value=vpc_peering.accept_status,
            description="VPC Peering Connection Status"
        )

        TerraformOutput(
            self,
            "trading_route_table_id",
            value=trading_route_table.id,
            description="Trading VPC Route Table ID"
        )

        TerraformOutput(
            self,
            "analytics_route_table_id",
            value=analytics_route_table.id,
            description="Analytics VPC Route Table ID"
        )

        TerraformOutput(
            self,
            "cloudwatch_dashboard_name",
            value=dashboard.dashboard_name,
            description="CloudWatch Dashboard Name for Network Monitoring"
        )

        TerraformOutput(
            self,
            "trading_vpc_id",
            value=trading_vpc.id,
            description="Trading VPC ID"
        )

        TerraformOutput(
            self,
            "analytics_vpc_id",
            value=analytics_vpc.id,
            description="Analytics VPC ID"
        )
