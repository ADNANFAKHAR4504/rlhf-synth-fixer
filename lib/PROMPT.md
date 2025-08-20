You are an expert Terraform architect. Your task is to generate a complete Infrastructure as Code (IaC) solution using **Terraform** that satisfies the requirements below.  

# Hers is the Task
Generate a complete, modular Terraform configuration that deploys a highly available and scalable web application across two AWS regions.

# Requirements
- Deploy all application components in two AWS regions using the Terraform provider alias feature.
- Implement AWS Auto Scaling groups to handle traffic spikes and maintain responsiveness.
- Use an Elastic Load Balancer (ELB/ALB) in each region to distribute traffic across instances.
- Configure Amazon Route 53 with health checks and failover routing to automatically route traffic to the healthy region in case of regional failure.
- Ensure all AWS resources are defined using Terraform HCL (no manual steps).
- The solution must be modularized (separate modules for VPC, compute/ASG, load balancer, DNS).
- The configuration must validate successfully with AWS and be deployable as-is.

# For Expected Output:
- A full Terraform codebase (HCL) with:
1. `main.tf` that wires together modules and provider aliases.
2. Module directories for VPC, compute/ASG, load balancer, and Route 53.
3. Example `variables.tf` with sensible defaults.
- Code should be syntactically correct and formatted with `terraform fmt`.
- Documentation comments explaining key design choices (e.g., why alias providers are used, how failover routing is set).

# IN SHHORT
Deploy a multi-region, highly available web application architecture on AWS using Terraform HCL. Use provider aliases for region separation, Auto Scaling and ELB for resilience and scalability, and Route 53 health checks for automatic failover. Deliver the solution as a validated, modularized Terraform project.
