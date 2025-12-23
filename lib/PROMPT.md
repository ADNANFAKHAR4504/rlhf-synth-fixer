I need help setting up our AWS infrastructure using Pulumi with Python for four environments: production, development, staging, and testing. Each environment needs to be in its own region with complete isolation.

Here's what I need to deploy:

**Network and Compute Layer**
Set up isolated VPCs for each environment - no default VPCs. Deploy EC2 instances behind an Application Load Balancer in each region with at least two target instances per environment. The ALB should distribute traffic to the EC2 instances and perform health checks.

**Data and Storage**
Create DynamoDB tables with Point-in-Time Recovery enabled for each environment. Lambda functions should read from and write to these DynamoDB tables for region-specific processing - make sure the Lambda has proper IAM permissions to access the tables. Set up S3 buckets with server-side encryption enabled where Lambda functions can store processed data or logs.

**Monitoring and Alerts**
Configure CloudWatch to collect metrics from the EC2 instances, Lambda functions, DynamoDB tables, and ALB. Set up alarms that trigger when EC2 CPU usage is high, when Lambda functions error out, or when DynamoDB throttling occurs. These alarms should send notifications so we can respond to issues.

**Security and Access Control**
Create IAM roles for Lambda functions that allow them to read/write to DynamoDB tables and S3 buckets. EC2 instances need roles to send logs to CloudWatch and access Systems Manager Parameter Store for configuration values. Keep permissions tight - Lambda should only access its specific DynamoDB table and S3 bucket, not everything.

**Configuration Management**
Store environment-specific settings in Systems Manager Parameter Store so Lambda functions and EC2 instances can retrieve configuration without hardcoding values. Things like database connection strings, API endpoints, feature flags should live there.

**Backup Strategy**
Set up automated backups for DynamoDB tables with a Recovery Point Objective of 1 hour maximum. We need to be able to restore data quickly if something goes wrong.

**Deliverables**
Write this as a Pulumi Python project with an index.py file that provisions everything. Make it modular so we can reuse components across environments. Include tests to verify the setup works and resources are properly isolated. Add comments explaining the major sections.

The goal is consistent, repeatable deployments across all four environments with proper security and monitoring in place.
