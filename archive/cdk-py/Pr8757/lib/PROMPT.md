# Prompt

Build a secure and observable AWS CDK v2 application in Python for a simple web workload.

Connectivity and data flow requirements:

- CloudFront connects to an S3 origin that stores static site assets.
- An ALB forwards HTTP traffic to EC2 instances in an Auto Scaling Group.
- EC2 instances send data to CloudWatch.
- CloudWatch alarms publishes to an SNS topic for alerting.

Security requirements:

- S3 buckets use encryption and block public access.
- IAM policies follow least privilege and avoid wildcard permissions.
- Secrets Manager stores application secrets.

Operational requirements:

- Add a CloudWatch dashboard with at least one widget.
- Export stack outputs for the S3 bucket name, CloudFront domain name, and ALB DNS name.

Testing requirements:

- Unit tests use CDK assertions to validate key resources and outputs.
- Integration tests use boto3 to validate deployed resources based on the outputs file.
