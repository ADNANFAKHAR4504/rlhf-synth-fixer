# Secure ECS Web Application Infrastructure

I need help setting up a secure and scalable cloud environment for a containerized web application using AWS CDK in Java. The application will be running on Amazon ECS and needs to follow strict security practices for production deployment.

## Requirements

1. **Region**: Deploy everything in us-east-1 region

2. **Networking**: 
   - VPC with proper subnet configuration
   - At least 2 public subnets and 2 private subnets across different AZs
   - Security groups with minimal required access

3. **Container Platform**:
   - ECS cluster for running the web application
   - Tasks must use proper IAM roles following least privilege principle
   - Use awsvpc network mode for enhanced security

4. **Data Security**:
   - All data at rest must be encrypted using AWS KMS
   - Use customer-managed KMS keys where appropriate
   - RDS database with multi-AZ for high availability and encryption

5. **Monitoring and Logging**:
   - CloudWatch Logs for centralized logging with KMS encryption
   - Container Insights for ECS monitoring
   - Proper log group encryption using customer-managed KMS keys

6. **Secrets Management**:
   - Use AWS Secrets Manager for database credentials and sensitive data
   - Proper IAM permissions for ECS tasks to access secrets

7. **Production Standards**:
   - All resources properly tagged for production environment
   - Follow AWS Well-Architected security principles
   - Use latest security features like enhanced CloudWatch log encryption and ECS security groups

Please provide the complete CDK Java infrastructure code that implements these requirements. The code should be production-ready and follow CDK best practices for Java applications. Make sure to include all necessary imports and properly structured stack definitions.