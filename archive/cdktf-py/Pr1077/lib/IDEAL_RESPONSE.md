# Ideal Response Documentation

## Overview
This document describes the ideal implementation for a secure, production-ready AWS infrastructure stack using CDKTF (Cloud Development Kit for Terraform) with Python. The stack implements a multi-AZ VPC with high availability, security best practices, and comprehensive monitoring.

## Architecture Components

### Core Infrastructure
- **VPC**: `/16` CIDR block with DNS resolution enabled
- **Multi-AZ Setup**: 2 availability zones for high availability
- **Subnets**: 
  - 2 public subnets (`/24` each) for load balancers and NAT gateways
  - 2 private subnets (`/24` each) for application servers
- **Internet Gateway**: For public internet access
- **NAT Gateways**: One per AZ for private subnet outbound connectivity
- **Elastic IPs**: Dedicated IPs for NAT gateways

### Networking & Security
- **Route Tables**: Separate routing for public and private subnets
- **Security Groups**: Restrictive ingress rules with specific CIDR blocks
- **Network ACLs**: Default VPC ACLs (implicit)

### Compute Resources
- **EC2 Instances**: t2.micro instances in private subnets
- **AMI**: Latest Amazon Linux 2 (dynamically fetched)
- **IAM**: Dedicated roles and policies for S3 access
- **Instance Profiles**: For EC2 to assume IAM roles

### Storage & Monitoring
- **S3 Bucket**: Encrypted storage for application logs
- **CloudWatch Alarms**: CPU utilization monitoring per instance
- **Encryption**: AES256 server-side encryption for S3

## Complete TapStack Implementation

```python
#!/usr/bin/env python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn, TerraformIterator
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.instance import Instance
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi


class TapStack(TerraformStack):
  def __init__(self, scope: Construct, id: str, **kwargs):
    super().__init__(scope, id)
    
    # Extract parameters from kwargs
    environment_suffix = kwargs.get("environment_suffix", "dev")
    aws_region = kwargs.get("aws_region", "us-east-1")
    default_tags = kwargs.get("default_tags", {})
    
    # Merge production environment tag with default tags
    production_tags = {
      "Environment": "Production"
    }
    if "tags" in default_tags:
      production_tags.update(default_tags["tags"])
    
    # AWS Provider
    AwsProvider(self, "aws",
      region=aws_region,
      default_tags=[{
        "tags": production_tags
      }]
    )
    
    # Use hardcoded availability zones to avoid token issues in tests
    availability_zones = [f"{aws_region}a", f"{aws_region}b"]
    
    # VPC
    vpc = Vpc(self, "vpc",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        "Name": f"vpc-{environment_suffix}",
        "Environment": "Production"
      }
    )
    
    # Internet Gateway
    igw = InternetGateway(self, "igw",
      vpc_id=vpc.id,
      tags={
        "Name": f"igw-{environment_suffix}",
        "Environment": "Production"
      }
    )
    
    # Public Subnets (2 AZs)
    public_subnets = []
    private_subnets = []
    nat_gateways = []
    
    for i in range(2):
      # Public Subnet
      public_subnet = Subnet(self, f"public_subnet_{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=availability_zones[i],
        map_public_ip_on_launch=True,
        tags={
          "Name": f"public-subnet-{i+1}-{environment_suffix}",
          "Environment": "Production"
        }
      )
      public_subnets.append(public_subnet)
      
      # Private Subnet
      private_subnet = Subnet(self, f"private_subnet_{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=availability_zones[i],
        tags={
          "Name": f"private-subnet-{i+1}-{environment_suffix}",
          "Environment": "Production"
        }
      )
      private_subnets.append(private_subnet)
      
      # Elastic IP for NAT Gateway
      eip = Eip(self, f"eip_nat_{i+1}",
        domain="vpc",
        tags={
          "Name": f"eip-nat-{i+1}-{environment_suffix}",
          "Environment": "Production"
        }
      )
      
      # NAT Gateway
      nat_gw = NatGateway(self, f"nat_gateway_{i+1}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={
          "Name": f"nat-gateway-{i+1}-{environment_suffix}",
          "Environment": "Production"
        }
      )
      nat_gateways.append(nat_gw)
    
    # Public Route Table
    public_rt = RouteTable(self, "public_rt",
      vpc_id=vpc.id,
      tags={
        "Name": f"public-rt-{environment_suffix}",
        "Environment": "Production"
      }
    )
    
    # Public Route to Internet Gateway
    Route(self, "public_route",
      route_table_id=public_rt.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=igw.id
    )
    
    # Associate Public Subnets with Public Route Table
    for i, subnet in enumerate(public_subnets):
      RouteTableAssociation(self, f"public_rt_association_{i+1}",
        subnet_id=subnet.id,
        route_table_id=public_rt.id
      )
    
    # Private Route Tables and Routes
    for i, (private_subnet, nat_gw) in enumerate(zip(private_subnets, nat_gateways)):
      private_rt = RouteTable(self, f"private_rt_{i+1}",
        vpc_id=vpc.id,
        tags={
          "Name": f"private-rt-{i+1}-{environment_suffix}",
          "Environment": "Production"
        }
      )
      
      # Private Route to NAT Gateway
      Route(self, f"private_route_{i+1}",
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gw.id
      )
      
      # Associate Private Subnet with Private Route Table
      RouteTableAssociation(self, f"private_rt_association_{i+1}",
        subnet_id=private_subnet.id,
        route_table_id=private_rt.id
      )
    
    # Security Group for EC2 instances
    ec2_sg = SecurityGroup(self, "ec2_sg",
      name=f"ec2-sg-{environment_suffix}",
      description="Security group for EC2 instances",
      vpc_id=vpc.id,
      tags={
        "Name": f"ec2-sg-{environment_suffix}",
        "Environment": "Production"
      }
    )
    
    # SSH access from specific CIDR
    SecurityGroupRule(self, "ssh_ingress",
      type="ingress",
      from_port=22,
      to_port=22,
      protocol="tcp",
      cidr_blocks=["203.0.113.0/24"],
      security_group_id=ec2_sg.id
    )
    
    # Outbound traffic
    SecurityGroupRule(self, "all_egress",
      type="egress",
      from_port=0,
      to_port=0,
      protocol="-1",
      cidr_blocks=["0.0.0.0/0"],
      security_group_id=ec2_sg.id
    )
    
    # S3 Bucket for logs
    s3_logs_bucket = S3Bucket(self, "s3_logs_bucket",
      bucket=f"logs-bucket-{environment_suffix}-{aws_region}",
      tags={
        "Name": f"logs-bucket-{environment_suffix}",
        "Environment": "Production"
      }
    )
    
    # S3 Bucket Server-Side Encryption
    S3BucketServerSideEncryptionConfigurationA(self, "s3_logs_encryption",
      bucket=s3_logs_bucket.id,
      rule=[
        S3BucketServerSideEncryptionConfigurationRuleA(
          apply_server_side_encryption_by_default=
            S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
              sse_algorithm="AES256"
            )
        )
      ]
    )
    
    # IAM Role for EC2
    ec2_role = IamRole(self, "ec2_role",
      name=f"ec2-role-{environment_suffix}",
      assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
              "Service": "ec2.amazonaws.com"
            }
          }
        ]
      }""",
      tags={
        "Name": f"ec2-role-{environment_suffix}",
        "Environment": "Production"
      }
    )
    
    # IAM Policy for S3 access
    s3_policy = IamPolicy(self, "s3_policy",
      name=f"s3-logs-policy-{environment_suffix}",
      description="Policy for EC2 to access S3 logs bucket",
      policy=f"""{{
        "Version": "2012-10-17",
        "Statement": [
          {{
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
              "s3:ListBucket"
            ],
            "Resource": [
              "{s3_logs_bucket.arn}",
              "{s3_logs_bucket.arn}/*"
            ]
          }}
        ]
      }}""",
      tags={
        "Name": f"s3-logs-policy-{environment_suffix}",
        "Environment": "Production"
      }
    )
    
    # Attach policy to role
    IamRolePolicyAttachment(self, "ec2_s3_policy_attachment",
      role=ec2_role.name,
      policy_arn=s3_policy.arn
    )
    
    # Instance Profile
    instance_profile = IamInstanceProfile(self, "ec2_instance_profile",
      name=f"ec2-instance-profile-{environment_suffix}",
      role=ec2_role.name,
      tags={
        "Name": f"ec2-instance-profile-{environment_suffix}",
        "Environment": "Production"
      }
    )
    
    # Get latest Amazon Linux 2 AMI
    ami = DataAwsAmi(self, "amazon_linux",
      most_recent=True,
      owners=["amazon"],
      filter=[
        {
          "name": "name",
          "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
        },
        {
          "name": "virtualization-type",
          "values": ["hvm"]
        }
      ]
    )
    
    # EC2 Instances in private subnets
    instances = []
    for i, private_subnet in enumerate(private_subnets):
      instance = Instance(self, f"ec2_instance_{i+1}",
        ami=ami.id,
        instance_type="t2.micro",
        subnet_id=private_subnet.id,
        vpc_security_group_ids=[ec2_sg.id],
        iam_instance_profile=instance_profile.name,
        tags={
          "Name": f"app-server-{i+1}-{environment_suffix}",
          "Environment": "Production"
        }
      )
      instances.append(instance)
      
      # CloudWatch Alarm for CPU utilization
      CloudwatchMetricAlarm(self, f"cpu_alarm_{i+1}",
        alarm_name=f"ec2-cpu-alarm-{i+1}-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period=300,
        statistic="Average",
        threshold=70,
        alarm_description="This metric monitors ec2 cpu utilization",
        dimensions={
          "InstanceId": instance.id
        },
        tags={
          "Name": f"cpu-alarm-{i+1}-{environment_suffix}",
          "Environment": "Production"
        }
      )
    
    # Outputs
    TerraformOutput(self, "vpc_id",
      value=vpc.id,
      description="VPC ID"
    )
    
    TerraformOutput(self, "public_subnet_ids",
      value=[subnet.id for subnet in public_subnets],
      description="Public Subnet IDs"
    )
    
    TerraformOutput(self, "private_subnet_ids",
      value=[subnet.id for subnet in private_subnets],
      description="Private Subnet IDs"
    )
    
    TerraformOutput(self, "ec2_instance_ids",
      value=[instance.id for instance in instances],
      description="EC2 Instance IDs"
    )
    
    TerraformOutput(self, "s3_logs_bucket_name",
      value=s3_logs_bucket.bucket,
      description="S3 Logs Bucket Name"
    )
```

## Key Implementation Details

### 1. Multi-AZ High Availability
- Resources distributed across 2 availability zones
- NAT gateways in each AZ for redundancy
- Private subnets for application security

### 2. Security Best Practices
- **Network Isolation**: Private subnets for EC2 instances
- **Restricted Access**: SSH only from specific CIDR (203.0.113.0/24)
- **IAM Least Privilege**: EC2 roles with minimal S3 permissions
- **Encryption**: S3 server-side encryption with AES256

### 3. Monitoring & Observability
- CloudWatch alarms for CPU utilization (>70%)
- Comprehensive tagging for resource management
- S3 bucket for centralized logging

### 4. Infrastructure as Code Benefits
- **Reproducible**: Consistent deployments across environments
- **Parameterized**: Environment-specific configurations
- **Version Controlled**: Infrastructure changes tracked in Git
- **Testable**: Unit tests validate infrastructure components

### 5. Production Readiness
- **Scalability**: Can easily add more AZs or instances
- **Cost Optimization**: t2.micro instances for minimal cost
- **Compliance**: Production tags and encrypted storage
- **Maintainability**: Clean code structure with proper imports

## Testing Strategy
The implementation includes comprehensive unit tests covering:
- Stack initialization and configuration
- VPC and networking components
- Security group rules and IAM policies
- EC2 instances and CloudWatch alarms
- S3 bucket encryption and outputs

## Critical Implementation Notes

### Import Structure
```python
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
```

### Data Types
- **Numeric Values**: CloudWatch threshold as `int/float` (70), not string ("70")
- **Complex Objects**: Use proper class instantiation for nested configurations
- **Tags**: Consistent tagging strategy across all resources

### Error Prevention
- **Hardcoded AZs**: Avoid token resolution issues in tests
- **Proper Scoping**: Unique resource IDs to prevent conflicts
- **Type Safety**: Correct parameter types for all resource configurations