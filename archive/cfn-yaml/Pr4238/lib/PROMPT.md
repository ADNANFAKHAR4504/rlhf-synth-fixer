Our security team has mandated a comprehensive infrastructure refresh. This template will serve as the secure-by-design blueprint for all future deployments, enforcing stringent security controls and AWS best practices by default.

Your solution must be engineered to fulfill the following objectives:

1: Data Encryption at Rest: Ensure all stored data, across all services (specifically S3 and RDS), is encrypted using customer-managed keys (CMK) from AWS KMS, removing reliance on default AWS-managed keys.

2: Network Segmentation & Isolation: Architect a secure VPC that logically isolates resources. Public-facing services must be segregated from private application and data layers, with traffic governed by minimal, least-privilege security group rules.

3: Identity & Access Least Privilege: Implement a robust IAM framework where all human and machine identities operate on the principle of least privilege. Enforce multi-factor authentication (MFA) for all IAM users and mandate automatic credential rotation for access keys.

4: Comprehensive Auditing & Monitoring: Establish a non-repudiable audit trail by enabling AWS CloudTrail and ensuring all logs are securely stored and immutable. Extend logging to all relevant application components.

5: Application & Database Hardening: Deploy database instances (RDS) with encryption at rest enabled and secure configurations. Protect public-facing applications with AWS WAF and ensure all client connections are secured with SSL/TLS termination using certificates from AWS Certificate Manager (ACM).

so you're main task is to design and validate a production-grade AWS CloudFormation template that establishes a secure, compliant, and well-architected foundation for a new enterprise application in the us-east-1 region and the file name should be infrastructure-security-setup.yml.

All resources must adhere to the corp--<resource-type>-enterpriseapp pattern (e.g., corp-s3-enterpriseapp-logs, corp-vpc-enterpriseapp).

The template will be evaluated against the following criteria:

1: Functional Completeness: Does the deployed stack successfully fulfill all security objectives (O1-O5)?

2: AWS Best Practices: Does the architecture adhere to the AWS Well-Architected Framework, particularly the Security and Reliability pillars?

3: Production Resilience: Is the template robust, with appropriate error handling, DependsOn attributes, and conditional logic (AWS::NoValue)?

4: Operational Excellence: Does the template include necessary Parameters for configurability and Outputs for easy discovery of critical resource IDs and endpoints? Are all resources appropriately tagged for cost and management?

5: Policy Compliance: Does the final infrastructure state demonstrably comply with all security constraints listed in the original mandate?

you should prioritize security and compliance over cost, but implement cost-optimized resource configurations where possible without compromising the primary objectives.

also the template should be self-documenting and have to use Metadata and Description fields to clarify the purpose of complex resources.

when you design, design with idempotency and reusability in mind, allowing this secure foundation to be reliably replicated across environments.