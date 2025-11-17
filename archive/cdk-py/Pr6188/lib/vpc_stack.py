"""VPC Stack for production payment processing infrastructure.

This stack creates a VPC with public and private subnets across 3 availability zones,
NAT instances for cost optimization, custom Network ACLs, VPC Flow Logs, and VPC endpoints.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Tags,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct


class VpcStackProps:
    """Properties for VPC Stack.

    Attributes:
        environment_suffix: Unique suffix for resource naming (required for PR environments)
    """

    def __init__(self, environment_suffix: Optional[str] = None):
        self.environment_suffix = environment_suffix or "dev"


class VpcStack(Stack):
    """Creates production VPC infrastructure with strict security controls."""

    # pylint: disable=too-many-branches
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[VpcStackProps] = None,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        props = props or VpcStackProps()
        env_suffix = props.environment_suffix

        # Standard tags for all resources
        standard_tags = {
            "Environment": "production",
            "Team": "platform",
            "CostCenter": "engineering"
        }

        # Create VPC with custom CIDR
        vpc = ec2.Vpc(
            self,
            f"PaymentVpc-{env_suffix}",
            vpc_name=f"payment-vpc-{env_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.50.0.0/16"),
            max_azs=3,
            nat_gateways=0,  # We'll use NAT instances instead
            subnet_configuration=[],  # We'll create subnets manually
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Apply standard tags to VPC
        for key, value in standard_tags.items():
            Tags.of(vpc).add(key, value)

        # Get availability zones
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # Create Internet Gateway
        igw = ec2.CfnInternetGateway(
            self,
            f"InternetGateway-{env_suffix}",
            tags=[
                {"key": "Name", "value": f"payment-igw-{env_suffix}"},
                {"key": "Environment", "value": "production"},
                {"key": "Team", "value": "platform"},
                {"key": "CostCenter", "value": "engineering"}
            ]
        )

        ec2.CfnVPCGatewayAttachment(
            self,
            f"VpcGatewayAttachment-{env_suffix}",
            vpc_id=vpc.vpc_id,
            internet_gateway_id=igw.ref
        )

        # Create public subnets
        public_subnets = []
        public_cidrs = ["10.50.1.0/24", "10.50.2.0/24", "10.50.3.0/24"]

        for idx, (az, cidr) in enumerate(zip(azs, public_cidrs)):
            subnet = ec2.Subnet(
                self,
                f"PublicSubnet{idx+1}-{env_suffix}",
                vpc_id=vpc.vpc_id,
                availability_zone=az,
                cidr_block=cidr,
                map_public_ip_on_launch=True,
            )

            # Apply tags
            Tags.of(subnet).add("Name", f"public-subnet-{idx+1}-{env_suffix}")
            for key, value in standard_tags.items():
                Tags.of(subnet).add(key, value)

            public_subnets.append(subnet)

        # Create private subnets
        private_subnets = []
        private_cidrs = ["10.50.11.0/24", "10.50.12.0/24", "10.50.13.0/24"]

        for idx, (az, cidr) in enumerate(zip(azs, private_cidrs)):
            subnet = ec2.Subnet(
                self,
                f"PrivateSubnet{idx+1}-{env_suffix}",
                vpc_id=vpc.vpc_id,
                availability_zone=az,
                cidr_block=cidr,
                map_public_ip_on_launch=False,
            )

            # Apply tags
            Tags.of(subnet).add("Name", f"private-subnet-{idx+1}-{env_suffix}")
            for key, value in standard_tags.items():
                Tags.of(subnet).add(key, value)

            private_subnets.append(subnet)

        # Create custom Network ACL for public subnets
        public_nacl = ec2.NetworkAcl(
            self,
            f"PublicNetworkAcl-{env_suffix}",
            vpc=vpc,
            network_acl_name=f"public-nacl-{env_suffix}"
        )

        # Apply tags to public NACL
        for key, value in standard_tags.items():
            Tags.of(public_nacl).add(key, value)

        # Public NACL - Inbound rules
        public_nacl.add_entry(
            "AllowHttpInbound",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/8"),
            rule_number=100,
            traffic=ec2.AclTraffic.tcp_port(80),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        public_nacl.add_entry(
            "AllowHttpsInbound",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/8"),
            rule_number=110,
            traffic=ec2.AclTraffic.tcp_port(443),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        public_nacl.add_entry(
            "AllowSshInbound",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/8"),
            rule_number=120,
            traffic=ec2.AclTraffic.tcp_port(22),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        public_nacl.add_entry(
            "AllowEphemeralInbound",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/8"),
            rule_number=130,
            traffic=ec2.AclTraffic.tcp_port_range(1024, 65535),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Public NACL - Outbound rules
        public_nacl.add_entry(
            "AllowAllOutbound",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/8"),
            rule_number=100,
            traffic=ec2.AclTraffic.all_traffic(),
            direction=ec2.TrafficDirection.EGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Associate public subnets with public NACL
        for idx, subnet in enumerate(public_subnets):
            ec2.SubnetNetworkAclAssociation(
                self,
                f"PublicNaclAssoc{idx+1}-{env_suffix}",
                network_acl=public_nacl,
                subnet=subnet
            )

        # Create custom Network ACL for private subnets
        private_nacl = ec2.NetworkAcl(
            self,
            f"PrivateNetworkAcl-{env_suffix}",
            vpc=vpc,
            network_acl_name=f"private-nacl-{env_suffix}"
        )

        # Apply tags to private NACL
        for key, value in standard_tags.items():
            Tags.of(private_nacl).add(key, value)

        # Private NACL - Inbound rules (allow internal VPC traffic)
        private_nacl.add_entry(
            "AllowVpcInbound",
            cidr=ec2.AclCidr.ipv4("10.50.0.0/16"),
            rule_number=100,
            traffic=ec2.AclTraffic.all_traffic(),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Private NACL - Outbound rules (allow internal VPC traffic)
        private_nacl.add_entry(
            "AllowVpcOutbound",
            cidr=ec2.AclCidr.ipv4("10.50.0.0/16"),
            rule_number=100,
            traffic=ec2.AclTraffic.all_traffic(),
            direction=ec2.TrafficDirection.EGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Private NACL - Outbound rules for internet access (ephemeral ports)
        private_nacl.add_entry(
            "AllowInternetOutbound",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/8"),
            rule_number=110,
            traffic=ec2.AclTraffic.all_traffic(),
            direction=ec2.TrafficDirection.EGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Associate private subnets with private NACL
        for idx, subnet in enumerate(private_subnets):
            ec2.SubnetNetworkAclAssociation(
                self,
                f"PrivateNaclAssoc{idx+1}-{env_suffix}",
                network_acl=private_nacl,
                subnet=subnet
            )

        # Security group for NAT instances
        nat_sg = ec2.SecurityGroup(
            self,
            f"NatInstanceSg-{env_suffix}",
            vpc=vpc,
            security_group_name=f"nat-instance-sg-{env_suffix}",
            description="Security group for NAT instances",
            allow_all_outbound=True
        )

        # Apply tags to NAT security group
        for key, value in standard_tags.items():
            Tags.of(nat_sg).add(key, value)

        # Allow traffic from private subnets
        nat_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.50.11.0/24"),
            connection=ec2.Port.all_traffic(),
            description="Allow from private subnet 1"
        )
        nat_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.50.12.0/24"),
            connection=ec2.Port.all_traffic(),
            description="Allow from private subnet 2"
        )
        nat_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.50.13.0/24"),
            connection=ec2.Port.all_traffic(),
            description="Allow from private subnet 3"
        )

        # Get latest Amazon Linux 2 AMI optimized for NAT
        nat_ami = ec2.MachineImage.latest_amazon_linux2(
            edition=ec2.AmazonLinuxEdition.STANDARD,
            virtualization=ec2.AmazonLinuxVirt.HVM,
            storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE
        )

        # IAM role for NAT instances
        nat_role = iam.Role(
            self,
            f"NatInstanceRole-{env_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Role for NAT instances",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )

        # Apply tags to NAT role
        for key, value in standard_tags.items():
            Tags.of(nat_role).add(key, value)

        # Create NAT instances
        nat_instances = []
        for idx, subnet in enumerate(public_subnets):
            # User data to configure NAT
            user_data = ec2.UserData.for_linux()
            user_data.add_commands(
                "#!/bin/bash",
                "echo 1 > /proc/sys/net/ipv4/ip_forward",
                "echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf",
                "sysctl -p /etc/sysctl.conf",
                "/sbin/iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE",
                "/sbin/iptables -F FORWARD",
                "yum install -y iptables-services",
                "systemctl enable iptables",
                "service iptables save"
            )

            nat_instance = ec2.Instance(
                self,
                f"NatInstance{idx+1}-{env_suffix}",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.T3,
                    ec2.InstanceSize.MICRO
                ),
                machine_image=nat_ami,
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(subnets=[subnet]),
                security_group=nat_sg,
                role=nat_role,
                user_data=user_data,
                source_dest_check=False,
            )

            # Apply tags to NAT instance
            Tags.of(nat_instance).add("Name", f"nat-instance-{idx+1}-{env_suffix}")
            for key, value in standard_tags.items():
                Tags.of(nat_instance).add(key, value)

            nat_instances.append(nat_instance)

        # Create route tables for public subnets
        for idx, subnet in enumerate(public_subnets):
            route_table = ec2.CfnRouteTable(
                self,
                f"PublicRouteTable{idx+1}-{env_suffix}",
                vpc_id=vpc.vpc_id,
                tags=[
                    {"key": "Name", "value": f"public-rt-{idx+1}-{env_suffix}"},
                    {"key": "Environment", "value": "production"},
                    {"key": "Team", "value": "platform"},
                    {"key": "CostCenter", "value": "engineering"}
                ]
            )

            # Add route to Internet Gateway
            ec2.CfnRoute(
                self,
                f"PublicRoute{idx+1}-{env_suffix}",
                route_table_id=route_table.ref,
                destination_cidr_block="0.0.0.0/0",
                gateway_id=igw.ref
            )

            # Associate route table with subnet
            ec2.CfnSubnetRouteTableAssociation(
                self,
                f"PublicRtAssoc{idx+1}-{env_suffix}",
                route_table_id=route_table.ref,
                subnet_id=subnet.subnet_id
            )

        # Create route tables for private subnets
        for idx, (subnet, nat_instance) in enumerate(zip(private_subnets, nat_instances)):
            route_table = ec2.CfnRouteTable(
                self,
                f"PrivateRouteTable{idx+1}-{env_suffix}",
                vpc_id=vpc.vpc_id,
                tags=[
                    {"key": "Name", "value": f"private-rt-{idx+1}-{env_suffix}"},
                    {"key": "Environment", "value": "production"},
                    {"key": "Team", "value": "platform"},
                    {"key": "CostCenter", "value": "engineering"}
                ]
            )

            # Add route to NAT instance
            ec2.CfnRoute(
                self,
                f"PrivateRoute{idx+1}-{env_suffix}",
                route_table_id=route_table.ref,
                destination_cidr_block="0.0.0.0/0",
                instance_id=nat_instance.instance_id
            )

            # Associate route table with subnet
            ec2.CfnSubnetRouteTableAssociation(
                self,
                f"PrivateRtAssoc{idx+1}-{env_suffix}",
                route_table_id=route_table.ref,
                subnet_id=subnet.subnet_id
            )

        # Create CloudWatch Log Group for VPC Flow Logs
        flow_log_group = logs.LogGroup(
            self,
            f"VpcFlowLogGroup-{env_suffix}",
            log_group_name=f"/aws/vpc/flowlogs/{env_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Apply tags to log group
        for key, value in standard_tags.items():
            Tags.of(flow_log_group).add(key, value)

        # IAM role for VPC Flow Logs
        flow_log_role = iam.Role(
            self,
            f"VpcFlowLogRole-{env_suffix}",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            description="Role for VPC Flow Logs to write to CloudWatch"
        )

        # Apply tags to flow log role
        for key, value in standard_tags.items():
            Tags.of(flow_log_role).add(key, value)

        # Grant permissions to write to CloudWatch Logs
        flow_log_group.grant_write(flow_log_role)

        # Create VPC Flow Logs
        ec2.CfnFlowLog(
            self,
            f"VpcFlowLog-{env_suffix}",
            resource_id=vpc.vpc_id,
            resource_type="VPC",
            traffic_type="ALL",
            log_destination_type="cloud-watch-logs",
            log_group_name=flow_log_group.log_group_name,
            deliver_logs_permission_arn=flow_log_role.role_arn,
            max_aggregation_interval=60,  # 1-minute intervals
            tags=[
                {"key": "Name", "value": f"vpc-flow-log-{env_suffix}"},
                {"key": "Environment", "value": "production"},
                {"key": "Team", "value": "platform"},
                {"key": "CostCenter", "value": "engineering"}
            ]
        )

        # Create S3 VPC Endpoint (Gateway)
        s3_endpoint = ec2.GatewayVpcEndpoint(
            self,
            f"S3VpcEndpoint-{env_suffix}",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnets=private_subnets)]
        )

        # Apply tags to S3 endpoint
        for key, value in standard_tags.items():
            Tags.of(s3_endpoint).add(key, value)

        # Create DynamoDB VPC Endpoint (Gateway)
        dynamodb_endpoint = ec2.GatewayVpcEndpoint(
            self,
            f"DynamoDbVpcEndpoint-{env_suffix}",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[ec2.SubnetSelection(subnets=private_subnets)]
        )

        # Apply tags to DynamoDB endpoint
        for key, value in standard_tags.items():
            Tags.of(dynamodb_endpoint).add(key, value)

        # Store VPC and subnet IDs for reference
        self.vpc = vpc
        self.public_subnets = public_subnets
        self.private_subnets = private_subnets
        self.nat_instances = nat_instances

        # Output important values
        cdk.CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID"
        )

        cdk.CfnOutput(
            self,
            "VpcCidr",
            value=vpc.vpc_cidr_block,
            description="VPC CIDR Block"
        )
