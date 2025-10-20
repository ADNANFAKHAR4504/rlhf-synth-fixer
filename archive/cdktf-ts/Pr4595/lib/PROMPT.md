Generate a production-ready AWS CDKTF TypeScript project that provisions a secure, resilient web-application infrastructure in us-east-2. The generator must output ONLY TWO files: `lib/tap-stack.ts` and `lib/modules.ts`. Do NOT produce any other files (no `main.ts`, `package.json`, `tsconfig.json`, `cdktf.json`, README, or test harness). Provide the full content of each file in its own code block labeled with the file path.

CONTEXT
- Target region: us-east-2 (single-account stack run).  
- Role: DevOps Engineer building a production-ready environment with strong security, monitoring, and scalability.  
- Use `@cdktf/provider-aws` and CDKTF TypeScript idioms.  
- All sensitive config should be parameterized and handled securely (Secrets Manager for DB secrets per requirement). Use SSM Parameter Store for non-secret config if needed.  
- Tag all resources consistently using `Project`, `Environment`, and `Owner` derived from input variables.

REQUIREMENTS (must be implemented exactly)
1. VPC & Networking
   - Create a VPC spanning at least two AZs with both public and private subnets (minimum 2 public + 2 private).  
   - Attach an Internet Gateway and deploy NAT Gateway(s) to allow private subnet outbound traffic. Each NAT should have an Elastic IP.  
   - Configure route tables for public and private subnets. Implement NACLs with explicit allow/deny rules (document rationale in comments).

2. IAM & Least Privilege
   - Define IAM roles and policies following least-privilege for EC2, Lambda, RDS, S3, CloudWatch, and other services.  
   - Avoid wildcard (`*`) permissions. Provide example policy patterns and attach narrowly-scoped policies.  
   - Include IAM policy examples that enforce MFA for console-sensitive actions (commented example using `aws:MultiFactorAuthPresent` condition). Document any manual steps needed to enforce MFA across users.

3. S3 & Encryption
   - Create S3 buckets required by the solution (audit/log buckets and backup buckets).  
   - Enable server-side encryption (SSE) (SSE-S3 or SSE-KMS selectable via parameter). Block public access and attach bucket policies that explicitly deny public access and restrict access by IAM principal or account. Enable access logging for buckets (deliver to an audit bucket).

4. RDS & Secrets
   - Deploy RDS instances (PostgreSQL or as parameterized) in private subnets with Multi-AZ enabled, automated backups, and deletion protection (parameterized).  
   - Use AWS Secrets Manager to store and rotate database credentials; RDS should reference or integrate with Secrets Manager as appropriate. Do not hardcode DB credentials.  
   - Ensure RDS storage is encrypted (AWS KMS-managed key by default; allow optional customer-managed KMS ARN).

5. Monitoring, Logging & Detection
   - Enable CloudTrail (multi-region recommended) and deliver logs to an encrypted S3 audit bucket with lifecycle rules and block public access.  
   - Enable VPC Flow Logs delivered to CloudWatch Logs and create appropriate Log Groups with parameterized retention.  
   - Create CloudWatch Log Groups and Alarms for key event detection (unauthorized API calls, high CPU, RDS free storage low, suspicious S3 activity).  
   - Enable GuardDuty and AWS Config (with recorder and delivery channel) and document multi-account aggregation considerations.

6. API Gateway & Logging
   - If API Gateway is used by the application, ensure all API traffic is logged (CloudWatch or S3) and enable request/response logging and sampling/tracing where applicable. Integrate WAF in front of API Gateway (see next).

7. WAF & Layer 7 Protection
   - Provision AWS WAFv2 WebACL and associate it with relevant CloudFront/APIGateway/ALB endpoints. Configure basic managed rules and an example custom rule (commented) to block common Layer 7 attacks.

8. Compute & Auto-scaling
   - Deploy an Auto Scaling Group of EC2 instances behind an Elastic Load Balancer (ALB) for the web app.  
   - Configure ASG with health checks, scaling policies (simple or target tracking), and parameterized min/max/desired capacity. Ensure instances run in private subnets and are reachable via ALB in public subnets.  
   - Attach an IAM role to EC2 instances with least-privilege to access S3, Secrets Manager (read DB secret), CloudWatch, and SSM (Session Manager). Recommend SSM Session Manager for admin access; do not open SSH to the world.

9. SSM & Secrets Management
    - Use AWS Secrets Manager for database credentials and any other sensitive secrets. Create IAM policies permitting services (RDS rotation role, EC2 instance role) to retrieve secrets as needed.

10. Backups & Recovery
    - Configure automated RDS backups and optional snapshot retention and rotation. Provide comments and parameters for cross-region snapshot replication as a recommendation.  
    - For critical buckets or volumes, ensure lifecycle rules and replication (if required) are parameterized and documented.

11. Security Controls & Policies
    - Implement Security Groups with strict inbound rules (only allow trusted CIDRs where administrative access is required). Application SGs should only accept traffic from ALB.
    - Implement NACLs with explicit rules as defense-in-depth.  
    - Create explicit deny statements in S3 bucket policies to prevent public access.  
    - Enable EBS encryption by default for all instance volumes using KMS.

12. Outputs & Documentation
    - Provide TerraformOutputs for critical resources: VPC ID, public/private subnet IDs, ALB DNS name, ASG name, EC2 role ARN, RDS endpoint & secret ARN, S3 audit bucket name, CloudTrail S3 bucket, GuardDuty detector ID, AWS Config recorder name, Budget ARN/ID, and SNS topic ARN for alarms.  
    - Include comprehensive inline comments documenting security rationales, manual account-level actions (e.g., enable GuardDuty/Config in master account, enroll IAM users in MFA), and developer steps to validate (`cdktf synth`, `cdktf diff`, `cdktf deploy`).

PARAMETERIZATION (expose as variables)
- `projectName`, `environment` (default `production`), `region` (default `us-east-2`), `vpcCidr` (default `10.0.0.0/16`), `publicSubnetCidrs`, `privateSubnetCidrs`, `adminAllowedCidrs` (required), `rdsInstanceClass`, `rdsStorageGb`, `rdsBackupRetentionDays`.

CONSTRAINTS (strict)
- Output exactly two TypeScript files under `lib/`: `tap-stack.ts` and `modules.ts`. No other files.  
- Use Secrets Manager for database credentials (per requirement). Do not hardcode secrets.  
- Use SSM Parameter Store for non-secret configuration as applicable.  
- Code must be modular, well-documented, idempotent, and suitable to run `cdktf synth`, `cdktf diff`, and `cdktf deploy` given an external CDKTF scaffold.  
- Avoid deprecated APIs and do not grant wildcard IAM permissions.

IMPLEMENTATION GUIDANCE (for the generator)
- `lib/modules.ts` should export reusable constructs for:
  - VPC (subnets, IGW, NATs, route tables, NACLs)  
  - IAM role & policy helper (least-privilege patterns, MFA examples)  
  - Encrypted S3 bucket construct (SSE, block public access, access logging)  
  - RDS (Multi-AZ, encrypted, automated backups) and Secrets Manager secret creation/rotation config (or reference to AWS-managed rotation roles)  
  - ALB & ASG construct (launch template, health checks, scaling policies)  
  - CloudTrail & audit S3 bucket with lifecycle rules  
  - CloudWatch & VPC Flow Logs helper  
  - GuardDuty & AWS Config enabling constructs (document multi-account aggregation considerations)  
  - SSM Parameter Store helper (for non-secret config)

- `lib/tap-stack.ts` should orchestrate modules, validate inputs (fail early with descriptive messages), apply tags, and create TerraformOutputs for all required outputs. Include comments for manual steps