# IDEAL_RESPONSE.md

## Overview

This document defines the structure and expectations of an **ideal response** for the IaC stack implemented using CDKTF in TypeScript. It outlines best practices and compliance requirements for provisioning a secure, highly available, and auditable VPC in AWS.

## Objective

Provision a production-grade VPC in the `us-east-1` region with:

- Public and private subnets across multiple availability zones
- Internet access via Internet Gateway and NAT Gateway
- Flow logs with appropriate retention and IAM roles
- Proper resource tagging for environment identification
- Compliance with AWS high-availability and least-privilege principles

---

## Ideal Response Characteristics

An ideal IaC response must:

- Follow AWS **high availability** best practices (multi-AZ deployment)
- Include **Internet Gateway** and **NAT Gateway** for appropriate subnets
- Generate **VPC Flow Logs** using a dedicated IAM role with scoped permissions
- Apply **Production tags** consistently across all resources
- Use **default AWS provider tags** to reduce redundancy
- Maintain **log retention** for at least 30 days (configurable)
- Avoid overly permissive IAM policies (`Resource: '*'` is prohibited)

---

## Example Implementation Highlights

- VPC CIDR: `10.0.0.0/16`  
- **2 Public Subnets** in `us-east-1a` and `us-east-1b`  
- **2 Private Subnets** in `us-east-1a` and `us-east-1b`  
- **Internet Gateway** for public subnets  
- **NAT Gateway** in public subnet for private subnet egress  
- **CloudWatch Log Group** for VPC flow logs with `30` days retention  
- **IAM Role and Policy** with specific log group ARN  
- **Route Tables** and **Associations** for both subnet types  
- All resources tagged with `Environment: Production`

---

## Expected Output

- Successfully deploys all required AWS networking components
- Ensures both internal and external connectivity paths are configured
- Provides logging for traffic monitoring and auditing
- Aligns with compliance policies for tagging and logging retention
- Passes all linting and TypeScript type checks

---

## Notes

- The use of dynamic AZ assignment (`String.fromCharCode(97 + index)`) improves fault tolerance.
- Avoids duplication in provider configuration by using `defaultTags`.
- IAM policies explicitly reference `logGroup.arn` to ensure least privilege.
- NAT Gateway costs are considered and provisioned only in one AZ for efficiency.

---

## Last Updated

**2025-07-31** — Based on latest implementation in `lib/vpc-stack.ts`

