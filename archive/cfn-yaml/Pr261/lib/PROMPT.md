# VPC Infrastructure Design Prompt

## Objective
Develop a CloudFormation YAML template named `vpc-setup.yaml` that provisions a secure, scalable, and cost-effective AWS Virtual Private Cloud (VPC) infrastructure suitable for hosting applications in a multi-AZ environment.

## Requirements

### 1. VPC Configuration
- Create a new VPC with the CIDR block `10.0.0.0/16`.
- Ensure no default subnets are created.

### 2. Subnet Design
- Provision **two public subnets**, each in a distinct Availability Zone (AZ).
- Provision **two private subnets**, also in distinct AZs aligned with the public subnets.

### 3. Internet & NAT Gateway Setup
- Attach an **Internet Gateway (IGW)** to the VPC.
- Create **two NAT Gateways**, one in each public subnet, for high availability.
- Ensure private subnets route internet-bound traffic through the NAT Gateways.

### 4. Routing Configuration
- Create and associate appropriate route tables:
  - Public subnets should route internet-bound traffic through the Internet Gateway.
  - Private subnets should route internet-bound traffic through the NAT Gateways.

### 5. Cost Optimization & Tagging
- Choose cost-effective AWS instance types or services where applicable (e.g., NAT Gateways, EC2).
- Apply meaningful tags (e.g., `Environment`, `Project`, `Owner`, `BillingCode`) to all compute resources for cost tracking and management.

## Deliverables
- A valid AWS CloudFormation template (`vpc-setup.yaml`) that:
  - Successfully provisions the described network infrastructure.
  - Passes AWS CloudFormation validation checks.
  - Follows AWS best practices for security, high availability, and cost efficiency.

---

> **Note:** The infrastructure should be scalable and production-ready while maintaining separation of public and private resources across availability zones.