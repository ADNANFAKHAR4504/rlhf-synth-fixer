# VPC Infrastructure for Financial Services Application

Hey team,

We need to build out a production-ready VPC infrastructure for our new financial services application. The business is establishing a fresh AWS presence and they're pretty serious about network isolation and compliance requirements. I've been asked to create this using **CDKTF with TypeScript** to give us the flexibility and type safety we need for this kind of critical infrastructure.

The requirements are pretty comprehensive. We're looking at a full network topology with proper segmentation between public and private resources, multiple availability zones for high availability, and all the monitoring and security controls you'd expect for a financial services workload. The network team has given us specific CIDR ranges to use, and we need to make sure everything is properly logged and monitored from day one.

One thing to keep in mind is that this infrastructure needs to support both internal microservices that should never touch the internet directly, as well as some services that need controlled internet access. We also need to maintain detailed audit trails for everything that happens in the network, which is a regulatory requirement.

## What we need to build

Create a production VPC infrastructure using **CDKTF with TypeScript** for a financial services application in us-east-1.

### Core Requirements

1. **VPC Configuration**
   - VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Must not overlap with existing corporate networks

2. **Subnet Architecture**
   - 3 public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - 3 private subnets: 10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24
   - Distribute across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - Each subnet needs descriptive tags including Environment, Purpose, and Tier

3. **Internet Connectivity**
   - Deploy an Internet Gateway attached to the VPC
   - Create 3 NAT Gateways, one in each public subnet
   - Provision Elastic IPs for each NAT Gateway

4. **Routing Configuration**
   - One route table for all public subnets routing 0.0.0.0/0 to IGW
   - Three separate route tables for private subnets (one per AZ)
   - Each private route table routes 0.0.0.0/0 to its respective NAT Gateway
   - Route tables must be explicitly associated with subnets, not rely on main route table

5. **Network Security**
   - Implement Network ACLs that allow all outbound traffic
   - Network ACLs must explicitly deny inbound SSH (port 22) from 0.0.0.0/0

6. **Flow Logs and Audit Trail**
   - Enable VPC Flow Logs
   - Send logs to an S3 bucket with AES256 encryption
   - Configure 90-day lifecycle policy on the S3 bucket

7. **Monitoring and Alarms**
   - Create CloudWatch alarms for each NAT Gateway
   - Monitor BytesOutToDestination metric
   - Set threshold at 1GB in 5 minutes
   - Alarms should notify when threshold is breached

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use AWS provider version 5.x or higher
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- Target availability zones: us-east-1a, us-east-1b, us-east-1c

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16
- All resources must be destroyable (no Retain policies)
- Private subnets must have no direct internet access except through NAT gateways
- Network ACLs must use explicit deny rules for SSH
- S3 bucket for flow logs must have server-side encryption enabled
- Include proper error handling and logging
- Code must be well-typed with TypeScript

## Success Criteria

- **Functionality**: VPC with proper public/private subnet segregation across 3 AZs
- **Security**: Network ACLs deny SSH from internet, flow logs enabled
- **High Availability**: Resources distributed across 3 availability zones
- **Monitoring**: CloudWatch alarms active for all NAT Gateways
- **Compliance**: All logs stored in encrypted S3 with 90-day retention
- **Resource Naming**: All resources include environmentSuffix variable
- **Code Quality**: TypeScript with proper types, well-tested, documented

## What to deliver

- Complete CDKTF TypeScript implementation
- VPC with DNS support enabled
- 6 subnets (3 public, 3 private) across 3 AZs
- Internet Gateway and 3 NAT Gateways with EIPs
- Route tables with proper associations
- Network ACLs with SSH deny rules
- VPC Flow Logs to encrypted S3 bucket
- CloudWatch alarms for NAT Gateway metrics
- Unit tests for all infrastructure components
- Documentation with deployment instructions
- Outputs for VPC ID, subnet IDs, and NAT Gateway IDs for downstream use
