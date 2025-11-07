Hey team,

We need to build a scalable infrastructure for an e-commerce company's Node.js application that can handle variable traffic loads during peak shopping hours. I've been asked to create this infrastructure using CloudFormation with JSON templates. The business wants automated scaling capabilities, load balancing, and a robust database backend with read replicas for improved performance.

The current challenge is that their application experiences traffic spikes during sales events and promotional periods, but they're paying for over-provisioned infrastructure during quiet hours. We need a solution that automatically scales compute capacity based on demand while maintaining high availability and security.

The infrastructure needs to support a Node.js web application running on EC2 instances with automatic scaling between 2 and 6 instances. Database operations require a PostgreSQL backend with read replicas to handle the read-heavy workload during peak times. All sensitive configuration like database credentials must be securely managed through AWS Secrets Manager.

## What we need to build

Create a complete infrastructure stack using **CloudFormation with JSON** for an auto-scaling Node.js e-commerce application with managed database backend.

### Core Requirements

1. **Network Infrastructure**
   - Create a VPC with 2 public and 2 private subnets across 2 availability zones
   - Set up NAT Gateways for outbound internet access from private subnets
   - Configure proper routing tables for public and private subnet traffic flow

2. **Load Balancing and HTTPS**
   - Deploy an Application Load Balancer in public subnets
   - Configure HTTPS listener using an ACM certificate
   - Set up health checks targeting /health endpoint on port 3000

3. **Auto Scaling Compute Layer**
   - Deploy an Auto Scaling Group in private subnets with minimum 2 and maximum 6 t3.medium instances
   - Use Amazon Linux 2 AMI for EC2 instances
   - Configure scaling policies to add instances when average CPU exceeds 70%
   - Configure scaling policies to remove instances when average CPU drops below 30%

4. **Database Layer**
   - Create an RDS PostgreSQL 14.x instance using db.t3.medium instance type
   - Deploy with Multi-AZ configuration for high availability
   - Set up one read replica to handle read-heavy workloads
   - Configure automated backups
   - Enable deletion protection on the RDS instance

5. **Security Configuration**
   - Store database connection string in AWS Secrets Manager
   - Reference Secrets Manager secret in EC2 user data for application configuration
   - Configure security groups allowing only ALB to reach EC2 instances on port 3000
   - Configure security groups allowing only EC2 instances to reach RDS on port 5432
   - Ensure EC2 instances are deployed in private subnets only

6. **Outputs and Monitoring**
   - Output the ALB DNS name for application access
   - Output RDS primary endpoint address
   - Output RDS read replica endpoint address

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use VPC for network isolation
- Use Application Load Balancer for traffic distribution
- Use Auto Scaling for dynamic capacity management
- Use RDS PostgreSQL 14.x with read replica for database
- Use Security Groups for network access control
- Use NAT Gateway for private subnet internet access
- Use AWS Secrets Manager for credential management
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- All resources must be tagged with Environment and Project tags

### Constraints

- Use AWS RDS PostgreSQL 14.x with at least one read replica
- Deploy EC2 instances in private subnets only
- Application Load Balancer must use HTTPS with ACM certificate
- Auto Scaling Group must scale between 2-6 instances based on CPU utilization
- All resources must be tagged with Environment and Project tags
- Database credentials must be stored in AWS Secrets Manager
- EC2 instances must use Amazon Linux 2 AMI
- Enable deletion protection on the RDS instance
- All resources must be destroyable (no Retain policies in production stacks)
- Include proper error handling and logging
- NAT Gateways must be in public subnets with Elastic IPs

## Success Criteria

- Functionality: Complete infrastructure deploys successfully and Node.js application can connect to database
- Performance: Auto Scaling responds to CPU metrics and scales appropriately
- Reliability: Multi-AZ deployment ensures high availability and read replica improves read performance
- Security: EC2 instances in private subnets, database credentials in Secrets Manager, proper security group rules
- Resource Naming: All resources include environmentSuffix parameter for unique identification
- Code Quality: CloudFormation JSON template, well-structured parameters and outputs, comprehensive documentation

## What to deliver

- Complete CloudFormation JSON template implementation
- VPC with public and private subnets across 2 availability zones
- Application Load Balancer with HTTPS listener
- Auto Scaling Group with CPU-based scaling policies
- RDS PostgreSQL 14.x with read replica
- Security Groups for ALB, EC2, and RDS
- NAT Gateway configuration for private subnet internet access
- AWS Secrets Manager secret for database credentials
- Unit tests for all template components
- Documentation and deployment instructions
