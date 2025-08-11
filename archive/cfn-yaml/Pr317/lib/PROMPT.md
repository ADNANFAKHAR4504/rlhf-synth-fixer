# CloudFormation YAML Template Prompt

## Objective

Generate a complete AWS CloudFormation template in **YAML format** to provision a **secure, public-facing web application infrastructure** in the `us-east-1` region.

## Problem Statement

Deploy the architecture within an AWS environment using CloudFormation, ensuring that it's tailored for a public-facing web application requiring high security standards.

## Constraints

The generated template must **strictly follow** these requirements without altering or omitting any detail:

1. **Region**
   - All AWS resources must be deployed in the `us-east-1` region.

2. **EC2 IAM Role**
   - Use a **single AWS IAM role** for all EC2 instances.

3. **S3 Buckets**
   - All S3 buckets must use **AWS KMS encryption**.

4. **VPC**
   - Use a VPC that spans **at least two availability zones**.

5. **Lambda Functions**
   - Enable **logging** for all AWS Lambda functions.

6. **Security Groups**
   - Every security group must include **descriptive tags** explaining their purpose.

7. **RDS Database**
   - Configure all RDS instances for **Multi-AZ deployment**.

8. **IAM Roles**
   - All IAM roles must follow **security best practices**:
     - Do **not allow** `'*'` in the `Action` statement.
     - Use **least privilege access** policies only.

9. **Application Type**
   - The architecture should support a **public-facing web application** with high security standards.

## Environment Overview

The infrastructure to be created includes:

- EC2 instances launched via an **Auto Scaling group**.
- One or more **RDS** database instances with Multi-AZ support.
- Multiple **Lambda functions**.
- Multiple **S3 buckets**.
- A **VPC** covering at least two availability zones.
- Proper use of **IAM roles**, **security groups**, and **KMS encryption**.

## Output Requirements

- The output must be a **fully functional CloudFormation YAML template**.
- The template should be **ready for deployment without errors**.
- Do **not generalize** or change any given CIDR blocks, security rules, tags, encryption settings, or policy restrictions.
- Do **not include** additional explanation, commentary, or non-YAML content.
- Output only the **CloudFormation YAML code**.
