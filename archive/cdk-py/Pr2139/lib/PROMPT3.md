Implement a multi-region, multi-environment AWS infrastructure using AWS CDK (Python). Create two files: tap.py (app entry) and lib/tap_stack.py (stack). 

Build a setup with the following components:

- VPC per environment per region with public and private subnets across multiple AZs.
- Auto Scaling Group behind an ALB with health checks to replace unhealthy instances automatically.
- CloudWatch alarm on EC2 CPUUtilization (average) with a sensible threshold.
- KMS encryption at rest for S3, RDS, and EBS; default EBS to the AWS-managed key unless an override is passed in.
- Least-privilege IAM with no broad wildcards; scope actions to what’s needed.
- Clear resource names include the environment suffix; no hard-coded secrets.

Return only the code for tap.py and lib/tap_stack.py.
