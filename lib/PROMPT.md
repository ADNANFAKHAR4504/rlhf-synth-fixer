Create a complete, validated, and deployable YAML CloudFormation template that establishes a foundational, secure AWS environment in the us-east-1 region for a sensitive workload (e.g., in finance or healthcare).

Objective: Create a template named SecureEnv.yaml that rigorously implements security best practices as code. The environment must be built to the exacting standards required for regulatory compliance.

Core Requirements & Constraints: Your solution must meticulously adhere to the following 16 specific security mandates. The template will be evaluated against each one:

Least Privilege IAM: All created IAM Roles must have policies granting the minimum permissions necessary for their specific function.
Managed Policies: Prefer and utilize AWS Managed Policies (e.g., AmazonS3ReadOnlyAccess) over custom inline policies where a suitable managed policy exists.
EC2 in VPC: All provisioned EC2 instances must be deployed within the created VPC and subnets.
EBS Encryption: Enable encryption for all Elastic Block Store (EBS) volumes attached to any EC2 instances.
RDS High Availability: Any Relational Database Service (RDS) instances must be deployed in a Multi-AZ configuration for fault tolerance.
S3 Default Encryption: All S3 buckets must have default encryption enabled (SSE-S3 is acceptable for this task).
TLS for In-Transit Data: Ensure all services that support it (e.g., Application Load Balancer, API Gateway) are configured to use TLS 1.2 or higher.
CloudWatch Alarms: Define meaningful CloudWatch Alarms for critical resources (e.g., CPU utilization on EC2, Database connections on RDS).
S3 Versioning: Enable versioning on all S3 buckets to protect against accidental overwrites and deletions.
ELB Access Logging: Configure access logging for any Elastic Load Balancers created.
Lambda in VPC: Any AWS Lambda functions must be configured to execute within the VPC.
RDS Public Access: Explicitly ensure RDS instances are not publicly accessible.
Minimal Security Groups: All Security Groups must be defined with the most restrictive rules possible (e.g., specific ports and CIDR ranges only).
GuardDuty: Implement and enable Amazon GuardDuty for threat detection.
RDS Backups: Ensure RDS instances have automatic backups enabled with a reasonable retention period (e.g., 7 days).
API Gateway Logging: Enable full execution logging for all API Gateway requests.
Naming & Technical Specifications:

Filename: The output must be a single file named SecureEnv.yaml.
Resource Naming: All resources must use the prefix SecureEnv (e.g., SecureEnvVPC, SecureEnvDataBucket).
AWS Account: Use the placeholder account ID 123456789012 in any resource ARNs if needed.
Region: The template must target the us-east-1 region.
Validation: The final YAML must be syntactically correct and pass a aws cloudformation validate-template check.
Deliverable: Provide the complete, self-contained YAML code for the SecureEnv.yaml CloudFormation template. The template should create a cohesive environment, including at a minimum: a VPC with public and private subnets, an example EC2 instance, an S3 bucket, and demonstrate the implementation of the security constraints listed above. Do not include any explanatory text outside of the YAML code itself.