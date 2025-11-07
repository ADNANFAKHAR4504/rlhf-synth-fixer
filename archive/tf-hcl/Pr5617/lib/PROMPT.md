Hey team,

We need to build out a production AWS environment in us-west-1 using Terraform, and it needs to follow all the security best practices we've been discussing. Everything should be tagged with environment = "production" so we can track costs and resources properly.

Here's what we need to set up:

First off, IAM roles for all EC2 instances. No exceptions - every instance needs its own role with minimal permissions. We're going strict least-privilege here.

For sensitive stuff like database passwords, let's use AWS Systems Manager Parameter Store. No hardcoded secrets in the code, period. Terraform can pull these values at runtime.

We'll need two S3 buckets - one for application data and one dedicated to logging. Make sure server access logging is enabled on the application bucket, and all logs go to that logging bucket. Obviously, keep the logging bucket locked down with no public access.

CloudTrail needs to be turned on to capture all account activity. Keep logs for at least 90 days and store them in the logging S3 bucket.

For networking, build a custom VPC across two availability zones in us-west-1. We need both public and private subnets for proper separation and high availability.

Put NAT Gateways in each public subnet so our private instances can reach the internet when needed.

Set up an Application Load Balancer in the public subnets with SSL termination. Wire it up to handle traffic for our EC2 instances.

Speaking of EC2 - all instances go in the private subnets. Every EBS volume needs to be encrypted, and turn on detailed monitoring for all of them.

For security groups, stick to least privilege. Only open the ports we actually need, nothing more.

Enable AWS Config so we can monitor compliance and catch any configuration drift.

Create a Systems Manager Maintenance Window to handle automated patching of our EC2 fleet. We don't want to be doing this manually.

We also need an RDS PostgreSQL database in the private subnets. Make sure automatic backups are enabled, storage is encrypted, and credentials are stored in Parameter Store - not hardcoded anywhere.

A few key constraints:
- Everything deploys to us-west-1
- Follow AWS security best practices throughout
- Never hardcode sensitive data
- Use encryption wherever it's available
- The final output should be a single Terraform file we can deploy directly

What we're looking for as the deliverable:

A complete Terraform configuration that includes provider setup, VPC with all the subnets and route tables, NAT gateways, security groups, IAM roles and policies, both S3 buckets with access logging configured, CloudTrail, Parameter Store entries, EC2 instances with encrypted EBS and monitoring enabled, the Application Load Balancer with SSL, AWS Config, the Systems Manager maintenance window, and the RDS PostgreSQL instance with backups and encryption.

The end result should be a fully functional, secure production environment that we can deploy with a single terraform apply command. Make sure to add comments in the code explaining the security practices we're following.

Thanks!
