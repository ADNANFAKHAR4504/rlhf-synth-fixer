import aws_cdk as cdk
from aws_cdk import (
  aws_ec2 as ec2,
  aws_iam as iam,
  Stack,
  CfnOutput,
  RemovalPolicy
)
from constructs import Construct


class VpcStack(Stack):
    """VPC Stack for creating networking infrastructure"""

    def __init__(self, scope: Construct, construct_id: str,
                 environment_suffix: str = 'dev', **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC
        self.vpc = ec2.Vpc(
            self,
            f"VPC-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name="PublicSubnet",
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name="PrivateSubnet",
                    cidr_mask=24
                )
            ],
            nat_gateways=1
        )

        # Tag the VPC
        cdk.Tags.of(self.vpc).add("Name", f"VPC-{environment_suffix}")
        cdk.Tags.of(self.vpc).add("Environment", environment_suffix)

        # Create security group for EC2 instance
        self.security_group = ec2.SecurityGroup(
            self,
            f"WebServerSG-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for web server",
            allow_all_outbound=True
        )

        # Add inbound rules
        self.security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(22),
            "SSH access from anywhere"
        )

        self.security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "HTTP access from anywhere"
        )

        # Create key pair name
        key_pair_name = f"keypair-{environment_suffix}"

        # Create key pair
        self.key_pair = ec2.KeyPair(
            self,
            f"KeyPair-{environment_suffix}",
            key_pair_name=key_pair_name,
            type=ec2.KeyPairType.RSA
        )

        # Ensure key pair can be deleted
        self.key_pair.apply_removal_policy(RemovalPolicy.DESTROY)

        # Create IAM role for EC2 instance
        ec2_role = iam.Role(
            self,
            f"EC2Role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )

        # User data script for web server setup
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from AWS CDK VPC Infrastructure</h1>' > /var/www/html/index.html"
        )

        # Create EC2 instance in public subnet with enhanced networking
        self.ec2_instance = ec2.Instance(
            self,
            f"WebServer-{environment_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            security_group=self.security_group,
            key_pair=self.key_pair,
            role=ec2_role,
            user_data=user_data
        )

        # Tag the EC2 instance
        cdk.Tags.of(self.ec2_instance).add("Name", f"WebServer-{environment_suffix}")
        cdk.Tags.of(self.ec2_instance).add("Environment", environment_suffix)

        # Outputs
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )

        CfnOutput(
            self,
            "PublicSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.public_subnets]),
            description="Public Subnet IDs"
        )

        CfnOutput(
            self,
            "PrivateSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.private_subnets]),
            description="Private Subnet IDs"
        )

        CfnOutput(
            self,
            "EC2InstanceId",
            value=self.ec2_instance.instance_id,
            description="EC2 Instance ID"
        )

        CfnOutput(
            self,
            "EC2PublicIP",
            value=self.ec2_instance.instance_public_ip,
            description="EC2 Instance Public IP"
        )

        CfnOutput(
            self,
            "SecurityGroupId",
            value=self.security_group.security_group_id,
            description="Security Group ID"
        )

        CfnOutput(
            self,
            "KeyPairName",
            value=self.key_pair.key_pair_name,
            description="EC2 Key Pair Name"
        )
