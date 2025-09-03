I need help building a comprehensive CloudFormation template for a production web application infrastructure in us-west-2. We're looking at a pretty robust setup that needs to cover security, compliance, and high availability.

Here's what I'm trying to accomplish:

The basic architecture should be a VPC-isolated setup with web servers sitting behind an Application Load Balancer, plus a private RDS database in the back. We'll need secure S3 buckets for storage, and I want to include a Lambda function that runs in the VPC for some processing tasks.

For security, everything needs to be encrypted with KMS - the S3 buckets, RDS, EBS volumes, the works. IAM roles should follow least privilege principles throughout. We also need WAF protection and proper access logging via CloudTrail for all S3 operations.

The infrastructure should be fully parameterized since we'll be deploying this across different environments. Things like VPC ID, subnet lists, instance types, scaling parameters, CIDR blocks for access control - all of that should be configurable through parameters.

Some specific requirements I need to hit:

The EC2 instances can't have public IPs and should only be accessible via the load balancer. Security groups need to be locked down - SSH access only from our office network, HTTP/HTTPS from specified ranges. Auto Scaling Group should span multiple AZs in private subnets.

For the database, it needs to be in private subnets only, no public access, with encryption at rest and automated daily backups. The backup retention and window should be parameterized.

S3 buckets must use SSE-KMS with a customer-managed key, block all public access, and have proper bucket policies. CloudTrail should log all S3 data events to a dedicated logs bucket.

The Lambda function should run in VPC private subnets with its own security group and minimal IAM permissions - just CloudWatch Logs access and whatever specific actions it needs.

For monitoring, I want VPC Flow Logs going to CloudWatch, with metric filters and alarms for unauthorized access attempts, especially failed SSH attempts. Also need health monitoring for the ASG instances and load balancer.

Load balancer should support both HTTP and HTTPS if we provide an ACM certificate ARN, otherwise just HTTP with optional redirect.

I'm thinking we should use the latest Amazon Linux 2023 AMI via SSM parameter lookup, and the UserData should install a basic web server with a simple index page showing stack info.

The template needs to be clean enough to pass cfn-lint validation and deploy successfully. All the outputs should be comprehensive - ALB DNS, RDS endpoints, bucket names, Lambda ARN, KMS key info, etc.

Looking for both the complete CloudFormation YAML and some CLI commands to deploy and verify everything works correctly. The whole thing should be production-ready and follow AWS best practices.

Let me know if you need clarification on any of these requirements or have suggestions for improving the security posture.