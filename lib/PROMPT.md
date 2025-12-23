# Payment Processing Web Application Infrastructure

Hey team,

We've been working with a financial technology startup that's struggling with their on-premises infrastructure. They're currently spending $45,000 per month maintaining their payment processing application, and they're hitting major scaling issues during peak transaction hours. The business impact is real - they're losing customers when the system slows down during busy periods.

The application handles sensitive financial data and needs to meet PCI-DSS compliance standards. They need strong network isolation, encryption everywhere, and comprehensive audit trails. The current setup just can't keep up with these requirements while also providing the elasticity they need for their growing customer base.

We need to build this infrastructure using **Terraform with HCL** to give them a solid, repeatable deployment process. The goal is to create a production-ready containerized application platform that can scale automatically, maintain security standards, and provide the monitoring they need for compliance auditing.

## What we need to build

Create a complete infrastructure solution using **Terraform with HCL** that deploys a containerized web application with a database backend. This needs to be production-ready from day one, handling financial transactions with appropriate security controls.

### Core Requirements

1. **Container Orchestration**
   - Deploy an ECS Fargate cluster for running containerized applications
   - Configure auto-scaling based on CPU and memory metrics
   - Use only Fargate launch type (no EC2 instances)
   - Implement container health checks with automatic task replacement on failure
   - Enable CloudWatch Container Insights for application monitoring

2. **Database Layer**
   - Create an RDS Aurora PostgreSQL cluster with encryption at rest
   - Configure automated backups with 3-day retention minimum
   - Use db.r6g.large instances minimum for production workloads
   - Deploy across multiple availability zones for high availability

3. **Load Balancing and Traffic Management**
   - Configure an Application Load Balancer with path-based routing
   - Implement SSL termination at the load balancer
   - Enable ALB access logs stored in a dedicated S3 bucket
   - Distribute traffic across 3 availability zones

4. **Network Architecture**
   - Implement network isolation using separate subnets for web, app, and database tiers
   - Deploy VPC across 3 availability zones in us-east-1 region
   - Create exactly one NAT gateway per availability zone for high availability
   - Enable VPC flow logs for compliance auditing with S3 storage
   - Use AWS PrivateLink endpoints for all inter-service communication

5. **Security and Compliance**
   - Store database credentials in Systems Manager Parameter Store with automatic rotation
   - Container environment variables must reference Parameter Store (not hardcoded values)
   - Enable encryption at rest for all data stores
   - Implement proper IAM roles and policies following least privilege

6. **Container Image Management**
   - Use ECR for container image storage
   - Enable vulnerability scanning on container images

### Deployment Requirements (CRITICAL)

- All resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (use appropriate deletion policies, no Retain)
- Use force_destroy on S3 buckets and other stateful resources to enable clean teardown
- FORBIDDEN: Retain policies or stateful resources that block destruction

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Terraform 1.5+** for the configuration
- Deploy to **us-east-1** region
- Configure Terraform state with S3 backend and DynamoDB locking
- Use data sources for AMI IDs and availability zones instead of hardcoded values
- Create modular structure with separate files: main.tf, variables.tf, outputs.tf, provider.tf

### AWS Services to Implement

- Amazon ECS (Fargate launch type)
- Amazon RDS (Aurora PostgreSQL 14.6)
- Application Load Balancer
- Amazon VPC (subnets, NAT gateways, internet gateway, route tables)
- Amazon S3 (for logs, backups, and Terraform state)
- AWS Systems Manager Parameter Store
- Amazon CloudWatch (Container Insights, logs, and metrics)
- Amazon ECR (Elastic Container Registry)
- VPC Endpoints for AWS services

### Constraints

- Use only Fargate launch type for ECS tasks with no EC2 instances
- RDS cluster must use db.r6g.large instances minimum with 3-day backup retention
- All inter-service communication must use AWS PrivateLink endpoints
- Terraform state must be configured for S3 backend with DynamoDB locking
- Container environment variables must reference Parameter Store, not hardcoded values
- ALB access logs must be enabled and stored in a dedicated S3 bucket
- Each availability zone must have exactly one NAT gateway for high availability
- Use data sources for AMI IDs and availability zones instead of hardcoded values

## Success Criteria

- **Functionality**: Complete working infrastructure that deploys a containerized application with database backend
- **Auto-scaling**: ECS tasks automatically scale based on CPU and memory metrics
- **High Availability**: Multi-AZ deployment with automatic failover capabilities
- **Security**: Network isolation, encryption at rest, secure credential management, VPC endpoints
- **Compliance**: VPC flow logs enabled, ALB access logs stored, audit trail capabilities
- **Monitoring**: CloudWatch Container Insights enabled, comprehensive logging
- Naming Convention: All resources include environmentSuffix for uniqueness
- Destroyability: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: Modular HCL code, well-organized, properly documented

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Provider configuration with S3 backend and DynamoDB state locking
- VPC with public, private, and database subnets across 3 AZs
- NAT gateways (one per AZ) and internet gateway
- VPC flow logs configuration
- ECS Fargate cluster with task definitions
- Auto-scaling policies for ECS based on CPU and memory
- Application Load Balancer with target groups and listeners
- RDS Aurora PostgreSQL cluster with encryption and backups
- Security groups for each tier with proper ingress/egress rules
- IAM roles and policies for ECS tasks, RDS, and other services
- Systems Manager Parameter Store for database credentials
- S3 buckets for logs, backups, and Terraform state
- CloudWatch log groups and Container Insights configuration
- ECR repository with vulnerability scanning
- VPC endpoints for AWS service access
- Variables file with all configurable parameters including environmentSuffix
- Outputs file with essential resource identifiers
- README with deployment instructions and architecture overview
- Unit tests for all infrastructure components
