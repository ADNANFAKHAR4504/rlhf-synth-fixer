Hey

build me a **Pulumi program in Go** that deploys the **same app infrastructure in two AWS regions**: primary `us-east-1`, secondary `eu-west-1`. I only want the files needed to run it (no tests): `Pulumi.yaml`, `go.mod`, and `lib/tap_stack.go` (put all logic in that one Go file). Print exactly those three code blocks and nothing else.

### What this infra is (the big picture)

We’re standing up a highly available, multi‑region baseline. Users hit **CloudFront** over HTTPS. CloudFront pulls from a **primary S3 origin** in `us-east-1`. Dynamic traffic goes through a regional **ALB** to an **AutoScaling Group** of EC2 instances (t3.micro). Data lives in **RDS** (Multi‑AZ) and **DynamoDB Global Tables** so both regions stay in sync. **S3 buckets** exist in both regions with **cross‑region replication**. All config that isn’t secret goes into **SSM Parameter Store**; secrets go into **Secrets Manager**. **CloudTrail** and **CloudWatch** give us audit + alarms. **SNS** emails us when something important happens. Everything is tagged with `Environment` and `Project`.

### How it works (runtime flow, in normal words)

- **Clients → CloudFront → S3 (static)**: CloudFront terminates TLS, enforces HTTPS, and serves static content from the primary S3 bucket.
- **Clients → CloudFront/ALB → EC2 (dynamic)**: For app paths, traffic lands on the regional ALB, which health‑checks targets and only sends to healthy EC2s.
- **App → Data**: The app talks to **RDS** inside private subnets (encrypted, multi‑AZ) and reads/writes to a **DynamoDB Global Table**, which replicates between the two regions for low RPO.
- **Storage durability**: Each region has an S3 data bucket; primary replicates to secondary via CRR. Access logs land in log buckets.
- **Config + secrets**: Non‑secret knobs live in SSM; real secrets (DB creds) are generated and stored in Secrets Manager.
- **Observability**: CloudTrail is multi‑region with log‑file validation, shipping to KMS‑encrypted S3 and CloudWatch Logs. We add a metric filter for `UnauthorizedOperation/AccessDenied*` and alarm to **SNS** (email from config).
- **Security posture**: HTTPS everywhere, least‑privilege IAM (no wildcards), private subnets for app + DB, no open SSH, and S3 bucket policies require KMS‑encrypted PUTs.

### What the Pulumi program should actually create (keep it practical)

- Two **AWS providers** (one per region). Reuse the same builder to stamp the infra in each region.
- **VPC per region** with 2 public + 2 private subnets spread across different AZs. Don’t hardcode AZ names; query them. Public subnets get IGW; private subnets route through a NAT.
- **Security Groups**: ALB allows 443 from the Internet; EC2 only allows from the ALB SG. Keep inbound tight; no open SSH.
- **EC2/ASG**: Launch Template uses the **latest Amazon Linux 2 AMI via SSM** (do not hardcode AMI IDs). ASG is `t3.micro` with a CPU‑based scaling policy.
- **ALB**: HTTPS listener with ACM certificate (regional certs for ALBs). Health checks on a simple `/healthz`.
- **RDS** (MySQL or Postgres): Multi‑AZ, KMS‑encrypted, deployed in private subnets. Credentials come from a **generated Secrets Manager secret** (don’t read a password from config).
- **DynamoDB Global Table**: a single logical table with replicas in both regions; enable point‑in‑time recovery.
- **S3**: one data bucket per region (SSE‑KMS, block public access, bucket policy denies unencrypted PUTs and requires `aws:kms`). Configure **CRR** between primary and secondary; create the replication IAM role/policy and use **full object ARNs** like `arn:aws:s3:::bucket/*`. Add access‑log buckets.
- **CloudFront**: distribution in front of the **primary S3** origin; HTTPS only. Remember the **ACM cert for CloudFront must be in `us-east-1`** (use a provider pinned to that).
- **Parameter Store**: store a few environment values (project, env, maybe feature flags).
- **Lambda (log ship)**: a small function that reads S3 access logs and writes to CloudWatch Logs. Give it a dedicated LogGroup with retention and a role that only allows `logs:CreateLogStream` + `logs:PutLogEvents` for that group.
- **CloudTrail**: in both regions, multi‑region enabled, log‑file validation on, send to KMS‑encrypted S3 and CloudWatch Logs. Add a metric filter + alarm to **SNS**.
- **SNS**: topic + email subscription using `notificationEmail` from config.
- **Tags**: apply `Environment` and `Project` to every taggable resource.

### Guardrails you must follow (so this is production‑safe)

- **Least privilege IAM**: no `*` in `Action` or `Resource`. Scope ARNs precisely (use provider/account/region tokens; don’t hardcode regions in ARNs except CloudFront’s cert rule).
- **No hardcoded AZ names**; always pick from what the account/region exposes.
- **No named roles/instance profiles** unless there’s a strong reason.
- **SSM AMI** for EC2 images; never a fixed AMI ID.
- **S3 policies** must reference **object ARNs** (`arn:aws:s3:::bucket/*`)—not partial strings.
- **HTTPS everywhere** (CloudFront, ALB, S3 policies, client‑facing endpoints).
- Keep code compact, clear, and runnable with `pulumi up`.

### Config and outputs (small but handy)

- Read from Pulumi config: `projectName`, `environment`, `notificationEmail` (+ optional CIDRs, ASG sizes, DB params).
- Export: ALB DNS names (both regions), CloudFront domain, S3 bucket names (data/logs in each region), DynamoDB table name + replica regions, RDS endpoints, VPC + subnet IDs.

**Output exactly three files as code blocks**—`Pulumi.yaml`, `go.mod`, `lib/tap_stack.go`—and nothing else.
