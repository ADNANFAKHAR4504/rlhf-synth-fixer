Hey team,

We need to build infrastructure for our growing e-commerce product catalog API that handles millions of daily requests. The business is pushing hard on reliability and zero-downtime deployments, so this needs to be production-grade from day one. I've been asked to create this using CloudFormation with JSON format.

The current API setup is fragile and doesn't scale well. We're seeing performance issues during peak traffic, and every deployment causes customer-facing downtime. The leadership team wants a proper load-balanced architecture with auto-scaling that can handle traffic spikes without manual intervention. They also want blue-green deployment capability so we can update the API without customers noticing.

The architecture needs to span three availability zones for high availability. We've had a few outages this year from single-AZ failures, so spreading the load across us-east-1a, us-east-1b, and us-east-1c is non-negotiable. The security team also requires all traffic to be encrypted and properly controlled through security groups.

## What we need to build

Create a high-availability web application infrastructure using **CloudFormation with JSON** for the product catalog API.

### Core Requirements

1. **Application Load Balancer**
   - Deploy across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - Configure SSL termination with ACM certificate
   - Enable HTTPS (port 443) from internet

2. **Auto Scaling Group**
   - Use t3.medium instances with Amazon Linux 2 AMI
   - Minimum 2 instances, maximum 8 instances
   - Distribute across 3 availability zones
   - Configure IMDSv2 for metadata access

3. **Target Group Configuration**
   - Path-based health checks on /api/v1/health
   - Health check interval: 30 seconds
   - Enable session stickiness for persistence

4. **CloudWatch Alarms and Scaling**
   - Monitor average CPU utilization across ASG
   - Scale-out trigger: 70% CPU
   - Scale-in trigger: 30% CPU
   - Automatic scaling based on thresholds

5. **IAM Instance Profile**
   - Allow EC2 instances to read from Parameter Store
   - Allow EC2 instances to write to CloudWatch Logs
   - Follow principle of least privilege

6. **Security Groups**
   - ALB security group: Allow HTTPS (443) from internet (0.0.0.0/0)
   - Instance security group: Allow HTTP (80) from ALB only
   - No direct internet access to instances

7. **VPC and Networking**
   - Use existing VPC with public subnets for ALB
   - Use private subnets for EC2 instances
   - Configure NAT Gateways or VPC Endpoints for outbound access
   - Prefer VPC Endpoints over NAT Gateways for cost optimization

8. **Outputs**
   - ALB DNS name for deployment pipeline integration
   - Target group ARN for CI/CD automation

9. **Resource Tagging**
   - Environment=Production
   - Application=ProductCatalogAPI

### Optional Enhancements

If time permits, consider these additional features:

- **RDS Aurora PostgreSQL**: Deploy Aurora Serverless v2 cluster with read replicas for database needs
- **ElastiCache Redis**: Add Redis cluster for session storage to improve API response times
- **AWS WAF**: Configure web application firewall on ALB for protection against common web exploits

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Template must be valid JSON format
- Use Parameters for reusable values (AMI ID, instance types, etc.)
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- All resources must be destroyable (no DeletionPolicy: Retain or RETAIN)

### Deployment Requirements (CRITICAL)

- All named resources MUST include environmentSuffix variable
- All resources MUST be destroyable (DeletionPolicy: Delete or no policy)
- No hardcoded environment names, account IDs, or regions
- Use Fn::Sub or Fn::Join for dynamic resource naming
- Do NOT create GuardDuty detectors (account-level resource limitation)
- If implementing RDS, use Aurora Serverless v2 (not provisioned)
- Avoid NAT Gateways if possible (prefer VPC Endpoints for S3, DynamoDB, etc.)

### Constraints

- Must use Amazon Linux 2 AMI for EC2 instances
- Instance type fixed at t3.medium
- ALB health check path must be /api/v1/health
- Health check interval must be 30 seconds
- CPU scaling thresholds: 70% scale-out, 30% scale-in
- All EC2 instances must use IMDSv2 for metadata access
- Parameter Store used only for database connection strings (if RDS included)

## Success Criteria

- **Functionality**: ALB distributes traffic across healthy instances in 3 AZs
- **Auto Scaling**: ASG automatically scales between 2-8 instances based on CPU
- **High Availability**: Infrastructure survives single AZ failure
- **Security**: Proper security group isolation, HTTPS termination, least-privilege IAM
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Monitoring**: CloudWatch alarms trigger scaling actions appropriately
- **Code Quality**: Valid JSON CloudFormation template, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template implementation
- All parameters defined (EnvironmentSuffix, VpcId, SubnetIds, etc.)
- IAM roles and instance profiles for EC2 instances
- Security groups for ALB and instances
- Auto Scaling Group with launch configuration/template
- CloudWatch alarms for scaling triggers
- Outputs for ALB DNS name and target group ARN
- Proper resource tagging (Environment, Application)
- Unit tests validating template structure
- Documentation with deployment instructions
