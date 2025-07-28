# CloudFormation Infrastructure Setup Requirements

## Overview

Create AWS CloudFormation infrastructure using YAML format for deployment in the us-east-1 region.

## Infrastructure Requirements

### Template Configuration
- Use AWS CloudFormation YAML format
- Ensure deployment compatibility with us-east-1 region
- Follow logical ID naming convention: `resourceTypePurpose`

### Network Infrastructure

#### VPC Configuration
- Define an Amazon VPC with CIDR block: `10.0.0.0/16`

#### Subnet Configuration
- **Public Subnet**: `10.0.0.0/24`
- **Private Subnet**: `10.0.1.0/24`

#### Internet Access
- Deploy an Internet Gateway and attach it to the VPC
- Establish a Public Route Table with a route to the Internet Gateway
- Associate the public subnet with the Public Route Table
- Create a NAT Gateway for Internet access in the private subnet
- Ensure the private subnet has a Route Table with a route to the NAT Gateway

### Compute Resources

#### EC2 Instances
- Include at least one EC2 instance in each subnet
- Use `t2.micro` instance type for cost considerations
- Configure security groups properly for each instance

#### Security Configuration
- Configure security groups to allow SSH access (port 22) only from the `198.51.100.0/24` IP range

### Resource Management

#### Tagging Strategy
- Ensure all resources are tagged with:
  - **Key**: `Environment`
  - **Value**: `Development`

## Deliverables

- CloudFormation YAML template implementing all requirements
- Template should be deployable and functional
- All resources properly configured with dependencies and associations