## Expert-Level Pulumi CI/CD Pipeline Integration (Python) with Enhanced Security and Compliance..

hey, so we need to build this pulumi thing for our CI/CD pipeline. basically we want a single python file that works with github actions and deploys to AWS.

the stack should deploy everything to us-west-2 region and we need to follow these requirements:

1. KMS stuff - need to create KMS keys with automatic rotation for encrypting secrets and S3 buckets. use aws.get_caller_identity() to get the account ID for policies. set deletion window to 0 for dev (7 days for prod)

2. no hardcoded secrets - use pulumi_random.RandomPassword for all sensitive stuff like db passwords, api keys, tokens. everything should be generated dynamically

3. python 3.12 runtime - all lambdaa functions need to use python 3.12

4. policy as code - implement compliance policies using IAM policies and roles. create AWS Config compatible stuff for tagging, S3 encryption, lambda security. but use simplified IAM policies instead of complex AWS Config Rules to avoid cross-account permission issues

5. budget management - set up AWS Budgets with $15 monthly cap and notifications at 80%% and 100%

6. secrets management - use AWS Secrets Manager with KMS encryption for all credentials. everything encrypted at rest with custom KMS key

7. automatic rollback - impleement rollback using lambda function versioning and cloudwatch alarms instead of CodeDeploy (avoid cross-account issues). create custom rollback functions that can revert to previous versions when alarms trigger

8. multi-region - deploy to us-west-2 as primary and us-east-1 as secondary for HA

9. testing - create unit tests with mocking and integration tests with dynamic resource naming based on env vars. no hardcoded resource names

10. documentation - includ setup instructions, follow pulumi best practices, and document the pipeline integration

some implementation notes:

- use pulumi_random.RandomPassword for all secret generation
- implement KMS encryption for S3 buckets and Secrets Manager
- create custom rollback mechanisms using lambda versioning and cloudwatch
- use environment-based dynamic resource naming
- implement IAM-based compliance policies instead of AWS Config Rules
- make sure all resources have proper tagging for cost allocation

the final deliverable should be a standalone python pulumi file that can be used immediately in our github repo for CI/CD automation. shouldnt need access to internal AWS accounts or external CI/CD pipeline configs.

---

Project Name: IaC >- AWS Nova Model Breaking  
Difficulty: Expert
