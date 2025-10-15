You are a Senior Cloud Engineer with expertise in AWS.

**Global**
- Implement a **multi-region disaster recovery** architecture for a mission-critical trading platform with **automated failover**, **minimal data loss**, and **minimal downtime**.
- Maintain a **hot standby** in the **secondary region** with **real-time data replication**.
- Use **Terraform** with required providers: `aws >= 5.0.0`, `random >= 3.0.0`.
- Configure **two AWS providers** with aliases for **primary** and **secondary** regions.
- Variables (parameterize): `primary_region`, `secondary_region`, `vpc_cidr_blocks` (for both regions), `domain_name` (Route53), `rds_instance_class`, `app_instance_count` (per region). All variables should have a default value and should not be required.
- Enforce consistent **tagging/naming** via locals; avoid hard-coded identifiers; all regional resources must be tied to their provider alias.

**VPC**
- Provision **VPC infrastructure in two regions** using provided **CIDR blocks**.
- Create subnets and routing sufficient to run **ALB**, **EC2 application tier**, and **RDS** in each region.
- Isolate data tier in private subnets; expose only ALB in public subnets.
- Replicate network topology **symmetrically** across **primary** and **secondary** regions.

**EC2 (Application Tier)**
- Launch **application instances** in **each region** with `app_instance_count` per region.
- Register instances with the **regional ALB target groups**.
- Health checks must reflect application readiness for **automated failover**.

**Application Load Balancer**
- Deploy one **ALB per region** fronting the application instances.
- Configure **target groups** and **health checks** for accurate endpoint health.
- Enable **cross-zone load balancing** within each region (per provider support).
- Output **ALB DNS names** for integration with Route53 failover records.

**Route53 (DNS + Health Checks)**
- Use hosted zone for `domain_name`.
- Create **failover routing** records: **PRIMARY** → primary ALB, **SECONDARY** → secondary ALB.
- Attach **Route53 health checks** to primary endpoint; configure evaluation to trigger DNS failover to secondary when unhealthy.
- TTLs tuned for **rapid convergence** (low TTL) to minimize downtime.

**RDS (Relational Database)**
- Deploy **RDS** in **primary region** with class `rds_instance_class`.
- Configure **cross-region read replica** in **secondary region** for **near real-time replication**.
- Expose outputs for **primary endpoint** and **replica ARN/endpoint**.
- Prepare **promotion workflow** (see Lambda) to convert replica to standalone **during failover**.

**DynamoDB (Global Tables)**
- Implement **DynamoDB Global Tables** spanning **primary** and **secondary** regions for **active-active** key-value/state data with **write replication**.
- Use identical table definitions (PK/SK, GSIs) in both regions.
- Output table ARNs and stream settings (if used by app/Lambda).

**Lambda (Failover Orchestration)**
- Create **Lambda functions** to orchestrate **automated failover**:
  - Detect primary region failure via **CloudWatch/Route53 health** signals.
  - **Promote RDS read replica** in secondary to standalone primary.
  - **Update Route53** records if needed (e.g., DB CNAME, app DNS already uses failover).
  - Optionally scale application instances in secondary to **meet `app_instance_count`** if using warm capacity policies.
- Grant minimal **IAM permissions** for RDS promotion, Route53 changes, and logging.
- Configure **retries/alerts** on failures.

**Observability (Minimal for DR Control Path)**
- Emit **CloudWatch Logs** and **metrics** from Lambda for audit of failover events.
- Alarms on health-check failures and Lambda errors to confirm **automated action** triggered.

**Outputs**
- Provide IDs/ARNs/DNS for: both **VPCs**, **subnets**, **ALBs (DNS)**, **Route53 records**, **RDS endpoints/ARNs**, **DynamoDB table ARNs**, **Lambda function ARNs**, and **application instance IDs** per region.

---

### File Structure 
- `provider.tf` (already present)  
  - Configure the Terraform **S3 backend** for remote state (all identifiers/paths parameterized).  
- `lib/main.tf`  
  - Declare **all variables** (including `aws_region`, unique suffix/ID for S3 names, CIDRs, SSH allowed CIDR, tagging map, toggle flags).  
  - Define **locals** for resource naming conventions, tags, CIDR blocks, toggles, and IP ranges.  
  - **Implement resources**
  - **Outputs**