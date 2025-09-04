**User Prompt:**

---

I want a complete Terraform configuration for AWS written in a **single `main.tf` file** (do not include provider configuration I already have `provider.tf` set up).

**Requirements:**

1. Create a VPC with CIDR block `10.0.0.0/16`.
2. Create **two public** and **two private** subnets, spread across two availability zones.
3. Provision an Internet Gateway attached to the VPC to enable internet access for public subnets.
4. Provision a NAT Gateway in one of the public subnets to enable outbound internet access for private subnets.
5. Ensure private subnets have no direct inbound internet access but can access the internet outbound via NAT Gateway.
6. Deploy an EC2 instance in each private subnet, using the **latest Amazon Linux 2 AMI**.
7. Deploy a bastion host EC2 instance in one of the public subnets, allowing SSH access from anywhere.
8. Configure appropriate security groups:

* Bastion host: allow inbound SSH from anywhere.
* Private EC2 instances: allow inbound SSH only from the bastion host.
9. Use **variables** for VPC CIDR block, subnet CIDRs, AWS region, instance types, key pair name, and any other configurable inputs. Initialize all variables with reasonable defaults inside the same `main.tf`.
10. Define **outputs** for:

* VPC ID
* Public subnet IDs
* Private subnet IDs
* Bastion host public IP
* Private EC2 instance IDs

All resource names should be prefixed with `"project-"`.

Please provide the complete and ready-to-use `main.tf` Terraform code following these instructions.

---

Would you like me to generate the full Terraform `main.tf` code for you based on this prompt?
