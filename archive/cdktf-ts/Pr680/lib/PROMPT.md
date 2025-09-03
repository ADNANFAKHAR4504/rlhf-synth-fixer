You are an expert **DevOps/SRE engineer** skilled in **CDKTF (Cloud Development Kit for Terraform)** and **AWS infrastructure design**. The task is to generate **idiomatic, syntactically correct, production-ready CDKTF code** using **TypeScript**.

---

## Objective

Create a **modular CDKTF configuration** to provision a **highly available**, **secure**, and **observable** AWS infrastructure in `us-east-1`. Emphasis is on:

- Security configurations
- High availability strategies
- Modular design
- Production readiness

---

## Requirements

### Networking

- Create a **VPC** with:
- Public and private subnets
- At least **3 Availability Zones** in `us-east-1`
- Setup **NAT Gateway** for private subnet internet access (egress only)

---

### Security Groups

- Allow **inbound traffic** only from a specified list of **IP ranges** (e.g., HTTP, SSH)
- All other ports must be restricted by default

---

### Storage (S3)

- Provision **S3 Buckets** with:
- **Server-side encryption** using **AWS KMS**
- **Lifecycle policies** (e.g., transition to Glacier, expire old versions)

---

### Compute (EC2 & Auto Scaling)

- Deploy **EC2 instances** within an **Auto Scaling Group (ASG)**
- Ensure **high availability** by spanning ASG across **multiple AZs**
- Enable **automatic scaling** based on demand

---

### IAM & Access Control

- Define **IAM Roles** and **Policies** with:
- **Least privilege** principle
- Access to **S3**, **CloudWatch logging**, etc.
- **No hardcoded credentials**

---

### Monitoring & Logging (CloudWatch)

- Integrate **CloudWatch** for:
- Real-time monitoring
- EC2 logs and metrics (standard + custom)
- Collect logs from EC2 instances in ASG

---

## Modularity

Use **separate CDKTF Constructs** for each major component:

- `NetworkingConstruct` VPC, Subnets, NAT Gateway
- `SecurityConstruct` Security Groups
- `IamConstruct` IAM Roles & Policies
- `StorageConstruct` S3, KMS, Lifecycle Rules
- `ComputeConstruct` EC2, ASG, Launch Templates
- `MonitoringConstruct` CloudWatch Alarms, Dashboards, Logs

---

## Tagging & Governance

Apply **consistent tagging** across all resources:

```ts
{
Project: "MyProject",
Environment: "Dev",
Owner: "Akshat Jain"
}
```

---

## Expected Output Structure

- A main TypeScript file (e.g., `main.ts` or `stack.ts`) with the primary stack class
- Separate TypeScript files for each construct: - networking-construct.ts
- security-construct.ts
- iam-construct.ts
- storage-construct.ts
- compute-construct.ts
- monitoring-construct.ts
- Code should be clean, readable, and follow CDKTF TypeScript best practices.

Each construct should expose reusable components and accept configuration via interfaces.

---

## Deliverables:

- CDKTF TypeScript files ready to be used with `cdktf synth`, `cdktf plan`, and `cdktf deploy`.
- All configuration properties clearly defined with proper TypeScript interfaces and defaults where appropriate.
- No hardcoded secrets or credentials.
- Use `@cdktf/provider-aws` for AWS resources.
- Assume the AWS provider is configured via `~/.aws/credentials` or environment variables.

Please generate the complete CDKTF configuration accordingly.
