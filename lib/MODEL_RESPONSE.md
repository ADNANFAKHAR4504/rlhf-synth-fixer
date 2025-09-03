This document provides the model response for the web_application_stack.yaml CloudFormation template. The template provisions a highly available, secure, and scalable production-grade web application in the AWS us-east-1 region, following best practices for infrastructure as code.

Key Features Implemented
1. Static Asset Hosting

S3 Bucket:

Configured for server-side encryption.

Proper access controls applied.

CloudFront Distribution:

Origin: S3 bucket.

HTTPS enabled using an ACM certificate.

Logging enabled for audit and monitoring.

2. Application Tier

EC2 Auto Scaling Group:

Amazon Linux 2 AMI.

Min size = 2, Max size = 6.

Launch configuration with secured security groups.

Security Groups:

Inbound traffic restricted to HTTP (80) and HTTPS (443) only.

IAM Role for EC2:

Provides least-privilege access to DynamoDB table.

3. Data Tier

DynamoDB Table:

Provisioned throughput: 5 RCUs / 5 WCUs.

Configured with Point-in-Time Recovery (PITR) for nightly backups.

4. Networking

VPC:

Spans multiple Availability Zones.

Contains public and private subnets.

Internet Gateway: Attached to VPC.

NAT Gateway: Provides outbound internet access for private subnets.

Elastic Load Balancer (ALB):

Placed in public subnets.

Routes traffic to EC2 instances in private subnets.

5. Monitoring & Security

CloudWatch Alarms:

Triggered when EC2 CPU > 75% for 5 minutes.

IAM Policies:

No hardcoded credentials.

Policies are inline with resources.

Parameter Store:

Used for storing sensitive values.

Resource Tags:

All resources tagged with Environment: Production.

6. Domain & Routing

Route 53 Hosted Zone:

Configured for application domain.

DNS record set points to the CloudFront distribution.

Expected Outcomes

A functional production-ready web application infrastructure deployed on AWS.

Application assets served securely via CloudFront + S3 + HTTPS.

Dynamic content handled by EC2 instances + DynamoDB.

Centralized monitoring with CloudWatch.

Domain routed through Route 53, ensuring a seamless user experience.