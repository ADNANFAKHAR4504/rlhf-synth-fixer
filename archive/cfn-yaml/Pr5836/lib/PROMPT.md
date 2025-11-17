Optimized EC2 Infrastructure Refactor (CloudFormation YAML)

## Summary

A financial services company’s existing CloudFormation template for their **trading platform** suffers from inefficiencies, redundant resources, and circular dependencies that slow deployment and inflate costs. The objective is to **refactor and optimize the infrastructure** using best practices, modern CloudFormation features, and cost-effective architecture patterns. The solution must retain all functional capabilities while improving performance, maintainability, and compliance with internal standards.


The trading platform runs in the **production environment (us-east-1)**. It includes:

* An **Application Load Balancer (ALB)** in public subnets.
* An **Auto Scaling group (ASG)** of EC2 instances running **Amazon Linux 2** in private subnets.
* Existing VPC: `vpc-0123456789abcdef0` (two availability zones).
* Deployed using **AWS CLI 2.x** with IAM permissions for EC2, ELB, Auto Scaling, CloudWatch, and CloudFormation.
* Current issues:

  * Hardcoded AMI IDs.
  * Redundant security groups.
  * Circular dependencies between ASG and ALB Target Group.
  * Lack of monitoring and stateful resource protection.
  * Overuse of `Fn::Join` and missing cost allocation tags.


## Functional Requirements

1. Replace **hardcoded AMI IDs** with SSM Parameter Store lookups for the latest Amazon Linux 2 AMI.
2. Consolidate three overlapping security groups into **one optimized group** with:

   * HTTPS (443) from internet.
   * HTTP (80) only from ALB.
3. Resolve **circular dependencies** between the ALB Target Group and Auto Scaling Group using `DependsOn`.
4. Replace standalone EC2 instances with an **Auto Scaling group** that maintains **2–4 instances** based on CPU utilization.
5. Configure **CloudWatch alarms** for:

   * High CPU (>80%).
   * Low healthy instances (<2).
6. Use **`Fn::Sub`** for cleaner, readable UserData scripts.
7. Add **DeletionPolicy** and **UpdateReplacePolicy** to protect stateful resources.
8. Use **Mappings** for region-specific values instead of nested conditions.
9. Export key **Outputs** for cross-stack referencing.
10. Implement **AWS::CloudFormation::Interface** metadata for organized parameters.


* Template must be **<51,200 bytes** (no S3 dependency for deployment).
* Use **only intrinsic functions** (no custom resources).
* Maintain **backward compatibility** with existing parameters.
* Use **mixed instances policy** in Auto Scaling for cost optimization.
* Apply **cost allocation tags**: `Environment`, `Project`, `Owner`.
* UserData script must **complete within 5 minutes**.
* Security group must **allow HTTPS (443)** publicly, and **HTTP (80)** only from ALB.
* Make CloudWatch alarms **optional** using CloudFormation conditions.
* Must **pass `cfn-lint` validation** successfully.


## High-level Components

1. **VPC (pre-existing)** — referenced by parameter.
2. **Subnets** — public (for ALB) and private (for EC2).
3. **Application Load Balancer (ALB)** — distributes traffic to EC2s in ASG.
4. **Target Group** — for ALB health checks.
5. **Auto Scaling Group** — 2–4 EC2 instances (Amazon Linux 2) using SSM AMI lookup.
6. **Launch Template** — references latest AMI, includes optimized UserData script.
7. **Security Group** — consolidated, least-privilege inbound rules.
8. **CloudWatch Alarms** — CPU >80% and instance count <2 (optional).
9. **IAM Roles** — for EC2 and CloudFormation operations.
10. **Outputs & Exports** — expose ALB DNS, ASG name, Security Group ID.

## Key Optimizations

* Use **DependsOn** to eliminate ALB/ASG circular dependencies.
* Use **Mappings** for region-based AMIs and instance types.
* Protect critical resources with **DeletionPolicy: Retain** and **UpdateReplacePolicy: Retain**.
* Apply consistent tagging for billing and ownership tracking.


1. Template validates with **`cfn-lint`** and deploys without errors.
2. **SSM AMI lookup** dynamically retrieves the latest Amazon Linux 2 AMI.
3. All redundant **security groups** are merged into a single optimized one.
4. **Circular dependency** between ALB and ASG resolved using `DependsOn`.
5. Auto Scaling operates between **2 and 4 instances** based on CPU.
6. Optional **CloudWatch alarms** trigger based on CPU and health metrics.
7. All stateful resources include **DeletionPolicy** and **UpdateReplacePolicy**.
8. Outputs provide **exportable references** for reuse in other stacks.
9. Template stays within **51,200 bytes** and **passes cfn-lint**.
10. Documentation clearly organizes parameters using **AWS::CloudFormation::Interface**.


## Prompt: Generate Optimized CloudFormation Template

```
You are an AWS infrastructure engineer. Produce a **CloudFormation YAML template** that refactors and optimizes an existing web application infrastructure.

Follow these requirements:
1. Replace hardcoded AMI IDs with SSM Parameter Store lookups.
2. Consolidate three security groups into one optimized security group.
3. Fix circular dependencies between ALB Target Group and Auto Scaling Group using `DependsOn`.
4. Replace standalone EC2 instances with an Auto Scaling Group (2–4 instances) scaling on CPU.
5. Add CloudWatch alarms for CPU >80% and instance count <2 (conditionally created).
6. Use `Fn::Sub` for UserData; remove multiple `Fn::Join` chains.
7. Apply `DeletionPolicy` and `UpdateReplacePolicy` on stateful resources.
8. Use mappings for region-specific values; export key outputs for cross-stack reference.
9. Include `AWS::CloudFormation::Interface` metadata for organized parameters.
10. Add tags: `Environment`, `Project`, `Owner` to all resources.
11. Must validate successfully with `cfn-lint` and stay under 51KB.

Return:
- A **single CloudFormation YAML template** implementing all optimizations.
- Inline comments explaining key improvements.
- Example parameter values for deployment.
```


* Confirm if CloudWatch alarms should be deployed by default or behind a condition (parameter-driven).
* Validate instance types and region mappings.
* Generate full CloudFormation YAML with explanatory comments and test using `cfn-lint` before deployment.