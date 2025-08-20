CloudFormation Template Requirements: Secure AWS Infrastructure
Please provide a detailed CloudFormation template in YAML format that provisions a secure AWS infrastructure configuration suitable for production environments. The template must satisfy the following requirements:

1. Compute Resources
   EC2 Instances: Deploy instances within a Virtual Private Cloud (VPC).

Instances must be associated with a security group that only allows SSH access from a specified IP range.

2. Identity and Access Management
   IAM Roles: Attach IAM roles to the EC2 instances.

These roles must adhere to the principle of least privilege, granting only the minimal permissions required for the instances to perform their functions.

3. Storage
   Secure S3 Buckets: Provision S3 buckets with the following security features:

Encryption enabled for data at rest.

Versioning activated to prevent data loss.

4. Auditing and Monitoring
   CloudTrail Setup: Configure CloudTrail to monitor API calls and user activities across your AWS account for auditing purposes.

5. Tagging
   Resource Tagging: All resources provisioned by this template must be appropriately tagged with:

Key: Environment

Value: Production

Expected Output
A valid YAML file named secure_infrastructure.yaml.

When applied, this template must create the specified infrastructure, adhering to all listed constraints.

The solution must be designed to pass tests validating the creation of secure, encrypted, and restricted-access configurations for all components.
