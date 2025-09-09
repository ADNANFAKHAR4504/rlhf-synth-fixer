ROLE: You are a senior Terraform engineer specializing in enterprise security infrastructure.

CONTEXT:
We are implementing project #166 from Batch 004 for the "IaC - AWS Nova Model Breaking" initiative. The objective is to create a comprehensive, enterprise-grade secure infrastructure using Terraform HCL that meets the strictest corporate security audit requirements. This will serve as our reference architecture for secure enterprise applications handling sensitive data in production environments.

CONSTRAINTS:

- Region: us-east-1 (primary deployment)
- Infrastructure must implement defense-in-depth security architecture
- All components must follow security best practices and corporate compliance requirements
- Production-ready with high availability and fault tolerance
- Security-first approach with no compromises on security controls
- Must pass enterprise security audits and continuous compliance monitoring

DELIVERABLES:

1. provider.tf (Terraform providers, backend configuration)
2. variables.tf (security policies, compliance settings, environment variables)
3. tap_stack.tf (main infrastructure resources)
4. outputs.tf (security resource references, endpoints, compliance outputs)

SECURITY REQUIREMENTS:

1. Identity & Access Management

- AWS IAM with comprehensive user permission management
- Strict access restrictions using principle of least privilege
- Role-based access control for service-to-service communication
- IAM policies enforcing granular access controls

2. Data Protection & Encryption

- S3 encryption at rest using SSE-S3 for all stored data
- RDS encryption at rest using AWS KMS
- HTTPS-only traffic access (HTTP completely blocked)
- End-to-end encryption for data in transit

3. Network Security & Isolation

- VPC with proper public/private subnet isolation
- SSH access restrictions via security groups
- Network segmentation for sensitive workloads
- Security groups as virtual firewalls with minimal access

4. High Availability & Scalability

- Auto Scaling Group for EC2 instances
- Elastic Load Balancer distributing traffic
- Multi-AZ deployment for critical components
- Health monitoring and automatic recovery

5. Web Application Security

- AWS WAF protecting against OWASP Top 10 attacks
- API Gateway with comprehensive logging
- DDoS protection and rate limiting
- Security headers and proper SSL/TLS configuration

6. Monitoring, Auditing & Compliance

- CloudTrail logging for complete audit trails
- AWS Config for continuous compliance monitoring
- SNS topic for critical alert notifications
- Centralized logging for security events

TECHNICAL ARCHITECTURE:

Infrastructure Foundation:

- VPC with public subnets (load balancers) and private subnets (applications)
- EC2 instances in private subnets with security hardening
- RDS database with encryption, backups, Multi-AZ configuration
- S3 buckets with encryption, versioning, strict access policies
- ELB with SSL termination and security configurations

Security Services Layer:

- IAM roles and policies implementing least privilege
- WAF rules protecting against common attacks
- KMS keys for encryption key management
- Security groups with restrictive rules
- CloudTrail with encrypted log storage

Monitoring & Alerting:

- CloudWatch metrics and alarms for security events
- Config rules for automated compliance checking
- API Gateway with detailed logging
- SNS notifications for critical security alerts
- Automated incident response triggers

IMPLEMENTATION SPECIFICATIONS:

IAM Security:

- Separate roles for each service with minimal required permissions
- Cross-account access controls where needed
- Service-linked roles for AWS services
- Regular access reviews and policy validation

Data Security:

- S3 bucket policies enforcing encryption and access controls
- RDS parameter groups with security hardening
- KMS key policies limiting usage to authorized services
- Backup encryption and retention policies

Network Security:

- Security group ingress rules limited to required ports/protocols
- NACLs as additional layer of network filtering
- VPC Flow Logs for network traffic monitoring
- Private subnets for sensitive workloads

Application Security:

- EC2 instances with minimal required software packages
- Auto Scaling policies maintaining security during scale events
- Load balancer security configurations
- Application-level security controls

OUTPUT FORMAT (IMPORTANT):

- Provide each file in a separate fenced code block with filename as first line comment
- Include detailed security explanations for architectural decisions
- Document compliance mapping for each security constraint
- Reference Terraform best practices for enterprise environments

SUCCESS CRITERIA:

- All 14 security constraints fully implemented and validated
- IAM follows strict principle of least privilege
- All data encrypted at rest using appropriate AWS services
- HTTPS-only access enforced across all web services
- SSH access properly restricted and monitored
- WAF actively protecting against common web exploits
- CloudTrail providing complete audit trails
- Config monitoring compliance with security policies
- Auto Scaling maintaining security posture during scaling events
- SNS alerting operational for critical security events

VALIDATION REQUIREMENTS:

- Infrastructure must pass terraform validate without errors
- Security groups must follow least privilege access patterns
- All storage resources must have encryption enabled
- Monitoring and alerting must be comprehensive
- IAM policies must be restrictive yet functional
- Network isolation must be properly implemented

DELIVERABLE STRUCTURE:
Each Terraform file should be:

- Security-first with comprehensive controls
- Production-ready with error handling
- Well-documented with security rationale
- Modular following Terraform best practices
- Audit-compliant with logging and monitoring
- Scalable maintaining security during operations
