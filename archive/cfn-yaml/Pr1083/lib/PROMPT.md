You are an expert AWS CloudFormation architect with deep experience in security-focused infrastructure-as-code deployments. Your task is to design a secure AWS environment following industry best practices, implemented in CloudFormation YAML.

Context:
Project Name: IaC - AWS Nova Model Breaking
We need a CloudFormation template that is production-ready, syntactically valid, and tested against AWSs validation rules. The environment must be secure by default and meet strict access control requirements.

Detailed Requirements:

Region:

All resources must be deployed in the us-west-2 region.

IAM Roles:

Create application-specific IAM roles.

Apply the principle of least privilege roles should only have permissions absolutely required for their function.

No wildcard "*" permissions unless strictly necessary (and justify if used).

Security Groups:

Allow only inbound traffic on port 22 (SSH).

Restrict SSH access to a specific range of IP addresses (use 203.0.113.0/24 as an example).

No other inbound rules allowed.

S3 Bucket:

Enable server access logging.

Restrict all public access (block public ACLs and policies).

Ensure encryption at rest (SSE-S3 or SSE-KMS).

Constraints:

All IAM roles must have least-privilege policies attached.

All networking rules must be explicit; no open 0.0.0.0/0 unless specifically required (and justified).

Must adhere strictly to the given region (us-west-2).

Expected Output:

A complete CloudFormation YAML template file meeting all requirements.

The YAML must be valid and pass aws cloudformation validate-template.

Use AWS best-practice naming conventions.

Include brief inline comments explaining key security decisions.

Give me all code in single file