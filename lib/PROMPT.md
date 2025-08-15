# AWS Nova Model Breaking – Pulumi CI/CD Setup

This project establishes a complete CI/CD pipeline for a serverless application deployed **entirely within AWS** using Pulumi and Python.

No GitHubb, no external services – only AWS services working natively.

---

## What It Does

AWS has everything needed to build, deploy and run the application.

The pipeline deploys the infrastructure (S3, Lambda, API Gateway, etc.) and the deployment process (CodeBuild, CodePipeline, CodeDeploy) all in a single step.

---

### Key components

- **S3 buckets** -- one for build artifacts and another one for application logs..
  Both of them are protected with a KMS CMK, versioning enabled, and bucket ownership set to `BucketOwnerEnforced`.

- **KMS key** – customer-managed key with rotation enabled. It is used for all buckets’ encryption.

- **Lambda function** – the application itself. It is deployed with an alias for zero-downtime releases.

- **API Gateway REST API** – integrated with the Lambda.

- **CodeCommit** – serves as an empty repository for the source stage of the pipeline. It is used as a fallback to placeholder values to ensure the rest of the pipeline works.

- **CodeBuild project** – responsible for compiling and packaging the application.

- **CodePipeline** – brings it all together.
  Comprised of:
  - Source from CodeCommit

  - Build with CodeBuild

  - Deploy with CodeDeploy

- **CodeDeploy** – handles Lambda traffic shifting and automatic rollback on failure.
- **CloudWatch** – logs, alarms, and metrics.

---

### Security notes

- Everything runs in isolated environments (suffix set via `ENVIRONMENT_SUFFIX`).
- IAM roles are locked down to the minimum needed.
- No public buckets, no wide-open policies.
- Tags go on _everything_:
  - `Environment` (from ENVIRONMENT_SUFFIX)
  - `Department` (defaults to Engineering)
  - `Project` (always `AWS Nova Model Breaking`)

### Naming style

We follow a mix of `nova-*` for app components and `corp-*` for shared/global stuff like log buckets or KMS keys.  
Keeps things unique across environments without resorting to random strings.

### Constraints worth noting

- All defined in a **single Pulumi Python file** – no multi-file modules here.
- Only AWS-native services are allowed. That means no GitHub Actions, no CircleCI, no S3 buckets in some random region.
- Zero downtime is a must – handled by Lambda aliases + CodeDeploy routing.
- Rollbacks are built-in thanks to CodeDeploy integration.
