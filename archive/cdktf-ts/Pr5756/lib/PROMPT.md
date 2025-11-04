# Cloud Environment Setup for Payment Gateway

Hey team,

We need to build a production-ready VPC infrastructure for our new fintech payment processing application. The business has asked us to set up a multi-tier network architecture that properly isolates web servers, application servers, and database resources. I've been asked to create this infrastructure using **CDKTF with TypeScript** so we can manage everything as code.

The startup is establishing their first AWS cloud presence and needs proper network segmentation from day one. They're processing payments, so security and isolation between tiers is critical. We need to make sure the web tier can talk to the internet, the app tier has secure outbound access through NAT gateways, and the database tier is completely isolated from the internet.

The architecture team has specified exact CIDR blocks and wants everything deployed across three availability zones for high availability. They also want visibility into network traffic through VPC Flow Logs and need a way to share subnet information with other stacks using Parameter Store.

## What we need to build

Create a multi-tier VPC network infrastructure using **CDKTF with TypeScript** for a production payment processing environment in the us-east-1 region.

### Core Requirements

1. **VPC Configuration**
   - Create a VPC with CIDR block 10.0.0.0/16
   - Deploy across 3 availability zones for high availability
   - Enable DNS hostnames and DNS resolution
   - Tag all resources with Environment=Production and Project=PaymentGateway

2. **Public Subnets (Web Tier)**
   - Create 3 public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Deploy one per availability zone
   - Internet gateway for inbound/outbound internet access
   - Route tables configured for internet access

3. **Private Subnets (Application Tier)**
   - Create 3 private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Deploy one per availability zone
   - NAT Gateway in each AZ for high availability outbound internet access
   - Separate route tables per AZ pointing to respective NAT gateways

4. **Isolated Subnets (Database Tier)**
   - Create 3 isolated subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - Deploy one per availability zone
   - No internet access (no NAT gateway routes)
   - Isolated route tables with no internet gateway routes

5. **Security Groups**
   - Web tier security group: allow inbound 80/443 from internet
   - App tier security group: allow inbound 8080 from web tier only
   - Database tier security group: allow inbound 5432 from app tier only
   - All security groups must use proper CDKTF security group reference objects

6. **Network Monitoring**
   - VPC Flow Logs capturing ALL traffic (accepted and rejected)
   - Store logs in CloudWatch Logs
   - Set retention period to 7 days
   - Create IAM role for Flow Logs to write to CloudWatch

7. **Cross-Stack Integration**
   - Store all subnet IDs in Systems Manager Parameter Store
   - Use naming convention: /vpc/production/{resource-type}/{az}
   - Enable other stacks to reference subnet IDs

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **AWS VPC** for network infrastructure
- Use **EC2** resources: subnets, internet gateway, NAT gateways, route tables, security groups
- Use **CloudWatch Logs** for VPC Flow Logs with 7-day retention
- Use **Systems Manager Parameter Store** for storing subnet IDs
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- Read region from lib/AWS_REGION file or environment variable

### Constraints

- Must use CDKTF (Terraform CDK) not AWS CDK
- NAT Gateways must be deployed one per AZ for redundancy (3 total)
- All subnets must be /24 CIDR blocks as specified
- VPC Flow Logs must capture ALL traffic (accepted and rejected)
- Security group rules must use CDKTF security group reference objects
- Parameter Store paths must follow /vpc/production/{resource-type}/{az} naming convention
- Stack must be deployable in any AWS region without hardcoded availability zone names
- Use CDKTF provider constructs from @cdktf/provider-aws
- All resources must be destroyable for easy cleanup (no retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: VPC deployed with 9 subnets across 3 AZs with proper routing
- **Security**: Network segmentation enforced through security groups with least-privilege access
- **High Availability**: NAT gateways deployed in each AZ for redundancy
- **Monitoring**: VPC Flow Logs capturing all traffic with 7-day retention
- **Integration**: All subnet IDs stored in Parameter Store under /vpc/production/* namespace
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript code, well-tested with unit and integration tests, properly documented
- **Destroyability**: All resources can be destroyed without manual intervention

## What to deliver

- Complete CDKTF TypeScript implementation in lib/tap-stack.ts
- VPC with internet gateway and 3 NAT gateways
- 9 subnets (3 public, 3 private, 3 isolated) with proper route tables
- 3 security groups (web, app, database) with tier-specific rules
- VPC Flow Logs with CloudWatch Logs integration
- Systems Manager Parameter Store entries for all subnet IDs
- IAM role for VPC Flow Logs
- Unit tests for all components with 100% coverage
- Integration tests validating infrastructure deployment
- Documentation in README format
