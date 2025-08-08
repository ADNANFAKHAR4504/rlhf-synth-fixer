# MODEL_RESPONSE.md

## High-Level Architecture

A modular, multi-stack AWS deployment orchestrated by `TapStack`:

- **SecureVpcStack**: VPC, public/private subnets across two AZs, Internet Gateway (IGW), Elastic IPs, NAT Gateways, and route tables/associations.
- **SecurityStack**: Three Security Groups (Web, App, DB) with least-privilege, environment-tagged rules.
- **ComputeStack**: One or more EC2 instances (default Amazon Linux 2) in public subnets for demo/testing.
- **DatabaseStack**: RDS MySQL instance in private subnets, password resolved securely (Secrets Manager or env var).
- **StorageStack**: Private S3 bucket with versioning, server-side encryption, and public-access blocks.

State is managed with an **S3 backend** (locking enabled). Global region can be overridden via a single source of truth in `AWS_REGION.ts`.

---

## Regions, State & Defaults

- **Region**: Resolved in order:
  1) `AWS_REGION.ts` (`AWS_REGION_OVERRIDE`)
  2) `TapStack` `props.awsRegion`
  3) Fallback `us-east-1`

- **Terraform Backend** (S3):
  - Bucket: `props.stateBucket` (default `iac-rlhf-tf-states`)
  - Key: `${environmentSuffix}/${stackId}.tfstate`
  - Region: `props.stateBucketRegion` (default `us-east-1`)
  - Locking: `terraform.backend.s3.use_lockfile = true`

- **Environment Suffix**: `props.environmentSuffix` (default `dev`)
- **Tagging**: Provider `defaultTags` supported. Resource-level tags include:
  - `Environment=dev`
  - `Project=myproject`
  - `ManagedBy=Terraform`
  - Resource-specific `Name=*`

---

## Networking (SecureVpcStack)

- **VPC**: `10.0.0.0/16`, DNS support & hostnames enabled.
- **AZ Discovery**: Dynamically queries available AZs in the provider region and selects the first two (token-safe).
- **Subnets**:
  - **Public**: `10.0.1.0/24` (AZ-1), `10.0.2.0/24` (AZ-2), mapPublicIpOnLaunch enabled.
  - **Private**: `10.0.11.0/24` (AZ-1), `10.0.12.0/24` (AZ-2).
- **Egress/Ingress**:
  - **IGW** attached to VPC for public egress.
  - **NAT Gateways**: 1 per public subnet (2 total) with dedicated EIPs for private egress.
- **Routes**:
  - Public RT: `0.0.0.0/0` → IGW, associated to both public subnets.
  - Private RTs: `0.0.0.0/0` → NAT GW (per AZ), associated 1:1 with each private subnet.
- **Lifecycle**: Uses `create_before_destroy` where applied downstream to reduce downtime.

**Outputs**
- `vpc_id`
- `public_subnet_ids`
- `private_subnet_ids`
- `internet_gateway_id`
- `nat_gateway_ids`

---

## Security (SecurityStack)

Three security groups inside the VPC:

1. **Web SG**
   - **Ingress**: TCP 80 and 443 from `0.0.0.0/0`
   - **Egress**: TCP 443 to `0.0.0.0/0`
   - Purpose: Internet-facing traffic termination/demo

2. **App SG**
   - **Ingress**: TCP 8080 **from Web SG** (east-west, SG-to-SG)
   - **Ingress**: TCP 22 from `vpcCidr` (admin within VPC)
   - **Egress**: TCP 443 to `0.0.0.0/0`
   - Purpose: App tier, only accessible from Web SG & VPC admin

3. **DB SG**
   - **Ingress**: TCP 3306 **from App SG**
   - **Ingress**: TCP 5432 **from App SG** (future-proofing for PostgreSQL)
   - **Egress**: TCP 443 to `vpcCidr` (keeps DB traffic inside VPC)
   - Purpose: DB tier, app-only access

**Outputs**
- `web_security_group_id`
- `app_security_group_id`
- `db_security_group_id`

---

## Compute (ComputeStack)

- **AMI**: Latest **Amazon Linux 2** (HVM, x86_64, gp2) discovered dynamically; can be overridden by `amiId`.
- **Instances**: `instanceCount` (e.g., 2) of `t3.micro` by default; round-robin across provided subnets.
- **Networking**: Deployed into **public subnets** and attached to **Web SG** (by default).
- **Storage**: Root EBS volume gp3, 20 GiB, encrypted.
- **User Data**: Simple bootstrap writes “Hello from instance!” to `/var/www/html/index.html`.
- **Monitoring**: Disabled (can be enabled later).
- **Lifecycle**: `create_before_destroy: true`.

**Outputs**
- `instance_ids`
- `public_ips`
- `private_ips`

---

## Database (DatabaseStack)

- **Engine**: MySQL 8.0, `db.t3.micro`.
- **Network**: Private subnets via a DB Subnet Group; not publicly accessible.
- **Backups & Maintenance**:
  - Retention: 7 days
  - Backup Window: `03:00-04:00`
  - Maintenance Window: `sun:04:00-sun:05:00`
- **Storage**: gp3, 20 GiB (auto-scales to 100 GiB), encrypted.
- **Multi-AZ**: Disabled (can be enabled in higher envs).
- **Credentials**:
  - Preferred: **Secrets Manager ARN** (`passwordSecretArn`)
  - CI/Local friendly: **Environment variable** name (`passwordEnvVarName`, reads `process.env[...]`)
  - Fallback/testing: plain `password` prop
  - If none provided → **error** to prevent accidental plaintext
- **Final Snapshot**: Taken on destroy (ID override supported).

**Outputs**
- `db_instance_id`
- `db_instance_endpoint`
- `db_instance_port`
- `db_subnet_group_id`

---

## Storage (StorageStack)

- **Bucket**: `${projectName}-${environment}-assets-${suffix}`
  - `suffix`: random 4-digit number (or `bucketSuffixOverride`)
- **Security/Compliance**:
  - **Versioning**: Enabled
  - **Encryption**: SSE-S3 (`AES256`)
  - **Public Access Block**: All four controls enabled (block public ACLs & policies, ignore public ACLs, restrict public buckets)

**Outputs**
- `bucket_id`
- `bucket_arn`
- `bucket_domain_name`
- `bucket_regional_domain_name`

---

## Orchestration (TapStack)

- **Provider**: `AwsProvider` with region/`defaultTags` support.
- **Backend**: S3 backend configured as above with lockfile override.
- **Order**:
  1. Create VPC & subnets (`SecureVpcStack`)
  2. Create SGs referencing VPC (`SecurityStack`)
  3. Launch EC2 in public subnets with Web SG (`ComputeStack`)
  4. Launch RDS in private subnets with DB SG (`DatabaseStack`; password via Secret ARN or env)
  5. Create S3 bucket (`StorageStack`)

**Environment Variables Used**
- `DB_PASSWORD` (when `passwordEnvVarName` is set to `DB_PASSWORD`)
- Optional for provider/backends (if not provided via props):
  - `AWS_REGION` (if you ignore the override file)
  - AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`)
  - S3 state bucket vars if you deviate from defaults

---

## Assumptions & Constraints

- Demo defaults: `environment = dev`, `projectName = myproject`.
- VPC CIDR/subnet CIDRs are fixed in this model (can be parameterized later).
- Two AZs are assumed available in the selected region.
- EC2 is placed in **public** subnets by default for demonstration (attach ALB or move to private subnets for production).
- RDS is **private only** (no public access).
- Security groups use minimal, opinionated rules for a 3-tier example.

---

## How To Use (Example Flow)

1. Ensure an S3 bucket exists for Terraform state (or accept default).
2. Set region in `AWS_REGION.ts` or export one in env.
3. Provide DB password via **Secrets Manager** (recommended) or export an env var:
   - `export DB_PASSWORD='strong-password'`
4. `cdktf synth` → confirm outputs are rendered and backend is configured.
5. `cdktf deploy` (or through your CI pipeline).

---

## Outputs Summary (All Stacks)

- **VPC**: `vpc_id`, `public_subnet_ids`, `private_subnet_ids`, `internet_gateway_id`, `nat_gateway_ids`
- **Security**: `web_security_group_id`, `app_security_group_id`, `db_security_group_id`
- **Compute**: `instance_ids`, `public_ips`, `private_ips`
- **Database**: `db_instance_id`, `db_instance_endpoint`, `db_instance_port`, `db_subnet_group_id`
- **Storage**: `bucket_id`, `bucket_arn`, `bucket_domain_name`, `bucket_regional_domain_name`

---

## Future Enhancements

- Parameterize CIDRs and per-env scaling (instance types/counts, Multi-AZ, backup policies).
- Add VPC Flow Logs and CloudWatch log retention policies.
- Add ALB + Auto Scaling Group for the compute tier.
- Tighten SG egress to specific endpoints/VPC endpoints where feasible.
- Replace demo user data with a hardened bootstrap and SSM Agent.
- Lifecycle policies on S3 for cost optimization in non-prod.

---
