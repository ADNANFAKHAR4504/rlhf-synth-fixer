# VPC Infrastructure Setup Task

I need to set up a basic VPC infrastructure in AWS using CDK TypeScript for a new application deployment in the us-east-1 region.

## Requirements

Create a VPC infrastructure with the following components:

1. **VPC Setup**:
   - Create a VPC with CIDR block 10.0.0.0/16
   - Deploy in us-east-1 region

2. **Public Subnets**:
   - Create exactly two public subnets
   - Each subnet should be in different availability zones (us-east-1a and us-east-1b)
   - Use CIDR blocks 10.0.1.0/24 and 10.0.2.0/24

3. **Internet Connectivity**:
   - Attach an Internet Gateway to the VPC
   - Configure route tables to route traffic to the Internet Gateway for public access

4. **Naming Convention**:
   - Use pattern: {Environment}-{ResourceType}-{UniqueIdentifier}
   - Environment should be configurable via CDK context or parameter
   - Apply consistent naming to all resources (VPC, subnets, route tables, etc.)

5. **Modern AWS Features**:
   - Prepare the VPC for future VPC Lattice service network integration
   - Include VPC endpoint configurations for enhanced private connectivity

## Technical Specifications

- Platform: CDK TypeScript
- AWS Region: us-east-1  
- CIDR: 10.0.0.0/16 for VPC
- Subnets: 10.0.1.0/24 and 10.0.2.0/24
- Availability Zones: us-east-1a, us-east-1b
- Environment parameterization for naming

Please generate the complete infrastructure code in CDK TypeScript format. Provide one code block per file that needs to be created.