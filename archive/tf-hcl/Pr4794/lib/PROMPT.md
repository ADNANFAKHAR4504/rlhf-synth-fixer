Hey team,

We need to build out secure AWS infrastructure for our new enterprise application. This needs to be rock solid from a security perspective since we're dealing with sensitive data and need to pass compliance audits.

The whole thing needs to be deployed in us-west-2 and I want everything in a single Terraform file to keep it simple for the team to manage.

Here's what we need:

## VPC and Networking

Set up a proper VPC with two public and two private subnets spread across two availability zones. We'll need an Internet Gateway for the public subnets and a NAT Gateway so our private resources can reach out when needed.

Make sure to lock things down with Network ACLs and Security Groups following least privilege - only allow what's actually needed.

## S3 Storage:

We need S3 buckets for CloudTrail logs and application logs. All buckets must have:
- Server-side encryption (use KMS)
- Versioning enabled
- Block all public access
- Proper bucket policies for the services that need access

## IAM Setup

Create IAM roles and policies that follow least privilege. No overly broad permissions - each service should only get exactly what it needs to function. 

We'll need roles for Lambda functions, EC2 instances, and RDS. Make sure the policies are tight.

## Monitoring and Compliance

Enable CloudTrail for everything - we need to log all account activity. Store those logs in an encrypted S3 bucket.

Set up CloudWatch logs with a customer-managed KMS key for encryption.

Get AWS Config running to monitor our security groups and enforce compliance rules. This will help us during audits.

## Compute and Database

Launch EC2 instances in the private subnets with encrypted EBS volumes.

For the database, we want RDS with:
- Multi-AZ deployment for high availability
- Encrypted storage
- Security groups that only allow access from our EC2 instances

## Security Configuration

Security groups should only allow HTTPS (port 443) from our organization's IP ranges. Keep outbound rules minimal.

## Application Load Balancer

Deploy an ALB with HTTPS using an ACM certificate. Integrate AWS WAF to protect against SQL injection, XSS, and other common web attacks.

Point the target group to our EC2 instances in the private subnets.

## Content Delivery

Set up CloudFront with the ALB as the origin. Force HTTPS everywhere and use a custom SSL certificate.

## Lambda Functions

Any Lambda functions need to run inside our VPC in the private subnets. Use IAM roles with least privilege and pull config from SSM Parameter Store.

## Secrets and Notifications

Use AWS Systems Manager Parameter Store for storing secrets - make sure to use SecureString type with KMS encryption.

Create SNS topics for alerts and notifications, with SSL enforced for all deliveries.

## Requirements:

- Everything in us-west-2 region
- Single Terraform file (keep it simple)
- Use latest stable AWS provider
- Every service needs encryption enabled
- Proper logging and monitoring
- Restricted access controls everywhere

The end result should be something we can deploy with just `terraform init` and `terraform apply`. Make sure to include good comments explaining the security configurations, especially around encryption, IAM restrictions, and VPC isolation.

Let me know if you have questions about any of this.