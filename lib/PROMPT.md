Produce a single CloudFormation YAML template implementing a secure, compliant environment. Do not modify or paraphrase any of the provided input blocks below—use them as authoritative requirements.
project structure:
└── lib/
        └── tapstack.yaml # Main stack definition

Environment: You are tasked with setting up a secure infrastructure for a web application using AWS CloudFormation. The environment requires a complex security configuration due to compliance requirements. Your tasks include: 1. Use AWS CloudFormation to define the security configuration; 2. Ensure all IAM roles have the least privilege necessary; 3. Enable logging for all AWS services used in the stack; 4. Create an S3 bucket with versioning and server-side encryption enabled; 5. Configure VPC with at least two public and two private subnets; 6. Ensure Security Groups allow only necessary inbound/outbound traffic; 7. Implement an AWS IAM Policy that restricts users from deleting CloudTrail logs; 8. Set up AWS Config to monitor changes in security settings; 9. Enable AWS Security Hub for the account to gather security insights; 10. Define a KMS key policy that grants access only to necessary services and roles; 11. Use CloudFormation Parameter Store to manage sensitive configuration values; 12. Include CloudWatch Alarms for monitoring unauthorized access attempts; 13. Ensure all Lambda functions have execution roles defined.\nExpected output: A YAML CloudFormation template implementing all of the above security configurations. The template should validate successfully with AWS CloudFormation, and all implemented features should positively affect the security posture of the environment. Include test cases to ensure compliance and the effectiveness of security settings.

Constraints Items: Use AWS CloudFormation to define the security configuration. | Ensure all IAM roles have the least privilege necessary. | Enable logging for all AWS services used in the stack. | Create an S3 bucket with versioning and server-side encryption enabled. | Configure VPC with at least two public and two private subnets. | Ensure Security Groups allow only necessary inbound/outbound traffic. | Implement an AWS IAM Policy that restricts users from deleting CloudTrail logs. | Set up AWS Config to monitor changes in security settings. | Enable AWS Security Hub for the account to gather security insights. | Define a KMS key policy that grants access only to necessary services and roles. | Use CloudFormation Parameter Store to manage sensitive configuration values. | Include CloudWatch Alarms for monitoring unauthorized access attempts. | Ensure all Lambda functions have execution roles defined.

Proposed Statement: The infrastructure will be deployed in the us-west-2 region. All resources should follow the naming convention of <resource-type>-<project-name>-<environment>. Use AWS CloudFormation templates written in YAML format.

What to Generate
1) Output Files & Format

Produce exactly one file in your response:

lib/tapstack.yaml as a single fenced YAML code block.

YAML must be valid CloudFormation (use AWSTemplateFormatVersion, Description, Parameters, Mappings (if needed), Conditions, Resources, Outputs).

No placeholders like “TBD”; provide sensible, secure defaults and parameters where appropriate.

2) Required Resources & Config (map directly to the inputs)

Implement the following (minimum):

Region & Naming

Target region: us-west-2.

Global tagging and naming convention: <resource-type>-<project-name>-<environment>.

Introduce Parameters for ProjectName, Environment, VPC CIDR, subnet CIDRs, and KMS key aliases.

Networking

One VPC with:

At least two public and two private subnets across two AZs.

NAT Gateway(s) for outbound access from private subnets.

Route tables, associations, and VPC Flow Logs to a logs bucket or CloudWatch Logs (logging enabled).

S3 (Logging & Data)

S3 bucket with versioning and server-side encryption (KMS).

Block public access, secure bucket policy, access logging (if using a separate logs bucket, create it).

Enforce TLS (aws:SecureTransport deny).

KMS

Customer-managed KMS key and key policy granting access only to required services/roles.

Aliases, rotation enabled.

IAM (Least Privilege)

Execution roles for all Lambda functions with minimal permissions.

IAM policy that prevents deletion of CloudTrail logs (e.g., deny on s3:DeleteObject for the CloudTrail log bucket, with appropriate conditions).

Logging & Monitoring

CloudTrail (organization or account trail) delivering to encrypted S3.

CloudWatch Logs enabled for services (e.g., Lambda).

CloudWatch Alarms for unauthorized access attempts (e.g., metric filters on CloudTrail ConsoleLogin failures, UnauthorizedOperation, AccessDenied).

AWS Config

AWS Config recorder, delivery channel, and a representative set of managed rules to track security posture (e.g., IAM least privilege, S3 encryption, CloudTrail enabled, SG restricted).

AWS Security Hub

Enable Security Hub and at least the Foundational Security Best Practices standard.

Parameter Store (SSM)

Secure parameters (e.g., /project/env/app/DB_PASSWORD as SecureString referencing KMS key).

Do not echo secrets in Outputs.

Lambda (if any)

At least one example Lambda function with:

Execution role (least privilege).

Logging configuration to CloudWatch Logs.

Environment variables sourced from Parameter Store via dynamic references where applicable.

Security Groups

Inbound/Outbound restricted to necessary ports (e.g., allow HTTPS from specific CIDR, restrict egress where possible).

3) Parameters, Conditions, and Outputs

Parameters: ProjectName, Environment, VpcCidr, PublicSubnetCidrs, PrivateSubnetCidrs, AllowedIngressCidr, KmsKeyAdminArn, KmsKeyUserArns (List), etc.

Conditions: optional flags for creating NAT in single vs. multi-AZ.

Outputs: VPC ID, subnet IDs, KMS Key ARN, CloudTrail Trail ARN, S3 bucket names, Security Hub status, Config Recorder name.

4) Security Defaults & Policies

Deny insecure transport on S3.

S3 bucket policy to explicitly deny deletion of CloudTrail logs.

KMS key policy: scope to admins and required service principals (CloudTrail, S3, Logs), and to Lambda execution roles (minimal actions).

Enable log retention on CloudWatch Log Groups.