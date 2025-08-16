I have an existing CDK for Terraform (CDKTF) TypeScript project with the following folder structure:

swift
Copy
Edit
/bin/tap.ts // entry point for the application  
/lib/tapstack.ts // main stack definition file  
/test/ // test folder for stack/unit tests  
The project name is "IaC - AWS Nova Model Breaking".

I want you to generate TypeScript CDKTF code implementing the following AWS infrastructure in the tapstack.ts file, using bin/tap.ts as the entry point and keeping all the best practices for CDKTF and TypeScript:

Requirements:

VPC with public and private subnets across multiple availability zones.

EC2 instance in a private subnet:

No public IP.

Accessible only through a bastion host in the public subnet.

Ensure EC2 launches with the latest security patches (e.g., latest AMI).

IAM Policies with least privilege access for users and roles.

Enable MFA for all IAM users.

Audit and remove unused IAM roles and policies.

AWS Lambda functions behind an API Gateway with strict access logging enabled.

RDS database instance:

Backups enabled.

Enhanced monitoring enabled.

No public access.

S3 Buckets:

Encryption at rest enabled by default (using AWS KMS).

Public access blocked at bucket and account level.

AWS WAF in front of API Gateway for malicious traffic filtering.

KMS for encryption key management across services.

Security Groups and NACLs configured with least privilege principles for all resources.

Constraints:

Exclude AWS Config Rules.

Exclude AWS CloudTrail.

Follow CDKTF TypeScript idioms (constructs, stack outputs, environment configuration).

Separate bin/tap.ts for app entry and lib/tapstack.ts for stack logic.

Write tests in /test folder for validating security settings (e.g., S3 encryption, RDS public access disabled, IAM MFA enabled).

Output:

Provide only the TypeScript code for bin/tap.ts, lib/tapstack.ts, & sample tests under /test.

Ensure the generated stack deploys in us-east-1.

Use descriptive a resource naming with the environment name included.

Follow Pulumi/HashiCorp AWS provider best practices for CDKTF.
