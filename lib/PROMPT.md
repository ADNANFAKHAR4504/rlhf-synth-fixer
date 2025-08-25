You are an infrastructure automation engineer. Your goal is to generate a concise, production-ready Pulumi and Java class for infrastructure automation, based on the following requirements and constraints.

1. Requirements
Migrate key AWS resources (EC2 instance, S3 bucket, DynamoDB table) to a new AWS region.
Ensure data integrity, availability, and a secure, scalable environment.
2. Environment Setup
Use Pulumi with Java to define and provision:
EC2 instance with a security group allowing HTTP and SSH access.
S3 bucket: retain and make all existing data accessible post-migration.
DynamoDB table: retain and make all existing data accessible post-migration.
Facilitate connections via required security protocols.
Support migration from 'us-east-1' to 'us-west-2'.
All resource names must include an environment suffix, which should be read from the ENVIRONMENT_SUFFIX environment variable.
3. Constraints
Classes must pass Pulumi and Java validation and cfn-lint.
Do not hard code the AWS region; use environment variables.
Use dynamic references for secrets (e.g., passwords).
Do not use 'Fn::Sub' (no variables required).
Do not include unsupported properties (e.g., 'BackupPolicy' if not allowed).
'IsLogging' is required for CloudTrail (if used).
Only include EC2, S3, and DynamoDB resources.
4. Output Expectations
- Produce two Java files as described above: `WebAppStackConfig.java` and `WebAppStack.java`.
 - `WebAppStack.java` should be designed to be called from your main class.
 - Deploy all specified AWS resources without error.
 - Use descriptive logical resource names.
 - Follow AWS best practices and security guidelines.
 - Ensure the stack is fully deployable, meets all requirements and constraints, and passes validation and linting.
