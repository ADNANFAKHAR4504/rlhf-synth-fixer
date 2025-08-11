# Model Failures

The submitted single-file CDKTF solution is close, but it violates several prompt constraints and contains issues that will fail at plan/apply time.

1. Missing Terraform Cloud remote backend

- Prompt requires Terraform Cloud for remote state and collaboration.
- Code imports `RemoteBackend`/`NamedRemoteWorkspace` but never configures a backend instance.
- Impact: `cdktf deploy` uses the default local backend instead of TFC, violating the requirement and breaking team workflows.

2. Plaintext secrets embedded in code

- Secrets are written directly in `SecretsmanagerSecretVersion.secret_string`:
  - Hardcoded DB password and JWT secret.
- Impact: Violates “no plaintext secrets in code”; also leaks secrets in VCS and state files.

3. Invalid ECS task secret references

- Container `secrets[].valueFrom` uses wildcard account and JSON key suffixes that won’t resolve:
  - Example: `arn:aws:secretsmanager:us-east-1:*:secret:production/database/credentials:password::`.
- Impact: Service fails to start; ECS cannot fetch secret values. Use concrete ARNs or names from resources created in this stack, with correct `:json_key::` only if the secret value is JSON.

4. RDS enhanced monitoring role ARN is invalid

- Code sets `monitoring_role_arn="arn:aws:iam::aws:role/rds-monitoring-role"`.
- Impact: This is not a valid role in the target account. Either create an IAM role with the proper trust policy and attach the AWS managed policy, or omit enhanced monitoring.

5. Outputs are insufficient for validation

- Only exports VPC ID. For verification and integration testing, you should also output ALB DNS name, target group ARN, ECS cluster/service names, RDS identifier/endpoint, and SNS topic ARN.

6. Secret materialization approach conflicts with “no plaintext in code”

- Even if Secrets Manager is used, embedding values in code contradicts the prompt. Values must come from secure variables (e.g., Terraform Cloud sensitive workspace variables) or existing secrets.

7. Minor best-practice gaps

- Hardcoded email in SNS subscription; should be parameterized.
- Hardcoded CIDR blocks and AZs without parameters; acceptable for demo but reduces reusability.

8. Incorrect ALB CloudWatch alarm dimensions

- The `TargetGroup` dimension must be the full target group resource ID (`targetgroup/<name>/<hash>`), and `LoadBalancer` must be `app/<name>/<hash>`. The current implementation derives only partial segments from ARNs.
- Impact: Alarm never evaluates correctly and won’t trigger on unhealthy targets.

9. RDS credentials/endpoint not wired to ECS when using managed password

- With `manage_master_user_password=True`, RDS stores the password in Secrets Manager and the endpoint is determined at runtime. The ECS task references a separate, hardcoded secret, so the application will not receive the actual credentials/host.
- Impact: Runtime connection failures despite successful provisioning.

Suggested remediations

- Configure `RemoteBackend` with `organization` and `NamedRemoteWorkspace`, driven by env vars (e.g., `TF_CLOUD_ORG`, `TF_WORKSPACE`).
- Replace plaintext secrets with `TerraformVariable` (sensitive=True) and write to Secrets Manager at apply time, or reference pre-existing secrets via data sources.
- Reference ECS secrets via the actual secret ARN(s) created in this stack (no account wildcard) and correct `valueFrom` format.
- Remove or properly create the RDS monitoring role; otherwise omit those fields.
- Add richer `TerraformOutput`s for key resources.
- For ALB alarms, compute CloudWatch dimensions using the full resource IDs obtained from the ALB/TG ARNs (parse to `app/<name>/<hash>` and `targetgroup/<name>/<hash>`), or use provider attributes exposing these directly.
- If using `manage_master_user_password`, reference the generated secret for DB credentials from the RDS instance in ECS (via Secrets Manager/outputs), or consistently manage a single Secrets Manager secret used by both RDS initialization and ECS tasks.
