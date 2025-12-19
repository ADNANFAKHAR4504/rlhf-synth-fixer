# Multi-Account Transit Gateway Network Architecture Implementation

## Overview

This implementation provides a complete hub-and-spoke network architecture using AWS Transit Gateway, spanning multiple accounts with centralized DNS resolution via Route53 Resolver. The solution enforces strict network isolation between production and development environments while allowing both to access shared services.

## Architecture Components

### 1. Transit Gateway (lib/transit_gateway_stack.py)

The Transit Gateway serves as the network hub, enabling communication between VPCs while maintaining isolation.

```python
# Key configuration
- DNS Support: Enabled
- Default Route Table Association: Disabled
- Default Route Table Propagation: Disabled
- Custom Route Tables: 3 (Production, Development, Shared Services)
- ASN: 64512 (private)
```

**File: lib/transit_gateway_stack.py**

### 2. VPC Infrastructure (lib/vpc_stack.py)

Three VPCs with distinct CIDR blocks:

**Production VPC (10.0.0.0/16)**
- Private subnets across 2 AZs
- Transit Gateway attachment with production route table
- Security group allowing traffic from shared services only
- VPC Flow Logs to S3 with 30-day retention

**Development VPC (10.1.0.0/16)**
- Private subnets across 2 AZs
- Transit Gateway attachment with development route table
- Security group allowing traffic from shared services only
- VPC Flow Logs to S3 with 30-day retention

**Shared Services VPC (10.2.0.0/16)**
- Private subnets across 2 AZs
- Transit Gateway attachment with shared services route table
- Security group allowing traffic from both production and development
- VPC Flow Logs to S3 with 30-day retention
- Hosts Route53 Resolver endpoints

**File: lib/vpc_stack.py**

### 3. Route53 Resolver (lib/route53_resolver_stack.py)

Centralized DNS resolution for the entire architecture:

- **Inbound Endpoint**: Allows on-premises networks to resolve AWS-hosted domains
- **Outbound Endpoint**: Allows AWS resources to resolve on-premises domains
- **Multi-AZ Deployment**: Endpoints span at least 2 availability zones
- **Security Group**: Allows DNS traffic (TCP/UDP port 53) from VPC CIDR blocks

**File: lib/route53_resolver_stack.py**

### 4. Main Stack Orchestration (lib/tap_stack.py)

The main TapStack orchestrates all nested stacks and configures:
- Transit Gateway routes for network isolation
- Security group rules for inter-VPC communication
- Resource dependencies and ordering
- Cross-stack references

**File: lib/tap_stack.py**

## Network Isolation Rules

### Transit Gateway Routing

**Production Route Table:**
- Routes to Shared Services (10.2.0.0/16) ✓
- NO routes to Development (10.1.0.0/16) ✗

**Development Route Table:**
- Routes to Shared Services (10.2.0.0/16) ✓
- NO routes to Production (10.0.0.0/16) ✗

**Shared Services Route Table:**
- Routes to Production (10.0.0.0/16) ✓
- Routes to Development (10.1.0.0/16) ✓

### VPC Routing

Each VPC's private subnets have routes configured to send traffic destined for the 10.0.0.0/8 CIDR range through the Transit Gateway.

## Security Configuration

### Security Groups

**Production VPC Security Group:**
```python
Ingress: 10.2.0.0/16 (Shared Services) - All Traffic
Egress: All Traffic (default)
```

**Development VPC Security Group:**
```python
Ingress: 10.2.0.0/16 (Shared Services) - All Traffic
Egress: All Traffic (default)
```

**Shared Services VPC Security Group:**
```python
Ingress: 10.0.0.0/16 (Production) - All Traffic
Ingress: 10.1.0.0/16 (Development) - All Traffic
Egress: All Traffic (default)
```

**Route53 Resolver Security Group:**
```python
Ingress: VPC CIDR - TCP/53 (DNS)
Ingress: VPC CIDR - UDP/53 (DNS)
Egress: All Traffic (default)
```

## VPC Flow Logs

All VPCs have Flow Logs enabled with the following configuration:

- **Traffic Type**: ALL (captures accepted, rejected, and all other traffic)
- **Destination**: S3 buckets with encryption
- **Log Format**: Extended format including source/destination addresses, ports, protocol, packets, bytes, action, and log status
- **Aggregation Interval**: 10 minutes (600 seconds)
- **Lifecycle Policy**: 30-day expiration with automatic cleanup
- **Bucket Encryption**: S3-managed encryption (SSE-S3)
- **Public Access**: Completely blocked

## Resource Tagging

All resources are tagged with:

- **Environment**: Identifies the environment (production, development, shared, or custom suffix)
- **CostCenter**: Set to "networking" for all network resources
- **ManagedBy**: Set to "cdk" to indicate CDK management

Additional tags from tap.py:
- **Repository**: Source repository name
- **Author**: Commit author
- **PRNumber**: Pull request number
- **Team**: Team identifier
- **CreatedAt**: ISO 8601 timestamp of creation

## Deployment Instructions

### Prerequisites

1. AWS CDK 2.x installed
2. Python 3.9 or higher
3. AWS CLI configured with appropriate credentials
4. Cross-account IAM roles with external IDs (if deploying to multiple accounts)

### Installation

```bash
# Install Python dependencies
pip install -r requirements.txt
# or
pipenv install

# Bootstrap CDK (if not already done)
cdk bootstrap
```

### Deployment

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy to AWS
cdk deploy TapStackdev

# Deploy with custom environment suffix
cdk deploy TapStack<suffix> -c environmentSuffix=<suffix>
```

### Testing

```bash
# Run unit tests
pytest tests/unit/ -v

# Run integration tests (requires deployed stack)
pytest tests/integration/ -v

# Run all tests with coverage
pytest tests/ -v --cov=lib --cov-report=html
```

### Cleanup

```bash
# Destroy stack and all resources
cdk destroy TapStackdev
```

## Compliance and Constraints

### Satisfied Requirements

✓ Transit Gateway with DNS support enabled
✓ Custom route tables (not using default)
✓ Three VPCs with specified CIDR blocks
✓ Private subnets only (no Internet Gateways)
✓ Route53 Resolver endpoints in 2+ AZs
✓ Network isolation between production and development
✓ VPC Flow Logs capturing ALL traffic
✓ S3 buckets with 30-day lifecycle policies
✓ Security groups with explicit CIDR blocks
✓ Comprehensive tagging (Environment, CostCenter, ManagedBy)
✓ Multi-AZ deployment for high availability

### AWS Services Used

- **EC2**: Transit Gateway, VPCs, Subnets, Route Tables, Security Groups
- **Route53 Resolver**: Inbound and Outbound Endpoints
- **S3**: VPC Flow Logs storage with lifecycle management
- **CloudFormation**: Stack management via CDK
- **IAM**: Cross-account roles (if multi-account deployment)

## Cost Optimization

- **No NAT Gateways**: Uses Transit Gateway for inter-VPC routing, avoiding NAT Gateway costs
- **No Internet Gateways**: Private subnets only, reducing data transfer costs
- **S3 Lifecycle Policies**: Automatic log expiration after 30 days
- **Serverless DNS**: Route53 Resolver is a managed service with no EC2 costs

## Monitoring and Observability

### VPC Flow Logs

Flow logs are captured in S3 with the following information:
- Source and destination IP addresses
- Source and destination ports
- Protocol
- Packets and bytes transferred
- Start and end time
- Action (ACCEPT/REJECT)
- Log status

### CloudWatch Integration

Transit Gateway metrics available in CloudWatch:
- BytesIn/BytesOut
- PacketsIn/PacketsOut
- PacketDropCountBlackhole
- PacketDropCountNoRoute

## Security Considerations

1. **Network Isolation**: Production and development cannot communicate directly
2. **Private Subnets**: No direct internet access, reducing attack surface
3. **Encrypted Logs**: S3 buckets use server-side encryption
4. **Least Privilege**: Security groups allow only necessary traffic
5. **Flow Logs**: All network traffic is logged for audit and forensics
6. **Multi-AZ**: High availability across availability zones

## Scalability

The architecture supports:
- Additional VPCs through Transit Gateway attachments
- More availability zones by modifying vpc_stack availability_zones parameter
- Additional route tables for further network segmentation
- Cross-region Transit Gateway peering (requires additional configuration)

## Troubleshooting

### Common Issues

1. **VPCs cannot communicate**: Verify Transit Gateway routes and route table associations
2. **DNS resolution fails**: Check Route53 Resolver endpoint status and security groups
3. **Flow Logs not appearing**: Verify S3 bucket permissions and VPC Flow Log status
4. **Deployment fails**: Check IAM permissions and account limits (Transit Gateway attachments, VPCs)

### Verification Commands

```bash
# Verify Transit Gateway status
aws ec2 describe-transit-gateways

# Check Transit Gateway attachments
aws ec2 describe-transit-gateway-attachments

# Verify Route53 Resolver endpoints
aws route53resolver list-resolver-endpoints

# Check VPC Flow Logs status
aws ec2 describe-flow-logs

# Verify S3 bucket lifecycle policies
aws s3api get-bucket-lifecycle-configuration --bucket vpc-flow-logs-production-dev
```

## File Structure

```
lib/
├── transit_gateway_stack.py    # Transit Gateway with custom route tables
├── vpc_stack.py                # VPC with Flow Logs and TGW attachments
├── route53_resolver_stack.py   # DNS resolver endpoints
└── tap_stack.py                # Main orchestration stack

tests/
├── unit/
│   └── test_tap_stack.py       # CDK synthesis tests
└── integration/
    └── test_tap_stack.py       # AWS resource validation tests
```

## Implementation Notes

- All resources use RemovalPolicy.DESTROY for test environments
- S3 buckets have auto_delete_objects=True for easy cleanup
- Nested stacks are used for better organization and reusability
- Cross-stack references handled via CFN exports
- Dependencies explicitly defined to ensure proper deployment order
