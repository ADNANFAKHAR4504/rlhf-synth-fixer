Hey team,

We need to stand up the student management platform's deployment pipeline so the product folks can move fast without compromising on student data protections. The scope covers staging and production environments, and we have to deliver it with a Pulumi + Python stack in `ap-southeast-1`.

**Critical requirement:** build the entire solution with Pulumi, using Python only.

**Delivery context**
- IaC framework: Pulumi  
- Language: Python  
- Target region: ap-southeast-1

## Background
The client is an education company handling sensitive student records. They want a dependable CI/CD system that enforces compliance controls, isolates staging from production, and keeps database operations tightly managed.

## What we need
Design and implement a secure CI/CD infrastructure that ships student record updates safely. Staging and production should be isolated, and releases to production must require a manual approval step.

## Key requirements
- Store database credentials in AWS Secrets Manager and rotate them every 30 days.
- Keep the RDS instance inside a private subnet with access gated through a NAT Gateway.
- Maintain separate staging and production pipelines, with manual approval before production deploys proceed.

## Environment setup
Provision the following with Pulumi + Python:
- AWS CodePipeline orchestrating staged deployments.
- Amazon RDS (MySQL) for the student data store.
- Amazon ElastiCache to handle session management.
- AWS Secrets Manager for credential lifecycle management.

Stick to ap-southeast-1 and follow Pulumi best practices around project structure and state handling.

## Implementation guardrails
- Use the `environmentSuffix` variable in every resource name.
- Enforce encryption at rest via AWS KMS and encryption in transit (TLS/SSL) wherever supported.
- Model IAM roles and policies with least-privilege access.
- Turn on CloudWatch logging and monitoring.
- Apply consistent tagging across resources.

## Testing expectations
- Add unit tests with meaningful coverage.
- Include integration tests that exercise end-to-end workflows on the deployed stack.
- Incorporate load-test inputs from `cfn-outputs/flat-outputs.json`.

## Resource management
- The stack must be fully destroyable for CI/CD use cases.
- Reuse existing entries in Secrets Manager; do not create new secrets.
- Avoid `DeletionPolicy: Retain` unless it’s absolutely required.

## Definition of done
- Staging and production deploy cleanly in ap-southeast-1.
- Security and compliance controls described above are in place.
- Test suites pass.
- Naming follows the `environmentSuffix` convention.
- `pulumi destroy` leaves no orphaned resources.
