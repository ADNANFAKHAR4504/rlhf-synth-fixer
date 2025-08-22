# Ideal AWS CDK Python Infrastructure Implementation

## Overview
This implementation creates a well-structured, production-ready AWS infrastructure using CDK with Python that meets all the specified requirements while following AWS best practices.

## Architecture Components

### VPC Configuration
- **CIDR Block**: 10.0.0.0/16 providing 65,536 IP addresses
- **Availability Zones**: Deployed across 2 AZs for high availability
- **DNS Support**: Enabled both DNS support and DNS hostnames for proper name resolution
- **Internet Gateway**: Automatically provisioned with public subnet configuration

### Subnet Design
- **Two Public Subnets**: /24 subnets (256 IPs each) in separate AZs
- **High Availability**: Resources distributed across multiple zones
- **Auto-assign Public IPs**: Configured for instances in public subnets

### Security Configuration
- **Security Group**: Allows SSH (port 22) access from anywhere (0.0.0.0/0)
- **IMDSv2**: Enforced on EC2 instances for enhanced metadata security
- **Outbound Traffic**: Unrestricted for software updates and patches

### Compute Resources
- **Instance Type**: t3.micro (cost-effective for basic workloads)
- **AMI**: Latest Amazon Linux 2023 with enhanced security features
- **Public IP**: Automatically assigned for internet access
- **Placement**: Strategic placement in first availability zone

### Tagging Strategy
- **Project Tag**: All resources tagged with "Project: CDKSetup"
- **Environment Tag**: Dynamic environment suffix for multi-env deployments
- **Management Tag**: "ManagedBy: CDK" for operational clarity
- **Naming Convention**: Consistent 'cdk-' prefix throughout

## Implementation Code

### Root Application Entry Point (tap.py)

```python
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create a TapStackProps object to pass environment_suffix

props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
```

### Main Infrastructure Stack (lib/tap_stack.py)

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
                    name="cdk-public-subnet",
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
            vpc_subnets=ec2.SubnetSelection(
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

### Package Initialization (lib/__init__.py)

```python
# CDK Infrastructure Package
```

## Code Quality Features

### Structure and Organization
- **Modular Design**: Separate methods for each infrastructure component
- **Type Hints**: Full Python type annotations for better code quality
- **Documentation**: Comprehensive docstrings and inline comments
- **Error Handling**: Proper CDK construct initialization

### AWS Best Practices
- **Resource Tagging**: Comprehensive tagging for cost allocation and management
- **Security**: IMDSv2 enforcement, proper security group configuration
- **Networking**: Proper VPC configuration with internet connectivity
- **Outputs**: All critical resource identifiers exposed as stack outputs

### CDK Best Practices
- **Props Pattern**: Clean parameter passing using dataclass
- **Resource Naming**: Consistent naming with environment suffixes
- **Stack Organization**: Logical grouping of related resources
- **Output Management**: Comprehensive outputs for downstream integration

## Deployment Considerations

### Cost Optimization
- **t3.micro**: Eligible for AWS Free Tier
- **No NAT Gateways**: Public subnets only to minimize costs
- **Minimal Resources**: Only essential components included

### Security Considerations
- **SSH Access**: Wide open for development (should be restricted in production)
- **IMDSv2**: Modern instance metadata service version
- **VPC Isolation**: Network-level isolation from other workloads

### Scalability Features
- **Multi-AZ Design**: Foundation for high availability
- **Subnet Capacity**: Room for growth with /24 subnets
- **Modular Code**: Easy to extend with additional components

## Integration Points

### CI/CD Integration
- **Environment Suffixes**: Support for multiple deployment environments
- **Stack Outputs**: Enable integration with other stacks or tools
- **Tag-based Management**: Support for automated operations

### Monitoring and Operations
- **Resource Tags**: Enable cost tracking and operational dashboards
- **Output Values**: Support for automated configuration management
- **Standard Naming**: Predictable resource identification

## Future Enhancements
This foundation supports easy extension for:
- Load balancers and auto scaling
- Database integration
- Application deployment
- Monitoring and logging
- Private subnet workloads with NAT gateways

The implementation provides a solid foundation for AWS workloads while maintaining simplicity and cost-effectiveness for basic use cases.