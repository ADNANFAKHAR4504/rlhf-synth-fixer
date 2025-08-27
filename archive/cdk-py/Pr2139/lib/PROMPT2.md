Update the CDK Python code in tap.py and lib/tap_stack.py to fix API compatibility issues and ensure successful synthesis. 

Please address the following requirements:

- Update the ASG/ALB health checks to use the current CDK v2 API.
- Keep the CPU alarm on EC2’s CPUUtilization metric.
- Ensure the VPC has DNS hostnames and DNS support enabled.
- Maintain encryption at rest for S3, RDS, and EBS using KMS, defaulting to the AWS-managed EBS key unless an override is provided.
- Implement least-privilege IAM with no broad wildcards.
- Name resources with the environment suffix and avoid hard-coded secrets.

Return only the updated code for tap.py and lib/tap_stack.py.
