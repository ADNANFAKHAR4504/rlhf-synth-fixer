## Mission Statement

As an expert AWS DevOps engineer, generate a TypeScript script using AWS CDK to define a CloudFormation stack for a multi-region cloud infrastructure. **All provided requirements and constraints must remain intact and unchanged.** Ensure a **string suffix is appended to resource names where needed** for uniqueness and compliance.

---

## Instructions

1. **Requirements Analysis**
   - Carefully review all problem statements, environments, and constraints. Do **not** modify, omit, or alter any provided data.

2. **Architecture Implementation**
   - Use AWS CDK in TypeScript to define all resources and configurations in accordance with CloudFormation best practices.

3. **Service Specification**
   - Explicitly configure each AWS service required: VPC, Subnets, RDS, Security Groups, IAM, Lambda, S3, Elastic Load Balancer, EC2, Route 53, CloudFront, CloudWatch, Logging Solution, KMS.

4. **Resource Naming, Security, & Tagging**
   - **Resource Naming:** All resources must use the company’s naming scheme and append a string suffix for uniqueness.
   - **Security:** Use least privilege IAM roles, enable encryption with KMS, and restrict security group ingress to HTTPS only.
   - **Tagging:** Tag all resources with `project=cloud-setup` for cost tracking purposes.

5. **Output Format**
   - **CloudFormation + TypeScript (AWS CDK)**

---

## Task Requirements

Design and implement a deployable AWS CDK TypeScript stack for the infrastructure spanning the `us-east-1` and `eu-west-1` regions.

### Core Components & Constraints

1. **VPCs**
    - Two VPCs: one in `us-east-1`, one in `eu-west-1`
    - Each VPC with at least two subnets: one public, one private
    - Ensure address space does **not** overlap

2. **Amazon RDS (SQL)**
    - Instance with encryption at rest (using AWS KMS)

3. **Security Groups**
    - Allow only HTTPS traffic (port 443)

4. **IAM Role**
    - For application servers with EC2 read-only permissions

5. **Lambda Function**
    - Triggered on S3 object upload

6. **Elastic Load Balancer**
    - Distributes traffic across EC2 instances

7. **Route 53**
    - Manages DNS entry for the application URL

8. **CloudFront**
    - CDN for content delivery optimization

9. **CloudWatch Alarms**
    - Monitor EC2 CPU usage and alert if usage exceeds 70%

10. **Centralized Logging Solution**
    - Collect and aggregate logs from EC2 instances into a central location

11. **Tagging**
    - All resources tagged with `project=cloud-setup`

12. **AWS KMS**
    - Used for managing all encryption keys

13. **Resource Naming**
    - Adhere to company naming scheme and append string suffix for uniqueness

---

## Solution Requirements

- **Single, deployable TypeScript CDK application**
- All configuration, resource definitions, IAM roles, tags, security, and outputs included
- Output must confirm creation/configuration of each resource
- Solution must pass CDK validation tests

---

## Success Criteria

- **Multi-region Deployment:** VPCs, subnets, and resources spanning `us-east-1` & `eu-west-1`
- **Security:** IAM roles, HTTPS-only ingress, KMS encryption
- **Tagging:** All resources tagged with `project=cloud-setup`
- **High Availability & Optimization:** ELB, CloudFront, Lambda triggers, CloudWatch alarms
- **Compliance:** All requirements/constraints implemented exactly as specified
- **Resource Uniqueness:** All resource names include a string suffix per company scheme
- **Operational Excellence:** Maintainable, well-documented TypeScript code
- **Deployment:** TypeScript file compiles, deploys, and passes CDK validation tests

---

## Expected Deliverables

- Complete AWS CDK TypeScript stack implementation
- Resource definitions for VPCs, Subnets, RDS, Security Groups, IAM, Lambda, S3, ELB, EC2, Route 53, CloudFront, CloudWatch, Logging, KMS
- Resource naming with string suffix for uniqueness
- Outputs for key resource IDs, endpoints, and ARNs
- Documentation for deployment, outputs, and operational runbooks

---
