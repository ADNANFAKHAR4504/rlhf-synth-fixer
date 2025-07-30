# AWS VPC Provisioning using Terraform CDK and TypeScript

## Role

You are a senior cloud infrastructure engineer with deep expertise in AWS, Terraform CDK (Cloud Development Kit), and TypeScript.

## Task

Write a complete Terraform CDK (CDKTF) program in TypeScript that provisions the following AWS infrastructure.

## Problem Statement

Provision a secure and cost-effective AWS Virtual Private Cloud (VPC) with the following requirements:

1. The VPC must have a primary CIDR block of `10.0.0.0/16`.
2. Create **two public subnets**, each in a different availability zone within the `us-west-2` region.
3. Attach an **Internet Gateway** to the VPC for outbound internet access.
4. Configure **Route Tables** and **Route Table Associations** to route outbound traffic through the Internet Gateway.
5. Create **Network ACLs (NACLs)** and **Security Groups** to allow **only inbound HTTP (port 80) and HTTPS (port 443)** traffic from anywhere (`0.0.0.0/0`), while denying all other inbound traffic.

## Environment

- AWS Region: `us-west-2` (fallback to `us-east-1` if needed)
- Infrastructure as Code Tool: **Terraform CDK (CDKTF)** using **TypeScript**
- CIDR block: `10.0.0.0/16` to avoid overlap with typical corporate networks

## Constraints and Best Practices

- Infrastructure should be **cost-efficient** without compromising essential functionality and performance
- Use **general-purpose** instance types and managed services where applicable
- IAM configurations (if required) must follow **AWS IAM security best practices**, including the principle of least privilege
- Avoid deprecated AWS services or Terraform constructs
- Use idiomatic **Terraform CDK and TypeScript**.

## Expected Output

- Complete **CDKTF code in TypeScript**, including all necessary imports and constructs
    - Create the entire solution as a single stack. 
    - Make the stack extend the Construct class instead of the TerraformStack class. 
    - Omit code to initialize AWS Providers or backends.
    - Generate only the code for this stack, do not include main entrypoint code.
- Code should be self-contained and runnable via `cdktf deploy`
- Include **inline comments** explaining key sections
- Output only the code (no extra commentary)

