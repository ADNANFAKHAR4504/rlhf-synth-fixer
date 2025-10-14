# Failures

- **Restart timing requirement violated**  
  The CloudWatch Events rule runs `rate(10 minutes)` but the prompt requires attempts **within 5 minutes** of stop (or retry interval 5 minutes). Schedule and retry timing are inconsistent.

- **Region not enforced**  
  Code sets `region = "us-west-2"` but does **not** configure an AWS provider or pass it to resources. Deployment could target the default region.

- **IAM least-privilege not met for EC2**  
  EC2 actions (`DescribeInstances`, `StartInstances`, `StopInstances`) are allowed on `Resource: "*"`. The policy does not restrict operations to instances tagged `Auto-Recover:true` (no resource/tag conditions).

- **Parameter Store not secured**  
  SSM parameters are created as plain `String` types. Sensitive configuration should use `SecureString` (KMS-backed) per “securely manage sensitive configuration” requirement.

- **Retry scheduling / interval mismatch**  
  The code stores `retry_interval_seconds = 300` but the scheduled rule runs every 10 minutes; the implementation does not ensure retries happen at the configured interval or within the required window.

- **S3 state handling details missing**  
  State storage in S3 is used but there is **no locking/consistency** handling (e.g., concurrent Lambda runs could race when reading/writing recovery state).

- **CloudWatch Logs configuration absent**  
  The solution grants log permissions but **does not create explicit LogGroup(s) or retention policies**, making operational retention/control incomplete.

- **SNS subscription lifecycle not addressed**  
  Email subscription is created but there is no handling/notice about required confirmation for the subscription to become active.

- **Lambda packaging / deployment hygiene**  
  The program writes Lambda source files at runtime and uses `FileArchive("./lambda")`. This works locally but is not a clear, reproducible CI-friendly packaging strategy (no build step or artifact versioning).

- **Insufficient modularization / reuse**  
  Most resources are defined inline in one program; the prompt asked for a modular, reusable codebase (separate modules/functions are expected).

- **No policy to limit IAM scope to Parameter Store/S3 names**  
  While SSM/S3 ARNs are referenced, the policy still uses broad patterns in places and lacks explicit least-privilege enforcement for parameter names and bucket object prefixes.

- **No handling for terminated or replaced instances**  
  The solution only restarts `stopped` instances — it does not detect or recreate instances that were terminated or that lost their EBS/ENI configuration.

- **No test/validation or idempotency checks included**  
  The response contains no automated tests, deployment validation steps, or Pulumi policy checks to prove the solution is fully deployable and repeatable.
