need cfn yaml for multi-region prod setup - us-east-1 and eu-west-1

setting up rds - needs to be in vpc with security group so only ec2 instances can connect to it. encrypt rds with kms key. same kms key for dynamodb table too. want cloudwatch logs from both dbs

s3 buckets - need to block http, only allow https through bucket policy. enable versioning on buckets and mfa delete. cloudtrail writes to s3

security groups:

- web sg: allow 443 and 80 from 0.0.0.0/0
- db sg: mysql/postgres ports, but ONLY from web sg - not from specific ips
- lambda sg: outbound 443 only

lambda functions in vpc, attach security groups. iam role restriction for who can invoke lambda. add waf

compliance stuff - aws config to monitor sg and iam role changes. guardduty for threat detection. everything logs to cloudwatch

iam console access needs mfa - check mfa in assume role policy

naming convention: projectname-env-resourcetype like myapp-prod-database or myapp-dev-bucket

cfn yaml format. works in both regions. iam least privilege - no wildcard actions. must pass aws cloudformation validate-template
