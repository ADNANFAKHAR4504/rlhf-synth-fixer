# TAP Stack - VPC Infrastructure (LocalStack Compatible)

## Overview

This CloudFormation template deploys a complete VPC infrastructure optimized for LocalStack compatibility. The stack includes:

- VPC with DNS support and hostnames enabled
- Public subnet with internet access
- Private subnet for internal resources
- Internet Gateway
- Route tables with proper routing
- Security group for VPC resources

## Architecture

```
┌───────────────────────────────────────────────────┐
│                VPC (10.0.0.0/16)                  │
│                                                   │
│  ┌────────────────┐      ┌────────────────┐      │
│  │ Public Subnet  │      │ Private Subnet │      │
│  │ (10.0.1.0/24)  │      │ (10.0.2.0/24)  │      │
│  │                │      │                │      │
│  └────────┬───────┘      └────────┬───────┘      │
│           │                       │              │
│           ▼                       ▼              │
│  ┌────────────────┐      ┌────────────────┐      │
│  │ Public Route   │      │ Private Route  │      │
│  │ Table          │      │ Table          │      │
│  └────────┬───────┘      └────────────────┘      │
│           │                                       │
└───────────┼───────────────────────────────────────┘
            ▼
   ┌────────────────┐
   │ Internet       │
   │ Gateway        │
   └────────────────┘
```

## LocalStack Compatibility

This deployment has been optimized for LocalStack by removing components that have known bugs:

- **EC2 Instances**: Removed due to a CloudFormation bug that incorrectly wraps AMI IDs in double brackets `[['ami-xxx']]`
- **NAT Gateway**: Removed due to AllocationID handling issues in LocalStack CloudFormation

The core VPC infrastructure (VPC, Subnets, Internet Gateway, Route Tables, Security Groups) deploys successfully and is fully functional for testing networking scenarios.

## Deployment

### Prerequisites

- AWS CLI configured or LocalStack running
- Node.js and npm installed

### Deploy to LocalStack

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to LocalStack
npm run localstack:deploy

# Run integration tests
npm run localstack:test
```

### Deploy to AWS

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to AWS
npm run deploy

# Run integration tests
npm run test
```

## Stack Outputs

The stack exports the following outputs:

- `VPCId` - ID of the created VPC
- `PublicSubnetId` - ID of the public subnet
- `PrivateSubnetId` - ID of the private subnet
- `SecurityGroupId` - ID of the default security group
- `InternetGatewayId` - ID of the Internet Gateway

## Parameters

The template accepts the following parameters:

- `EnvironmentSuffix` - Environment suffix for resource naming (default: dev)
- `VpcCidrBlock` - CIDR block for the VPC (default: 10.0.0.0/16)
- `PublicSubnetCidrBlock` - CIDR block for the public subnet (default: 10.0.1.0/24)
- `PrivateSubnetCidrBlock` - CIDR block for the private subnet (default: 10.0.2.0/24)

## Testing

Integration tests verify:

- Stack deployment completes successfully
- VPC is available
- Public and private subnets are available
- Internet Gateway is attached to VPC
- Route tables exist and public route has IGW route
- Security group is attached to VPC

## Future Enhancements

When LocalStack fixes the known CloudFormation bugs, the following components can be added back:

- **EC2 Instances**: For compute resources in public and private subnets
- **NAT Gateway**: For private subnet internet access via network address translation

## License

This project is part of the TAP Stack infrastructure automation.
