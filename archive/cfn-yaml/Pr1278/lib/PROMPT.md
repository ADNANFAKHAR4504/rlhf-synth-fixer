Create a CloudFormation template in YAML that provisions a secure and compliant AWS production environment in the us-east-1 region.

The stack must include EC2, S3, RDS, Elasticsearch, Lambda, IAM, CloudWatch, and Parameter Store, and it must align with AWS security best practices.

Requirements:

Intrinsic Functions

Use CloudFormation intrinsic functions (!Ref, !Sub, !GetAtt, etc.) for dynamic, modular configurations.

IAM Policies

Follow the principle of least privilege.

Use AWS managed policies where possible.

Tagging

Apply the tag Environment: Production to all resources.

Networking & Security

Create security groups that allow SSH (port 22) and HTTP (port 80) only from specific CIDR IP ranges (to be parameterized).

EC2 Instances

Use the latest Amazon Linux 2 AMI (fetched dynamically).

Enable detailed CloudWatch monitoring.

S3 Buckets

Enable server-side encryption (AES-256).

RDS

Deploy a Multi-AZ RDS instance.

Elasticsearch

Enable fine-grained access control.

Sensitive Data

Store secrets (e.g., DB credentials) in AWS Parameter Store (SecureString).

Lambda Functions

Set reserved concurrency limits.

Compliance

Template must pass AWS CloudFormation JSON schema validation.

Must be ready to deploy without modification.

Output:
A complete YAML CloudFormation template that implements all the above, using parameters and intrinsic functions wherever possible.