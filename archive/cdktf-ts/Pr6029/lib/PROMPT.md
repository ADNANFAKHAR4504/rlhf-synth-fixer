Hey team,

We're expanding into the Asia-Pacific region and need to build out our network foundation in AWS. The infrastructure team has asked me to set up a production-grade VPC that will serve as the backbone for our APAC operations. This needs to be rock-solid because it'll be hosting our application servers, load balancers, and databases.

The architecture needs to span 3 availability zones for high availability, with proper network segmentation between our public-facing load balancers, private application servers, and database tier. The security team is particularly concerned about SSH access and wants comprehensive network logging for compliance audits. I've been asked to build this using **CDKTF with TypeScript** since that's what our infrastructure team standardizes on.

We're deploying to us-east-1 to start, though the task originally mentioned Singapore. The VP of Engineering wants us to prove out the design in us-east-1 first before replicating to ap-southeast-1. This is a high-complexity task, so we need to get the networking fundamentals absolutely right.

## What we need to build

Create a production-ready multi-tier VPC architecture using **CDKTF with TypeScript** for AWS infrastructure provisioning.

### Core Requirements

1. **VPC Foundation**
   - VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Tag with Environment='prod' and Project='apac-expansion'

2. **Public Subnet Tier**
   - 3 public subnets across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - CIDR blocks: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - For hosting load balancers and bastion hosts
   - Route traffic to Internet Gateway

3. **Private Application Tier**
   - 3 private subnets across the same 3 availability zones
   - CIDR blocks: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - For hosting application servers
   - Route traffic through NAT Gateways for outbound internet access

4. **Private Database Tier**
   - 3 private database subnets across the same 3 availability zones
   - CIDR blocks: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - For hosting RDS instances
   - Isolated from direct internet access

5. **Internet Gateway**
   - Named 'igw-prod-us-east-1'
   - Attached to VPC
   - Enables public subnet internet connectivity

6. **NAT Gateway High Availability**
   - Deploy 3 NAT Gateways (one per public subnet)
   - Allocate Elastic IPs for each NAT Gateway
   - Each private subnet routes through its corresponding NAT Gateway
   - Ensures high availability for outbound internet from private subnets

7. **Routing Configuration**
   - Public route table: Routes 0.0.0.0/0 to Internet Gateway
   - Private route tables: Each routes 0.0.0.0/0 to corresponding NAT Gateway
   - Explicit subnet associations for all route tables

8. **Network ACLs**
   - Allow standard web traffic on ports 80 and 443
   - Explicitly deny inbound SSH (port 22) from 0.0.0.0/0
   - Apply to all subnets for defense in depth

9. **VPC Flow Logs**
   - Enable flow logs with 'ALL' traffic type (accepted, rejected, and all)
   - Send logs to CloudWatch Logs group named '/aws/vpc/flowlogs'
   - Create IAM role with proper permissions for flow logs service
   - Capture comprehensive network traffic for security analysis

10. **Resource Naming**
    - All resources must include **environmentSuffix** for uniqueness
    - Naming pattern: `{resource-type}-{environmentSuffix}`
    - Enables multiple parallel deployments without conflicts

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **VPC** for network foundation
- Use **Internet Gateway** for public internet access
- Use **NAT Gateway** with **Elastic IPs** for private subnet outbound access
- Use **Route Tables** for traffic routing
- Use **Network ACLs** for subnet-level security
- Use **VPC Flow Logs** and **CloudWatch Logs** for network monitoring
- Use **IAM Role** for VPC Flow Logs permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region (availability zones: us-east-1a, us-east-1b, us-east-1c)

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16
- Subnets must span exactly 3 availability zones (no more, no fewer)
- All 9 subnets must have explicit CIDR blocks as specified
- Private subnets must NOT have direct internet access (no IGW route)
- Internet Gateway must be named with specific format: igw-{environment}-{region} pattern
- NAT Gateways must be deployed in high availability mode (one per AZ)
- Network ACLs must explicitly deny SSH from 0.0.0.0/0
- VPC Flow Logs must capture ALL traffic types
- CloudWatch log group must be named '/aws/vpc/flowlogs'
- All route tables must have explicit subnet associations
- All resources must be destroyable (no Retain policies)
- Consistent tagging: Environment='prod', Project='apac-expansion'
- Include proper error handling and logging

## Success Criteria

- **Functionality**: 9 subnets across 3 AZs with proper routing
- **High Availability**: NAT Gateways in each AZ for fault tolerance
- **Security**: Network ACLs blocking SSH, VPC Flow Logs capturing all traffic
- **Network Isolation**: Clear separation between public, app, and database tiers
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript code, well-tested, documented
- **Compliance**: Comprehensive logging for security audits

## What to deliver

- Complete CDKTF TypeScript implementation
- VPC, Subnets, Internet Gateway, NAT Gateways, Elastic IPs
- Route Tables with explicit associations
- Network ACLs with security rules
- VPC Flow Logs with CloudWatch Logs integration
- IAM Role for VPC Flow Logs
- Unit tests for all components
- Documentation and deployment instructions
