# Security Configuration as Code

I need to create infrastructure as code for a production environment that focuses on security best practices. The solution should include EC2 instances and S3 buckets with comprehensive security configurations.

## Requirements

Create a secure production environment with the following components:

1. **S3 Bucket Security**
   - Block all public access 
   - Enforce SSL/TLS for all data transfers
   - Enable server-side encryption

2. **EC2 Instance Security**
   - Use IAM roles with minimal required permissions
   - Apply security groups that only allow HTTPS traffic on port 443
   - No SSH access for production security

3. **Logging and Monitoring**
   - Enable CloudWatch logging for all resources
   - Set log retention to 7 days to manage costs
   - Use AWS IAM Access Analyzer for access monitoring
   - Integrate Amazon GuardDuty for threat detection

4. **Resource Management**
   - Tag all resources with "Environment: Production"
   - Deploy in us-west-1 region
   - Follow principle of least privilege for all IAM policies

5. **Infrastructure Code Requirements**
   - Use AWS CDK with TypeScript
   - Provide complete infrastructure code in separate files
   - One code block per file for easy deployment
   - Include proper error handling and validation

Please provide the complete infrastructure code that implements these security requirements. Make sure all components work together and follow AWS security best practices for production environments.