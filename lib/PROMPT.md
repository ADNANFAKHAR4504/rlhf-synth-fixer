Hey team,

We need to build out a production-ready AWS infrastructure using Terraform, and I want everything in a single file for easier deployment and management. The goal here is to create a secure, highly available setup in us-east-1 that meets our compliance and security standards.

So here's what we're looking to implement:

Networking Setup

We need a VPC that spans two availability zones for redundancy. Set up 2 public subnets and 2 private subnets in each AZ. Add an Internet Gateway for the public subnets and NAT Gateways so our private instances can reach out when needed.

For security groups, make sure we're only allowing traffic from specific IP ranges that we'll define in variables. No open SSH ports - we'll use SSM Session Manager instead for accessing EC2 instances.

Compute and Load Balancing

Deploy an Auto Scaling Group with EC2 instances running in the private subnets. We want an Application Load Balancer in the public subnets handling incoming traffic. Make sure the ALB enforces TLS 1.2 or higher using the ELBSecurityPolicy-TLS-1-2-2017-01 policy.

We'll pass in an ACM certificate ARN through a variable for the HTTPS listener.

Storage and Data Protection

Create S3 buckets with KMS encryption enabled, versioning turned on, and all public access blocked. Add bucket policies that deny any uploads without encryption.

For the database, provision a Multi-AZ RDS instance with KMS encryption. Store the database credentials in AWS Secrets Manager and set up automatic rotation using a Lambda function. You can write the Lambda code inline using a heredoc block.

Use SSM Parameter Store for any configuration values that aren't sensitive.

Monitoring and Compliance

Enable CloudTrail across all regions and have it write logs to an encrypted S3 bucket. Set up CloudWatch Alarms to monitor CPU usage on EC2 instances and RDS. Have those alarms send notifications to an SNS topic that emails the admin address we'll provide in variables.

Configure AWS Config with rules to check that S3 buckets have encryption and versioning enabled, RDS instances are Multi-AZ, and CloudTrail is turned on.

IAM and Resource Management

For IAM, we need roles and policies that stick to least privilege. Tag everything consistently with Environment, CostCenter, and any custom tags we define. For critical resources like databases and S3 buckets, use lifecycle prevent_destroy based on a variable so we don't accidentally delete production data.

Technical Constraints:

Keep everything in one Terraform file - no separate modules or split files. Use Terraform 1.4 or higher with AWS provider version 5.0 or above. Create all the KMS keys we need in the same file and use them consistently across S3, RDS, Secrets Manager, and CloudTrail.

Before you wrap up, run terraform fmt and terraform validate to make sure everything's clean.

Variables to Define

Set up variables for region, allowed IP ranges, ACM certificate ARN, admin email, environment name, cost center, common tags, prevent_destroy flag, EC2 instance type, and RDS engine type.

Expected Deliverable

I need one complete Terraform file with all the provider configuration, networking resources, compute setup, IAM roles, load balancer, database, storage, monitoring, and compliance resources. Include the inline Lambda function for secret rotation. Add outputs for the ALB DNS name, RDS endpoint, S3 bucket names, KMS key ARNs, and SNS topic ARN.

Make sure there are comments throughout explaining the security best practices and why we're doing things a certain way. The file should be production-ready and deployable as-is.

Let me know if you have any questions about the requirements.