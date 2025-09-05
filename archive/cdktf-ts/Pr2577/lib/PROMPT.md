We want to design and deploy a **secure and scalable AWS infrastructure** using **CDK for Terraform (TypeScript)**.  
The original spec was written with CloudFormation in mind, but our implementation will be done in **CDKTF** with the same security and tagging standards.  

---

## What we want to achieve

- **Region & Core Setup**  
  - All resources must deploy to **us-east-1**.  
  - Create a **custom VPC** spanning multiple AZs.  
  - Define at least **two public subnets** (different AZs) for EC2 + ELB.  
  - Define **private subnets** for the database.  

- **EC2 Instances**  
  - Launch EC2 instances behind an **Elastic Load Balancer (ELB)**.  
  - Enable **detailed monitoring**.  
  - Instances should run with IAM roles that allow **S3 access (read/write as required)**.  
  - Place EC2 instances in an **Auto Scaling Group** for resilience.  

- **RDS Database**  
  - Deploy an **RDS instance** inside the VPC (private subnets).  
  - Must **not be publicly accessible**.  
  - Only allow traffic from EC2 instances (restricted by Security Group).  

- **S3 Bucket**  
  - Create an S3 bucket with **server-side encryption (AWS KMS)**.  
  - Deny public access.  

- **Networking & Security**  
  - Security group for EC2 → allow **HTTP (80)** + **HTTPS (443)** inbound.  
  - Security group for RDS → allow inbound only from EC2 SG.  
  - Follow least privilege across all IAM roles and policies.  

- **Monitoring & Scaling**  
  - Enable **CloudWatch alarms** for EC2 CPU usage > 80%.  
  - Auto Scaling Group must react to alarms (scale out/in).  

- **Tagging**  
  - Apply consistent **tags for cost allocation and operational transparency**:  
    - `Name`  
    - `Environment`  
    - `Project` (`IaC - AWS Nova Model Breaking`)  

- **Conditions**  
  - Implement **conditional logic** (in CloudFormation style) to optionally deploy certain resources (e.g., toggle RDS or ASG with a flag).  

---

## Files to create

- **modules.ts** → Define all AWS resources:  
  - VPC + subnets (multi-AZ).  
  - Security groups.  
  - IAM roles/policies.  
  - S3 bucket (with KMS encryption).  
  - ELB + Auto Scaling Group.  
  - EC2 instances.  
  - RDS instance.  
  - CloudWatch alarms.  

- **tap-stack.ts** → Orchestration:  
  - Import modules.  
  - Wire up inputs (AMI IDs, subnet IDs, DB settings, ASG sizes, etc.).  
  - Apply tags consistently.  
  - Outputs: VPC ID, ELB DNS name, ASG name, RDS endpoint, S3 bucket name, CloudWatch alarm ARN.  

---

## Key Requirements

- **Region**: us-east-1  
- **Multi-AZ VPC** with at least two public subnets.  
- **EC2 + ELB + ASG** setup with detailed monitoring.  
- **IAM roles** for EC2 → S3 access.  
- **S3 bucket** → KMS encryption + public access denied.  
- **RDS database** → private, no public exposure, accessible only from EC2 SG.  
- **Security Groups** → least privilege, web SG allows 80/443 only.  
- **CloudWatch alarms** → trigger at 80% CPU usage.  
- **Resource tags** → Name, Environment, Project.  
- **Conditional deployment logic** (toggle DB or ASG).  
- Must pass `terraform validate` + `terraform plan`.  

---

## What to deliver

Two TypeScript files:  

1. `modules.ts` → defines all resources.  
2. `tap-stack.ts` → handles wiring + outputs.  

Both must include **inline comments** explaining design + security choices.  

---