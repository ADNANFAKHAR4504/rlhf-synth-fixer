Create a CloudFormation template in YAML thats implements the following security and compliance controls:

Requirements:

encrypt all data at rest in S3 and DynamoDB using AES-256.

enforce least-privilege for all IAM roles and policies.

enable https for all endpoints served through Elastic Load Balancing.

Use VPC security groups to control inbound and outbound traffic by IP ranges.

Store sensitive parameters and secrets in AWS Secrets Manager.

Enable versioning for all critical data stores (S3 buckets and DynamoDB where applicable).

centralize CloudTrail logs from all regions into a single, designated encrypted S3 bucket.

Launch EC2 instances only in a custom VPC (do not use the default VPC).

Ensure RDS instances use Multi-AZ deployments for high availability.

Deploy an AWS WAF to protect web endpoints against common vulnerabilities.

Implement detection and alerting for any changes to Security Groups and Network ACLs using eventbridge to trigger sns message to trigger a lambda which will alert

Assign narrowly scoped IAM roles to Lambda functions (least privilege).

Create automated backup schedules for all database resources (RDS and other DBs).

Configure CloudWatch Alarms for critical service thresholds across the environment.

Use AWS KMS for key management and enforce automatic key rotation.

Constraints & expectations:

-the template must follow AWS best practices for security and be deployable across multiple regions.

-use KMS wherein appropriate and makesure rotation is enabled for customer-managed keys.

-Centralized logging and monitoring must be demonstrable (CloudTrail → centralized S3, CloudWatch alarms, alerting).

-All sensitive values must be stored in Secrets Manager (no plaintext secrets in the template).

-Ensure resources are tagged and named clearly to suit multi-region deployment.

-The template must pass CloudFormation validation and be executable without errors.