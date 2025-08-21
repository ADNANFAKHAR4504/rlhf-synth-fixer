# 📄 System Prompt

You are an expert DevOps engineer specializing in **Terraform (HCL)** and **AWS production architectures**.  
Your task is to generate a **single-file Terraform configuration** named **`tap_stack.tf`** that sets up a **secure, scalable, and observable** AWS environment optimized for **zero-downtime Fargate deployments**.

**Critical rules:**
- Produce **only valid HCL** in one file called **`tap_stack.tf`** — this file must contain **all variable declarations, sensible defaults, locals, data sources, resources, and outputs**.  
- **Do not** include provider or backend configuration (that already exists in `provider.tf`).  
- **Assume** the provider is AWS and already configured in `provider.tf` to use the variable `aws_region`.  
- **Target region is `us-east-1` only** and must be enforced via the `aws_region` variable you declare (default to `us-east-1`).  
- The code must be **brand-new** (no external module sources, no references to preexisting stacks).  
- Use **production best practices** (least privilege IAM, encryption, tagging, multi-AZ where relevant, health checks, alarms, autoscaling where applicable).  
- **Pass `terraform validate`** and be ready to apply in a clean AWS account.

---

# 👤 User Prompt

Generate `tap_stack.tf` implementing the following **requirements** and **constraints**. Respect every item.

## Environment & Organization
1. **Single region**: All resources must be in **`us-east-1`**.  
   - Declare `variable "aws_region"` with default `"us-east-1"` and use it throughout.  
   - Do **not** set provider/backends here (they live in `provider.tf` and use `var.aws_region`).

2. **Tagging**: All resources must have tags that include **`Environment = "Production"`**.  
   - Implement a `local.common_tags` and **merge** it into every resource that supports tags.

3. **Terraform Cloud**: Assume state is managed in Terraform Cloud (backend configured in `provider.tf`).  
   - Do **not** declare `backend` blocks here.  
   - Include a `terraform` block with `required_version` and `required_providers` only.

## Network (VPC)
4. **VPC with public & private subnets** across **at least 2 AZs** in `us-east-1`.  
   - Internet Gateway for public subnets, **NAT Gateway** for private subnets.  
   - Route tables correctly associated.  
   - Security groups:
     - ALB: allow inbound 80/443 from `var.allowed_cidrs` (declare with sensible defaults).  
     - ECS services in private subnets: restrict inbound from ALB SG only.  
     - RDS: restrict inbound **only** from ECS tasks’ SG on DB port.

5. **EBS encryption-by-default** enabled at the account level.  
   - Use `aws_ebs_encryption_by_default`.

## Compute (Serverless on ECS Fargate)
6. **ECS on Fargate** for application services (no EC2 capacity).  
   - Create a cluster, task execution role, task role (least privilege), CloudWatch log groups.  
   - Container(s) should use **AWS Logs** driver to CloudWatch.  
   - Use **Application Load Balancer** in public subnets and target groups in private subnets with **dynamic port mapping**.  
   - Health checks configured for ALB target groups.

7. **Zero-downtime deployments**:  
   Implement **CodeDeploy Blue/Green for ECS** with:
   - `aws_codedeploy_app` (ECS), `aws_codedeploy_deployment_group` using two target groups, listener rules, and an **ALB**.  
   - Enable termination wait time, traffic shifting (all in HCL).  
   - ECS service must set `deployment_controller { type = "CODE_DEPLOY" }`.

8. **Autoscaling (optional but recommended)**:  
   - Include ECS service autoscaling policies (CPU/Memory) to demonstrate scalability.

## Data (RDS & Secrets)
9. **RDS** (e.g., Postgres or MySQL) in **private subnets**:  
   - Multi-AZ = `true` (recommended for prod) or justify if not feasible.  
   - Enable **automated backups** (`backup_retention_period`, `preferred_backup_window`).  
   - Encrypted at rest (with AWS-managed or KMS key).  
   - DB SG allows access only from ECS tasks’ SG.  
   - Output the DB endpoint (but **do not** output secrets).

10. **AWS Secrets Manager**:  
   - Create secrets for app config (e.g., DB password) and **reference them** from ECS task definitions using `secrets` in container definitions.  
   - Task role has **least-privilege** policy to read **only** those secrets ARNs.

## IAM (Least Privilege)
11. **IAM roles**:
   - **Task execution role** for pulling images and writing logs.  
   - **Task role** limited to required secrets and specific AWS APIs used by the app.  
   - Any additional roles/policies strictly **least privilege** and **scoped to ARNs**.  
   - Inline policy examples should be explicit and minimal.

## Monitoring & Logging
12. **CloudWatch**:
   - Log groups for ECS tasks (with retention).  
   - **Alarms** for:  
     - ALB 5XX error rate,  
     - ECS service CPU/Memory high,  
     - RDS CPU high / FreeStorage low.  
   - Use sensible thresholds and include alarm descriptions.

## Security & Compliance
13. **Encryption everywhere**:
   - EBS default encryption ON.  
   - RDS storage encryption ON.  
   - CloudWatch Logs (KMS optional).  
   - ALB access logs to S3 (if you add this, ensure S3 bucket is private & encrypted). *(Optional but nice)*

14. **Ingress restrictions**:
   - Parameterize `var.allowed_cidrs` and use it for ALB 80/443 ingress.  
   - Deny broad access elsewhere.

## Modularity (Single-file Pattern)
15. **Single file** but **modularized structure**:  
   - Since Terraform doesn’t support inline modules, emulate modularity using **sectioned blocks** with clear comments and **reusable locals**.  
   - Group resources by “virtual module” sections: `# module: vpc`, `# module: ecs`, `# module: codedeploy`, `# module: rds`, `# module: secrets`, `# module: monitoring`.  
   - Use `locals` for reusable names, ARNs, tags, and share them across sections.  
   - Avoid external module sources.

## Outputs
16. Provide outputs for:
   - VPC ID, public/private subnet IDs,  
   - ALB DNS name,  
   - ECS service name/ARN,  
   - CodeDeploy application & deployment group names,  
   - RDS endpoint,  
   - CloudWatch log group names.  
   - **Do not output secret values**.

---

## Interface & Defaults to Declare
- `variable "aws_region"` { default = "us-east-1" }  
- `variable "project_name"` { default = "nova-model-breaking" }  
- `variable "environment"` { default = "Production" }  
- `variable "allowed_cidrs"` { type = list(string), default = ["0.0.0.0/0"] } *(You may narrow the default if you prefer.)*  
- `variable "db_engine"` { default = "postgres" }  
- `variable "db_engine_version"` { default = "15.5" } *(or a stable version)*  
- `variable "db_instance_class"` { default = "db.t3.medium" }  
- `variable "db_allocated_storage"` { default = 50 }  
- `variable "container_image"` { description = "ECR image URI", default = "public.ecr.aws/amazonlinux/amazonlinux:latest" } *(placeholder ok)*  
- `variable "container_port"` { default = 8080 }  
- `variable "desired_count"` { default = 2 }  
- Any other sensible variables (ALB idle timeout, health check path, etc.).

---

## Acceptance Criteria
- ✅ **Single file**: Output **only** `tap_stack.tf` with valid HCL.  
- ✅ **Region-pinned** to `us-east-1` via `var.aws_region`.  
- ✅ **Fargate ECS** with ALB, private subnets, CloudWatch logs.  
- ✅ **CodeDeploy Blue/Green** for **zero-downtime** ECS deployments (two target groups, listener rules).  
- ✅ **Secrets Manager** used and least-privilege access from the ECS **task role**.  
- ✅ **RDS** in private subnets with automated backups, encryption, and SG scoped to ECS.  
- ✅ **EBS encryption-by-default** enabled.  
- ✅ **CloudWatch alarms** for ALB 5XX, ECS CPU/Memory, RDS CPU/FreeStorage.  
- ✅ **All resources tagged** with `Environment = "Production"` via `local.common_tags`.  
- ✅ **No external modules** or remote sources; emulate modularity within the single file.  
- ✅ **No provider/backend** blocks in this file.

---

## Output Format
Return a single fenced HCL block:

\`\`\`hcl
# tap_stack.tf
# (entire working configuration here)
\`\`\`

No prose, no README, no comments outside the code block.