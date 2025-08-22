# AWS CDK Python Infrastructure Response

I'll create a basic AWS environment with a VPC, subnets, EC2 instance, and proper networking components using CDK Python. Here's the implementation:

## lib/tap_stack.py

```python
from dataclasses import dataclass
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput,
)
from constructs import Construct


@dataclass
class TapStackProps:
    """Properties for the TapStack"""
    environment_suffix: str
    env: Optional[cdk.Environment] = None


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, props: TapStackProps, **kwargs) -> None:
        super().__init__(scope, construct_id, env=props.env, **kwargs)
        
        self.environment_suffix = props.environment_suffix
        
        # Create VPC
        self.vpc = self._create_vpc()
        
        # Create Security Group
        self.security_group = self._create_security_group()
        
        # Create EC2 Instance
        self.ec2_instance = self._create_ec2_instance()
        
        # Add outputs
        self._create_outputs()
        
        # Apply tags to all resources
        self._apply_tags()
    
    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public subnets in multiple AZs"""
        vpc = ec2.Vpc(
            self,
            f"cdk-vpc-{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"cdk-public-subnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ],
            nat_gateways=0,  # No NAT gateways needed for this basic setup
            enable_dns_support=True,
            enable_dns_hostnames=True
        )
        
        # Add tags to VPC
        cdk.Tags.of(vpc).add("Name", f"cdk-vpc-{self.environment_suffix}")
        cdk.Tags.of(vpc).add("Project", "CDKSetup")
        
        return vpc
    
    def _create_security_group(self) -> ec2.SecurityGroup:
        """Create security group allowing SSH access"""
        security_group = ec2.SecurityGroup(
            self,
            f"cdk-security-group-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for CDK setup allowing SSH access",
            allow_all_outbound=True
        )
        
        # Allow SSH access from anywhere
        security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(22),
            "Allow SSH access from anywhere"
        )
        
        # Add tags
        cdk.Tags.of(security_group).add("Name", f"cdk-security-group-{self.environment_suffix}")
        cdk.Tags.of(security_group).add("Project", "CDKSetup")
        
        return security_group
    
    def _create_ec2_instance(self) -> ec2.Instance:
        """Create EC2 instance in the first public subnet"""
        
        # Use Amazon Linux 2023 AMI
        ami = ec2.MachineImage.latest_amazon_linux2023()
        
        # Get the first public subnet
        public_subnet = self.vpc.public_subnets[0]
        
        # Create the EC2 instance
        instance = ec2.Instance(
            self,
            f"cdk-ec2-instance-{self.environment_suffix}",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machine_image=ami,
            vpc=self.vpc,
            subnet_selection=ec2.SubnetSelection(
                subnets=[public_subnet]
            ),
            security_group=self.security_group,
            require_imdsv2=True,  # Use IMDSv2 for enhanced security
            associate_public_ip_address=True
        )
        
        # Add tags
        cdk.Tags.of(instance).add("Name", f"cdk-ec2-instance-{self.environment_suffix}")
        cdk.Tags.of(instance).add("Project", "CDKSetup")
        
        return instance
    
    def _create_outputs(self) -> None:
        """Create stack outputs"""
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self,
            "InstanceId",
            value=self.ec2_instance.instance_id,
            description="EC2 Instance ID"
        )
        
        CfnOutput(
            self,
            "InstancePublicIp",
            value=self.ec2_instance.instance_public_ip,
            description="EC2 Instance Public IP"
        )
        
        CfnOutput(
            self,
            "SecurityGroupId",
            value=self.security_group.security_group_id,
            description="Security Group ID"
        )
        
        # Output subnet information
        for i, subnet in enumerate(self.vpc.public_subnets):
            CfnOutput(
                self,
                f"PublicSubnet{i+1}Id",
                value=subnet.subnet_id,
                description=f"Public Subnet {i+1} ID"
            )
    
    def _apply_tags(self) -> None:
        """Apply common tags to all resources in the stack"""
        cdk.Tags.of(self).add("Project", "CDKSetup")
        cdk.Tags.of(self).add("Environment", self.environment_suffix)
        cdk.Tags.of(self).add("ManagedBy", "CDK")
```

## Key Features Implemented:

1. **VPC Configuration**: Created with CIDR 10.0.0.0/16 spanning 2 availability zones
2. **Subnet Setup**: Two public subnets automatically created in different AZs 
3. **EC2 Instance**: t3.micro instance with public IP in the first subnet using Amazon Linux 2023
4. **Internet Gateway**: Automatically created with public subnet configuration
5. **Security Group**: Allows SSH (port 22) access from any IP address (0.0.0.0/0)
6. **Tagging**: All resources tagged with 'Project: CDKSetup' and proper naming convention
7. **Best Practices**: IMDSv2 enabled, DNS support enabled, proper resource naming
8. **High Availability**: Resources deployed across multiple availability zones

The infrastructure follows AWS best practices including:
- Use of the latest Amazon Linux 2023 AMI
- IMDSv2 requirement for enhanced security
- Proper DNS configuration for the VPC
- Resource tagging for cost allocation and management
- Public IP assignment for internet connectivity

All resources use the 'cdk-' naming prefix as requested, and the stack is designed to be easily deployable across different environments using the environment suffix pattern.