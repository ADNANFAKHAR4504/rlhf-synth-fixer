Act as a senior AWS + Terraform engineer. Generate a small, production-style Terraform project that is secure, least-privilege, and cost-effective, and that passes terraform validate.

Scope (us-east-1): A simple web app with:

Frontend on S3 (static website),

Backend on EC2 (Amazon Linux 2 serving HTTP on port 80),

Database on RDS in private subnets,

Monitoring via CloudWatch (logs + basic alarms).

Hard requirements (do all exactly):

AWS provider version >= 3.29.0.

Region us-east-1.

Use Terraform workspaces for staging and production (separate state/vars).

Store Terraform state in S3 with versioning enabled and default encryption SSE-S3. Use separate keys/paths per workspace.

Tag every resource with Project = "X" (use provider default_tags or a shared locals.tags).

EC2 must be t2.micro only. Enforce with variable validation or checks.

Encrypt all EBS volumes.

Security Groups: public ingress only ports 22 and 80. Restrict SSH (22) to var.allowed_ssh_cidr (not 0.0.0.0/0); HTTP (80) may be 0.0.0.0/0. Internal DB SG must allow its port only from the backend SG, never public.

Attach least-privilege IAM roles to EC2 (only what’s needed, e.g., CloudWatch logging/SSM if used).

Enforce MFA for IAM users: attach a policy that denies all actions when aws:MultiFactorAuthPresent is false (apply via an IAM group, add one example user).

SNS topics must use HTTPS subscriptions only. Provide a var.sns_https_endpoint validated to start with https://.

Lambda shutdown job: a Python 3.x Lambda that stops EC2 instances daily at 8 PM IST (Asia/Kolkata) via an EventBridge rule. Limit permissions so it can only stop instances tagged Project = "X".

CloudWatch monitoring: EC2 CPU/status check alarms, RDS CPU/FreeStorage alarms, log groups with sensible retention. Send alarms to the HTTPS-only SNS topic.

Before deployment, the config must pass terraform validate.

Deliverables:

A minimal repo with clear modules/files (networking, security, compute, database, storage, monitoring, ops/lambda), environment tfvars for staging and production, and a short README showing exact commands:

bootstrap state (create S3 bucket with versioning + SSE-S3),

init/reconfigure backend,

create/select workspaces,

plan/apply with -var-file,

validate and run tests.

A Makefile with targets like: bootstrap, init, select-env, plan, apply, validate, test, destroy.

Lightweight policy tests (OPA/Conftest or terraform-compliance) that assert:

EC2 type is exactly t2.micro,

Only ports 22 and 80 are publicly open,

All EBS volumes are encrypted,

S3 backend bucket has versioning + SSE-S3,

SNS subscriptions are HTTPS,

MFA deny policy exists and is attached via group,

Lambda + EventBridge schedule present (8 PM IST) and permissions constrained to Project = "X",

Every resource has tag Project = "X".

Style notes:

Keep it simple and readable. No hard-coded credentials. Prefer least privilege and low cost (avoid NAT gateways unless strictly needed).

Use clear variable validations and helpful defaults.


Ensure everything runs cleanly with terraform validate.
output should only be in provider.tf and tap_stack.tf.