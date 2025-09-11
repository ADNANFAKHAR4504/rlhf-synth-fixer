# AWS CI/CD Pipeline Infrastructure Challenge

Create a comprehensive AWS CloudFormation template in JSON format to deploy a production-grade CI/CD pipeline for a microservices architecture. The infrastructure should demonstrate best practices in security, scalability, and maintainability.

## Requirements

### Core Components
1. **CI/CD Pipeline**
   - AWS CodePipeline integrated with CodeBuild and CodeDeploy
   - S3 bucket for artifact storage with versioning enabled
   - Automated build and deployment process

2. **Compute and API Layer**
   - Lambda function using latest Node.js runtime
   - API Gateway with logging enabled
   - Application Load Balancer with HTTPS listener
   - EC2 instances in a secured environment

3. **Data Layer**
   - DynamoDB tables with point-in-time recovery
   - RDS instances with automated backups

4. **Monitoring and Security**
   - CloudWatch Alarms for Lambda errors
   - CloudTrail for API auditing
   - SNS topics with KMS encryption
   - Step Functions for Lambda orchestration

### Technical Constraints
1. **Resource Configuration**
   - Region: us-east-1
   - All resources must be tagged with 'Environment: Production'
   - Use latest Amazon Linux 2 AMI for EC2 instances
   - Enable CloudFront CDN for API caching

2. **Security Requirements**
   - Implement least privilege IAM roles
   - Configure security groups for EC2 access control
   - Enable cross-account access auditing
   - Encrypt sensitive data using KMS

3. **Network Architecture**
   - VPC with public and private subnets
   - Secure network access patterns
   - Proper route table configurations

4. **Monitoring and Maintenance**
   - Enable Cost and Usage Reports
   - Configure CloudWatch logging
   - Implement backup and recovery strategies

## Additional Considerations
- Use Parameters section for environment-specific configurations
- Implement proper error handling and rollback mechanisms
- Follow AWS Well-Architected Framework principles
- Include comprehensive resource tagging strategy
- Document any assumptions or prerequisites

## Deliverables
1. CloudFormation template in JSON format
2. All resources must include required tags
3. IAM roles with minimum required permissions
4. Proper security group configurations
5. Complete monitoring and alerting setup

## Success Criteria
- Template successfully creates all required resources
- All security controls are properly implemented
- Monitoring and alerting are correctly configured
- Infrastructure follows AWS best practices
- Resources are properly tagged and organized
