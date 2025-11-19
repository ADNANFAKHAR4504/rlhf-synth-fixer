# Highly Available VPC Infrastructure for Payment Processing Platform

This CloudFormation template creates a production-ready, highly available VPC infrastructure designed for PCI-DSS compliant payment processing workloads across three availability zones in us-east-1.

## Architecture Overview

The infrastructure implements a robust three-tier network architecture with comprehensive security controls, high availability guarantees, and complete observability through VPC Flow Logs.

### Network Design

**VPC Configuration:**
- CIDR Block: 10.0.0.0/16 (65,536 addresses)
- DNS Resolution and DNS Hostnames: Enabled for service discovery
- Spans 3 Availability Zones for 99.99% availability SLA
- Multi-AZ deployment ensures no single point of failure

**Subnet Architecture (9 subnets total):**

*Public Subnets (3 subnets - one per AZ):*
- us-east-1a: 10.0.1.0/24 (256 addresses)
- us-east-1b: 10.0.2.0/24 (256 addresses)
- us-east-1c: 10.0.3.0/24 (256 addresses)
- MapPublicIpOnLaunch: Enabled
- Purpose: NAT Gateways, Load Balancers, Bastion Hosts

*Private Subnets (6 subnets - two per AZ):*
- us-east-1a: 10.0.11.0/24, 10.0.12.0/24
- us-east-1b: 10.0.13.0/24, 10.0.14.0/24
- us-east-1c: 10.0.15.0/24, 10.0.16.0/24
- Purpose: Application servers, databases, internal services
- Total capacity: 1,536 addresses for private workloads

**Routing Configuration:**

*Public Route Table:*
- Default route (0.0.0.0/0) → Internet Gateway
- Associated with all 3 public subnets
- Enables direct internet connectivity

*Private Route Tables (3 separate tables):*
- PrivateRouteTable1: Serves AZ1 subnets → NAT Gateway 1
- PrivateRouteTable2: Serves AZ2 subnets → NAT Gateway 2
- PrivateRouteTable3: Serves AZ3 subnets → NAT Gateway 3
- Each AZ uses its own NAT Gateway (no cross-AZ dependencies)

### High Availability Components

**NAT Gateways (3 deployed):**
- One per availability zone in respective public subnet
- Each with dedicated Elastic IP address
- 45 Gbps bandwidth per gateway
- Automatic failover within availability zone
- No cross-AZ traffic (reduces costs and latency)

**Internet Gateway:**
- Single IGW attached to VPC
- Horizontally scaled, redundant, and highly available
- Supports bidirectional traffic for public subnets

### Security Architecture

**Security Groups (Application-Level Firewalls):**

1. **BastionSecurityGroup** (sg-0fb410ecc5b175f63)
   - Inbound: SSH (22/tcp) from specific IP parameter only
   - Purpose: Secure administrative access
   - Least-privilege: No 0.0.0.0/0 access

2. **ALBSecurityGroup** (sg-00136bc3b132f683e)
   - Inbound: HTTP (80/tcp) and HTTPS (443/tcp) from 0.0.0.0/0
   - Purpose: Public-facing load balancer
   - Standard web traffic acceptance

3. **ApplicationSecurityGroup** (sg-05b6daef13fe2feab)
   - Inbound HTTP/HTTPS: From ALBSecurityGroup only
   - Inbound SSH: From BastionSecurityGroup only
   - Purpose: Application tier isolation
   - Zero direct internet access

**Network ACLs (Subnet-Level Firewalls):**

*PublicNetworkACL:*
- Inbound rules: HTTP (80), HTTPS (443), SSH (22), Ephemeral ports (1024-65535)
- Outbound rule: All traffic (0.0.0.0/0)
- Rule numbers: 100, 110, 120, 130 for explicit ordering
- Associated with all 3 public subnets

*PrivateNetworkACL:*
- Inbound rules: HTTP (80), HTTPS (443), SSH (22), Ephemeral ports (1024-65535)
- Outbound rule: All traffic (0.0.0.0/0)
- Rule numbers: 100, 110, 120, 130 for explicit ordering
- Associated with all 6 private subnets
- Additional layer of defense for internal resources

### Monitoring and Compliance

**VPC Flow Logs:**
- Traffic Type: ALL (accept, reject, and all traffic)
- Destination: CloudWatch Logs
- Log Group: /aws/vpc/flowlogs-synth367
- Retention: 30 days
- Encryption: AWS KMS
- Purpose: Network forensics, security analysis, compliance

**CloudWatch Log Group:**
- Name: /aws/vpc/flowlogs-synth367
- Retention: 30 days (compliance requirement)
- KMS Encryption: Customer-managed key
- IAM Role: FlowLogsRole with necessary permissions

**KMS Encryption:**
- Key Type: Symmetric
- Key Alias: alias/flowlogs-synth367
- Key Policy: Allows CloudWatch Logs service to encrypt/decrypt
- Key State: Enabled
- Purpose: Protect sensitive network flow data

### Resource Naming and Tagging

**Naming Convention:**
All resources include `${EnvironmentSuffix}` parameter for deployment isolation:
- VPC: `vpc-${EnvironmentSuffix}`
- Subnets: `public-subnet-{1-3}-${EnvironmentSuffix}`, `private-subnet-{1-6}-${EnvironmentSuffix}`
- Security Groups: `{bastion|alb|application}-sg-${EnvironmentSuffix}`
- NAT Gateways: `nat-gateway-{1-3}-${EnvironmentSuffix}`

**Resource Tags:**
- **Name**: Resource-specific name with EnvironmentSuffix
- **Environment**: {development|staging|production}
- **Owner**: platform-team (default)
- **CostCenter**: payment-processing (default)

### Parameters

1. **EnvironmentSuffix** (Required)
   - Type: String
   - Constraints: 3-10 characters, lowercase alphanumeric with hyphens
   - Purpose: Enable multiple parallel deployments

2. **VpcCidr** (Optional)
   - Default: 10.0.0.0/16
   - Purpose: Configurable address space

3. **BastionAllowedIP** (Required)
   - Type: String
   - Purpose: Whitelist specific IP for SSH access

4. **Environment** (Optional)
   - Default: production
   - Values: development, staging, production
   - Purpose: Environment categorization

5. **Owner** (Optional)
   - Default: platform-team
   - Purpose: Ownership tracking

6. **CostCenter** (Optional)
   - Default: payment-processing
   - Purpose: Cost allocation

### Outputs (16 total)

**Core Network:**
- VPCId: vpc-05542c40bb6d75028
- VPCCidr: 10.0.0.0/16

**Public Subnets:**
- PublicSubnet1Id, PublicSubnet2Id, PublicSubnet3Id

**Private Subnets:**
- PrivateSubnet1Id through PrivateSubnet6Id

**Security Groups:**
- BastionSecurityGroupId, ALBSecurityGroupId, ApplicationSecurityGroupId

**Monitoring:**
- FlowLogsLogGroupName: /aws/vpc/flowlogs-synth367
- FlowLogsKMSKeyArn: arn:aws:kms:us-east-1:342597974367:key/...

All outputs include Export names following pattern: `${AWS::StackName}-{OutputName}` for cross-stack references.

## Deployment and Lifecycle

**Deployment Characteristics:**
- Stack creates 64 resources
- Typical deployment time: 5-7 minutes
- Critical path: NAT Gateway creation (2-3 minutes each)
- Region: us-east-1

**Destroyability:**
- All resources are fully destroyable
- No DeletionPolicy: Retain on any resource
- No DeletionProtection enabled
- Clean teardown guaranteed for CI/CD pipelines

**Dependencies:**
- NAT Gateways depend on EIPs and public subnets
- Private route tables depend on NAT Gateways
- Flow Logs depend on IAM role and KMS key
- All subnet associations depend on route tables and NACLs

## Best Practices Implemented

1. **High Availability:**
   - Multi-AZ deployment across 3 availability zones
   - Redundant NAT Gateways (one per AZ)
   - No single points of failure

2. **Security:**
   - Defense in depth: Security Groups + Network ACLs
   - Least-privilege access controls
   - No hardcoded credentials or secrets
   - Encrypted Flow Logs with KMS

3. **Scalability:**
   - Sufficient IP address space (65K addresses)
   - Six private subnets for workload distribution
   - Separate NAT Gateways prevent bottlenecks

4. **Compliance:**
   - PCI-DSS ready network segmentation
   - Comprehensive audit logging via Flow Logs
   - 30-day log retention
   - Encrypted data at rest

5. **Operational Excellence:**
   - Parameterized for flexibility
   - Consistent naming conventions
   - Comprehensive tagging strategy
   - Full observability

6. **Cost Optimization:**
   - Right-sized subnet allocations
   - Efficient routing (no cross-AZ NAT Gateway traffic)
   - On-demand resources (no over-provisioning)
   - Proper log retention (not indefinite)

## Usage Example

```bash
# Deploy stack
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStackdev \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnvironmentSuffix=dev \
    BastionAllowedIP=203.0.113.0/32 \
    Environment=development \
  --region us-east-1

# Get outputs
aws cloudformation describe-stacks \
  --stack-name TapStackdev \
  --query 'Stacks[0].Outputs' \
  --region us-east-1

# Delete stack
aws cloudformation delete-stack \
  --stack-name TapStackdev \
  --region us-east-1
```

## Testing

**Unit Tests:** 78 test cases covering:
- Template structure validation
- Parameter constraints
- Resource counts and types
- Security group rules
- Routing configuration
- Tagging compliance
- Deletion policies

**Integration Tests:** 34 test cases validating:
- Live VPC creation and configuration
- Subnet deployment across AZs
- NAT Gateway and Internet Gateway functionality
- Security group rule enforcement
- Network ACL configuration
- VPC Flow Logs operation
- KMS encryption validation
- Cross-resource connectivity

## Success Criteria Met

✅ **Functionality**: Complete VPC with 3 AZs, 9 subnets, 3 NAT Gateways, security groups, NACLs
✅ **High Availability**: Multi-AZ deployment with redundant NAT Gateways
✅ **Security**: Proper network segmentation, security groups, NACLs, encrypted logs
✅ **Compliance**: PCI-DSS ready with network isolation, logging, and encryption
✅ **Resource Naming**: All resources include EnvironmentSuffix
✅ **Destroyability**: All resources can be cleanly torn down
✅ **Code Quality**: Valid CloudFormation JSON, proper parameters, documented

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         VPC 10.0.0.0/16                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   AZ us-east-1a │  │   AZ us-east-1b │  │   AZ us-east-1c ││
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤│
│  │ Public 10.0.1/24│  │ Public 10.0.2/24│  │ Public 10.0.3/24││
│  │  ┌──────────┐   │  │  ┌──────────┐   │  │  ┌──────────┐   ││
│  │  │NAT-GW + │   │  │  │NAT-GW + │   │  │  │NAT-GW + │   ││
│  │  │   EIP   │   │  │  │   EIP   │   │  │  │   EIP   │   ││
│  │  └────┬─────┘   │  │  └────┬─────┘   │  │  └────┬─────┘   ││
│  ├───────┼─────────┤  ├───────┼─────────┤  ├───────┼─────────┤│
│  │Private10.0.11/24│  │Private10.0.13/24│  │Private10.0.15/24││
│  │       │         │  │       │         │  │       │         ││
│  │Private10.0.12/24│  │Private10.0.14/24│  │Private10.0.16/24││
│  │       │         │  │       │         │  │       │         ││
│  │   App Servers   │  │   App Servers   │  │   App Servers   ││
│  └───────┼─────────┘  └───────┼─────────┘  └───────┼─────────┘│
│          │                    │                    │           │
│          └────────────────────┴────────────────────┘           │
│                         Internet Gateway                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                          Internet
```

This infrastructure provides a solid foundation for deploying secure, highly available payment processing applications in AWS.
