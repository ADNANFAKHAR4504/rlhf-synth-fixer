You are an expert Terraform architect. Your task is to generate a complete Infrastructure as Code (IaC) solution using Terraform HCL that satisfies the requirements below.  

# Task
Generate a modular Terraform configuration that deploys a robust, highly available, and scalable web application across two AWS regions.

# Requirements
- Deploy all application components in **two AWS regions** using the **Terraform provider alias** feature.
- Implement AWS Auto Scaling Groups (ASG) to automatically adjust compute capacity during traffic spikes and maintain responsiveness.
- Use an Elastic Load Balancer (ELB/ALB) in each region to distribute traffic across instances.
- Configure Amazon Route 53 with health checks and failover routing so traffic is routed to the healthy region if one region fails.
- All AWS resources must be defined in **Terraform HCL** (no manual steps).
- The design must be **modularized** into separate modules (e.g., VPC, compute/ASG, load balancer, DNS).
- The configuration must **validate with AWS** and be deployable as-is.

# Expected Output
- A complete Terraform codebase (HCL) including:
  1. `main.tf` that wires modules together and configures provider aliases.
  2. Module directories for VPC, compute/ASG, load balancer, and Route 53.
  3. `variables.tf` and an example `terraform.tfvars` with sensible defaults.
- Code should be **syntactically correct**, formatted with `terraform fmt`, and include **documentation comments** explaining key design choices (e.g., why aliases are used, how Route 53 failover is configured).

# In Short
Deploy a **multi-region, highly available web application architecture** on AWS using Terraform HCL. Use provider aliases for region separation, Auto Scaling + ELB for resilience and scalability, and Route 53 health checks for automatic failover. Deliver the solution as a validated, modularized Terraform project.
