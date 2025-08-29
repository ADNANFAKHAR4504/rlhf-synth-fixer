
Model failures are as below -

1. Model was not able to generate the full response in single go.
2. Had to get the model generate the full response.
3. Model geenrated few keys which were not required as per the task requirement.

Secrets Manager Resources Missing for RDS Passwords (both regions)
Tests expected aws_secretsmanager_secret resources that were no longer in the configuration.

IAM Roles, Policies, and Groups Missing or Incomplete
Some IAM-related resources were expected but not present, causing failures.

CloudWatch Log Groups Missing for RDS and Security
Expected CloudWatch log groups specifically tied to RDS and security events were missing.

Output Declarations Missing or Incomplete
Tests expected outputs for VPCs, subnets, RDS endpoints, IAM groups, KMS keys, CloudTrail, and others that were missing or incomplete.
