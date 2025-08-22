# AWS CDK Multi-Region Infrastructure Design

Act as an expert AWS Cloud Architect and CDK developer. Help me design and implement a secure, highly available infrastructure using **AWS CDK in Python**. The environment must meet the following requirements:

---

## Requirements

- **Multi-region deployment** across `us-east-1` and `us-west-2` to ensure high availability.
- **VPCs in each region** to provide network isolation and security for application components.
- Use **managed database services** (e.g., Amazon RDS or Aurora) with automated backups retained for at least **7 days**.
- Implement **application load balancing** across multiple **Availability Zones (AZs)** within each region.
- Ensure **data at rest encryption** using **customer-managed AWS KMS keys**.
- Use **Route 53** for automated DNS management and **failover routing** between the two regions.
- Enable **CloudWatch monitoring and logging** for all services to comply with AWS security best practices.

---

## Your Task

1. **Provide a CDK (Python) project structure** with example stacks/modules implementing these requirements.
2. **Explain design decisions**, such as:
   - Failover handling
   - Region-specific deployment logic
   - Use of constructs
3. Where appropriate, include:
   - **Construct classes**
   - **Stack splitting logic**
   - **IAM/KMS configuration** to meet the security goals

---

## Focus Areas

- **Infrastructure-as-code best practices**
- **Modular design**
- **Reusability across regions**
