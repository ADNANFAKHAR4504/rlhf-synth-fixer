# CloudFormation Development Environment Prompt

## Objective
You are an AWS CloudFormation expert. Your task is to write a **YAML CloudFormation template** that sets up a basic development environment in the **us-east-1** region.

## Requirements

### 1. VPC Configuration
- Create a VPC with CIDR block `10.0.0.0/16`
- Enable DNS support and DNS hostnames

### 2. Network Subnets
Create two public subnets:
- **Subnet 1**: CIDR `10.0.1.0/24` (in first AZ)
- **Subnet 2**: CIDR `10.0.2.0/24` (in second AZ)
- Both subnets must auto-assign public IPs

### 3. EC2 Instances
- Launch **one EC2 instance** in each public subnet
- Each instance must have a **public IP address**
- Use **t2.micro** instance type
- Use latest **Amazon Linux 2 AMI** for us-east-1

### 4. Security Configuration
- Create a security group allowing:
- **SSH (port 22)** from anywhere (`0.0.0.0/0`)
- **HTTP (port 80)** from anywhere (`0.0.0.0/0`)
- Attach this security group to both instances

### 5. Internet Connectivity
- Create and attach an **Internet Gateway** to the VPC
- Configure a **route table** to route traffic from both subnets to the Internet Gateway
- Associate both subnets with the route table

### 6. Parameters
- Define a **KeyPair parameter** to enable SSH access to instances
- Parameter must be of type `AWS::EC2::KeyPair::KeyName`

### 7. Mappings
- Use **mappings** to define the AMI ID for us-east-1 region
- AMI: `ami-0c02fb55956c7d316` (Amazon Linux 2)

### 8. Outputs
Return the following in the Outputs section:
- **Public DNS name** of EC2 Instance 1
- **Public DNS name** of EC2 Instance 2

### 9. Resource Tagging
- Tag **all resources** with:
- Key: `Environment`
- Value: `Development`

## Success Criteria
- Template must be **fully deployable** in us-east-1 with no errors
- All instances must be accessible via SSH and HTTP
- All resources must be properly tagged
- Template must follow CloudFormation best practices
- Use proper YAML syntax and CloudFormation intrinsic functions

## Template Structure
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
Basic Development Environment in us-east-1 with two public subnets,
EC2 instances, security groups, Internet access, and tagging.

Parameters:
# KeyPair parameter here

Mappings:
# AMI mappings here

Resources:
# All AWS resources here

Outputs:
# Instance DNS outputs here
```

The output should be a YAML CloudFormation template that satisfies all the requirements above.

All resources must be tagged as specified.

Use parameters where appropriate (e.g., for KeyName).