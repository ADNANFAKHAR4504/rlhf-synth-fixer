## Context and Role Assignment
You are an expert AWS Solutions Architect with deep expertise in Infrastructure as Code using AWS CloudFormation. Your task is to create comprehensive, production-ready CloudFormation templates based on specific infrastructure requirements.

## Task Description
Generate a complete AWS CloudFormation YAML template that creates a robust network infrastructure in the **us-east-1** region. The template must be syntactically correct, follow AWS best practices, and pass CloudFormation validation without errors.

## Infrastructure Requirements

### Core Constraints - MUST IMPLEMENT ALL:
1. **Amazon VPC**: Create with CIDR block `10.0.0.0/16`
2. **Subnets**: Two public subnets with CIDR 10.0.1.0/24 and 10.0.2.0/24, plus two private subnets with CIDR 10.0.3.0/24 and 10.0.4.0/24 across **different Availability Zones**
3. **Internet Gateway**: Attached to VPC for public subnet internet access
4. **NAT Gateway**: Single NAT Gateway in one public subnet for private subnet outbound access
5. **Elastic IP**: Allocated and associated with the NAT Gateway
6. **EC2 Instance**: Deploy in one public subnet with specified KeyPair for SSH access
7. **Security Group**: Allow SSH on port 22 and HTTP on port 80 from anywhere with source 0.0.0.0/0
8. **Public Route Table**: Associate with public subnets, route to Internet Gateway
9. **Private Route Table**: Associate with private subnets, route to NAT Gateway

## Detailed Implementation Guidelines

### Network Architecture:
- **VPC CIDR**: Exactly `10.0.0.0/16`
- **Public Subnet 1**: `10.0.1.0/24` in first AZ
- **Public Subnet 2**: `10.0.2.0/24` in second AZ
- **Private Subnet 1**: `10.0.3.0/24` in first AZ
- **Private Subnet 2**: `10.0.4.0/24` in second AZ
- Use `!Select 0, !GetAZs ''` and `!Select 1, !GetAZs ''` for AZ selection

### Security Requirements:
- Security group must allow:
 - **SSH**: Port 22, Protocol TCP, Source 0.0.0.0/0
 - **HTTP**: Port 80, Protocol TCP, Source 0.0.0.0/0
- Apply security group to EC2 instance

### Routing Configuration:
- **Public Route Table**: Default route 0.0.0.0/0 → Internet Gateway
- **Private Route Table**: Default route 0.0.0.0/0 → NAT Gateway
- Proper subnet associations for each route table

### Resource Dependencies:
- NAT Gateway depends on Internet Gateway attachment
- EC2 instance depends on security group and subnet
- Routes depend on gateway availability
- Use appropriate `DependsOn` attributes where necessary

## Template Structure Requirements

### Parameters Section:
Include these parameters with appropriate defaults:
Parameters: KeyPairName: Type: AWS::EC2::KeyPair::KeyName Description: Name of an existing EC2 KeyPair for SSH access
InstanceType: Type: String Default: t3.micro AllowedValues: t3.micro, t3.small, t3.medium Description: EC2 instance type

### Resource Naming Convention:
- Use descriptive resource names like `VPC`, `PublicSubnet1`, `PrivateRouteTable`
- Include appropriate tags with Name values
- Follow consistent naming patterns

### Outputs Section:
Provide these essential outputs:
- VPC ID
- Public subnet IDs
- Private subnet IDs
- EC2 instance ID
- Security group ID
- NAT Gateway ID

## Quality Assurance Requirements

### Validation Criteria:
- Template must pass `aws cloudformation validate-template`
- All resource dependencies properly defined
- Correct intrinsic function usage
- No circular dependencies
- Proper error handling with `DependsOn` attributes

### Best Practices Implementation:
- Use intrinsic functions appropriately (`!Ref`, `!GetAtt`, `!Select`)
- Include meaningful descriptions for all resources
- Implement proper resource tags for management
- Follow AWS naming conventions
- Include comments for complex configurations

## Output Format Specifications

### Response Structure:
1. **Complete YAML CloudFormation template** as primary deliverable
2. **Template validation confirmation**
3. **Brief explanation** of key architectural decisions
4. **Deployment commands** for AWS CLI

### Code Quality:
- Properly indented YAML syntax
- Clear resource organization
- Comprehensive inline comments
- Error-free CloudFormation syntax

## Example Context Reference
Base your implementation on established AWS patterns for VPC creation with public/private subnet architecture, similar to standard AWS quick-start templates but customized for the specific requirements above.

## Success Criteria
Your template will be considered successful when it:
- Deploys without errors in us-east-1 region
- Creates all required infrastructure components
- Enables SSH and HTTP access to EC2 instance
- Provides internet access to public subnets
- Provides outbound internet access to private subnets via NAT
- Follows AWS CloudFormation best practices
- Includes comprehensive outputs for resource references

Generate the complete CloudFormation YAML template now, ensuring it meets all specified requirements and constraints.
