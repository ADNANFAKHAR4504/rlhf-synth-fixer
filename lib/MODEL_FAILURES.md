# model_failure.md

A model failure response for this prompt would occur when:

- The YAML is invalid or fails CloudFormation validation.
- Missing key modules (e.g., VPC, subnets, IAM role, S3 bucket, or CloudTrail).
- Uses insecure or overly permissive IAM policies like `"Action": "*"` or `"Resource": "*"` without scoping.
- Public S3 access is not blocked.
- SSL-only enforcement is missing in the S3 bucket policy.
- No `Tags` like `Environment` and `Owner` are applied on resources.
- EC2 Security Group allows `0.0.0.0/0` on all ports.
- Any placeholder like `REPLACE_ME` or `<bucket-name>` exists.
- Missing required `Outputs` or incorrect `!Ref`/`!Sub` syntax.

A typical model failure might look like:

```yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      AccessControl: PublicRead # ❌ insecure
