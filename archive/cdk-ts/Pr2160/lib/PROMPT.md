# Multi-Environment Consistency & Replication Infrastructure

## Task Overview
You are tasked with setting up multi-environment consistency and replication using AWS CDK with TypeScript for an application deployed on AWS. The application needs to run in two separate environments that mirror each other, one in the US-East-1 region and another in the US-West-2 region.

## Requirements

### Infrastructure Components
1. **VPC Configuration**
   - Create identical VPCs in both regions
   - CIDR block: 10.0.0.0/16
   - Public and private subnets across different availability zones

2. **Networking**
   - NAT Gateway in public subnet for private subnet internet access
   - Internet Gateway for public subnet connectivity
   - Proper route tables for both subnet types

3. **Multi-Region Setup**
   - Deploy identical infrastructure in US-East-1 and US-West-2
   - Ensure consistency across both regions
   - Use CDK cross-stack references where appropriate

4. **Security & IAM**
   - Follow principle of least privilege for IAM roles
   - Proper security groups for network isolation
   - No hardcoded credentials or secrets

## Constraints
1. Use AWS as the cloud provider
2. Ensure that the VPC in both environments is created with CIDR block 10.0.0.0/16
3. Both environments should have a public and a private subnet in different availability zones
4. Deploy a NAT Gateway in the public subnet for internet access in the private subnet
5. Use CDK cross-stack references for managing dependencies between regions
6. Ensure IAM roles are created with minimum privilege principle in mind for resource access
7. Replication must occur between US-East-1 and US-West-2 regions

## Expected Output
A complete CDK TypeScript application that:
- Successfully synthesizes and deploys using `cdk synth` and `cdk deploy`
- Creates identical infrastructure in both US-East-1 and US-West-2 regions
- Follows AWS best practices for multi-region deployments
- Includes proper error handling and resource tagging
- Passes all validation tests

## Technical Stack
- **Platform**: AWS CDK v2
- **Language**: TypeScript
- **Node.js**: v18 or later
- **AWS Services**: VPC, EC2, IAM

## File Structure
```
lib/
├── tap-stack.ts        # Main stack implementation
├── PROMPT.md          # This file
├── MODEL_RESPONSE.md  # Your implementation details
└── IDEAL_RESPONSE.md  # Reference implementation
```

## Testing
The solution will be validated against:
- Unit tests for stack configuration
- Integration tests for multi-region deployment
- CDK synthesis validation
- AWS deployment validation

## Notes
- Ensure all resources are properly tagged for cost tracking
- Use CDK best practices for stack organization
- Consider using CDK Aspects for cross-cutting concerns
- Implement proper resource naming conventions