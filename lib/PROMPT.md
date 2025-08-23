Design a secure AWS environment for handling sensitive data with advanced security controls, full auditability, and least-privilege access.

Core Requirements

1. VPC Architecture
   - Create a VPC with a prefix `prod-sec` (e.g., `prod-sec-vpc`).
   - Include both public and private subnets across multiple Availability Zones.
   - Use CIDR ranges appropriate for production use (e.g., `10.0.0.0/16`).
   - Ensure secure routing: public subnets use an Internet Gateway; private subnets use NAT Gateway.
   - Implement VPC Flow Logs for network traffic monitoring.

2. Security Groups and Network Security
   - Implement zero-trust security groups with least privilege access.
   - Allow only necessary inbound/outbound traffic between tiers.
   - Configure SSH access from specified CIDR blocks only.
   - Implement security group rules for ALB, EC2, and RDS tiers.
   - Enable VPC Flow Logs for network traffic analysis.

3. Application Load Balancer
   - Deploy an Application Load Balancer in public subnets.
   - Configure health checks and target groups for EC2 instances.
   - Support HTTPS traffic on port 443 with SSL/TLS termination.
   - Enable access logging to S3 bucket.
   - Implement proper security group rules for ALB.

4. Auto Scaling Group
   - Create an Auto Scaling Group in private subnets.
   - Use Launch Template with Amazon Linux 2023 AMI.
   - Configure desired, minimum, and maximum capacity.
   - Implement secure web server setup via user data.
   - Enable detailed monitoring for production instances.

5. Database Layer
   - Deploy PostgreSQL RDS instance in private subnets.
   - Configure database subnet group and security groups.
   - Enable encryption at rest using KMS Customer Managed Keys.
   - Enable automated backups with encryption.
   - Use environment-specific instance classes and storage.
   - Implement RDS parameter groups for security hardening.

6. Advanced Security Controls
   - Implement AWS KMS for encryption key management.
   - Create Customer Managed Keys for RDS, S3, and application data.
   - Enable AWS CloudTrail for API call logging and auditability.
   - Configure AWS Config for compliance monitoring and resource tracking.
   - Implement AWS Secrets Manager for sensitive credential storage.
   - Create comprehensive IAM policies with least privilege access.

7. IAM and Access Management
   - Create IAM roles for EC2 instances with minimal required permissions.
   - Implement IAM users with MFA requirements for administrative access.
   - Configure IAM policies for CloudTrail, Config, and Secrets Manager access.
   - Store database connection parameters in AWS Secrets Manager.
   - Implement least privilege access controls for all resources.

8. Monitoring and Compliance
   - Create CloudWatch log groups for application and security logs.
   - Configure CloudWatch alarms for security events and performance metrics.
   - Set up CloudWatch dashboard for comprehensive monitoring.
   - Implement S3 bucket for log storage with versioning and encryption.
   - Configure CloudTrail event selectors for comprehensive logging.
   - Set up AWS Config rules for compliance monitoring.

9. S3 Storage and Security
   - Create S3 bucket for log storage with proper security controls.
   - Enable server-side encryption using KMS Customer Managed Keys.
   - Implement S3 bucket policies and public access blocking.
   - Configure versioning and lifecycle policies.
   - Enable S3 access logging for audit trails.

10. Compliance and Audit
    - Implement comprehensive logging for all AWS services.
    - Configure CloudTrail to log all API calls and events.
    - Set up AWS Config for resource compliance monitoring.
    - Create CloudWatch alarms for unauthorized access attempts.
    - Implement VPC Flow Logs for network traffic analysis.
    - Configure SNS notifications for security events.

Output Expectations

- Provide a complete, working Terraform configuration in HCL.
- Include all necessary `.tf` files: `provider.tf` and `tap_stack.tf`.
- Ensure the code passes manual review and validation.
- Add inline comments for complex security logic and compliance requirements.
- Use variables for all configurable parameters.
- Implement proper tagging for cost allocation and resource management.

Assumptions

- You may assume the remote backend (S3 bucket and DynamoDB table) already exists.
- Use `terraform { backend "s3" { ... } }` with encryption enabled.
- All resources must include proper Name tags and security tags.
- Environment-specific configurations should be handled via variables and locals.
- Assume production-grade security requirements for all components.

Note: Give all infrastructure in single file tap_stack.tf.
