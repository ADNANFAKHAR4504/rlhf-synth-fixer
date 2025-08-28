tap_stack.tf Deployment got failed with below error
```
│ Error: creating CloudTrail Trail (tap-secure-dev-cloudtrail): operation error CloudTrail: CreateTrail, https response error StatusCode: 400, RequestID: cd7c0f12-6218-46ed-a3b7-3f4a9307ce68, InsufficientEncryptionPolicyException: Insufficient permissions to access S3 bucket tap-secure-dev-cloudtrail-yvrjguph or KMS key arn:aws:kms:us-west-2:***:key/bb73ee1d-cbdd-45e0-b29b-1f0e9b0208c6.
│ 
│   with aws_cloudtrail.main,
│   on tap_stack.tf line 708, in resource "aws_cloudtrail" "main":
│  708: resource "aws_cloudtrail" "main" {i
```
