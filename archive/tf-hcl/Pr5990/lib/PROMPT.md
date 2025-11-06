# E-Commerce Product Catalog API Infrastructure

Hey team,

We need to build infrastructure for our e-commerce product catalog API that's currently handling millions of requests daily. The business is experiencing rapid growth and needs a robust, scalable deployment solution on AWS. I've been asked to create this infrastructure using **Terraform with HCL**. The operations team wants zero-downtime deployments and the ability to handle traffic spikes during sale events.

The product catalog API is the backbone of our e-commerce platform - customers browse products, check availability, and get pricing information through this service. Right now we're manually managing deployments and it's becoming a bottleneck. We need proper infrastructure automation that gives us automatic scaling, proper load balancing with SSL, and the ability to do blue-green deployments without impacting customers.

The development team already has an RDS database set up in production, so we'll be integrating with that existing resource rather than creating a new one. We also need to make sure everything follows AWS best practices for security, particularly around network isolation and access controls.

## What we need to build

Create a complete AWS deployment infrastructure using **Terraform with HCL** for our product catalog API service.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 10.0.0.0/16 CIDR block
   - Public subnets in 2 availability zones for load balancer placement
   - Private subnets in 2 availability zones for application servers
   - Internet Gateway for public subnet internet access
   - NAT Gateway to allow private subnet outbound connectivity

2. **Load Balancing and SSL**
   - Application Load Balancer deployed in public subnets
   - HTTPS listener on port 443 with SSL termination
   - Path-based routing capability for API version support
   - ACM certificate for api.example.com domain with DNS validation
   - Target group with health checks pointing to /health endpoint

3. **Auto Scaling Application Tier**
   - Launch template configured with t3.medium instance type
   - Amazon Linux 2023 as the base AMI
   - Instances deployed across private subnets in both AZs
   - Scaling policy: minimum 2 instances, maximum 10 instances
   - CPU-based auto scaling: scale out at 70% CPU, scale in at 30% CPU
   - CloudWatch detailed monitoring enabled on all instances

4. **Security Configuration**
   - ALB security group allowing HTTPS traffic (port 443) from internet (0.0.0.0/0)
   - EC2 security group allowing HTTP traffic (port 80) only from ALB security group
   - Follow least privilege security principle throughout
   - No direct internet access to application servers

5. **Database Integration**
   - Reference existing RDS by subnet group name: 'prod-db-subnet-group'
   - Do not create new RDS instance, only reference existing infrastructure

6. **Monitoring and Health Checks**
   - Target group health checks configured for /health endpoint
   - CloudWatch detailed monitoring on all EC2 instances
   - Proper logging and metric collection

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use VPC, Subnets, Internet Gateway, NAT Gateway
- Use Application Load Balancer with target groups
- Use Auto Scaling Group with Launch Template
- Use EC2 t3.medium instances with Amazon Linux 2023
- Use Security Groups for network access control
- Use AWS Certificate Manager for SSL certificates
- Use CloudWatch for monitoring
- Deploy to **us-east-1** region with exactly 2 availability zones
- Resource names must include **environmentSuffix** parameter for deployment uniqueness
- Follow naming convention: resource-type-environmentSuffix
- All resources must include tags: Environment, Project, ManagedBy

### Constraints

- Must deploy in exactly 2 availability zones within us-east-1
- RDS subnet group is separate from application subnets
- All EC2 instances must have CloudWatch detailed monitoring enabled
- Infrastructure must support blue-green deployment patterns
- All resources must be destroyable - no Retain deletion policies
- Follow AWS Well-Architected Framework principles
- Security groups must enforce least privilege access
- Include proper error handling and validation

## Success Criteria

- **Functionality**: All AWS resources deploy successfully and interconnect properly
- **Performance**: Auto Scaling Group responds to CPU metrics (70% scale-out, 30% scale-in)
- **Reliability**: ALB health checks pass and route traffic only to healthy instances
- **Security**: Security groups enforce least privilege, private subnets have no direct internet access
- **SSL**: ACM certificate properly configured and attached to ALB HTTPS listener
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Tagging**: All resources tagged with Environment, Project, and ManagedBy
- **Code Quality**: Well-structured HCL code, properly tested and documented

## What to deliver

- Complete Terraform HCL implementation with main.tf, variables.tf, outputs.tf
- VPC with public/private subnets, Internet Gateway, NAT Gateway
- Application Load Balancer with HTTPS listener and target group
- Auto Scaling Group with Launch Template and CPU-based scaling policies
- Security Groups with least privilege access rules
- ACM certificate configuration for SSL termination
- Integration with existing RDS subnet group
- CloudWatch monitoring configuration
- Comprehensive test suite with 100% coverage
- Integration tests validating complete deployment
- Documentation including deployment instructions
- Outputs for ALB DNS name and Auto Scaling Group name
