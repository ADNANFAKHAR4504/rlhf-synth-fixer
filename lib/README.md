Here’s a **README.md** tailored for your multi-region Terraform/CDKTF setup so it matches both the **PROMPT.md** intent and the style of an **IDEAL\_RESPONSE.md**.
This version works for a **CDKTF TypeScript** project with workspaces, S3/DynamoDB backend, and multi-region failover.

---

# Multi-Region AWS Infrastructure with CDKTF (TypeScript)

## Overview

This repository provisions a **highly available, multi-region AWS environment** using [CDK for Terraform (CDKTF)](https://developer.hashicorp.com/terraform/cdktf) in TypeScript.
It implements:

* **Two AWS regions:** `us-east-1` and `eu-west-1`
* **Cross-region failover** with Route53 latency/failover routing
* **Multi-AZ** deployments in each region
* **Reusable stacks** for VPC, Security, Compute, Database, Monitoring, DNS, and Remote State
* **Terraform workspaces** for environment isolation (`dev`, `test`, `prod`)
* **S3 + DynamoDB** for secure remote state storage and locking
* **Least privilege IAM policies** and resource tagging for cost tracking

---

## Prerequisites

* [Node.js](https://nodejs.org/) v18+
* [Terraform](https://developer.hashicorp.com/terraform/downloads) v1.6+
* [CDKTF CLI](https://developer.hashicorp.com/terraform/cdktf/downloads)
* AWS credentials configured (`~/.aws/credentials` or environment variables)
* Access to create resources in both `us-east-1` and `eu-west-1`

---

## Project Structure

```
bin/
  tap.ts                   # CDKTF app entrypoint
lib/
  tap-stack.ts             # Orchestrates all stacks
  secure-vpc-stack.ts
  security-stack.ts
  compute-stack.ts
  database-stack.ts
  monitoring-stack.ts
  dns-stack.ts
  remote-state-stack.ts
  utils/                   # Naming/tagging helpers
test/
  unit.test.ts              # Basic synth/unit tests
cdktf.json
tsconfig.json
package.json
README.md
```

---

## Workspaces & Naming

* Workspaces control environment (`dev`, `test`, `prod`).
* Resource naming pattern:

  ```
  <environment>-<service>-<region>
  ```
* Tags applied to all resources: `environment`, `project`, `owner`, `cost_center`.

---

## How to Deploy

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Select or create workspace**

   ```bash
   terraform workspace new dev    # or test/prod
   terraform workspace select dev
   ```

3. **Synthesize Terraform configuration**

   ```bash
   npm run synth
   ```

4. **Initialize Terraform backend**

   ```bash
   terraform init
   ```

5. **Plan infrastructure changes**

   ```bash
   terraform plan
   ```

6. **Apply changes**

   ```bash
   terraform apply
   ```

---

## Testing

Run lint, build, synth, and tests:

```bash
npm run lint
npm run build
npm run synth
npm test
```

---

## Disaster Recovery / Failover

* **Route53** configured with **latency or failover routing** between ALBs in both regions.
* **Health checks** monitor ALB availability; Route53 automatically routes traffic to healthy region.
* **RDS** configured with **Multi-AZ** for regional HA; manual failover possible via AWS console.

---

## Security Notes

* IAM policies follow **principle of least privilege**.
* SSH restricted to admin CIDR ranges (update in `security-stack.ts` before deploy).
* No secrets in code — DB passwords pulled from **AWS Secrets Manager**.

---

## Cost Optimization

* **NAT Gateways** are per-AZ in production; can be toggled off for non-prod in `secure-vpc-stack.ts`.
* S3 lifecycle policies applied for log storage and state backups.

---

## Cleanup

To destroy all resources in current workspace:

```bash
terraform destroy
```

---