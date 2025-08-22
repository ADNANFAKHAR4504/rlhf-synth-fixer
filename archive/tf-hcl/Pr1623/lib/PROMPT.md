You are an expert Terraform architect. Your task is to generate a complete IaC solution using Terraform HCL that satisfies the requirements below.  

# Task
Generate a modular Terraform configuration that deploys a robust, highly available, and scalable web application across two AWS regions

# Here are the requirements
- Deploy the application components in two AWS regions using the Terraform provider alias feature.
- Create AWS Auto Scaling Groups (ASG) to automatically scale capacity up and down during traffic spikes to maintain responsiveness.
- Use Application Elastic Load Balancer (ELB/ALB) in each region to distribute traffic to the instances.
- Configure health checks in Amazon Route 53 and failover routing so that traffic is routed to the healthy region if one region fails.
- Define all resources in Terraform HCL
- The files must be modularized into separate modules (e.g., VPC, compute/ASG, load balancer, DNS).
- The configuration must be deployable as-is.

# Expected Output
- A complete HCL Terraform codebase which includes:
  1. `main.tf` that connects the modules together and configures provider aliases
  2. Module directories for VPC, ASG/Compute, load balancer, and Route 53
  3. `variables.tf` with sensible defaults.
- Code should be formatted with `terraform fmt`, and include documentation comments explaining key design choices

# In Short
Deploy a **multi-region, highly available web application architecture** on AWS using Terraform HCL. 
Use aliases for region separation, Auto Scaling + ELB for resilience and scalability, and Route 53 health checks for automatic failover. Deliver a validated and modularized Terraform project solution