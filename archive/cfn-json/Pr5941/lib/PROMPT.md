Hey team,

We've got a critical infrastructure migration project for one of our fintech clients. They're running a payment processing system on an outdated single-AZ VPC setup, and we need to move them to a modern multi-AZ architecture while keeping everything PCI compliant. The tricky part is that we can't disrupt their existing RDS connections or take down the payment gateway EC2 instances during the migration.

The current setup is pretty straightforward but risky - everything is in one availability zone using the 10.0.0.0/16 CIDR range. They've got t3.large instances running their payment gateway and a db.t3.medium PostgreSQL RDS instance handling transactions. If that AZ goes down, their entire payment processing stops. We need to build out a new environment in the 172.16.0.0/16 range across three availability zones before we migrate anything over.

I've been asked to create this infrastructure using CloudFormation with JSON templates. The business is particularly concerned about security and cost control, so we need to be really careful with the security groups and make sure we're using VPC endpoints to avoid unnecessary data transfer charges.

## What we need to build

Create a multi-AZ VPC migration infrastructure using **CloudFormation with JSON** for a production payment processing environment.

### Core Requirements

1. **VPC and Network Foundation**
   - New VPC with CIDR block configurable via CloudFormation parameter
   - Three public subnets across three availability zones in us-east-1
   - Three private subnets across three availability zones in us-east-1
   - Internet gateway attached to the VPC for public internet access

2. **NAT Gateway Configuration**
   - Three NAT gateways, one deployed in each availability zone
   - Each NAT gateway must be placed in a public subnet
   - Provides outbound internet access for private subnet resources

3. **Routing Infrastructure**
   - Route tables for public subnets routing traffic to the internet gateway
   - Route tables for private subnets routing traffic to their respective NAT gateways
   - Proper subnet associations for all route tables

4. **Security Groups**
   - Web tier security group allowing HTTPS traffic (port 443) from the internet
   - Database tier security group allowing PostgreSQL traffic (port 5432) only from web tier security group
   - Follow least privilege principle with no open 0.0.0.0/0 inbound rules for database tier

5. **S3 Storage for Migration Logs**
   - S3 bucket for storing migration logs and documentation
   - Versioning enabled on the bucket
   - Server-side encryption using AWS managed keys (SSE-S3)

6. **Cost Optimization**
   - VPC endpoints for S3 to reduce data transfer costs
   - Configure gateway endpoint for S3 service

7. **Outputs for Migration Steps**
   - VPC ID for reference in subsequent templates
   - All subnet IDs (public and private) for EC2 and RDS placement
   - Security group IDs for attaching to instances during migration

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** service for network infrastructure
- Use **EC2** for NAT Gateway resources
- Use **S3** for migration log storage
- Use **Internet Gateway** for public internet connectivity
- Use **NAT Gateway** for private subnet outbound access
- Use **Security Groups** for network-level access control
- Use **Route Tables** for traffic routing
- Use **VPC Endpoints** for cost-optimized S3 access
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention with environment suffix for all resources
- Deploy to **us-east-1** region
- Use CloudFormation parameters for all CIDR blocks and configurable values

### Constraints

- Use only AWS native services without third-party tools or scripts
- All resources must have specific tags: Environment, Project, and Owner
- Template must use CloudFormation parameters for CIDR blocks and instance types
- Security groups must follow least privilege principle
- No security group rules allowing inbound from 0.0.0.0/0 except for web tier HTTPS
- All S3 buckets must have versioning enabled
- All S3 buckets must have server-side encryption with AWS managed keys
- All resources must be destroyable with no Retain deletion policies
- Include proper resource dependencies and references

## Success Criteria

- Functionality: Complete multi-AZ VPC infrastructure ready for migration
- Performance: Three availability zones with proper network isolation
- Reliability: Redundant NAT gateways for high availability
- Security: Properly isolated security groups following least privilege
- Resource Naming: All resources include environmentSuffix parameter
- Cost Optimization: VPC endpoints configured for S3 access
- Code Quality: Valid CloudFormation JSON, well-structured, properly tagged

## What to deliver

- Complete CloudFormation JSON implementation
- VPC with configurable CIDR block
- 3 public subnets and 3 private subnets across 3 AZs
- Internet gateway and 3 NAT gateways
- Route tables with proper associations
- Security groups for web tier and database tier
- S3 bucket with versioning and encryption
- VPC endpoint for S3
- CloudFormation outputs for VPC ID, subnet IDs, and security group IDs
- All resources properly tagged with Environment, Project, Owner
- Parameters for CIDR blocks and environment suffix
- Documentation and deployment instructions
