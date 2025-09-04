# CDKTF TypeScript Prompt: AWS IPv6-Only IoT Infrastructure using Modules

> **Act as a senior DevOps engineer and AWS Solutions Architect.** 
You are building a **secure, production-grade IPv6-only infrastructure on AWS** using **CDK for Terraform (CDKTF) in TypeScript**. The goal is to support **IoT and smart device applications** in an **IPv6-only network**, structured with **modular CDKTF code** for clarity and reusability.

---

## Required Files

- `lib/modules.ts` 
Contains all reusable infrastructure components (VPC with IPv6, Subnets, Security Group, EC2, IAM, etc.).

- `lib/tap-stack.ts` 
Composes the infrastructure by importing and instantiating modules, passing values, and exporting final outputs (e.g., VPC ID, subnet IDs, EC2 instance IPv6 address).

---

## Environment

- Cloud Provider: **AWS**
- Region: `us-west-2`
- IPv6-only: **No IPv4 addresses or routing anywhere in the stack**
- Tagging (applied to all resources):
- `Environment = dev`
- `Project = IPv6-IoT`
- `Cloud = AWS`

---

## Infrastructure Requirements

1. **IPv6-Only VPC**
- Assign Amazon-provided IPv6 CIDR
- No IPv4 CIDR
- Fully IPv6-enabled subnets (public & private)

2. **IPv6 Route Tables**
- Routes via IPv6 internet gateway
- No IPv4 NAT or IGW

3. **IPv6-Only Security Group**
- Only allows IPv6 ingress/egress traffic

4. **EC2 Instance (IoT App)**
- Lightweight web app (e.g., Python Flask or Node.js HTTP server)
- Must bind to and serve over IPv6
- Must not have any IPv4 address

5. **IAM Role & Instance Profile**
- EC2 execution permissions (least privilege)

6. **Outputs (from `tap-stack.ts`)**
- VPC ID
- Subnet IDs
- EC2 Instance ID
- EC2 IPv6 Address

---

## Constraints

- All infrastructure must be reusable through `modules.ts`
- No logic should be embedded in `tap-stack.ts` other than composition
- IPv4 must be completely excluded
- All AWS resources must include proper tags

---

## Deliverables

- `modules.ts`: 
Exports modular CDKTF constructs: VPC (IPv6-only), subnets, routes, security groups, EC2, IAM role/profile.

- `tap-stack.ts`: 
Imports modules, instantiates and links components, passes variables, and defines `TerraformOutput` values.