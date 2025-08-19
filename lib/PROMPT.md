Context
You are an expert AWS + Pulumi engineer. Produce a production-grade, multi-region AWS infrastructure for a business-critical web app. Use Pulumi with TypeScript. 
You must only modify and output code for these files:
- lib/tap-stack.ts  (stack implementation)
- test/tap-stack.unit.test.ts  (unit tests)
- test/tap-stack.int.test.ts   (integration tests)

Do NOT modify or add any other files.

Inputs (replace placeholders with config or constants)
- projectName: "IaC - AWS Nova Model Breaking"
- regions: ["us-east-1","us-west-2","eu-central-1"]
- env: "prod"
- app: "nova-web"
- owner: "infra-team@example.com"
- sshCidr: "1.2.3.4/32"
- minASG: 2
- maxASG: 6
- rdsClass: "db.t3.medium"
- dbEngine: "postgres"
- kmsAlias: "alias/nova-web-kms"
- logBucketName: "nova-central-logs-prod"

Hard Constraints (apply directly in lib/tap-stack.ts)
1. Multi-region: Deploy equivalent resources in us-east-1, us-west-2, eu-central-1. Use region-specific providers inside one stack.
2. Networking: VPC with 2 public + 2 private subnets, NAT gateway, route tables, security groups.
   - ALB SG: allow 80/443 from 0.0.0.0/0
   - EC2 SG: allow 80/443 from ALB SG, SSH only from sshCidr
3. Auto Scaling Group: min=2, max=6, behind an internet-facing ALB.
4. WAF: Attach AWS WAF ACL (OWASP managed rules) to each ALB.
5. RDS: Multi-AZ Postgres, encrypted with KMS key alias.
6. Central Logging: One S3 bucket with KMS encryption, lifecycle (30d → Glacier, 365d expire), policy restricted to VPC endpoints.
7. Lambda: Python runtime to process logs before writing to S3.
8. IAM: Define least-privilege roles for EC2, Lambda, S3/CloudWatch.
9. Security: Encrypt all data at rest (EBS, RDS, S3). Use Pulumi config/Secrets Manager for DB password.
10. Tags: Apply {Environment, Application, Owner} to all resources.
11. Custom Resource: Include at least one Pulumi dynamic provider or region-specific customization.
12. No CloudFront usage.

Deliverables
1. lib/tap-stack.ts:
   - Implement all infra above using Pulumi TypeScript.
   - Comment sections clearly (VPC, ALB, ASG, RDS, S3, Lambda, IAM, WAF).
   - Use modular helper functions where needed inside the same file.
   - Ensure region-specific providers are applied.

2. test/tap-stack.unit.test.ts:
   - Write Pulumi unit tests with mocks to verify:
     - Resources are created with correct names and tags.
     - ASG min/max values.
     - RDS Multi-AZ enabled and encrypted.
     - S3 bucket lifecycle rules exist.
     - Lambda runtime = python.
   - Achieve high coverage without actually deploying.

3. test/tap-stack.int.test.ts:
   - Write integration tests to run against a preview/deployed stack.
   - Validate connectivity chain: ALB → ASG EC2, RDS not public, WAF attached, S3 lifecycle, Lambda exists.
   - Include assertions for region handling.

Style
- Production-grade Pulumi TypeScript.
- Keep to a single file for infra (lib/tap-stack.ts) but logically structured.
- Tests must run with jest/mocha and Pulumi testing libs.
- Document assumptions in comments.

Output
Only return the complete code for:
- lib/tap-stack.ts
- test/tap-stack.unit.test.ts
- test/tap-stack.int.test.ts
Nothing else.