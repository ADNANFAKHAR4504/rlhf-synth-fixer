Use AWS CDK (Python) with two files only: tap.py (app entry) and lib/tap_stack.py (stack). Keep the same multi‑region, dev/prod setup.

 What to adjust now:

 - Configure the ASG behind the ALB using the current CDK v2 health check API; pass the grace period via the HealthCheck.elb(grace=...) keyword.
 - Keep a CloudWatch alarm on EC2 CPUUtilization (average) with a clear threshold.
 - Ensure the VPC has DNS hostnames and DNS support enabled.
 - Keep KMS encryption at rest for S3, RDS, and EBS; default EBS to the AWS‑managed key unless an override is provided.
 - IAM should be least‑privilege with no broad wildcards; name resources with the environment suffix; no hard‑coded secrets.

 Return only the code for tap.py and lib/tap_stack.py — no explanations or comments.
