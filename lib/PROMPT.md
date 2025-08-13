## Context

You are an expert AWS Cloud Infrastructure engineer tasked with designing and deploying a **secure, resilient, and automated AWS environment**. This solution must use **Pulumi in Python**, strictly adhere to AWS and company best practices, and be fully compliant with operational and security guidelines.

***

## Task Requirements

Create a comprehensive Pulumi Python program that implements a secure AWS infrastructure supporting a robust CI/CD pipeline. Your program must address the following requirements:

### Security Requirements

- **IAM Security:** Define IAM roles and policies with the principle of least privilege for all compute, service, and pipeline resources.
- **Encryption:** Use AWS KMS to encrypt all data at rest for RDS, EKS, ALB, and S3.
- **Network Security:** Build security groups to **allow only HTTP (80) and HTTPS (443) traffic** where appropriate; restrict database and internal resources to the VPC.
- **Secrets Management:** Store sensitive variables (connection strings, keys) in AWS Systems Manager Parameter Store, never in code/config files.
- **Database Security:** Deploy Amazon RDS PostgreSQL in a private subnet with proper network isolation; prohibit direct public access.

***

### Infrastructure Requirements

- **High Availability:** Distribute resources (VPC subnets, EKS nodes, ALB) across at least two availability zones in `us-west-2` for fault tolerance.
- **Monitoring:** Enable AWS CloudWatch for comprehensive logging and monitoring of RDS, EKS, ALB, and CI/CD pipeline.
- **Key Management:** Centralize encryption key creation and usage via KMS, enforced for all supported resources.
- **Networking:** Create a VPC with a CIDR block of `10.0.0.0/16`, separating public and private subnets in different AZs. Include Route Tables, IGW, and NAT Gateway as needed.
- **Load Balancing:** Deploy an Application Load Balancer (ALB) routing external traffic to EKS nodes running NGINX; ensure health checks and auto-scaling are configured.

***

### CI/CD & Automation

- **Pipeline:** Implement a CodePipeline to automate deployment from a GitHub repo to EKS.
- **Automation:** Use Pulumi’s stack/config features for environment-specific variables and secrets. Document all key configuration points.
- **Testing & Simulation:** Ensure the Pulumi Python code passes all provided unit and integration tests and simulates error-free deployments.

***

## Compliance Constraints

- Deploy exclusively in AWS `us-west-2` region.
- Prefix all resource names with `corp-` per company naming standards.
- Apply AWS Well-Architected Framework principles.
- All IAM policies must be attached to roles/groups, not directly to users.
- All infrastructure logic must be written in Python using Pulumi, with clear type annotations and PEP8 compliance.
- Tag all resources consistently (e.g., `Environment: Production`).

***

## Technical Specifications

**Required AWS Services**
- **Compute:** EKS cluster with auto-scaling enabled; NGINX demo server in public subnet.
- **Database:** RDS PostgreSQL in private subnet.
- **Storage:** S3 buckets with encryption, private by default.
- **Security:** IAM, KMS, Security Groups, Parameter Store.
- **Monitoring:** CloudWatch Logs, Metrics, Alarms.
- **Networking:** VPC, Subnets, NAT Gateway, Route Tables, ALB.

***

## Implementation Guidelines

### Security Best Practices

1. **Least Privilege:** All IAM roles/policies must be tightly scoped by service and environment.
2. **Defense in Depth:** Layer security controls—Security Groups, encrypted storage, restricted parameters.
3. **Audit Trail:** Enable CloudWatch logging and AWS CloudTrail for all supported events.
4. **Data Protection:** Encrypt all resources and enforce TLS across public endpoints.
5. **Network Segmentation:** Fully isolate public web tier from private database and internal services.

***

### Operational Excellence

1. **Monitoring & Logging:** Centralized, automated CloudWatch coverage for all infrastructure and pipeline events.
2. **Tagging:** Tag all resources with business-relevant keys (`Environment`, `Project`, etc.).
3. **Automation:** Leverage Pulumi’s stack/config abstraction, use inline documentation and docstrings, and adhere to consistent code styling.

***

### Reliability and Performance

1. **Multi-AZ Deployment:** Critical resources (EKS, ALB, subnets) to span multiple AZs.
2. **Auto Scaling:** Configure EKS node groups and ALB for scaling based on demand.
3. **Health Checks:** Enable ALB and RDS health checks; monitor NGINX status via EKS probes.
4. **Resource Limits:** Set quotas and sensible defaults for all scalable resources.

***

## Expected Deliverable

A **production-grade Pulumi Python program** that:
- Implements all security and infrastructure requirements.
- Follows AWS and company Well-Architected standards.
- Passes all integration/unit tests and Pulumi deployment simulations.
- Includes comprehensive tagging and clear, meaningful outputs for key endpoints and resource identifiers.
- Provides robust error handling, rollback procedures, and inline documentation for easy integration and audit.

***

## Success Criteria

Your solution must:
1. Deploy without errors via Pulumi in `us-west-2`.
2. Pass all AWS security/config compliance checks.
3. Demonstrate proper resource isolation, security, and audit logging.
4. Show evidence of operational monitoring, automated logging, and recovery mechanisms.
5. Prove high availability and fault tolerance across AZs.
6. Validate encryption and secrets protection for all relevant resources.

***
