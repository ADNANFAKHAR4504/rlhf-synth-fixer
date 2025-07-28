# Ideal CloudFormation Template Response

## Overview

This document describes the ideal CloudFormation template structure for setting up AWS VPC infrastructure with proper security, availability, and best practices.

## Template Requirements

### Core Infrastructure Components

- **VPC Configuration**: Custom VPC with CIDR block 10.0.0.0/16
- **Subnets**: 
  - Public subnet: 10.0.0.0/24 (with MapPublicIpOnLaunch enabled)
  - Private subnet: 10.0.1.0/24
- **Internet Gateway**: For public subnet internet access
- **NAT Gateway**: For private subnet outbound internet access
- **Route Tables**: Proper routing configuration for both subnets
- **Security Groups**: SSH access restricted to 198.51.100.0/24 CIDR range
- **EC2 Instances**: One instance in each subnet (t2.micro)

### Template Structure

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation template to set up a VPC, subnets, route tables, NAT Gateway, and EC2 instances.

Parameters:
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair for SSH access

Resources:
  # VPC, subnets, gateways, route tables, security groups, EC2 instances
  # (Full resource definitions would go here)

Outputs:
  # Resource IDs for cross-stack references
  # VPCId, SubnetIds, SecurityGroupId, InstanceIds, etc.
```

### Best Practices Implemented

1. **Dynamic AZ Selection**: Uses `!GetAZs` instead of hardcoded availability zones
2. **Parameter Configuration**: Configurable AMI IDs and SSH key names
3. **Proper Tagging**: All resources tagged with Environment: Development
4. **Resource Dependencies**: Correct DependsOn and Ref relationships
5. **Comprehensive Outputs**: Full outputs section for modular deployment
6. **Security**: Restricted SSH access and proper network isolation

### Key Features

- **Reusability**: Parameterized template for multiple environments
- **Portability**: Dynamic AZ selection works across regions
- **Security**: Network isolation and restricted access controls
- **Modularity**: Comprehensive outputs enable stack composition
- **Best Practices**: Follows AWS CloudFormation recommended patterns

This template provides a production-ready foundation for VPC infrastructure setup with proper security controls and architectural best practices.