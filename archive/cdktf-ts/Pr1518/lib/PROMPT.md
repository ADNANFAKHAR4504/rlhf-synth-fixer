The goal is to build a web application environment on AWS that can survive the loss of a single availability zone. 
Everything should be written in TypeScript using CDK for Terraform.

## What to implement

Well keep the code split into two files:

### modules.ts
This file should hold the core building blocks:
- A VPC that covers at least three AZs in `us-east-1`.
- An Elastic Load Balancer that can send traffic to multiple zones.
- An Auto Scaling Group that places EC2 instances in three AZs.
- An RDS database configured for Multi-AZ with backups kept for at least 7 days.

Add short inline comments in the code that explain why each resource is needed and how it helps with availability.

### tap-stack.ts
This file ties everything together. 
It should:
- Import the modules above and wire them up.
- Accept variables for AZ selection, instance size, scaling thresholds, and DB details. 
- Avoid any hard-coded credentials.
- Export useful outputs such as the ELB DNS name, RDS endpoint, and details about the Auto Scaling Group.

## Key requirements

- Region is `us-east-1`. 
- Database must run in Multi-AZ and keep at least 7 days of automated backups. 
- Load balancer must spread traffic across three or more AZs. 
- Auto Scaling should be able to add/remove EC2 instances and keep them distributed across three AZs. 
- The system should continue running even if one AZ goes down.

## Deliverables

- `modules.ts` with the resource definitions and inline comments. 
- `tap-stack.ts` that composes the modules, wires variables, and sets outputs. 
- Code should pass `terraform validate` and `terraform plan` without errors.

## Extra notes

Keep the modules clean and reusable. 
Use comments not just to describe *what* is created but also *why*. 
The end result should be the CDKTF version of a CloudFormation template that enforces high availability.
