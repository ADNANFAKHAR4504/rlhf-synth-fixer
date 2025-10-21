# Model Response Failure Analysis

The initial model output looked plausible, but QA surfaced several issues that prevented a secure, region-agnostic deployment. The fixes baked into `IDEAL_RESPONSE.md` address the problems detailed below.

## Critical Failures

### 1. KMS Key Policy Missing Service Principals (Blocking)
- **Symptom**: CloudWatch Logs failed to create the log group when encryption was enabled, returning `AccessDeniedException` because the logging service was not allowed to use the customer-managed KMS key.
- **Root Cause**: The model relied on the default KMS key policy, which only grants the account root user access. Managed services like CloudWatch Logs, RDS, Secrets Manager, and ElastiCache require explicit permissions.
- **Fix**: Crafted a KMS key policy that permits the necessary AWS services (logs, rds, secretsmanager, elasticache, ecs-tasks) to encrypt, decrypt, and generate data keys.

### 2. TLS Port Mismatch on ECS Tasks (High)
- **Symptom**: Service Connect advertised HTTPS on port 443, but the container task definition exposed HTTP on port 80, and the security group also left port 8080 open. This violated the HIPAA requirement for TLS in transit and caused failed health checks when clients attempted HTTPS.
- **Fix**: Locked the task definition to port 443, removed the stray 8080 rule, and kept security group ingress limited to encrypted traffic.

### 3. Hard-Coded CloudWatch Logs Region (High)
- **Symptom**: Deployments outside `us-east-1` failed because the log configuration hard-coded `awslogs-region`. In any other region, tasks could not start due to log driver misconfiguration.
- **Fix**: Resolved the region dynamically via `aws.get_region()` and reused that value across the stack.

### 4. Plaintext Handling of the Master Password (Medium)
- **Symptom**: The random password output fed directly into the RDS cluster and Secrets Manager version, leaving the value visible in Pulumi state files instead of being marked secret.
- **Fix**: Wrapped the generated password with `pulumi.Output.secret(...)` before it touched any resource, ensuring it stays encrypted at rest in state and in flight to AWS APIs.

## Compliance Clean-up
- Enforced encrypted CloudWatch log storage by keeping the log group on the same KMS key once the policy was corrected.
- Ensured the ECS execution role retains only the permissions needed to read the secret and decrypt with the KMS key.

## Outcome
After applying these fixes, the infrastructure deploys successfully in any AWS region while satisfying the HIPAA checklist in the prompt: encrypted data at rest, TLS-enforced services, secrets isolated in AWS Secrets Manager, and 30-day retention for database backups.
