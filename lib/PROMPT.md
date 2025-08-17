Generate a single main.tf Terraform configuration file in HCL language that sets up a highly available, secure web application infrastructure on AWS following best practices. The code must satisfy the following requirements:

Deploy the infrastructure in a single VPC with both public and private subnets across at least two Availability Zones.

Use an Auto Scaling Group (ASG) with EC2 instances that scale based on CPU utilization, fronted by an Application Load Balancer (ALB).

Deploy an Amazon RDS PostgreSQL database inside private subnets with access restricted only to the application instances (via Security Groups).

Create an S3 bucket for application logs, enabled with server-side encryption and lifecycle policies for archival.

Define IAM roles and policies for EC2 instances and Lambda functions, adhering to the principle of least privilege.

Add a CloudFront distribution to serve application content securely.

Use Route 53 to configure DNS routing to the application domain.

Protect the app with an AWS WAF WebACL including common exploit protections.

Store application configuration parameters in SSM Parameter Store.

Configure CloudWatch Alarms for cost monitoring and scaling events.

Ensure all resources include tags aligned with organizational tagging policies.

Follow Terraform best practices:

Use variables and locals where appropriate.

Use data sources for AMIs.

Ensure encryption (KMS/SSE) for S3 and RDS.

Implement least-privilege IAM.

Use secure defaults for Security Groups and NACLs.

The output must be a single file (main.tf) containing the full configuration. Do not split into multiple files or modules.