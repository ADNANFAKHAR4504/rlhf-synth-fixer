## Mission Statement

Your mission is to act as an **expert AWS Solutions Architect** and generate a TypeScript AWS CDK program that provisions a robust, secure, and parameterized VPC-based architecture in AWS. All requirements and constraints provided **must remain intact and unchanged**. Ensure that a **string suffix is appended to resource names where needed** to prevent naming collisions.

## Instructions

### 1. Analyze the Requirements
Review all requirements and constraints carefully. Do **not** alter or omit any aspect of the provided data.

### 2. Write the Architecture in CloudFormation TypeScript Format
Use AWS CDK in TypeScript to define all resources and configurations, ensuring industry best practices for networking and security are followed.

### 3. Specify AWS Services
Explicitly name and configure each AWS service needed for the solution: VPC, Subnets, NAT Gateway, Security Group, Lambda, S3, IAM, CloudWatch Logs, RDS MySQL.

### 4. Emphasize Resource Uniqueness, Security & Tagging
- **Resource Naming**: Every resource must follow the `'app-purpose-environment-stringSuffix'` naming convention, appending a string suffix where necessary to guarantee uniqueness.
- **Security**: Allow ingress on only HTTP (80) and SSH (22) via Security Group, attach IAM roles with strictly required permissions, and place Lambda in a private subnet.
- **Tagging**: Tag all resources with `'Environment':'Development'`.

### 5. Output Format
**AWS CloudFormation + TypeScript (AWS CDK)**

## Task Requirements

Design an IaC solution using **AWS CDK in TypeScript** to implement a multi-tier, VPC-based architecture for the **"IaC - AWS Nova Model Breaking"** project.

### Core Requirements

1. **VPC**
   - CIDR block: `10.0.0.0/16`
   - At least three subnets: one public, two private
   - Subnets span at least two Availability Zones
   - Tag: `'Environment':'Development'`

2. **NAT Gateway**
   - Associate with private subnets for outbound internet

3. **Security Group**
   - Allow ingress on HTTP (port 80) and SSH (port 22) only
   - Restrict all other traffic
   - Tag: `'Environment':'Development'`

4. **Lambda Function**
   - Deployed in a private subnet
   - Triggers on S3 bucket events
   - IAM Role: S3 read-only, CloudWatch Logs write
   - Tag: `'Environment':'Development'`

5. **RDS MySQL Instance**
   - Multi-AZ deployment (high availability)
   - Deployed in one private subnet
   - Parameterized instance type and database size
   - Tag: `'Environment':'Development'`

6. **Configuration**
   - All resources use parameters for configurable aspects (e.g., instance type, DB size)

7. **Outputs**
   - Export VPC ID, Subnet IDs, and Security Group IDs

### Constraints

- Use AWS CDK with TypeScript only.
- All resources must have parameterized inputs.
- All resource names must include a string suffix for uniqueness.
- Tag all resources as specified.

## Solution Requirements

- **Single, deployable TypeScript CDK application**
- All configuration, resource definitions, tags, IAM roles, and outputs included
- Output must confirm creation and configuration of each resource

## Success Criteria

- **Security**: Proper security group, IAM roles, and subnet placement
- **Uniqueness**: Resource names have a string suffix
- **Compliance**: All requirements and constraints are implemented exactly as specified
- **Operational Excellence**: Clean, maintainable, and well-documented TypeScript code
- **Deployment**: TypeScript file compiles and deploys successfully using AWS CDK

## Expected Deliverables

- Complete AWS CDK TypeScript stack implementation
- Resource definitions for VPC, Subnets, NAT Gateway, Security Group, Lambda, S3, IAM, CloudWatch Logs, and RDS MySQL
- All resources tagged with `'Environment':'Development'`
- Resource naming with a string suffix for uniqueness
- Outputs for VPC ID, Subnet IDs, and Security Group IDs
- Documentation for deployment and outputs

---