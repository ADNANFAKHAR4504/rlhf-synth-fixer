You are asked to implement a CDK for Terraform (CDKTF) TypeScript project that synthesizes Terraform code to deploy an AWS environment meeting the following exact requirements.

PROJECT STRUCTURE & RULES
1. Create exactly two TypeScript files under `lib/`:
- `lib/modules.ts` contains **all** reusable module classes (no other file should define classes or components).
- `lib/tap-stack.ts` the root stack which composes/instantiates the module classes from `lib/modules.ts`, wires outputs and variables, and contains no module class definitions.
2. The code must be TypeScript for CDKTF and compile with `strict: true`. Use CDKTF constructs and the official AWS provider.
3. Do not create any other application-level files that contain resource code or classes (helper functions are allowed inside these two files only).
4. Make the implementation production-grade: typed inputs, default values, input validation where appropriate, clear names and tags.
5. The generated project must be compatible with Terraform version **0.14 or higher** (explicitly set in `required_version` in the synthesized Terraform when appropriate).

INFRA REQUIREMENTS (exact)
- Region: `us-west-2`.
- Use the official AWS provider.
- Use the latest Amazon Linux 2 AMI available in `us-west-2` (the code should look up the latest AMI, not hardcode an AMI id).
- Launch a single EC2 instance (t2.micro default, overridable via variables).
- Create an S3 bucket for application data with **versioning enabled**.
- Create an IAM role / instance profile for EC2 that grants the EC2 instance read/write permissions to the S3 bucket.
- Apply tags to all resources: at minimum `Environment` and `Owner` (values passed in via variables).
- Use Terraform remote state backend that stores state in S3 **and** uses DynamoDB for state locking (provide configuration via variables for bucket name, key/prefix, and DynamoDB table).
- All defaults must be overridable via input variables (AMI lookup filters, instance type, ssh cidr, bucket name, environment, owner, tags map, region, instance key name, etc.).
- Expose the EC2 instance's **public IP** as a Terraform / CDKTF output.

MODULAR DESIGN & NAMES
- In `lib/modules.ts` implement modular classes. At minimum include (but not limited to) these classes:
- `VpcModule` creates VPC, subnet, route table, internet gateway, and necessary associations.
- `S3Module` creates versioned S3 bucket and related lifecycle rules if applicable.
- `IamModule` creates IAM role, IAM policy allowing `s3:GetObject`, `s3:PutObject`, `s3:ListBucket` on the S3 bucket, and an instance profile.
- `SecurityModule` creates security group allowing SSH ingress from `ssh_cidr` variable and egress as required.
- `Ec2Module` launches the EC2 instance, attaches the IAM instance profile, attaches the security group, places it in the subnet, and looks up the Amazon Linux 2 AMI dynamically.
- Each module class should receive typed constructor arguments (interfaces) to accept variables and return whatever is needed by consumers (IDs, ARNs, bucket name, instance public IP).
- Keep dependencies explicit e.g., `Ec2Module` should accept the subnet id, security group id, IAM instance profile name, S3 bucket arn/name (if needed), and tagging map.

VARIABLES & OVERRIDES
- All sensible defaults must be provided, but every default should be overridable via typed input variables at the root `tap-stack.ts` level. Provide clear variable names and descriptions.
- Example variable set (not exhaustive): `region`, `environment`, `owner`, `ssh_cidr`, `instance_type`, `instance_key_name`, `s3_bucket_name`, `state_bucket`, `state_key`, `tags` (map).

DELIVERABLE FORMAT
- Provide **only** the complete content of `lib/modules.ts` and `lib/tap-stack.ts` (two files). Do not output other files or additional prose except short header comments inside the files.
- Ensure the files are self-consistent: class names used in `tap-stack.ts` must match the classes exported from `modules.ts`.
- Use modern TypeScript syntax and idiomatic CDKTF patterns.