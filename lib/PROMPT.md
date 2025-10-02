# Prompt

Write me Infrastructure as Code (IaC) in **AWS CloudFormation YAML** based on the following requirements.

## Problem

Create a CloudFormation YAML template that automates the provisioning of a **VPC with high-availability infrastructure**, suitable for a production environment. The infrastructure must be **secure, cost-effective, scalable**, and aligned with **AWS security best practices**.

### Requirements:

1. A VPC with **three public subnets** and **three private subnets**, distributed across **three Availability Zones**.
2. An **Internet Gateway** attached to the public subnets.
3. **NAT Gateways** for each private subnet to enable outbound internet access.
4. Security configurations ensuring **least privilege access** for public and private subnet resources.
5. An **RDS instance** with Multi-AZ deployment, high availability, and automatic backups.
6. A **Bastion Host** in a public subnet for secure SSH access to private subnet instances.
7. An **Application Load Balancer** managing public-facing traffic across EC2 instances.
8. **Encryption at rest** enabled for all services (EBS, RDS, S3).
9. **VPC Flow Logs** directed to an encrypted S3 bucket.
10. **No hardcoded secrets or credentials** — use managed IAM roles.
11. Apply **tags** to all resources to clearly identify the production environment.

## Expected Output

- A **CloudFormation YAML file** named `TapStack.yaml`.
- The template must be correctly formatted, validated, and adhere to **AWS best practices**.
- It must successfully deploy the infrastructure described above in **AWS CloudFormation**.
- The provided `TapStack.yaml` file should use the following code in it:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:

Outputs:
  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

- Response should only include the single code file `TapStack.yaml` with the above content included.

## Environment

- Region: **us-east-1**.
- Purpose: **High availability, secure, and monitorable networking infrastructure** for a production environment.

## Constraints

- All resources must include the tag: **Environment: Production**.
- VPC with **3 public and 3 private subnets**, equally spread across 3 AZs.
- Each **public subnet** must have a **separate route table** associated.
- Internet Gateway must be attached to the VPC and linked to **public route tables**.
- A **managed NAT Gateway** must be created for each private subnet in its AZ.
- **Security Groups**:
  - Allow HTTP/HTTPS from anywhere to public subnets.
  - No "all inbound" rules; only specific ports allowed.
- **Private subnets**:
  - No direct internet access.
  - Contain **database resources only**, not publicly accessible.
- **RDS**: MySQL Multi-AZ with automatic backups, deployed in private subnets.
- **Bastion Host**: Deployed in a public subnet; only this host can SSH into private instances.
- **Load Balancer**: Public-facing, attached only to public subnets.
- **Encryption**: Enabled for all EBS volumes, RDS, and S3 buckets.
- **VPC Flow Logs**: Enabled, directed to encrypted S3 bucket.
- **IAM**: Use managed roles; no access keys or hardcoded credentials.
- All policies and configurations must align with **AWS security best practices**.
