Need to build a CloudFormation template for a financial services app. Using YAML format.

The infrastructure needs to be secure and compliant - we're dealing with financial data so security is critical. Should be deployable to our test AWS account and pass cfn-lint and cfn-nag scans.

Here's what needs to be included:

## Networking Setup

VPC with 2 public and 2 private subnets across different availability zones. Add Internet Gateways where needed for front-end services. Set up NAT Gateways for private subnet internet access and configure route tables. Enable VPC Flow Logs so we can monitor traffic patterns.

## IAM and Access Control

Create IAM roles and policies following least privilege - only grant what's actually needed. For Lambda functions, don't hardcode any secrets. Use AWS Secrets Manager to handle credentials and sensitive config.

## Storage Components

Need S3 buckets with KMS encryption turned on by default. Block all public access at the bucket level. CloudFront should be the only way to access S3 content, using Origin Access Identity.

RDS PostgreSQL instance that's encrypted at rest with KMS. Keep it private - no public accessibility.

DynamoDB tables with multi-AZ enabled and encryption at rest.

All EBS volumes should be encrypted by default.

## Security Groups

No open ports to the public internet. Make sure SSH port 22 and RDP port 3389 are specifically closed. Security groups should only allow traffic between our own resources where needed.

## Lambda Functions

Define the Lambda functions in CloudFormation. Use environment variables for configuration but keep secrets in Secrets Manager. The Lambda roles need permissions to access S3, DynamoDB, and read from Secrets Manager.

## DNS and CDN

Route 53 private hosted zones for internal DNS resolution between services.

CloudFront distribution in front of S3 - configure it to use Origin Access Identity so S3 isn't directly accessible.

SNS topics for notifications with policies that deny public access.

## Monitoring and Compliance

CloudTrail enabled across all regions to track API calls.

AWS Config with compliance rules to check resource configurations.

WAF rules to protect against common web threats like SQL injection and XSS.

## Tagging

Every resource needs these tags:
- Environment: dev, staging or prod
- Project: name of the project
- Owner: team or person responsible

## Deliverable

Single YAML file called infrastructure.yaml. Organize it into logical sections (Networking, IAM, Storage, Lambda, etc). Add inline comments explaining what each major resource block does and why. Should be production-ready for our testing environment.
