## Prompt

Create a CloudFormation template in YAML that sets up the security configuration for a web application running on AWS. The template must satisfy the following requirements:

1. **S3 Encryption with KMS** 
- Provision an Amazon S3 bucket dedicated to application data.
- Use AWS Key Management Service (KMS) to encrypt all objects stored in the bucket.
- Define a custom KMS key (not the default AWS-managed key) for encryption.

2. **API Gateway Logging** 
- Set up an API Gateway (REST or HTTP) with logging enabled for all endpoints.
- Ensure access logs are sent to Amazon CloudWatch Logs.
- Log format should include request ID, caller IP, HTTP method, and status code.

3. **IAM Roles with Least Privilege** 
- Define IAM roles required by the application services (e.g., Lambda, API Gateway).
- Apply the principle of least privilege: grant only the permissions necessary for each roles function.
- Include inline or managed policies that restrict actions to specific resources.

4. **VPC Configuration** 
- Create a Virtual Private Cloud (VPC) with a CIDR block of `10.0.0.0/16`.
- Include at least two subnets with non-overlapping CIDR blocks within the VPC.
- Align subnet CIDRs with internal IP range conventions.

5. **Security Group Configuration** 
- Define security groups to allow HTTPS (TCP port 443) traffic only.
- Ensure HTTP (TCP port 80) is explicitly denied or not allowed.
- Restrict inbound access to specific ports as needed for the application.

### Output Requirements

- Provide a single YAML-formatted CloudFormation template.
- Ensure the template is syntactically valid and passes CloudFormation validation checks.
- All resources must follow best practices for security and AWS architecture.
