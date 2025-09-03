You are an expert AWS Solutions Architect and Infrastructure-as-Code engineer specializing in cloud security and compliance. Your task is to design and implement a highly secure, compliant, and resilient enterprise AWS environment using AWS CDK. Carefully follow all instructions and constraints, and output only the final, production-ready AWS CDK code (TypeScript or Python preferred), with clear comments. Do not include explanations or extra commentaryoutput only the code.

**Constraints:**
- Use AWS IAM roles and policies to enforce least-privileged access for all users and services.
- All S3 buckets must be encrypted with AES-256 (SSE-S3 or SSE-KMS); ensure encryption for data in transit as well.
- Use AWS CloudWatch for comprehensive logging and monitoring; configure alarms for any suspicious or security-related activities.
- Design a VPC with public and private subnets; ensure all databases are placed exclusively in private subnets and are not publicly accessible.
- Enable Multi-Factor Authentication (MFA) for all users accessing sensitive resources.
- Detect and rotate all access keys every 90 days, and ensure they are encrypted at rest.
- Deploy infrastructure across at least three availability zones for high availability.
- Use AWS KMS for managing encryption at rest for all relevant resources.
- Deploy AWS WAF to protect web applications from common vulnerabilities.
- Ensure automatic backups are enabled for all server and database volumes.
- Use AWS Secrets Manager for managing all sensitive data such as API keys and passwords.

**Problem:**
Design and implement an advanced, production-grade security configuration strategy using AWS CDK that enforces strict security practices for access control, data encryption, and threat detection, as described above. Your solution must:

1. Implement IAM roles/policies for least-privileged access.
2. Encrypt all S3 buckets with AES-256, for data at rest and in transit.
3. Use CloudWatch for monitoring/logging and trigger alarms for security breaches.
4. Design a VPC with public/private subnets; host databases only in private subnets, with no public access.
5. Require MFA for sensitive resource access and enforce regular, encrypted key rotation.
6. Deploy WAF for web app protection and rotate keys automatically every 90 days.
7. Use at least three availability zones for all deployments.
8. Manage encryption at rest with AWS KMS and sensitive data with Secrets Manager.

**Expected output:** Output the complete AWS CDK code that, when deployed, configures this infrastructure according to all provided requirements. The solution must be comprehensive, pass all security and compliance tests, and reflect AWS best practices for enterprise security.

**Environment:** 
The infrastructure is hosted on AWS, utilizing S3, IAM, EC2, RDS, CloudWatch, VPC, WAF, KMS, Secrets Manager, and spanning at least three availability zones.

**Instructions:**
- Output only the final AWS CDK code with in-line comments (no explanations or extra prose).
- All code should adhere to AWS and security best practices.
- Include all necessary constructs, policies, and configurations to satisfy every requirement above.
- Ensure the code is ready for direct deployment and passes all provided tests and security checks.