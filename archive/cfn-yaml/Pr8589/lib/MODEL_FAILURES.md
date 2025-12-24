# model_failure.md

## Overview
This document enumerates possible failure scenarios, validation errors, and runtime deployment issues for the **TapStack VPC CloudFormation stack**. It is intended to be versioned with the IaC codebase for reference during reviews, deployments, and incident investigations.

---

## Parameter & Validation Failures
- **Invalid CIDR ranges**  
  - Overlapping subnet CIDRs (e.g., public and private ranges colliding).  
  - VPC CIDR not within RFC1918 private space or overlapping with another existing VPC.  
- **Availability Zone mismatch**  
  - Template uses `!Select [0/1, !GetAZs ""]`. If region has fewer than 2 AZs, stack creation fails.  
- **Tagging limits exceeded**  
  - Very long `EnvironmentName` parameter values can push tags or resource names beyond AWS limits.  

---

## Resource Creation Failures
- **VPC**  
  - Account limit of VPCs per region exceeded.  
  - CIDR conflicts with an existing VPC in the account.  
- **Subnets**  
  - Overlapping or invalid CIDR ranges.  
  - Subnet size too small to support required resources.  
- **Internet Gateway (IGW)**  
  - IGW already attached to another VPC.  
  - Failure if VPC ID is missing or invalid.  
- **Elastic IPs (EIP)**  
  - AWS account has reached the Elastic IP quota.  
  - Failure to allocate due to region capacity issues.  
- **NAT Gateways**  
  - NAT Gateway creation fails if EIP allocation fails.  
  - NAT Gateway creation is limited by service quotas.  
  - Placement in wrong subnet (must be public).  
- **Routes & Associations**  
  - Circular or duplicate routes in route tables.  
  - Attempt to reference a non-existent NAT Gateway or IGW.  
  - Failure when associating a route table with a non-existent subnet.  

---

## Deployment Timing & Dependency Failures
- **Route Dependencies**  
  - PublicRoute depends on IGW attachment; failure if IGW attach not completed in time.  
- **NAT Gateway Provisioning Time**  
  - NAT Gateways take minutes to provision; routes may fail if they reference them too early.  

---

## Runtime / Post-Deployment Failures
- **Connectivity Issues**  
  - Private subnets cannot reach the internet if NAT Gateway fails or is misconfigured.  
  - Public subnets cannot reach outside if IGW or routes fail.  
- **High Availability**  
  - Template assumes two AZs. If one AZ becomes unavailable, resiliency is reduced.  
- **Cost Failures**  
  - NAT Gateways incur hourly and data processing charges; exceeding budget can cause unintended termination via budgets/automation.  

---

## Quota & Limit Exceedance
- **VPC & Subnet Quotas**  
  - Each region has limits on number of VPCs, subnets per VPC, and route tables.  
- **EIP Quotas**  
  - By default, 5 Elastic IPs per region; this template consumes 2.  
- **NAT Gateway Quotas**  
  - Per-region limits apply; exceeded if running multiple stacks.  

---

## Security / Misconfiguration Risks
- **Public Route Exposure**  
  - Misconfigured routes (0.0.0.0/0 to IGW) expose resources if security groups/NACLs are too permissive.  
- **Tagging / Environment Drift**  
  - Missing or inconsistent tags can cause governance/policy pipelines to reject the stack.  
- **IAM Permissions**  
  - Deploying user/role must have full `ec2:*` on VPC, subnets, IGW, EIPs, NAT Gateways, and routing; insufficient IAM rights cause failures.  

---

## Mitigation & Best Practices
- Validate CIDRs before deployment (`cfn-lint`, `taskcat`).  
- Check AZ availability per region.  
- Pre-allocate and confirm EIP limits.  
- Deploy into a sandbox first to verify resource dependencies.  
- Monitor NAT Gateway costs and availability.  
- Apply least-privilege IAM policies but ensure CloudFormation execution role has sufficient permissions.  
