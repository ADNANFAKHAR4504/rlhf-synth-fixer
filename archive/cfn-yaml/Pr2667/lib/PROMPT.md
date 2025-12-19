Design and implement a CloudFormation template in YAML named web_application_stack.yaml to deploy a highly available, secure, and scalable production web application in the us-east-1 region.

The template must adhere to AWS best practices for infrastructure as code and meet the following requirements:

Static Asset Hosting

Provision an S3 bucket for static assets.

Configure correct permissions and enable server-side encryption.

Set up a CloudFront distribution pointing to the S3 bucket, with logging enabled and HTTPS enforced using an ACM certificate.

Application Tier

Create an EC2 Auto Scaling Group with Amazon Linux 2 AMIs.

Ensure a minimum of 2 and maximum of 6 instances.

Restrict security group rules to allow only inbound HTTP (80) and HTTPS (443).

Attach an IAM role to EC2 with least-privilege access to DynamoDB.

Data Tier

Deploy a DynamoDB table with provisioned throughput of 5 RCUs and 5 WCUs.

Enable nightly backups for DynamoDB.

Networking

Build a VPC spanning at least two availability zones.

Include public and private subnets, an Internet Gateway, and a NAT Gateway for outbound access.

Place EC2 instances in private subnets behind an Elastic Load Balancer.

Monitoring & Security

Configure CloudWatch alarms to monitor EC2 CPU utilization (>75% for 5 minutes).

Ensure all resources are tagged with Environment: Production.

Enforce IAM best practices (no hardcoded credentials, inline policies only where needed, use Parameter Store for sensitive values).

Domain & Routing

Configure Route 53 with a domain name, pointing traffic to the CloudFront distribution.

Constraints:

No hardcoded credentials.

All resources should be created in us-east-1.

Ensure high availability, scalability, and secure defaults.

The template must validate successfully with CloudFormation linter and deploy without errors.

Expected Output:
A fully functional CloudFormation YAML template (web_application_stack.yaml) that provisions all specified resources, applies compliance and security controls, and is production-ready.