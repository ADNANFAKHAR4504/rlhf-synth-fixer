# Blue-Green Deployment Infrastructure with CDKTF Python

## Objective

Create a comprehensive Blue-Green deployment infrastructure using CDKTF with Python that enables zero-downtime deployments for a web application. The infrastructure should support seamless traffic switching between blue and green environments.

## Requirements

### 1. Network Infrastructure
- Create a VPC with public and private subnets across 2 availability zones
- Configure Internet Gateway and NAT Gateways for outbound traffic
- Set up appropriate route tables and security groups

### 2. Application Load Balancer
- Deploy an Application Load Balancer in public subnets
- Configure target groups for blue and green environments
- Set up listener rules with weighted routing capabilities
- Enable health checks for both environments

### 3. Compute Resources
- Deploy Auto Scaling Groups for both blue and green environments
- Use EC2 instances with Amazon Linux 2023 AMI
- Configure user data to install and run a sample web application
- Implement proper scaling policies

### 4. Database Layer
- Create an RDS Aurora PostgreSQL Serverless v2 cluster
- Configure with multi-AZ deployment for high availability
- Set up security groups allowing access from application tier
- Use Secrets Manager for database credentials

### 5. Deployment Management
- Implement parameter-based traffic switching mechanism
- Configure CloudWatch alarms for monitoring
- Set up SNS topic for deployment notifications
- Create S3 bucket for deployment artifacts and logs

### 6. Security
- All resources must use Security Groups with least privilege
- Database credentials must be stored in Secrets Manager
- Enable encryption at rest and in transit
- Use IAM roles for EC2 instances

### 7. Environment Configuration
- Use ENVIRONMENT_SUFFIX for resource naming
- Support dynamic environment configuration
- All resources must be fully destroyable (no retention policies)
- Region: us-east-1

## Infrastructure Components

1. **VPC Configuration**
   - CIDR: 10.0.0.0/16
   - Public subnets: 10.0.1.0/24, 10.0.2.0/24
   - Private subnets: 10.0.10.0/24, 10.0.11.0/24

2. **Blue Environment**
   - Auto Scaling Group with min: 1, max: 4, desired: 2
   - Target group with health checks
   - Initial traffic weight: 100%

3. **Green Environment**
   - Auto Scaling Group with min: 1, max: 4, desired: 2
   - Target group with health checks
   - Initial traffic weight: 0%

4. **Traffic Management**
   - ALB listener with weighted target groups
   - Parameter to control traffic split (0-100)
   - Gradual traffic migration capability

5. **Monitoring**
   - CloudWatch metrics for ALB, ASG, and RDS
   - Alarms for high error rates and unhealthy targets
   - SNS notifications for critical events

## Expected Outputs

The stack should export the following outputs:
- ALB DNS name
- Blue target group ARN
- Green target group ARN
- RDS cluster endpoint
- Database secret ARN
- VPC ID
- Public subnet IDs
- Private subnet IDs
- S3 bucket name for artifacts

## Deployment Workflow

1. Initial deployment creates both blue and green environments
2. Blue environment receives 100% traffic initially
3. New version deployed to green environment
4. Traffic gradually shifted from blue to green
5. Once validated, blue environment can be updated or decommissioned
6. Process repeats for next deployment

## Testing Requirements

- All code must have 100% unit test coverage
- Integration tests must validate:
  - ALB is accessible and returning responses
  - Both environments are healthy
  - Database is accessible from application tier
  - Traffic routing works correctly
  - Secrets Manager integration functions properly

## Cost Optimization

- Use t3.micro instances for cost efficiency
- Implement appropriate auto-scaling policies
- Use Aurora Serverless v2 with appropriate ACU configuration
- Minimize NAT Gateway usage where possible

## Additional Considerations

- Implement proper tagging strategy for all resources
- Use environment suffix for resource identification
- Ensure all resources are in the same region
- Follow AWS best practices for security and reliability
