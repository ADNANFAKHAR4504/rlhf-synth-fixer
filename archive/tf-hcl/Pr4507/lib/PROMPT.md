### Prompt

You are an expert AWS cloud security and Terraform engineer.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** that implements a **Zero Trust Security Model** across a **multi-account AWS organization**.  

All code must include:  
- **Variable declarations** (with default values where appropriate)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file that defines AWS provider configuration using a variable named `aws_region`.  
Ensure the script properly references this `aws_region` variable.  

This must be a **brand new stack** — create all modules and resources from scratch, without referencing any pre-existing infrastructure or modules.  
The Terraform logic must match **AWS and Zero Trust best practices** for multi-account organizations, automation, and compliance enforcement.  

---

### Business Use Case

A **global financial services company** needs to implement a **Zero Trust security model** across multiple AWS accounts and regions.  
The company operates under **strict compliance standards** such as **SOC 2** and **PCI-DSS**, and must enforce:  
- **Least privilege access** across all resources and identities.  
- **Automated compliance monitoring and continuous auditing**.  
- **Centralized threat detection, event correlation, and reporting**.  
- **Codified, version-controlled security baselines** that can be **automatically enforced**.  

---

### Required Architecture & Components

1. **AWS IAM (Identity & Access Management)**  
   - Enforce **least privilege** and **Zero Trust policies** across accounts.  
   - Create **IAM roles and policies** with scoped permissions.  
   - Configure **Service Control Policies (SCPs)** via AWS Organizations to restrict non-compliant operations.  
   - Enable **IAM Access Analyzer** for continuous validation of permissions.  
   - Implement **IAM identity federation** for centralized user authentication (SAML or OIDC).  

2. **AWS Security Hub**  
   - Enable **Security Hub** across all accounts and regions.  
   - Aggregate findings to a **central security account**.  
   - Integrate with **GuardDuty**, **Config**, and **CloudTrail** for unified visibility.  
   - Enable **CIS AWS Foundations Benchmark** and **PCI-DSS compliance standards** within Security Hub.  

3. **AWS GuardDuty**  
   - Enable GuardDuty in all active regions.  
   - Configure **multi-account management** with delegated administrator account.  
   - Forward findings to **Security Hub** and **CloudWatch Events** for automated alerting.  
   - Enable **S3 Protection**, **EKS Audit Logging**, and **Malware Protection** modules.  

4. **AWS Config**  
   - Enable **AWS Config** across all accounts and regions for compliance tracking.  
   - Use **managed rules** for resource compliance (encryption, MFA, public access).  
   - Deliver **Config snapshots and compliance history** to an encrypted S3 bucket.  

5. **CloudTrail & CloudWatch**  
   - Enable **organization-wide CloudTrail** with multi-region logging.  
   - Send logs to a **centralized, KMS-encrypted S3 bucket**.  
   - Configure **CloudWatch Metrics** and **Alarms** for high-severity Security Hub or GuardDuty findings.  

6. **EventBridge (Automation Layer)**  
   - Create **EventBridge rules** to automatically remediate findings (e.g., IAM over-permissions, public S3 buckets).  
   - Trigger **Lambda functions** for automated policy enforcement and alerting.  

7. **Lambda (Remediation Functions)**  
   - Deploy Lambda functions to enforce Zero Trust controls dynamically.  
   - Examples:
     - Disable access keys on policy violation.  
     - Revoke public S3 permissions.  
     - Quarantine compromised IAM roles or EC2 instances.  

8. **KMS & Encryption Policies**  
   - Use **AWS KMS CMKs** for encryption at rest across S3, CloudTrail, Security Hub, and GuardDuty data.  
   - Ensure all communication is **encrypted in transit (TLS)**.  

9. **Multi-Account Architecture**  
   - Define structure for:  
     - **Management account** (control policies, config, security baselines)  
     - **Security account** (GuardDuty, Security Hub aggregation, auditing)  
     - **Workload accounts** (application and data environments)  
   - Enable **cross-account roles** for centralized monitoring.  

10. **Tagging & Compliance Metadata**  
    - All resources must include tags:  
      - `Environment`  
      - `Owner`  
      - `Project`  
      - `Compliance` (e.g., PCI-DSS, SOC2)  

---

### Security Controls & Enforcement

- **Zero Trust Principle:** “Never trust, always verify.”  
- **Access:** Enforce identity verification and context-based access (IAM policies, SCPs, MFA).  
- **Audit:** Continuous compliance scanning with Security Hub and Config.  
- **Detection:** GuardDuty + Security Hub for continuous monitoring.  
- **Response:** Automated remediation via Lambda and EventBridge.  
- **Visibility:** Centralized CloudTrail logs and Security Hub dashboards.  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all variables, logic, and outputs.  
- Creates all required resources and modules from scratch.  
- Implements a **multi-account Zero Trust architecture** using **IAM, Security Hub, GuardDuty, and Config**.  
- Enables **automated compliance monitoring** and **continuous enforcement**.  
- Adheres to **AWS security, compliance, and Terraform best practices**.