# CloudFormation VPC Infrastructure for Payment Processing

Production-ready VPC infrastructure with PCI-DSS compliance for payment processing applications.

## Architecture

This CloudFormation template deploys a multi-tier, multi-AZ VPC infrastructure designed for payment processing workloads with PCI-DSS compliance requirements.

### Network Architecture

- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **Availability Zones**: Deployed across 2 AZs for high availability
- **Subnet Strategy**:
  - Public subnets (10.0.1.0/24, 10.0.2.0/24) for web tier
  - Private application subnets (10.0.11.0/24, 10.0.12.0/24) for application tier
  - Private database subnets (10.0.21.0/24, 10.0.22.0/24) for database tier

### Security Features

#### Network Segmentation (PCI-DSS Requirement 1)
- Three-tier architecture with clear network boundaries
- Separate subnets for web (DMZ), application, and database tiers
- Network ACLs providing subnet-level traffic control
- Security groups enforcing least privilege at instance level

#### Security Groups
- **Web Tier**: Allows HTTP (80) and HTTPS (443) from internet
- **Application Tier**: Allows traffic only from web tier on port 8080
- **Database Tier**: Allows MySQL (3306) and PostgreSQL (5432) only from application tier

#### Network ACLs
- **Public NACL**: Controls traffic for public subnets, allows HTTP/HTTPS inbound
- **Private NACL**: Controls traffic for private subnets, allows only VPC internal traffic

#### Logging and Monitoring (PCI-DSS Requirement 10)
- VPC Flow Logs enabled for all traffic (accepted and rejected)
- Logs stored in CloudWatch Logs with 30-day retention
- Provides audit trail for network traffic analysis

### High Availability

- Multi-AZ deployment across 2 availability zones
- Redundant NAT Gateways (one per AZ) for private subnet internet access
- Separate route tables per AZ for private subnets
- No single points of failure in network design

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create VPC, subnets, gateways, security groups, IAM roles, and CloudWatch Logs

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name payment-vpc-dev \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
