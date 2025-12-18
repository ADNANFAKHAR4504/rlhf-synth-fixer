### Prompt for Claude Sonnet

Prompt Title: Secure AWS Infrastructure with CloudFormation

1. Role and Context:

You are an expert AWS Solutions Architect specializing in secure infrastructure design. Your task is to generate a complete AWS CloudFormation template and a detailed README file for a secure, multi-component infrastructure. The solution must be production-ready and adhere to all specified security best practices. The infrastructure should be deployed in the `us-east-1` region.

2. Overall Goal:

Design and manage a highly secure infrastructure environment on AWS using CloudFormation YAML. This environment will host a web application and its data, with a strong emphasis on data encryption, least-privilege access, and robust access logging and monitoring.

3. Required Tools and Technologies:

The entire infrastructure must be defined in a single AWS CloudFormation YAML template named `secure_infrastructure.yaml`.

4. Infrastructure Requirements:

- VPC: Create a new VPC with a single public subnet to host the EC2 instance.
- EC2 Instances:
  - Deploy a single EC2 instance in the public subnet.
  - The instance should use the latest Amazon Linux 2 AMI and a `t2.micro` instance type.
  - The EBS root volume attached to this instance must be encrypted.
- Data Storage Solutions:
  - Create three S3 buckets for different purposes: `website-content`, `application-logs`, and `backup-data`.
  - Ensure all data stored in these buckets is encrypted at rest using AWS KMS (Key Management Service) with an automatically generated key.
- IAM Roles:
  - Create a specific IAM Role for the EC2 instance. This role must follow the principle of least privilege.
  - The IAM Role's policy should grant permissions only for what is necessary, specifically:
    - Read-only access to the `website-content` S3 bucket.
    - Write access (uploading objects) to the `application-logs` S3 bucket.
- Security Groups:
  - Create a Security Group for the EC2 instance.
  - The Security Group must only allow inbound SSH traffic (port 22) from a specified CIDR block `[Your Public IP Address]/32` for management purposes.

5. Resource Connection and Security Policies (The Most Important Part):

- EC2 to S3: The EC2 instance must be able to interact with the S3 buckets.
  - The IAM Role created for the EC2 instance must be attached to the instance profile.
  - The S3 bucket policies must be written to explicitly allow the IAM Role attached to the EC2 instance to perform the permitted actions (read from `website-content`, write to `application-logs`). This ensures that the buckets are not publicly accessible and that access is strictly controlled via the IAM role.
- S3 Access Controls & Logging:
  - For all three S3 buckets, enforce strict access controls.
  - Implement bucket policies on each bucket to prevent public access.
  - Enable S3 Access Logging for each of the three buckets. The logs should be stored in a separate, dedicated S3 bucket named `s3-access-logs-[unique-id]`.
- Encryption Enforcement:
  - Ensure the EBS volume of the EC2 instance has encryption enabled.
  - Ensure the S3 buckets have server-side encryption with an automatically generated KMS key enabled by default for all new objects.

6. Expected Output:

Provide two separate blocks of output:

1.  A complete, well-commented YAML CloudFormation template named `secure_infrastructure.yaml`. The template should include all the resources and their configurations as specified above.
2.  A detailed `README.md` file that explains:
    - The purpose of the infrastructure.
    - The design choices made to ensure security (encryption, least-privilege, access controls).
    - A breakdown of how the CloudFormation template fulfills each requirement, with specific references to the template's resources (e.g., "The `EC2InstanceRole` IAM role is attached to the instance via the `InstanceProfile` property...").
    - Steps for deployment and validation, including how to verify that the security controls are correctly in place after deployment.
