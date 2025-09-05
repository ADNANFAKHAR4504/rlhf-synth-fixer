Role

You are Claude Sonnet, an expert AWS solutions architect and Terraform practitioner. Produce production-quality Terraform code that validates with terraform validate and implements secure, least-privilege, cost-effective AWS infrastructure.

Objectives:

Configure AWS infrastructure for a simple web app in us-east-1 (N. Virginia) with two environments (staging, production) managed via Terraform workspaces. The app stack includes:

Frontend: S3 static website hosting.

Backend: EC2 (Amazon Linux 2) web server.

Database: RDS (e.g., MySQL or PostgreSQL) in a private subnet.

Monitoring: CloudWatch metrics, alarms, and logs.

Interpret “Only port 22 and 80 are open on security groups” as: Only internet-facing security groups may expose ports 22 (SSH) and 80 (HTTP). Internal security groups may allow additional ports strictly for intra-VPC communication on a least-privilege basis (e.g., DB port from backend SG only), and must not be open to 0.0.0.0/0.

Hard Requirements (do all)

Provider version: AWS provider >= 3.29.0 (you may choose a higher version; if you use default_tags, set provider to a version that supports it).

Region: us-east-1.

Workspaces: Use terraform workspace for staging and production separation.

State backend: Store state in S3 with versioning enabled and SSE-S3 default encryption. Use workspace_key_prefix so each workspace has its own state path. (Optionally add a DynamoDB table for state locking as best practice.)

Global tagging: All resources must have the tag Project = "X". Prefer provider-level default_tags (if your chosen version supports it). Otherwise ensure a local.tags map is merged into every resource’s tags.

EC2 instances: t2.micro only, with EBS volume encryption enabled (SSE with AWS managed key for EBS). Enforce via validation/policy/tests.

Security groups (public): Only inbound 22 and 80 allowed. Lock SSH (22) to a variable allowed_ssh_cidr (default to a placeholder like your office IP, not 0.0.0.0/0). Outbound can be wide open unless otherwise required.

Security groups (internal): Database SG must allow its port only from the backend SG (no public ingress).

IAM roles for EC2: Attach least-privilege instance roles/policies (e.g., CloudWatch agent write, SSM if used, and any strictly necessary permissions).

MFA for all IAM users: Create an IAM policy that denies all console/API actions when aws:MultiFactorAuthPresent is false, and attach it to an IAM group (e.g., mfa-required), with an example user added to that group.

SNS: Ensure all SNS topics use HTTPS subscriptions only. Add a variable sns_https_endpoint with validation startswith("https://"). Create an alerts topic and a subscription using protocol = "https".

Lambda shutdown: Implement a Lambda function (Python 3.x) that stops EC2 instances at 20:00 (8 PM) IST daily by default. Use EventBridge rule with a parameterized cron variable (default to cron(30 14 * * ? *) which is 20:00 Asia/Kolkata = 14:30 UTC), and document this clearly. Scope the Lambda’s IAM policy to only stop instances tagged Project = "X".

CloudWatch monitoring:

Metrics/alarms for EC2 CPU (e.g., >80%), status checks.

RDS CPU/FreeStorage alarms.

Log groups for backend app and Lambda with sensible retention.

Alarm notifications sent to the HTTPS-only SNS topic.

Validation: The configuration must pass terraform validate. Provide OPA Conftest or terraform-compliance tests to assert:

EC2 instance type is exactly t2.micro.

No public SG has inbound ports other than 22 and 80.

All EBS volumes are encrypted.

S3 backend bucket has versioning and SSE-S3 default encryption.

SNS subscriptions are HTTPS.

MFA deny policy is present and attached.

Lambda and EventBridge schedule exist and target the shutdown function.

All resources include tag Project = "X".
output should be in a single file