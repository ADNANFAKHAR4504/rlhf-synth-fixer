# AWS Cloud Environment Setup with Pulumi Go

I need to create AWS infrastructure code using Pulumi Go to set up a basic cloud environment with VPC and networking components in the us-east-1 region.

## Requirements

Create infrastructure code with the following specifications:

### Network Configuration
- VPC with CIDR block 10.0.0.0/16 in us-east-1 region
- Two public subnets: 10.0.1.0/24 and 10.0.2.0/24 in different availability zones  
- Two private subnets: 10.0.10.0/24 and 10.0.11.0/24 in different availability zones
- Internet Gateway attached to the VPC
- Route tables configured properly for public subnets with default route to Internet Gateway
- All resources must use "iac-task" as the prefix for naming

### Technical Requirements
- Use Pulumi with Go language
- Define AWS provider with appropriate version constraints
- No hardcoded values - use Pulumi configuration where appropriate
- All resources should have consistent naming with "iac-task" prefix
- Include proper resource tagging
- Enable DNS hostnames and DNS resolution for the VPC

### AWS Latest Features Integration
Include these modern AWS networking capabilities:
- Configure VPC with IPv4 CIDR allocation for future VPC Lattice integration
- Set up VPC with proper subnet architecture that supports AWS PrivateLink endpoints

### Infrastructure Outputs
Export the following values for integration:
- VPC ID
- Public subnet IDs
- Private subnet IDs
- Internet Gateway ID
- Route table IDs

Please provide the complete infrastructure code in separate files. Create one code block per file, ensuring each file can be created by copy-pasting from your response.