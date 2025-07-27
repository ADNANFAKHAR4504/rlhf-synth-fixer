# Common Failure Cases

1. **Missing Region Specification**:
   - VPC created in default region instead of explicitly us-east-1
   - Fix: Add `Region: us-east-1` property to VPC resource

2. **Incorrect S3 Bucket Encryption**:
   - Using default encryption instead of AES256
   - Fix: Add explicit BucketEncryption configuration

3. **Overly Permissive IAM Policies**:
   - Using `"Action": "s3:*"` instead of specific actions
   - Fix: Restrict to `s3:GetObject` and `s3:ListBucket`

4. **Missing Public Access Blocks**:
   - S3 bucket allows public access by default
   - Fix: Add PublicAccessBlockConfiguration with all blocks enabled

5. **Hardcoded Values**:
   - Using static project names instead of parameters
   - Fix: Replace with `!Ref ProjectName`

6. **Inconsistent Tagging**:
   - Missing tags on some resources
   - Fix: Add standardized tags to all resources

7. **Wildcard Resource References**:
   - Using `Resource: "*"` in IAM policies
   - Fix: Use explicit bucket ARN references