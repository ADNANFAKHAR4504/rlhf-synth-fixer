Please write IAC code in cloudformation yaml using the data given below:

Contraints:

All resources must be defined within a specific AWS Region: us-east-1. | Use AWS Key Management Service (KMS) to encrypt all sensitive data at rest. | Ensure IAM roles and policies follow the principle of least privilege. | All AWS Lambda functions must be packaged and deployed using S3. | Use a VPC for all network-related resources to isolate them from public access. | Apply security groups to EC2 instances to control inbound and outbound traffic. | All user data for EC2 instances must be passed securely using AWS Secrets Manager. | The CloudFormation template must enforce Multi-Factor Authentication (MFA) for user access. | Audit logging must be enabled for all services via AWS CloudTrail. | Define alarms for security incidents using AWS CloudWatch. | Ensure that no resource has a public IP unless explicitly required. | Protect the CloudFormation template using Stack Policies to prevent accidental changes.

Environment:

Design a CloudFormation template in YAML to set up a secure AWS environment that adheres to the following requirements: 1. Define a Virtual Private Cloud (VPC) to isolate network resources. 2. Deploy secure IAM roles and policies ensuring the principle of least privilege. 3. Use AWS KMS for encryption of all sensitive data at rest. 4. Configure AWS Lambda functions to be deployed from S3 with appropriate access configurations. 5. Ensure all EC2 instances only allow inbound and outbound traffic specified by security groups. 6. Securely manage EC2 instance user data using AWS Secrets Manager. 7. Enable audit logging for all AWS services via AWS CloudTrail. 8. Implement alarms for security incidents using AWS CloudWatch. 9. Require MFA for all user accesses to the environment. 10. Strictly manage public IP allocation to only those resources where it's absolutely necessary. 11. Protect the CloudFormation stack with stack policies to prevent unintended changes. 12. The solution should pass all security audit tests.  
Expected Output: The solution should be implemented as a YAML CloudFormation template named `secure-cloudformation-template.yaml`. Ensure that the implemented template passes all the security checks and constraints specified above.

It should include this metadata:
Metadata:
AWS::CloudFormation::Interface:
ParameterGroups: - Label:
default: 'Environment Configuration'
Parameters: - EnvironmentSuffix

and this Parameter:
Parameters:
EnvironmentSuffix:
Type: String
Default: 'dev'
Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
AllowedPattern: '^[a-zA-Z0-9]+$'
ConstraintDescription: 'Must contain only alphanumeric characters'

and include them in the code as well

Proposed Statement:

The infrastructure will be provisioned in AWS Region us-east-1, leveraging AWS services such as IAM, KMS, VPC, EC2, Lambda, S3, CloudTrail, and CloudWatch. All resources should be secured according to the given constraints and security best practices.
