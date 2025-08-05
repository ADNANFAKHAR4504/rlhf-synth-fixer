# CloudFormation Challenge Prompt

## Project Name:
**IaC - AWS Nova Model Breaking**

## Difficulty:
**Hard**

## Environment:
- **Region:** `us-east-1`
- **Tagging Requirement:** All resources must include the tag:
  - `Key`: `Environment`
  - `Value`: `Production`
- **Template Type:** AWS CloudFormation using YAML
- **Parameterization:** All configurations must be parameterized to distinguish between staging and production environments.
- **Security:** IAM roles and policies must follow AWS best practices, particularly the principle of least privilege.
- **Availability:** Multi-AZ setup is mandatory for fault tolerance and high availability.

## Problem Statement:
Create a fully parameterized CloudFormation YAML template to deploy a **secure and highly available web application infrastructure** on AWS that complies with production standards and best practices.

### The template must provision the following resources and configurations:

1. **S3 Bucket**
   - Versioning enabled
   - Data encrypted at rest using **AWS KMS**

2. **VPC**
   - Include **two public** and **two private subnets**
   - Subnets must span across **two Availability Zones** for redundancy

3. **Application Load Balancer (ALB)**
   - Accept only **HTTPS** traffic
   - Redirect all **HTTP** traffic to **HTTPS**

4. **RDS Database**
   - Deployed in **multi-AZ** mode for high availability
   - Data encrypted at rest using **AWS KMS**

5. **EC2 Instances**
   - Must have **auto-scaling** enabled
   - Auto-scaling policy based on **CPU utilization**

6. **IAM Roles and Policies**
   - Defined using the **least privilege principle**

7. **Monitoring and Notifications**
   - Use **CloudWatch Alarms** to monitor EC2 health and CPU performance
   - Configure **SNS notifications** to alert on alarm threshold breaches

## Constraints:
- All configurations must support separation between **staging** and **production** environments via parameters.
- Follow AWS security and reliability best practices.

## Expected Output:
- A **CloudFormation YAML template** that:
  - Is **fully parameterized**
  - Satisfies all **resource creation and configuration constraints**
  - **Passes deployment tests** for availability, encryption, and monitoring
  - Includes appropriate use of **intrinsic functions**, **conditions**, and **mappings** where necessary
  - Applies the **`Environment: Production`** tag to **all** resources

## Evaluation Criteria:
- Correctness of deployed resources
- Full compliance with encryption, security, and availability requirements
- Effective use of CloudFormation constructs for modularity and reuse
- Monitoring and alerting mechanisms properly configured and testable
