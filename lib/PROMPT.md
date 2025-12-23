### Secure AWS S3 Configuration with Python CDK

Hey team, we're shifting gears on our secure configuration project. Instead of a CloudFormation YAML template, we'll be using Python and the AWS Cloud Development Kit (CDK) to define our infrastructure. This approach will give us more flexibility and allow us to use familiar programming concepts.

Your task is to create a Python CDK application that sets up a secure IAM role for interacting with AWS S3. This is a critical piece of our infrastructure, so it needs to follow our security best practices.

### Requirements

Here's what the solution needs to do:

* **IAM Role and Least Privilege:** Create an IAM Role that Lambda functions can assume. The role must have a customer-managed policy that grants minimal S3 permissions - specifically `s3:GetObject` for reading objects and `s3:ListBucket` for listing, but scoped to a specific S3 bucket prefix. The policy should use conditions to restrict access to only `apps/tap/*` prefix.

* **Service Integration:** The IAM role uses an AssumeRole policy allowing AWS Lambda service to assume it. Lambda functions will use this role to securely read objects from S3 without needing hardcoded credentials.

* **Tagging:** All resources including the IAM Role and its managed policy must be tagged with `Environment: Production` and `Owner: DevOps` for proper resource tracking.

* **Security:** Follow AWS security best practices - use least-privilege IAM policies with specific resource ARNs and conditions rather than wildcard permissions.

### Technical Specifications

* **Language:** Python
* **Framework:** AWS CDK
* **Environment:** Design for `us-east-1` region

### Deliverable

Please submit a complete Python CDK project including the main application file (e.g., `app.py`) and the stack definition file (e.g., `s3_stack.py`). The project should be ready to deploy with `cdk synth` and `cdk deploy`.
