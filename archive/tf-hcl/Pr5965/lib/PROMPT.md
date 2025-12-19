# Production VPC Infrastructure Setup

Hey team,

We need to build out a secure network foundation for a financial services startup launching a new trading platform. They're looking to establish a production-ready VPC infrastructure in AWS that properly separates public-facing web services from private backend systems. I've been asked to create this using **Terraform with HCL**. The business wants a highly available setup that follows AWS Well-Architected Framework principles and supports their multi-tier application architecture.

The trading platform will have web-facing Application Load Balancers handling HTTPS traffic in public subnets, while EC2 instances and PostgreSQL databases run in private subnets for security. They need everything spread across three availability zones for high availability, with proper routing and security controls in place. The network design needs to accommodate future growth while maintaining strict security boundaries between the web tier and database tier.

## What we need to build

Create a VPC network infrastructure using **Terraform with HCL** for a production trading platform deployment in us-east-1.

### Core Requirements

1. **VPC Foundation**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Tag all resources consistently with Environment, Project, and ManagedBy

2. **Subnet Architecture**
   - Deploy 3 public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Deploy 3 private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Distribute across us-east-1a, us-east-1b, us-east-1c availability zones
   - One public and one private subnet per AZ

3. **Internet Connectivity**
   - Create and attach Internet Gateway to VPC
   - Allocate 3 Elastic IPs for NAT Gateways
   - Deploy NAT Gateway in each public subnet for high availability

4. **Routing Configuration**
   - Create shared route table for all public subnets with default route to Internet Gateway
   - Create separate route table for each private subnet with default route to respective NAT Gateway
   - Associate route tables with corresponding subnets

5. **Security Groups**
   - Web server security group: allow HTTPS (443) from 0.0.0.0/0, HTTP (80) from 10.0.0.0/16
   - Database security group: allow PostgreSQL (5432) only from web security group
   - Use least-privilege principles with explicit ingress/egress rules

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use VPC, Subnets, Internet Gateway, NAT Gateway, Elastic IP, Route Tables, and Security Groups
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Apply consistent tagging: Environment=production, Project=trading-platform, ManagedBy=terraform
- All resources must be destroyable with no Retain policies
- Include proper error handling and logging

### Constraints

- VPC CIDR must be 10.0.0.0/16 for future growth capacity
- Exactly one public and one private subnet per availability zone
- NAT Gateways must be in high-availability configuration (one per AZ)
- All private subnet traffic must route through NAT Gateways
- Security groups must follow least-privilege with explicit rules
- No default resources, all Internet Gateway and route tables must be explicit
- Network segmentation must isolate web tier from database tier

## Success Criteria

- **Functionality**: VPC spans 3 AZs with proper public/private subnet separation
- **Performance**: High availability with NAT Gateway per AZ eliminates single points of failure
- **Reliability**: Multi-AZ design ensures resilience to availability zone failures
- **Security**: Databases isolated in private subnets with security group controls
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean HCL code with proper resource dependencies and tagging

## What to deliver

- Complete Terraform HCL implementation
- main.tf with VPC, subnets, Internet Gateway, NAT Gateways, route tables, and security groups
- variables.tf for configurable parameters including environmentSuffix
- outputs.tf exposing VPC ID, subnet IDs, and security group IDs
- provider.tf with AWS provider configuration for us-east-1
- Unit tests for all components
- Documentation and deployment instructions
