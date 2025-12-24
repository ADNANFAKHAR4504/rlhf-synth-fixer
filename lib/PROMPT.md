# Multi-Region Security Infrastructure

I need a CloudFormation YAML template for a production security setup across us-east-1 and eu-west-1. Here's what I'm trying to build:

I want an RDS database that only accepts connections from instances in my VPC through security groups. The RDS data should be encrypted using a KMS key. Also need a DynamoDB table encrypted with the same KMS key. Both databases should send their logs to CloudWatch log groups for monitoring.

For storage, I need S3 buckets that enforce HTTPS-only access through bucket policies (deny any request without SSL). The buckets should have versioning and MFA delete enabled. CloudTrail should log all account activity to these S3 buckets.

Security groups need specific rules - web security group allows HTTPS and HTTP from anywhere, database security group only allows MySQL/PostgreSQL from the web security group (no direct IP access), and Lambda security group only allows HTTPS egress.

Lambda functions should run in VPC with security groups attached, and only specific IAM roles can execute them. WAF should protect the application from common web attacks.

Need AWS Config to track changes to security groups and IAM roles for compliance. GuardDuty should be enabled to detect intrusions and send alerts. All security events and logs should go to CloudWatch.

IAM roles must require MFA for console access - the assume role policy should check for MFA presence.

Naming should follow projectname-env-resourcetype pattern (like myapp-prod-database, myapp-dev-bucket).

Make it CloudFormation YAML, deployable to both regions, following least privilege for all IAM policies (grant only specific actions needed, no wildcards). Should validate with aws cloudformation validate-template without errors.
