— Failure 1
Problem: Circular dependency between security groups due to cross-referenced ingress/egress rules.
Solution: Split SG creation from SG rules using separate ingress/egress resources
Affected area: Security Groups

— Failure 2
Problem: ALB access logging failed because the S3 bucket lacked required ELB log-delivery permissions.
Solution: Added correct S3 bucket policy for `elasticloadbalancing.amazonaws.com` and enforced creation order
Affected area: S3 Bucket Policy / Load Balancer

— Failure 3
Problem: ALB logging still failed because the bucket policy was missing the region-specific ELB service account principal.
Solution: Added ELB account ID (`127311923021` for us-east-1) to bucket policy
Affected area: S3 Bucket Policy

— Failure 4
Problem: ALB logging failed again due to ACL restrictions, wrong service principal, and overly strict PublicAccessBlock settings.
Solution:

- Added OwnershipControls
- Relaxed ACL blocking
- Switched principal to `logging.s3.amazonaws.com`
- Added `s3:PutBucketAcl` and required ACL condition
  Affected area: S3 Bucket / S3 Policy

— Failure 5
Problem: ALB logging still failed because KMS encryption and ACL complexity blocked ELB log delivery.
Solution:

- Switched to S3 AES256 encryption
- Removed ownership controls
- Restored strict PublicAccessBlock
- Simplified bucket policy to only allow required `s3:PutObject` from ELB account
  Affected area: S3 Bucket / S3 Policy

— Failure 6
Problem: AutoScalingGroup failed because Launch Template referenced a KMS key in an org-restricted environment, causing EC2 encryption access errors.
Solution:

- Simplified KMS policy
- Removed EC2/Lambda service principals
- Removed explicit EBS KMS encryption from Launch Template
- Dropped all KMS-related `DependsOn`
  Affected area: KMS / Launch Template / Auto Scaling Group

### Summary

- Total issues: 6
- Severity breakdown:

  - Critical: 4 (Failures 1, 2, 3, 6)
  - High: 1 (Failure 5)
  - Medium: 1 (Failure 4)
    -All fixed-
