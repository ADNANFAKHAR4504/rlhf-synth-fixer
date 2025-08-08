You are an expert **Cloud DevOps Engineer** specializing in AWS infrastructure as code. Your task is to generate a **Pulumi (Python)** script and supporting files to establish a consistent, replicable AWS infrastructure across multiple environments and regions, following enterprise-grade best practices.

---

### Context & Objective
You need to build a **multi-environment, multi-region AWS setup** using Pulumi and Python. The goal is to ensure **consistent application deployments** across four AWS regions representing distinct environment types:  
- Production  
- Development  
- Staging  
- Testing  

Each region must fully comply with enterprise guidelines for **security, cost management, resource configurations, and network settings**.

---

### Detailed Requirements
1. **Pulumi + Python**: All infrastructure must be fully defined in Pulumi using Python as the scripting language.
2. **VPC Isolation**: Create fully isolated VPCs for each environment; do not use any default VPCs.
3. **Monitoring**: Integrate Amazon CloudWatch for resource monitoring with metrics and alarms for unexpected behavior.
4. **Data Layer**: Use DynamoDB tables for environment-specific data with **Point-in-Time Recovery (PITR)** enabled.
5. **Load Balancing**: Deploy an Application Load Balancer (ALB) in each region with at least **two target EC2 instances** per environment.
6. **IAM**: Configure IAM roles and policies consistently across environments using the **principle of least privilege**.
7. **Data Security**: Ensure all Amazon S3 buckets have **server-side encryption** enabled.
8. **Compute**: Use AWS Lambda (Python runtime) for region-specific computation needs.
9. **Configuration Management**: Manage environment-specific configurations using **AWS Systems Manager Parameter Store**.
10. **Backup & RPO**: Automate backups of all databases, ensuring a **Recovery Point Objective (RPO)** of no more than 1 hour.

---

### Expected Deliverables
- A Pulumi Python script named **`index.py`** that provisions all required resources across the four environments and regions.
- Any supporting Pulumi configuration files needed for deployments.
- Code must adhere to **Pulumi best practices** (e.g., reusable components, environment-aware configs).
- Automated tests to verify resource setup, security configurations, and environment isolation.

---

### Success Criteria
- Each environment (Prod, Dev, Staging, Test) is isolated and consistently configured.
- All security and backup requirements are met.
- Code is modular, readable, and supports future scalability.
- Include inline comments explaining major sections of the code.

---

### Output Format
Return the following in your response:
1. The complete **`index.py`** Pulumi script.
2. Any required configuration snippets (YAML/JSON) for Pulumi project and stack definitions.
3. Clear instructions for deploying and testing the infrastructure.

---

**Now generate the full Pulumi Python solution and tests according to the above requirements.**
