
Create an AWS CloudFormation template in JSON to set up a secure baseline for our AWS environment.

The template should provision the following security resources in the us-west-2 region:

1.IAM: Create a basic IAM role with a policy that follows the principle of least privilege (read-only access to S3).
2.VPC Security:
  Set up a VPC Flow Log to capture IP traffic for a new VPC.
  Create a Security Group that allows inbound SSH (port 22) and HTTP (port 80) access from a specific IP address range (10.0.0.0/16).
3.Logging and Monitoring:
  Enable AWS CloudTrail and configure it to deliver logs to a new, secure S3 bucket.
  Set up a CloudWatch Alarm to trigger on failed AWS console sign-in attempts.
4.Data Protection:
  Create a customer-managed KMS key for encryption.
  Create a private S3 bucket that is encrypted using the KMS key created above. The bucket policy should restrict access to a specific CIDR block.
5.Secrets Management:
  Store a sample database password securely in AWS Secrets Manager with automatic encryption.
6.Compliance:
  Add an AWS Config rule to check for and flag publicly accessible S3 buckets.

Finally, please make sure the output is a single JSON file named cloud_security_template.json.