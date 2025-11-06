Hey team,

We're in the middle of a critical account consolidation project. Our company is migrating production workloads from a legacy AWS account into our new organizational structure, and I need your help with the networking foundation. The existing VPC is running live microservices across three availability zones in us-east-1, and we absolutely cannot have any downtime during this transition

The challenge is that we need to stand up a completely new VPC environment in the target account while keeping the old one running. Once the new VPC is ready, we'll migrate workloads incrementally using VPC peering between the old and new environments. The business has given us a tight window to execute this, so everything needs to be right the first time.

I've been asked to create the infrastructure using CloudFormation, which is what we're standardizing on across the organization. The networking team has already allocated the CIDR ranges and worked out the subnet design, so we have clear specifications to work from.

## What we need to build

Create a production-grade VPC migration infrastructure using **CloudFormation with YAML** that establishes a complete networking environment in the target AWS account.

### Core Requirements

1. **VPC and Subnets**
   - New VPC with CIDR block 10.1.0.0/16 (non-overlapping with existing 10.0.0.0/16)
   - 3 public subnets: 10.1.1.0/24, 10.1.2.0/24, 10.1.3.0/24
   - 3 private subnets: 10.1.11.0/24, 10.1.12.0/24, 10.1.13.0/24
   - Distribute subnets across 3 availability zones for high availability

2. **Internet Connectivity**
   - Internet Gateway attached to VPC for public subnet internet access
   - NAT Gateway in each public subnet for private subnet outbound connectivity
   - Elastic IPs allocated for each NAT Gateway

3. **Routing Configuration**
   - Public route table with route to Internet Gateway (0.0.0.0/0)
   - Private route tables per AZ with routes to respective NAT Gateways
   - Proper subnet associations for all route tables

4. **VPC Endpoints**
   - S3 gateway endpoint for private S3 access
   - DynamoDB gateway endpoint for private DynamoDB access
   - Associate endpoints with private subnet route tables

5. **Security Groups**
   - Web tier security group allowing inbound ports 80 and 443
   - Database tier security group allowing inbound port 5432 from web tier
   - Both security groups should allow all outbound traffic

6. **Network ACLs**
   - Replicate existing environment's NACL rules
   - Configure inbound and outbound rules with proper rule numbers
   - Associate NACLs with appropriate subnets

7. **VPC Flow Logs**
   - Enable VPC Flow Logs for security compliance
   - Send logs to S3 bucket for retention and analysis
   - Create IAM role with necessary permissions for Flow Logs

8. **Outputs**
   - VPC ID for reference in subsequent stacks
   - All subnet IDs (public and private)
   - Security group IDs (web and database tiers)
   - Route table IDs for validation
   - S3 bucket name for flow logs

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **VPC** service for core networking
- Use **EC2** service for NAT Gateways and Elastic IPs
- Use **S3** service for VPC Flow Logs storage
- Use **DynamoDB** gateway endpoint for private access
- Use **CloudWatch** for VPC Flow Logs integration
- Resource names must include **environmentSuffix** parameter for environment isolation
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to **us-east-1** region
- Use parameters for flexibility across environments

### Constraints

- The new VPC CIDR (10.1.0.0/16) must not overlap with existing VPC (10.0.0.0/16) to enable VPC peering
- All resources must be destroyable (no Retain policies on deletion)
- Security group rules must exactly mirror the existing environment
- NAT Gateways required in each AZ for redundancy and failover
- Network ACLs must maintain the same rule priorities as current environment
- VPC endpoints must be gateway type (not interface) for S3 and DynamoDB
- Include proper error handling and validation
- All dependencies must be explicitly defined using DependsOn where necessary

## Success Criteria

- **Functionality**: VPC provides full networking capabilities matching existing environment
- **High Availability**: Resources distributed across 3 AZs with redundant NAT Gateways
- **Security**: Security groups and NACLs properly configured with principle of least privilege
- **Connectivity**: Private subnets can reach internet through NAT Gateways
- **Compliance**: VPC Flow Logs enabled and sending to S3
- **Resource Naming**: All resources include environmentSuffix for proper identification
- **Outputs**: Complete set of resource IDs exported for downstream consumption
- **Code Quality**: Clean YAML, well-documented, follows CloudFormation best practices

## What to deliver

- Complete CloudFormation YAML template
- VPC with 6 subnets (3 public, 3 private) across 3 AZs
- Internet Gateway and 3 NAT Gateways with Elastic IPs
- Route tables with proper routing for public and private subnets
- VPC endpoints for S3 and DynamoDB services
- Security groups for web tier (80, 443) and database tier (5432)
- Network ACLs with inbound and outbound rules
- VPC Flow Logs to S3 bucket with IAM role
- Comprehensive outputs for VPC ID, subnet IDs, security group IDs
- Parameters for environmentSuffix and CIDR customization
- Documentation in template describing each resource
