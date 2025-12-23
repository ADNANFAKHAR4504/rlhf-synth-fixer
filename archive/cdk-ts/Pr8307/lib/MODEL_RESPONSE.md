# Secure Production Environment with AWS CDK

I'll create a secure production environment using AWS CDK with TypeScript. Here's my implementation:

## Architecture Overview

The infrastructure implements a secure VPC-based environment with:

- VPC with public and private subnets across 2 availability zones
- Bastion hosts for secure access to private resources
- IAM roles with least privilege access
- Security groups with restrictive access rules
- VPC endpoints for AWS Systems Manager (Session Manager)
- Shared security group architecture for VPC endpoints

## Implementation

### Stack Structure

The implementation is organized into:

1. **TapStack**: Main orchestration stack
2. **SecurityStack**: Core security infrastructure (VPC, bastion hosts, security groups, IAM roles)

### Key Implementation Details

**VPC Configuration:**
- CIDR block: 10.0.0.0/16
- 2 Availability Zones for high availability
- 2 Public subnets (/24) with internet gateway
- 2 Private isolated subnets (/24) without NAT gateway
- DNS hostnames and DNS support enabled
- No NAT gateways for LocalStack compatibility

**VPC Endpoints for Systems Manager:**
- SSM endpoint for Systems Manager
- SSM Messages endpoint for Session Manager messaging
- EC2 Messages endpoint for EC2 instance messaging
- Private DNS enabled for seamless service discovery
- Interface VPC endpoints in private subnets

**Security Groups:**
1. **VPC Endpoint Security Group**: Shared across all VPC endpoints
   - Allows HTTPS (port 443) from VPC CIDR range
   - Demonstrates newer AWS feature: security group sharing for endpoints
   - Prevents all outbound traffic (restrictive by default)

2. **Bastion Security Group**: For bastion host instances
   - Ingress: SSH (port 22) from specific IP range only (203.0.113.0/24)
   - Egress: HTTPS (port 443) for SSM and updates
   - Egress: HTTP (port 80) for package updates
   - Restrictive access model

3. **Internal Security Group**: For private resources
   - Ingress: SSH (port 22) from bastion security group only
   - Ingress: All TCP traffic within same security group (internal communication)
   - Egress: HTTPS (port 443) to VPC endpoint security group
   - No direct internet access

**IAM Roles:**
1. **Bastion Role**: Attached to bastion host instances
   - Managed policy: AmazonSSMManagedInstanceCore
   - Custom permissions for Session Manager operations
   - Allows SSM connectivity without SSH keys

2. **Private Instance Role**: For resources in private subnets
   - Managed policy: AmazonSSMManagedInstanceCore
   - Enables Systems Manager access for private instances

**Bastion Hosts:**
- 2 EC2 instances (one per AZ) for high availability
- Instance type: t3.nano (cost-effective)
- Amazon Linux 2 AMI
- Deployed in public subnets
- Attached to bastion security group
- SSM-enabled for secure access without SSH keys

**Security Features:**
- Least privilege IAM policies
- Network segmentation with isolated subnets
- Session Manager integration eliminates need for SSH key management
- VPC endpoints enable secure AWS service access without internet gateway
- Security group rules enforce traffic only from known sources
- All resources tagged with Environment:Production

**LocalStack Optimizations:**
- RemovalPolicy.DESTROY on all resources for easy cleanup
- No NAT gateways (LocalStack EIP allocation issues)
- Standard EC2 instances instead of BastionHostLinux construct
- Custom resource limitations considered
- VPC endpoint policy configured for LocalStack compatibility

## CloudFormation Outputs

The stack provides the following outputs for reference:

- VPC ID
- Bastion Host Security Group ID
- Internal Security Group ID
- Bastion Host Instance IDs (for both AZs)

## Testing Approach

The implementation includes comprehensive tests:

1. **Unit Tests**: Validate stack synthesis and resource configuration
2. **Integration Tests**: Verify deployed resources in LocalStack
   - VPC and subnet validation
   - Security group rule verification
   - VPC endpoint configuration checks
   - Bastion host deployment validation
   - IAM role and policy verification

## Usage

```bash
# Deploy to LocalStack
npm run deploy

# Run integration tests
npm run test:int

# Destroy resources
npm run destroy
```

This infrastructure provides a secure foundation for production workloads with proper network segmentation, access controls, and AWS best practices for security.
