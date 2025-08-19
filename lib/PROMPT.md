As an AWS Solutions Architect, design a CloudFormation template named `TapStack.yml` that sets up a secure, production-ready AWS environment in the `us-west-2` region. The template should follow AWS security and compliance best practices, use YAML, and include the following:

1. Networking
   * Create a VPC with both public and private subnets.
   * Configure route tables and gateways so that internet access is only allowed where necessary.
2. Compute & Access Control
   * Launch an EC2 instance in the public subnet.
   * Restrict SSH access to a specific IP address.
   * Attach an IAM role with `ReadOnlyAccess` to the instance.
   * Use an Auto Scaling group with at least 2 instances for high availability.
3. Storage
   * Create an S3 bucket with versioning enabled.
   * Apply a bucket policy that restricts access to only the VPC.
4. Database
   * Deploy an RDS instance into the private subnet.
   * Enable storage encryption.
5. Serverless
   * Add a Lambda function that triggers whenever a new object is uploaded to the S3 bucket.
6. Monitoring & Alerts
   * Configure CloudWatch alarms to track EC2 CPU utilization.
   * If CPU usage goes above 80%, send a notification using SNS.
7. Tagging & Outputs
   * Tag all resources with `Environment: Production`.
   * Include outputs for EC2 Public IP, RDS Endpoint, and S3 Bucket Name.
