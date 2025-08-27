# Web Application Infrastructure with AWS CDK Java

I need to create secure infrastructure for a web application using AWS CDK Java. The application will be deployed in us-east-1 region and needs to follow specific security requirements.

## Requirements

1. **Security Group Configuration**
   - Create a security group that allows incoming HTTPS traffic on port 443 only
   - No other inbound traffic should be permitted

2. **IAM Role Setup**  
   - Create an IAM role with read-only access to all S3 buckets
   - Use the principle of least privilege - no additional permissions beyond S3 read access

3. **EC2 Instance**
   - Launch an EC2 instance and associate it with the security group created above
   - Use a standard Amazon Linux instance type

4. **Resource Naming Convention**
   - All resources must follow the pattern: myapp-<component>-production  
   - For example: myapp-securitygroup-production, myapp-iamrole-production

5. **Latest AWS Features**
   - Implement AWS Systems Manager Session Manager for secure instance access without SSH
   - Use AWS Instance Metadata Service v2 (IMDSv2) for enhanced security

The infrastructure should be simple, secure, and production-ready. Please provide the complete CDK Java code with proper imports and all necessary resource configurations.