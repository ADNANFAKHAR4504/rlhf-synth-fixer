Please write IAC code in CloudFormation YAML using the data given below:

Constraints:

All resources must be defined within AWS Region us-east-1. Use AWS Key Management Service to encrypt all sensitive data at rest. Ensure IAM roles and policies follow the principle of least privilege. All AWS Lambda functions must be packaged and deployed using S3. Use a VPC for all network-related resources to isolate them from public access. Apply security groups to EC2 instances to control inbound and outbound traffic. All user data for EC2 instances must be passed securely using AWS Secrets Manager. The CloudFormation template must enforce Multi-Factor Authentication for user access. Audit logging must be enabled for all services via AWS CloudTrail. Define alarms for security incidents using AWS CloudWatch. Ensure that no resource has a public IP unless explicitly required. Protect the CloudFormation template using Stack Policies to prevent accidental changes.

Environment:

Design a CloudFormation template in YAML to set up a secure AWS environment that adheres to the following requirements:

1. Define a Virtual Private Cloud that connects to private subnets through route tables, with a NAT Gateway that provides internet access for resources in private subnets.

2. Deploy secure IAM roles and policies ensuring the principle of least privilege. EC2 instances attach to IAM instance profiles for secure AWS API access.

3. Use AWS KMS for encryption. KMS keys integrate with S3 buckets for server-side encryption and CloudWatch Logs for log encryption.

4. Configure AWS Lambda functions deployed from S3 buckets. Lambda connects to VPC subnets through security groups for secure network access.

5. Ensure all EC2 instances only allow inbound and outbound traffic specified by security groups. Security groups reference each other for layered access control - bastion hosts connect to application instances, and ALB forwards traffic to backend servers.

6. Securely manage EC2 instance user data using AWS Secrets Manager. EC2 roles grant permission to retrieve secrets from Secrets Manager.

7. Enable audit logging for all AWS services via AWS CloudTrail. CloudTrail sends logs to S3 buckets and integrates with CloudWatch Logs for real-time monitoring.

8. Implement CloudWatch alarms that trigger on security metrics from CloudTrail events.

9. Require MFA for all user accesses through IAM group policies that deny actions when MFA is not present.

10. Strictly manage public IP allocation. Only the public subnet with NAT Gateway has internet-routable addresses. Private subnets route through NAT for outbound-only access.

11. Protect the CloudFormation stack with stack policies to prevent unintended changes.

12. The solution should pass all security audit tests.

Expected Output: The solution should be implemented as a YAML CloudFormation template. Ensure that the implemented template passes all the security checks and constraints specified above.

It should include this metadata:

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

and this Parameter:

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming such as dev, staging, prod'
    AllowedPattern: alphanumeric characters only
    ConstraintDescription: 'Must contain only alphanumeric characters'

Include these in the template code.

Proposed Statement:

The infrastructure will be provisioned in AWS Region us-east-1, leveraging AWS services such as IAM, KMS, VPC, EC2, Lambda, S3, CloudTrail, and CloudWatch. All resources should be secured according to the given constraints and security best practices.
