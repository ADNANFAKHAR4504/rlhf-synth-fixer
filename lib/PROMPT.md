Hey team,

We have a startup client who's ready to launch their first production environment on AWS. They've been running in a dev setup and now need a proper, scalable foundation that they can replicate for staging and future environments. I've been asked to build this using **Pulumi with TypeScript** to give them infrastructure as code that's easy to maintain and version.

The business wants a complete production-ready environment that includes isolated networking, auto-scaling compute capacity, managed database, and object storage. Everything needs to be properly secured and follow AWS best practices since this will be handling real customer traffic.

They're particularly concerned about security and want to make sure we're following the principle of least privilege across the board. They also need this to be cost-effective but scalable, so we're balancing that with redundancy requirements.

## What we need to build

Create a foundational AWS environment using **Pulumi with TypeScript** for a production workload deployment. The infrastructure should provide network isolation, compute auto-scaling, managed database services, and secure object storage.

### Core Infrastructure

1. **Networking Foundation**
   - VPC with CIDR block 10.0.0.0/16 spanning two availability zones for redundancy
   - Public subnets (10.0.1.0/24, 10.0.2.0/24) for internet-facing resources
   - Private subnets (10.0.11.0/24, 10.0.12.0/24) for application and database tiers
   - Internet Gateway for public internet access
   - NAT Gateways (one per AZ) to allow private subnets outbound connectivity
   - Explicit route tables for all subnet associations

2. **Load Balancing**
   - Application Load Balancer deployed in public subnets
   - HTTP listener on port 80 to distribute traffic
   - Health checks and target group configuration

3. **Compute Resources**
   - Auto Scaling Group with t3.micro instances in private subnets
   - Minimum 2 instances, maximum 4 instances for horizontal scaling
   - Launch template configuration (not launch configuration)
   - Amazon Linux 2023 AMI for EC2 instances
   - Instances distributed across availability zones

4. **Database**
   - RDS PostgreSQL 14.x instance (db.t3.micro) in private subnets
   - Encryption at rest enabled using AWS managed keys
   - Automated backups configured
   - Multi-subnet group for high availability

5. **Object Storage**
   - S3 bucket for application assets
   - Versioning enabled for data protection
   - Lifecycle policy for storage optimization
   - Block all public access settings
   - Server-side encryption enabled

6. **Observability**
   - CloudWatch Log Groups for application logs
   - CloudWatch Log Groups for infrastructure logs
   - 7-day retention period for cost optimization

7. **Security and Access Control**
   - Security groups with least privilege rules
   - Only necessary traffic allowed between components
   - Explicit egress rules defined
   - IAM roles for EC2 instances with permissions to access S3 bucket and CloudWatch Logs
   - Managed policies for AWS service integration

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use Pulumi's AWS Classic provider (@pulumi/aws) version 6.x or higher
- All resources must be created in **ap-northeast-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming pattern: `{resourceType}-${environmentSuffix}`
- All resources must be tagged with Environment: production and ManagedBy: pulumi
- All resources must be destroyable (no Retain deletion policies, no deletion protection)
- Use Pulumi stack outputs to export VPC ID, ALB DNS name, and S3 bucket name

### Constraints

- Security groups must follow least privilege principle with explicit egress rules
- All subnet route tables must be explicitly defined (no default associations)
- RDS instance must have encryption at rest enabled using AWS managed keys
- S3 bucket must block all public access and use server-side encryption
- EC2 instances must use Amazon Linux 2023 AMI
- Auto Scaling Group must use launch template instead of launch configuration
- All resources must support clean teardown for testing environments
- Include proper error handling and validation in the code
- Add comprehensive comments explaining resource configurations

## Success Criteria

- **Functionality**: Complete working environment with all components properly integrated
- **Security**: Least privilege IAM policies, encryption at rest, network isolation
- **Scalability**: Auto Scaling Group responds to load, RDS supports growth
- **Reliability**: Multi-AZ deployment, automated backups, health checks configured
- **Resource Naming**: All named resources include environmentSuffix parameter
- **Observability**: CloudWatch logging configured for troubleshooting
- **Code Quality**: TypeScript, well-commented, follows Pulumi best practices
- **Destroyability**: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- VPC with public and private subnets across two availability zones
- Internet Gateway and NAT Gateways with proper routing
- Application Load Balancer with HTTP listener
- Auto Scaling Group with t3.micro instances (min: 2, max: 4)
- RDS PostgreSQL 14.x with encryption and backups
- S3 bucket with versioning and lifecycle policies
- CloudWatch Log Groups with 7-day retention
- Security groups with least privilege access
- IAM roles for EC2 with S3 and CloudWatch permissions
- Pulumi stack outputs for VPC ID, ALB DNS name, and S3 bucket name
- Unit tests for all components
- Integration tests using deployed resources
- Clear documentation and deployment instructions
