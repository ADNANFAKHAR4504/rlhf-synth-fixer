# MODEL_FAILURES

Below are concise failures identified

1) Hardcoded and region-mismatched ACM certificate references (CloudFront certificates must be in us-east-1; ALB certificates must be in the ALB's region).

2) Protocol/port mismatch between ALB listener/target group (HTTPS/443) and EC2 instance user-data (HTTP/80).

3) Incorrect CDK construct types used for certificates and CloudFront (passing plain objects or incorrect types instead of ACM ICertificate/ListenerCertificate constructs).

4) Hard-coded global S3 bucket name risking AlreadyExists errors (S3 bucket names are globally unique).

5) Unsafe destructive defaults for stateful resources (e.g., `removalPolicy: DESTROY`, `autoDeleteObjects: true`, `deletionProtection: false` for RDS).

6) Improper KMS usage and alias handling (attempting to set `alias` in the Key constructor and cross-region key misplacement).

7) User-data, CloudWatch agent, and health-check misalignment with the chosen AMI and installed packages (commands like `ec2-metadata` may not exist; package manager differences).

```