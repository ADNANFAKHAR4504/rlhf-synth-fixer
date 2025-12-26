We're NovaCart, an e-commerce startup, and we need you to build our secure infrastructure foundation in CloudFormation YAML.

Here's how our services need to work together:

### Customer Request Flow

When customers hit our site, CloudFront serves static content from S3 while AWS WAF inspects every request for malicious patterns before allowing traffic through. The WAF protects CloudFront and blocks SQL injection, XSS attacks, and suspicious traffic.

For dynamic content, API Gateway receives requests and validates them against strict JSON schemas before invoking Lambda functions. These Lambda functions connect to our RDS database in private subnets to fetch order data.

### Application Architecture

EC2 instances run in private subnets across multiple availability zones for high availability. They connect to RDS for database queries and read configuration files from S3. The instances use IAM roles with permission boundaries to authenticate to AWS services - they fetch database passwords from Secrets Manager and decrypt S3 objects using KMS.

### Data Protection Layer

A single KMS key encrypts everything - S3 bucket objects, RDS data at rest, CloudWatch log streams, and Secrets Manager values. When EC2 needs to read from S3, it calls KMS to decrypt the data. When CloudTrail writes audit logs to S3, it uses the same KMS key to encrypt them.

### Audit and Monitoring

CloudTrail tracks every API call across our infrastructure and sends logs to a dedicated S3 bucket with versioning enabled. At the same time, it streams events to CloudWatch Logs for real-time monitoring. Lambda sends failed invocations to an SQS dead letter queue for troubleshooting.

CloudWatch monitors CPU metrics from EC2 and RDS, triggering alarms when thresholds breach.

### Security Boundaries

Security groups lock down network access - EC2 instances only accept SSH from our office IP and HTTP from within the VPC. The database security group only allows MySQL traffic from the VPC CIDR range, preventing external access. API Gateway enforces request validation, rejecting malformed payloads before they reach Lambda.

Build this as a complete CloudFormation template with all resources connected properly.
