Design a secure and scalable e-commerce infrastructure on AWS using CloudFormation JSON with comprehensive security controls and high availability.

The solution should include a VPC with isolated network spanning 2 availability zones with public and private subnets configured for optimal security. Security groups must be configured to restrict access with ALB allowing HTTP and HTTPS from internet, web servers allowing traffic only from ALB and SSH from restricted CIDR ranges, and database security group allowing MySQL access only from web servers. 

An RDS MySQL database should be provisioned with Multi-AZ deployment, encryption at rest using KMS, 7-day backup retention, and deployment in private subnets. Database credentials must be managed through AWS Secrets Manager with automatic rotation capabilities.

An S3 bucket should be set up with KMS encryption enabled, versioning configured, public access blocked, and lifecycle policies for cost optimization. The bucket must deny insecure transport and integrate with the application through IAM roles.

Auto Scaling Group should be configured with Application Load Balancer for high availability, target tracking scaling policy based on CPU utilization, and health checks through ELB. Launch template must enforce IMDSv2 for metadata service security and include proper EBS volume configuration.

All resources must be secured with KMS encryption where applicable, IAM roles must be created with least privilege access, and CloudWatch should capture logs and metrics for monitoring. SNS topic should be configured for security alerts with email notifications.

Lambda function should be included for automated security remediation with capabilities to handle S3 public access violations and other security findings. Environment variables must be used to pass configuration data and resource policies should be applied for secure access control.

The deployment must be environment-agnostic using parameters for configuration, follow AWS best practices around security and operational excellence, and include comprehensive tagging strategy for resource management. All critical resource identifiers should be exported as CloudFormation outputs for cross-stack references.