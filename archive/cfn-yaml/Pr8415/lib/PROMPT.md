Please write IAC code in cloudformation yaml using the data given below:

Contraints:

SSL/TLS should be enforced on all your endpoints. | IAM User credential exposure must be minimized by utilizing roles where possible. | All data at rest must be encrypted using KMS. | Resources must adhere to your organization's tagging policy, including 'Environment', 'Project', and 'Owner' tags. | Ensure usage of private subnets for your database instances and deny public access.

Environment:

Design and implement a CloudFormation template in YAML to set up a secure AWS infrastructure environment. Your configuration must: 1. Enforce SSL/TLS on all endpoints, ensuring encrypted data transmission. 2. Use IAM roles to minimize long-term IAM user credential exposure and adhere to the principle of least privilege. 3. Encrypt all data at rest using AWS Key Management Service (KMS). 4. Adhere to your organization's tagging policy by including 'Environment', 'Project', and 'Owner' tags on all resources. 5. Deploy resources such that database instances are in private subnets, disallowing any form of public access.

Expected output: A validated YAML CloudFormation template incorporating all security features and constraints. Ensure that the template passes an AWS CloudFormation linter without errors and adheres to all constraints listed above. Submit the YAML file named 'secure_infra_setup.yaml'.
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

You are tasked with setting up a secure infrastructure environment using AWS CloudFormation for a web application. The infrastructure includes resources spanning VPCs, subnets, EC2 instances, RDS databases, and S3 buckets, all hosted within a specified AWS region. Follow organizational security standards and best practices as outlined in the constraints.
