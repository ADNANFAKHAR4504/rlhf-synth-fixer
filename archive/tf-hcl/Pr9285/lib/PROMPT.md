I need help building a secure web application infrastructure on AWS using Terraform. The setup should demonstrate how different AWS services connect together to create a secure, event-driven environment.

Here is what I need:

The Application Load Balancer sits in public subnets and routes incoming traffic to web application instances in private subnets. AWS WAF v2 connects to the ALB to filter malicious requests using managed rule sets and rate limiting. The ALB sends access logs to an S3 bucket for audit purposes.

For encryption, a KMS key encrypts data stored in S3 buckets and also encrypts CloudWatch Logs. The web application writes logs to CloudWatch Logs which uses the KMS key for encryption at rest.

The web application instances connect to Systems Manager Parameter Store to retrieve configuration settings. SSM parameters store database connection strings and application config as encrypted SecureString values using the same KMS key.

For event-driven processing, the application sends custom events to an EventBridge custom event bus. EventBridge rules capture user activity events and system alerts, then route these events to CloudWatch Logs for monitoring and analysis.

IAM roles follow least privilege by granting the web application role only the specific permissions needed: reading from S3, writing to CloudWatch Logs, reading SSM parameters, and publishing to EventBridge.

The VPC has public subnets with NAT gateways that allow private subnet resources to reach the internet for updates. Security groups restrict traffic so only the ALB can reach the web application, and only from specific ports.

Please create the Terraform configuration with all resources properly connected and dependencies managed.
