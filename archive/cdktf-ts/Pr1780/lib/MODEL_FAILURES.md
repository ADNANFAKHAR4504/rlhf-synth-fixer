### **1. RDS instances lack Multi-AZ and full encryption setup**

- **Issue:** The RDS resources in `MODEL_RESPONSE.md` use a single `DbInstance` with encryption, but **Multi-AZ deployment is not enabled**, and encryption is not explicitly tied to the KMS key.
- **Requirement:** RDS should be **encrypted at rest using a KMS key** and deployed in **Multi-AZ** for resilience.
- **Impact:** Database availability and compliance are weaker than required.

---

### **2. IAM roles are oversimplified**

- **Issue:** The IAM role created for EC2 only attaches the **AmazonSSMManagedInstanceCore** policy.
- **Requirement:** IAM roles should grant **minimal required permissions** for EC2 to interact with RDS, ALB, CloudWatch, etc.
- **Impact:** The model solution does not satisfy least-privilege principles and may block workloads.

---

### **3. Missing critical outputs for operators**

- **Issue:** The model solution does not export key outputs such as **ALB DNS name, RDS endpoint, VPC ID, or Subnet IDs**.
- **Requirement:** Operators need these outputs for validation and integrations.
- **Impact:** Makes it difficult to consume or test the deployed infrastructure.
