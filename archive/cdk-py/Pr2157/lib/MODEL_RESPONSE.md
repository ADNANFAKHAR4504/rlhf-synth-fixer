# AWS VPC Infrastructure with CDK Python Implementation

I'll create a complete AWS VPC infrastructure using CDK Python that meets all your requirements. This implementation follows AWS best practices and incorporates modern networking features.

## Architecture Overview

The infrastructure creates a robust VPC setup with:
- VPC with 10.0.0.0/16 CIDR
- Multi-AZ deployment with public and private subnets
- Internet Gateway and NAT Gateway for connectivity
- EC2 instance with proper security groups
- Enhanced networking capabilities

## Implementation

### lib/vpc_stack.py

```python
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_iam as iam,
    Stack
)
from constructs import Construct
from typing import Optional


class VpcStack(Stack):
    """VPC Stack for creating networking infrastructure"""

    def __init__(self, scope: Construct, construct_id: str, 
                 environment_suffix: str = 'dev', **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC
        self.vpc = ec2.Vpc(
            self, 
            f"VPC-{environment_suffix}",
            cidr="10.0.0.0/16",
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
            nat_gateways=1,
            tags={
                "Name": f"VPC-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

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

        # Create key pair (you need to specify existing key pair name)
        key_pair_name = self.node.try_get_context("keyPairName") or "my-key-pair"

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
            key_name=key_pair_name,
            role=ec2_role,
            user_data=user_data,
            source_dest_check=False,
            tags={
                "Name": f"WebServer-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Outputs
        cdk.CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )

        cdk.CfnOutput(
            self,
            "PublicSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.public_subnets]),
            description="Public Subnet IDs"
        )

        cdk.CfnOutput(
            self,
            "PrivateSubnetIds", 
            value=",".join([subnet.subnet_id for subnet in self.vpc.private_subnets]),
            description="Private Subnet IDs"
        )

        cdk.CfnOutput(
            self,
            "EC2InstanceId",
            value=self.ec2_instance.instance_id,
            description="EC2 Instance ID"
        )

        cdk.CfnOutput(
            self,
            "EC2PublicIP",
            value=self.ec2_instance.instance_public_ip,
            description="EC2 Instance Public IP"
        )

        cdk.CfnOutput(
            self,
            "SecurityGroupId",
            value=self.security_group.security_group_id,
            description="Security Group ID"
        )
```

### lib/tap_stack.py (Updated)

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from .vpc_stack import VpcStack


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
      environment_suffix (Optional[str]): An optional suffix to identify the 
      deployment environment (e.g., 'dev', 'prod').
      **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
      environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties, 
      CDK context, or defaults to 'dev'.
    Note:
      - Do NOT create AWS resources directly in this stack.
      - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the 
        stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create VPC infrastructure stack
        self.vpc_stack = VpcStack(
            self,
            f"VpcStack-{environment_suffix}",
            environment_suffix=environment_suffix
        )
```

## Key Features Implemented

### 1. VPC Configuration
- **CIDR Block**: 10.0.0.0/16 as requested
- **Multi-AZ**: Automatically distributes across 2 availability zones
- **DNS Support**: Enabled DNS hostnames and resolution
- **Enhanced Networking**: Uses modern VPC features

### 2. Subnet Architecture
- **Public Subnets**: /24 CIDR blocks with internet gateway routes
- **Private Subnets**: /24 CIDR blocks with NAT gateway routes
- **Automatic Distribution**: CDK automatically distributes subnets across AZs

### 3. Internet Connectivity
- **Internet Gateway**: Automatically created and attached
- **NAT Gateway**: Single NAT gateway with Elastic IP for cost optimization
- **Route Tables**: Properly configured for public and private traffic

### 4. EC2 Instance Features
- **Instance Type**: t3.micro with enhanced networking capabilities
- **Placement**: Deployed in public subnet for direct internet access
- **AMI**: Latest Amazon Linux 2 with security updates
- **User Data**: Automated web server setup with Apache
- **IAM Role**: Includes Systems Manager access for management

### 5. Security Configuration
- **Security Group**: Allows SSH (22) and HTTP (80) from anywhere
- **IAM Role**: Follows principle of least privilege
- **Key Pair**: Configurable via CDK context

### 6. Modern AWS Features
- **Enhanced Networking**: Uses t3 instance type with enhanced networking
- **Systems Manager**: Instance configured for Session Manager access
- **Tagging Strategy**: Comprehensive tagging for resource management
- **Outputs**: All important resource identifiers exported

## Deployment Instructions

1. **Prerequisites**:
   - AWS CDK installed and configured
   - AWS credentials configured
   - Existing EC2 Key Pair (or create one)

2. **Set Key Pair Context**:
   ```bash
   cdk deploy -c keyPairName=your-key-pair-name
   ```

3. **Deploy**:
   ```bash
   cdk deploy TapStackdev
   ```

## Cost Optimization Features

- Single NAT Gateway instead of one per AZ
- t3.micro instances for cost-effective compute
- Minimal security group rules
- Resource tagging for cost allocation

This implementation provides a production-ready VPC infrastructure that meets all requirements while incorporating modern AWS networking capabilities and best practices.