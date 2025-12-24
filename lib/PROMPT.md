# AWS Infrastructure as Code Generation

You are an expert AWS Solutions Architect and senior developer specializing in Infrastructure as Code (IaC). Your task is to design and generate a complete, self-contained AWS infrastructure solution based on the user's requirements.

## Problem Statement

You are tasked with setting up a cloud environment using AWS CloudFormation. The requirements are as follows:

1. **VPC and Subnet Configuration**
   - Define a VPC with CIDR block 10.0.0.0/16
   - Create two public and two private subnets distributed across two availability zones
   - Enable DNS support and DNS hostnames in the VPC

2. **Auto Scaling Group Setup**
   - Deploy an EC2 instance in each public subnet
   - These instances should be part of an Auto Scaling Group
   - Ensure there are always two instances running with MinSize, MaxSize, and DesiredCapacity all set to 2

3. **Network Gateway Configuration**
   - Set up a NAT Gateway for the private subnets to enable outbound internet access
   - Configure proper route tables for public and private subnets
   - Attach an Internet Gateway to the VPC

4. **Security Configuration**
   - Configure security groups to allow SSH access to the EC2 instances from IP range 203.0.113.0/24 only
   - Do not allow SSH access from 0.0.0.0/0
   - Use CloudFormation Parameters for the allowed SSH IP range to make the template reusable

## Technical Constraints

- **Tool**: AWS CloudFormation
- **Language**: YAML
- **Region**: us-east-1
- **Template**: Single, self-contained file that can be deployed directly
- **AMI**: Use Mappings section to find the latest Amazon Linux 2 AMI ID for us-east-1 region

## Additional Constraints

- **Region**: The infrastructure must be deployed in the us-east-1 region
- **Resource Naming**: Utilize existing resource naming conventions with prefixes for easy identification
- **Cost Tracking**: Ensure all resources are tagged for cost tracking purposes
- **Availability Zones**: Use us-east-1a and us-east-1b for subnet distribution

## Required Components

### 1. VPC and Networking

- VPC with CIDR 10.0.0.0/16
- 2 Public subnets distributed across us-east-1a and us-east-1b availability zones
- 2 Private subnets distributed across us-east-1a and us-east-1b availability zones
- Internet Gateway attached to VPC
- NAT Gateway in one of the public subnets
- Route tables for public and private subnets

### 2. Auto Scaling Group

- Launch Template with Amazon Linux 2 AMI
- Auto Scaling Group with MinSize=2, MaxSize=2, DesiredCapacity=2
- Instances placed in public subnets
- Security group allowing SSH from specified IP range

### 3. Security and Best Practices

- Security Group with SSH access only from 203.0.113.0/24
- Use Parameters for configurable values
- Use Mappings for AMI lookup
- Apply appropriate tags to all resources

### 4. Resource Tagging Requirements

- **Environment**: Production/Development/Staging
- **Project**: Project identifier
- **Owner**: Team or individual responsible
- **CostCenter**: For cost allocation and tracking
- **Purpose**: Brief description of resource purpose

### 5. Outputs

- VPC ID
- List of Public Subnet IDs
- List of Private Subnet IDs

## Deliverables

Generate a complete CloudFormation YAML template that:

1. **Is immediately deployable** - No placeholder text or manual modifications required
2. **Follows AWS best practices** - Proper security groups, IAM roles, and resource tagging
3. **Uses dynamic references** - Parameters, Mappings, and intrinsic functions where appropriate
4. **Includes proper documentation** - Description field and clear resource naming
5. **Passes validation** - Template should pass cfn-lint and stack validation
6. **Implements cost tracking** - All resources tagged with appropriate cost allocation tags
7. **Uses consistent naming** - Resource names follow established conventions with prefixes

## Output Format

Provide the complete YAML template in a single code block, ready for deployment. The template should include:

- `AWSTemplateFormatVersion` and `Description`
- `Parameters` section with configurable values
- `Mappings` section for AMI lookup
- `Resources` section with all required components
- `Outputs` section with the requested values
- Proper tagging on all resources for cost tracking and identification
