The W1011 warning from cfn-lint highlights an important AWS security best practice:
Do not pass sensitive values (like DB passwords) as CloudFormation parameters. Instead, use dynamic references to AWS Secrets Manager or AWS Systems Manager Parameter Store.

This prevents secrets from being exposed in plaintext in stack events, templates, or logs.

What Changed

Removed the insecure DBPassword parameter.

Added an AWS Secrets Manager dynamic reference in the RDS resource definition.

The RDS MasterUserPassword is now pulled directly at deployment from an existing secret (myapp/rds/master).