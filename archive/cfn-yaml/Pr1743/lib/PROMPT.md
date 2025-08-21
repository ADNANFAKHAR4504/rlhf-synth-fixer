You are tasked with designing a secure cloud infrastructure using AWS CloudFormation in YAML format. The architecture must follow the latest security best practices to protect sensitive data and ensure operational integrity.

Your design should meet the following requirements:

    1.	All infrastructure components must be defined using CloudFormation.
    2.	Encryption at rest must be enabled for Amazon S3, Amazon RDS, and Amazon EBS.
    3.	IAM roles and policies should follow the principle of least privilege, granting only the minimum permissions necessary.
    4.	Monitoring and logging must be implemented through Amazon CloudWatch to capture and audit activities.
    5.	Multi-Factor Authentication (MFA) must be enforced for all IAM users.
    6.	All resources must be provisioned within the us-west-2 region.
    7.	AWS Key Management Service (KMS) must be used to manage encryption keys across all applicable services.

Expected Output:
Provide a valid CloudFormation YAML template that implements the above requirements. The template should be ready to deploy in AWS and conform to security best practices.
