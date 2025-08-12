You are an AWS CloudFormation expert specializing in secure, compliant infrastructure as code. Create a complete, production-ready CloudFormation template in YAML for the us-west-2 AWS region that meets the following requirements:

Networking

Create a VPC with both public and private subnets across at least two availability zones.

Attach an Internet Gateway for public subnet access.

Configure a NAT Gateway in the public subnet for private subnet outbound traffic.

Security Groups & Access Control

Create security groups allowing SSH access only from the IP range 203.0.113.0/24.

Ensure all EBS volumes attached to EC2 instances are encrypted.

Use IAM roles for EC2 instances to securely access S3 without embedding credentials.

Create S3 bucket policies to allow only HTTPS/TLS connections.

Monitoring & Compliance

Enable CloudTrail to log all account activity to an S3 bucket (with encryption).

Enable AWS Config to monitor and record all resource configurations.

Compute & Scaling

Deploy EC2 instances in an Auto Scaling Group across two availability zones for high availability.

Database & Storage

Create at least one DynamoDB table with point-in-time recovery enabled.

Alerting & Incident Response

Create a CloudWatch alarm that triggers on unauthorized access attempts (CloudTrail events).

Use an AWS Lambda function to send alerts via SNS email notification when triggered.

Additional Requirements:

Follow AWS best practices for security and compliance.

Use parameterization where possible (e.g., CIDR ranges, instance types).

Ensure the YAML is fully valid and deployable without modification.

Include Outputs for key resources (e.g., VPC ID, Subnet IDs, EC2 ASG name, S3 bucket names).