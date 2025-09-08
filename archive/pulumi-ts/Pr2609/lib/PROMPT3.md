The code you provided is failing with the below metioned errors at the deploy phase - 

```bash
 +  pulumi:pulumi:Stack TapStack-TapStackpr2609 create 1 message
    aws:ec2:SecurityGroup sg-pr2609  1 error
Diagnostics:
  aws:s3:Bucket (s3-bucket-pr2609):
    warning: urn:pulumi:TapStackpr2609::TapStack::aws:s3/bucket:Bucket::s3-bucket-pr2609 verification warning: versioning is deprecated. Use the aws_s3_bucket_versioning resource instead.
  aws:ec2:SecurityGroup (sg-pr2609):
    error: aws:ec2/securityGroup:SecurityGroup resource 'sg-pr2609' has a problem: invalid value for name (cannot begin with sg-). Examine values at 'sg-pr2609.name'.
  pulumi:pulumi:Stack (TapStack-TapStackpr2609):
    Downloading provider: aws
Error: Process completed with exit code 255.
```
