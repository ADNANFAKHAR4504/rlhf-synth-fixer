# VPC Infrastructure for Digital Banking Platform

Hey team,

We need to build a production-ready VPC infrastructure for our new digital banking platform. I've been asked to create this using **CDKTF with Python**. The business requires strict network segmentation to meet PCI-DSS compliance standards while establishing a secure foundation for our ECS Fargate containers, RDS Aurora PostgreSQL clusters, and ALB load balancers.

This is a financial services project, so security is paramount. We need to establish a secure, isolated network foundation in AWS with controlled internet access and strict security boundaries. The infrastructure will serve as the foundation for hosting our digital banking workloads across multiple availability zones for high availability.

The network architecture needs to support future growth while maintaining cost efficiency. We're implementing a three-tier subnet design with separate public, private, and database layers. Each layer will have its own routing and security controls to enforce proper network segmentation.

## What we need to build

Create a production-ready VPC infrastructure using **CDKTF with Python** for a digital banking platform in the us-east-1 region.

### Core Requirements

1. **VPC and Subnet Architecture**
   - Create VPC with CIDR 10.50.0.0/16 in us-east-1 region
   - Deploy across 3 availability zones for high availability
   - Create 9 subnets total with /24 CIDR blocks:
     - 3 public subnets (for NAT Gateways and ALBs)
     - 3 private subnets (for application workloads)
     - 3 database subnets (for RDS instances)

2. **Internet Connectivity**
   - Deploy Internet Gateway for public subnet connectivity
   - Cost optimization: Create only 1 NAT Gateway (not 3) to reduce costs from $96/month to $32/month
   - Configure 1 Elastic IP for the NAT Gateway
   - All private and database subnets route outbound traffic through single NAT Gateway

3. **Routing Configuration**
   - Create separate route tables for each subnet type
   - Public subnets route to Internet Gateway
   - Private and database subnets route to NAT Gateway
   - All route tables must have explicit associations with no implicit routing

4. **Network Access Control**
   - Implement Network ACLs with deny-by-default policy
   - Allow only required traffic:
     - HTTPS (port 443)
     - SSH (port 22) from specific CIDR
     - Ephemeral ports (1024-65535) for return traffic

5. **Security Groups**
   - Create security groups following least privilege principle
   - ALB tier security group (web tier)
   - ECS tier security group (app tier)
   - RDS tier security group (database tier)
   - No 0.0.0.0/0 ingress rules allowed

6. **VPC Flow Logs**
   - Enable VPC Flow Logs for network monitoring
   - Store logs in S3 bucket
   - Configure S3 lifecycle policy for 7-day transition to Glacier storage class

7. **VPC Endpoints**
   - Create VPC endpoints for S3 to reduce NAT Gateway costs
   - Create VPC endpoints for ECR to reduce NAT Gateway costs

8. **Outputs**
   - Export all subnet IDs grouped by type (public, private, database)
   - Export NAT Gateway public IP
   - Export VPC endpoint IDs

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use Terraform 1.5+ with AWS provider 5.x
- Deploy to **us-east-1** region
- Follow three-tier network architecture pattern
- Implement encryption at rest and in transit where applicable
- Enable appropriate logging and monitoring
- Follow AWS Well-Architected Framework principles

### Deployment Requirements (CRITICAL)

- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-name-${environmentSuffix}
- Example: S3 bucket name must be vpc-flow-logs-${environmentSuffix}
- All resources must be destroyable after testing (no RETAIN policies)
- Use skip_final_snapshot=true for any database resources
- Set deletion_protection=false for resources that support it
- DO NOT hardcode environment names (prod-, dev-, staging-) in resource names
- DO NOT hardcode account IDs or regions in resource names

### Resource Tagging (MANDATORY)

All resources must include consistent tags:
- Environment tag
- Owner tag
- CostCenter tag

### Constraints

- VPC CIDR must be /16 (10.50.0.0/16) to accommodate future growth
- All subnets must be /24 CIDR blocks
- NAT Gateway: Deploy only 1 instance (cost optimization) instead of 3
- All route tables must have explicit subnet associations
- Network ACLs must explicitly deny all traffic except required ports
- Security groups must follow least privilege with no 0.0.0.0/0 ingress
- VPC Flow Logs must transition to Glacier after 7 days
- All resources must be tagged with Environment, Owner, and CostCenter
- Infrastructure must support future deployment of ECS Fargate and RDS Aurora

## Success Criteria

- **Functionality**: VPC spans 3 AZs with proper subnet segmentation
- **Routing**: All subnets have explicit route table associations
- **Security**: Network ACLs and security groups enforce least privilege
- **Monitoring**: VPC Flow Logs enabled with S3 storage and lifecycle policy
- **Cost Optimization**: Single NAT Gateway reduces monthly costs by 66%
- **Compliance**: Network architecture meets PCI-DSS segmentation requirements
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be destroyed without manual intervention
- **Code Quality**: Python code is well-structured, tested, and documented

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- VPC with 10.50.0.0/16 CIDR in us-east-1
- 9 subnets across 3 AZs (3 public, 3 private, 3 database)
- 1 NAT Gateway with Elastic IP for cost optimization
- Internet Gateway for public subnet connectivity
- Route tables for each subnet type with explicit associations
- Network ACLs with deny-by-default policy
- Security groups for ALB, ECS, and RDS tiers
- VPC Flow Logs with S3 storage and Glacier lifecycle
- VPC Endpoints for S3 and ECR
- Comprehensive outputs for subnet IDs, NAT Gateway IP, and VPC endpoint IDs
- Unit tests for infrastructure components
- Documentation in README.md with deployment instructions
