# Multi-Environment Infrastructure Deployment

## Objective
Create a production-ready, multi-environment infrastructure deployment system using Pulumi TypeScript on AWS. The system should support three environments (dev, staging, prod) with comprehensive security, monitoring, and scalability features.

## Requirements

### 1. Multi-Environment Support
- Support three environments: dev, staging, prod
- Environment-specific configurations and resource naming
- Environment-specific tags for cost allocation
- Shared resources across environments where appropriate

### 2. Networking (VPC)
- Create VPC with public and private subnets across 3 availability zones
- Internet Gateway for public subnet connectivity
- NAT Gateways in each availability zone for private subnet internet access
- Route tables for public and private subnets
- VPC Flow Logs to CloudWatch for network traffic monitoring
- Network ACLs for additional security layer

### 3. Compute (EC2 and ECS)
- EC2 bastion host in public subnet for secure SSH access
- ECS cluster for container orchestration
- ECS task definitions with Fargate launch type
- Auto-scaling configuration for ECS services
- EC2 security groups with least privilege access
- IAM roles for ECS task execution and tasks

### 4. Database (RDS)
- Multi-AZ PostgreSQL RDS instance for high availability
- Automated backups with 7-day retention
- DB subnet group in private subnets
- Enhanced monitoring enabled
- Encryption at rest using KMS
- Database credentials stored in Secrets Manager
- Security group allowing access only from ECS tasks

### 5. Storage (S3)
- Application assets bucket with versioning enabled
- Static website hosting bucket for CloudFront
- Logging bucket for access logs
- Server-side encryption with KMS
- Lifecycle policies for cost optimization
- Block public access by default

### 6. Content Delivery (CloudFront)
- CloudFront distribution for static content
- Origin Access Identity for secure S3 access
- HTTPS enforcement with TLS 1.2 minimum
- Custom error pages
- Access logging to S3
- Price class optimization based on environment

### 7. Load Balancing (ALB)
- Application Load Balancer in public subnets
- Target groups for ECS services
- Health checks with appropriate thresholds
- Connection draining enabled
- Access logs to S3
- Security group allowing HTTP/HTTPS traffic

### 8. Security (IAM, KMS, Secrets Manager)
- Least privilege IAM roles and policies
- KMS keys for encryption at rest (RDS, S3)
- Automatic key rotation enabled
- Secrets Manager for database credentials
- Automatic secret rotation configured
- IAM instance profiles for EC2
- Service-linked roles for AWS services

### 9. Monitoring (CloudWatch)
- CloudWatch log groups for application logs
- Metric alarms for critical resources:
  - ECS CPU and memory utilization
  - RDS CPU, connections, and storage
  - ALB target health and response time
  - CloudFront error rates
- SNS topics for alarm notifications
- CloudWatch dashboards for environment visibility
- VPC Flow Logs for network monitoring

### 10. Configuration Management
- Pulumi stack configurations for each environment
- Encrypted configuration values for sensitive data
- Output exports for cross-stack references
- Resource tagging strategy with environment, project, and cost center tags

## Technical Constraints

1. **Platform**: Pulumi with TypeScript
2. **Cloud Provider**: AWS
3. **Infrastructure as Code**: All resources must be defined in code
4. **No Manual Steps**: Deployment should be fully automated
5. **Security**: Follow AWS security best practices
6. **Cost Optimization**: Use appropriate instance sizes and features per environment
7. **High Availability**: Multi-AZ deployments for production-critical resources
8. **Monitoring**: Comprehensive logging and alerting
9. **Secrets Management**: No hardcoded credentials
10. **Testability**: Infrastructure must be testable with unit and integration tests

## Expected Deliverables

1. **Infrastructure Code** (`lib/tap-stack.ts`):
   - Main Pulumi stack with all AWS resources
   - Modular and reusable components
   - Proper resource dependencies
   - Environment-specific configurations

2. **Application Entry Point** (`bin/tap.ts`):
   - Pulumi program initialization
   - Stack configuration management
   - Output exports

3. **Unit Tests** (`test/tap-stack.unit.test.ts`):
   - Test resource creation logic
   - Validate resource configurations
   - Mock external dependencies
   - 100% code coverage

4. **Integration Tests** (`test/tap-stack.integration.test.ts`):
   - Test deployed infrastructure
   - Validate resource connectivity
   - Test security configurations
   - Use actual deployment outputs

5. **Pulumi Configuration** (`Pulumi.yaml`, `Pulumi.dev.yaml`):
   - Project metadata
   - Stack-specific configurations
   - Encrypted secrets

6. **Documentation**:
   - Resource architecture overview
   - Deployment instructions
   - Configuration guidelines
   - Troubleshooting guide

## Success Criteria

1. All 43+ AWS resources deploy successfully
2. Resources are properly tagged and organized
3. Security groups follow least privilege principle
4. Encryption enabled for data at rest and in transit
5. Monitoring and alerting fully configured
6. 100% test coverage with passing tests
7. Clean deployment (no warnings or errors)
8. Environment-specific configurations working correctly
9. All outputs properly exported for reference
10. Documentation complete and accurate

## Deployment Estimate
- Expected deployment time: 25-35 minutes
- Resource count: ~43 resources
- Critical path: RDS Multi-AZ instance creation (15-20 min) and CloudFront distribution (10-15 min)
