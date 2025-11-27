# VPC Infrastructure for Payment Processing Platform

Hey team,

We've been asked to build the networking foundation for a new payment processing platform. This is for a fintech startup that needs production-grade infrastructure with PCI compliance in mind. The business wants to support both containerized microservices and serverless functions, all running on AWS.

The key challenge here is network isolation. We need clear separation between workload tiers and proper internet access controls. Since this handles payment data, security and compliance are non-negotiable. The architecture needs to span multiple availability zones for reliability.

I've been tasked to create this infrastructure using **Pulumi with Python**. The team specifically wants to avoid NAT Gateways to keep costs down, so we'll be using NAT instances instead.

## What we need to build

Create a production-ready multi-tier VPC architecture using **Pulumi with Python** for a payment processing platform that requires PCI compliance and high availability.

### Core Requirements

1. **VPC Foundation**
   - Create VPC with CIDR 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution for service discovery
   - Deploy across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)

2. **Network Segmentation**
   - Deploy 3 public subnets for load balancers and bastion hosts
   - Deploy 3 private subnets for application workloads
   - Deploy 3 database subnets with no internet access
   - All subnets distributed across different availability zones

3. **Internet Connectivity**
   - Create Internet Gateway and attach to VPC
   - Launch t3.micro NAT instances in each public subnet for cost optimization
   - Configure routing tables: one for public subnets, one per private subnet

4. **Security Controls**
   - Create security group for bastion hosts with SSH access
   - Create security group for application tier with HTTP/HTTPS
   - Create security group for database tier with restricted access
   - All security group rules must be defined inline

5. **Compliance and Monitoring**
   - Enable VPC Flow Logs writing to S3 bucket
   - Configure S3 bucket with encryption
   - Set 30-day lifecycle policy for Flow Logs
   - Tag all resources with Environment, Project, and ManagedBy

6. **Outputs**
   - Export all subnet IDs as structured JSON
   - Export all route table IDs as structured JSON
   - Include VPC ID and security group IDs

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network foundation
- Use **EC2** t3.micro instances for NAT (cost optimization)
- Use **S3** for VPC Flow Logs storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- Use Python type hints for all custom functions and classes

### Deployment Requirements (CRITICAL)

- Resource names must include **environmentSuffix** parameter for parallel deployment isolation
- All resources must be destroyable - no RemovalPolicy.RETAIN or DeletionPolicy: Retain
- NAT instances are preferred over NAT Gateways for cost optimization
- S3 buckets must not have retention policies that prevent deletion

### Constraints

- Use Pulumi version 0.20.x or higher with AWS provider
- VPC CIDR must be 10.0.0.0/16 with subnets carved from this range
- Deploy exactly 3 availability zones for high availability
- Private subnets must use NAT instances instead of NAT Gateways to reduce costs
- All route tables must have explicit names following pattern: `{env}-{tier}-rt`
- Security group rules must be defined inline, not as separate resources
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: All 10 mandatory requirements implemented
- **Performance**: NAT instances operational with proper routing
- **Reliability**: High availability across 3 AZs
- **Security**: Network segmentation and Flow Logs enabled
- **Compliance**: PCI-ready architecture with proper isolation
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: Python with type hints, well-tested, documented
- **Destroyability**: All resources can be cleanly destroyed

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- VPC with DNS enabled
- 9 subnets total (3 public, 3 private, 3 database)
- Internet Gateway and 3 NAT instances
- Route tables with proper associations
- Security groups with inline rules
- S3 bucket for VPC Flow Logs with encryption and lifecycle
- VPC Flow Logs configuration
- Structured JSON outputs for all subnet and route table IDs
- Unit tests for all components
- Documentation and deployment instructions
