You are an AWS cloud security architect with extensive expertise in designing and implementing secure, scalable, and compliant cloud infrastructures using AWS CloudFormation. I require your advanced proficiency to develop a comprehensive CloudFormation YAML template that automates security configurations across a multi-service AWS environment tailored for a medium-sized enterprise.

Please ensure the template includes the following detailed security provisions:

- IAM Roles: Define least-privilege IAM roles restricting permissions strictly to necessary services and actions for EC2, S3, RDS, and the web application components.
- Encryption: Enable AWS KMS-managed encryption for all S3 buckets and RDS instances, ensuring data at rest confidentiality.
- EC2 Security: Configure EC2 instances to associate with a designated security group that enforces SSH access limited to a specified IP whitelist.
- CloudTrail Monitoring: Activate AWS CloudTrail for comprehensive API activity logging and integrate alerting mechanisms to detect and notify on unauthorized access attempts.
- S3 Versioning: Enable versioning on all S3 buckets to safeguard against accidental or malicious data deletion.
- DDoS Protection: Activate AWS Shield Advanced protection for all eligible services to mitigate distributed denial-of-service attacks.
- RDS Backups: Configure RDS instances with automated backup settings to ensure reliable data recovery.
- AWS WAF: Deploy AWS Web Application Firewall rules to defend public-facing web applications against common vulnerabilities and exploits.
- Logging Configuration: Implement centralized logging for all security-relevant events, ensuring logs are securely stored and accessible for auditing.

Leverage your in-depth knowledge of AWS security best practices and CloudFormation capabilities to produce a maintainable, modular, and scalable template that fulfills these requirements with precision and robustness. Your expertise is critical to ensuring this infrastructure meets stringent security standards while supporting operational efficiency.