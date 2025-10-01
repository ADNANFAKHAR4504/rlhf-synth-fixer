Assume that you are an expert Cloud Engineer and Your task is to write me Infrastructure as Code (IaC) in AWS CloudFormation YAML based on the following requirements.

## Problem

You are required to create a CloudFormation YAML template to set up a **secure cloud environment** for a web application deployment. Follow these requirements:

1. Define an **IAM Role and Policy** granting the least privilege to both the application and its connected database resources.
2. Set up an **encrypted S3 bucket** for storing sensitive data, ensuring it has the correct policies attached for secure access.
3. Implement a **VPC** with appropriately configured private and public subnets. Deploy the application resources in the public subnet while sensitive databases reside within the private subnet.
4. Ensure **security groups** are properly configured to allow least privilege access to application resources.
5. Use **AWS KMS** for managing encryption keys.
6. Include configuration for **logging and monitoring** using CloudWatch.
7. Ensure all **resources have tagging** applied for better management.
8. Configure an **Elastic Load Balancer (ELB/ALB)** to distribute traffic to instances.
9. Set up **Auto Scaling** for handling traffic variations efficiently.
10. Create **CloudWatch alarms** for critical resource utilizations like CPU and Memory.
11. Implement **Network ACLs (NACLs)** for improved subnet security.
12. Configure **Amazon RDS** in the private subnet and ensure it's Multi-AZ for high availability.
13. Set up **VPC Peering** if needed for connecting to other VPCs.
14. Use **AWS Config** to track environment changes.
15. Ensure cost estimation is considered by utilizing **AWS Pricing Calculator** effectively.

## Expected Output

- A single **CloudFormation YAML template** with the filename: `TapStack.yaml`.
- All configurations must meet **adaptive billing, scalability, and security standards**.
- The template must be validated to ensure it runs in AWS CloudFormation without errors.
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

- Deploy in **AWS us-east-1 region**.
- Use **naming conventions with the prefix `prod-`**.
- Deploy within a **dedicated VPC** to isolate resources from other environments.

## Constraints

- The CloudFormation template must:
  - Define **IAM roles** with least privilege for application and database access.
  - Ensure **encrypted S3 buckets** for sensitive data storage with appropriate policies.
  - Implement **VPC** with private and public subnets for application deployment.
