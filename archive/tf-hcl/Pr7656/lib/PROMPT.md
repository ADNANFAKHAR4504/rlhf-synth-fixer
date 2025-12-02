# E-Commerce Product Catalog API Infrastructure

Hey team,

We need to deploy a scalable product catalog API for a growing e-commerce company. The API handles millions of requests daily with variable traffic patterns, so we need automatic scaling that responds to demand. The business wants high availability across multiple zones with proper health checks and load balancing.

Our e-commerce platform is experiencing rapid growth, and the product catalog API is becoming a critical bottleneck. We need infrastructure that can handle traffic spikes during sales events while remaining cost-effective during off-peak hours. The solution must ensure zero downtime and automatic recovery from instance failures.

## What we need to build

Create a web application API infrastructure using **Terraform with HCL** for automatic scaling and high availability on AWS.

### Core Requirements

1. **Application Load Balancer**
   - Deploy in public subnets across 2 availability zones
   - Health checks on /health endpoint
   - HTTP (port 80) and HTTPS (port 443) listeners
   - Path-based routing for API versioning

2. **Auto Scaling Group**
   - Minimum 2 instances, maximum 6 instances
   - Target tracking scaling policy maintaining 70% CPU utilization
   - Deploy instances across 2 availability zones
   - Use t3.micro instances for cost optimization

3. **Launch Template**
   - Use latest Amazon Linux 2 AMI (via data source)
   - User data script to install and start API service
   - Enable detailed CloudWatch monitoring

4. **Target Group Configuration**
   - Sticky sessions enabled for session persistence
   - Health checks on /health endpoint
   - Proper deregistration delay for graceful shutdown

5. **Security Configuration**
   - ALB security group: allow HTTP/HTTPS from anywhere
   - EC2 security group: allow traffic only from ALB security group
   - Principle of least privilege for network access

6. **Networking**
   - VPC with public subnets in 2 availability zones
   - Internet Gateway for public internet access
   - Route tables configured for public subnet routing

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Application Load Balancer** for traffic distribution
- Use **Auto Scaling Group** with EC2 instances for compute
- Use **CloudWatch** for monitoring and metrics
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- Tag all resources with Environment and Project tags
- Terraform 1.5+ with AWS provider 5.x

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies or deletion protection)
- Use `skip_final_snapshot = true` for any databases (if applicable)
- Use `enable_deletion_protection = false` for ALB and other resources
- Include proper error handling and logging
- CloudWatch monitoring enabled for operational visibility

### Constraints

- Use ALB with path-based routing capability for future API versioning
- Deploy EC2 instances across exactly 2 availability zones
- Configure Auto Scaling with target tracking policy based on CPU utilization
- Use only t3.micro instances for cost optimization
- Create separate security groups for ALB and EC2 instances
- Enable detailed CloudWatch monitoring for all instances
- Tag all resources with Environment and Project tags
- Use data sources to fetch the latest Amazon Linux 2 AMI

## Success Criteria

- **Functionality**: ALB distributes traffic across healthy instances only
- **Scalability**: Auto Scaling responds to CPU metrics and scales appropriately
- **Reliability**: Instances span 2 AZs with automatic health checks
- **Security**: Traffic flows only through ALB to EC2 instances
- **Resource Naming**: All resources include environmentSuffix for test isolation
- **Monitoring**: CloudWatch metrics available for all components
- **Code Quality**: Clean HCL code, well-tested, documented

## What to deliver

- Complete Terraform HCL implementation
- Application Load Balancer with health checks
- Auto Scaling Group with target tracking policy
- Launch Template with user data script
- VPC, subnets, Internet Gateway, route tables
- Security groups with proper ingress/egress rules
- CloudWatch monitoring configuration
- Unit tests for all components
- Documentation and deployment instructions
- Outputs for ALB DNS name and target group ARN
