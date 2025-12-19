A recent security audit flagged our IAM roles for being overly permissive. Please write a secure CloudFormation template in YAML to create new roles.

Here are the requirements:

Roles: Define separate IAM roles for an EC2 instance and a Lambda function.

Least Privilege: Attach specific, least-privilege inline policies to each role.

Security: Apply a restrictive permission boundary to both roles to prevent any potential privilege escalation.

Strict Policy: Explicitly deny the use of wildcard actions (like "Action": "\*") in all policies.

The expected output is a single, validated CloudFormation template. You should also confirm that it would pass a CFN-Nag scan and that no wildcard actions exist in the policies.
