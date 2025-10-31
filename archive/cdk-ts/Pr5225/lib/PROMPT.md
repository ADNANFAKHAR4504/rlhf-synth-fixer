A financial services company must enforce strict security controls for developer access to AWS in order to meet PCI-DSS requirements. Produce one self-contained AWS CDK (TypeScript) stack file that implements a secure baseline with strong guardrails, automated secrets rotation, and comprehensive auditing. The stack should be deployable as-is in a dev environment and parameterized for production use.

Must-have requirements

IAM & Permission Boundaries

    •	All IAM roles and users created by the stack must have permission boundaries that prevent privilege escalation.
    •	Permission boundary policy must explicitly deny actions that enable role creation/attachment or privilege escalation (for example iam:CreateRole, iam:AttachRolePolicy, iam:PutRolePolicy, iam:PassRole, and other escalation actions).
    •	Provide example developer role(s) that are least-privilege for common developer tasks (e.g., read-only access to specific services, ability to assume a limited non-privileged role) and are bounded by the permission boundary.
    •	Produce a reusable Managed Policy and a PermissionBoundary resource that can be applied to future roles.

KMS

    •	Create (or accept as parameter) a customer-managed KMS key for the account used to encrypt logs and secrets.
    •	KMS key policy must restrict key usage to explicitly listed IAM principals and AWS services (e.g., Secrets Manager, CloudWatch Logs, S3) and deny usage to other principals.
    •	Enable Key Rotation and tag the key using mandatory tags.

Secrets Manager & Rotation

    •	Provision a Secrets Manager secret with an associated rotation Lambda.
    •	The rotation Lambda must run inside isolated VPC subnets (private subnets with no internet egress) and use NAT or VPC endpoints only if explicitly parameterized; by default it should have no internet access.
    •	Secrets must be encrypted with the KMS key created/selected above.
    •	Include an example rotation schedule and rotation handler stub (TypeScript) with comments describing implementation details.

CloudWatch Logging & Retention

    •	All CloudWatch Log Groups created by the stack must have retention set to 365 days.
    •	CloudWatch Logs must be server-side encrypted using the customer-managed KMS key.
    •	Create a CloudWatch Logs retention & encryption helper so all Lambdas and rotation functions follow this setting.

Audit & Monitoring

    •	Enable CloudTrail (multi-region) and deliver logs to an S3 bucket encrypted with the KMS key; configure lifecycle rules for audit logs and block public access.
    •	Create CloudWatch Alarms / dashboards for suspicious events (e.g., ConsoleSignIn failures, CreateRole API calls, KMS usage outside expected principals).
    •	Provide an SNS topic for alerting and a sample subscription (email) parameter.

Network & VPC

    •	Create a small audit VPC with private subnets designated for rotation Lambdas (no IGW/NAT by default). Parameterize VPC IDs/subnets so existing VPCs can be used.
    •	Ensure Lambdas that need to access Secrets Manager and RDS (if any) have secure network placement and appropriate VPC endpoints (parameterized).

Least-Privilege & Explicit Deny

    •	All IAM policies created must be narrowly scoped (resource ARNs, condition keys) and include explicit deny statements where relevant to enforce policy (for example deny iam:CreatePolicyVersion or iam:AttachRolePolicy for developer roles).
    •	Provide one canonical example of an explicit-deny policy document to be used as part of the permission boundary.

Tagging & Metadata

    •	Every resource must include mandatory tags: Environment, Team, ComplianceLevel, and DataClassification. Make EnvironmentSuffix a parameter used in naming and tagging.

Parameters & Customization

    •	Parameters for: EnvironmentSuffix, TeamName, ComplianceLevel (e.g., PCI-DSS), DataClassification (e.g., Sensitive), KmsKeyArn (optional — use existing), UseExistingVPC (bool) and VPC/Subnet IDs if true, AlertEmail, and SecretsRotationSchedule (cron or rate).
    •	Provide sensible defaults and clear inline comments describing recommended production values.

Outputs

    •	Export the KMS Key ARN, Secrets ARNs, PermissionBoundary ARN, sample Developer Role ARN, CloudTrail S3 bucket name/ARN, and SNS topic ARN.
