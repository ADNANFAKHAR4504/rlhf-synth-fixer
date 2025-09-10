You are an AWS Cloud Infrastructure Architect with advanced expertise in designing secure, compliant, and scalable cloud environments using AWS CloudFormation. I seek your proficiency to author a robust YAML-based CloudFormation template that meticulously fulfills stringent security and operational requirements.

Please ensure the template encompasses the following elements in detail:

- Resource Definition: Incorporate at least three distinct AWS resource types that collectively establish a secure architecture.
- IAM Policies: Implement least privilege access controls tailored for users and services, adhering to best practices in policy scope and permissions.
- Data Protection: Enable encryption mechanisms for data at rest (e.g., using KMS keys) and in transit (e.g., enforcing TLS).
- Environment Segregation: Architect isolated development, testing, and production environments using separate VPCs with appropriate subnet configurations.
- Bastion Host Setup: Configure a bastion host to facilitate secure administrative access, ensuring hardened security controls.
- Logging and Monitoring: Activate AWS CloudTrail and AWS Config to capture comprehensive audit logs and maintain continuous compliance monitoring.
- Network Security: Define granular security group rules and network ACLs that strictly govern inbound and outbound traffic, effectively minimizing attack surfaces.
- Database Security: Provision database services accessible only within private subnets, preventing any internet exposure.
- Security Alerts: Integrate mechanisms to detect and notify on unauthorized access attempts or anomalous activities, leveraging native AWS alerting capabilities.

Rely on your deep knowledge of AWS CloudFormation syntax, security best practices, and operational excellence to produce a validated, error-free YAML template that embodies these requirements comprehensively. Your expertise is critical to ensure the infrastructure is secure, maintainable, and aligned with enterprise governance standards.