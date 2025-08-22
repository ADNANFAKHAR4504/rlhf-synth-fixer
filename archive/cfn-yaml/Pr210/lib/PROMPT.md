Here is a **high-level, comprehensive user prompt** that clearly communicates the full project scope for building the required CloudFormation YAML template:

---

### **Prompt Title**

**Design Secure AWS VPC, S3, and IAM Access with Environment-Based Tagging in us-east-1 using CloudFormation YAML**

---

### **Prompt Description**

Act as an experienced **AWS CloudFormation Engineer**. Your task is to write a complete, production-ready **CloudFormation YAML template** to establish a basic cloud infrastructure in the **`us-east-1`** region. The template must define core networking and storage components and enforce access control using **IAM** while following strict naming conventions and tagging standards.

---

### **Requirements**

You must ensure the CloudFormation stack includes the following **modules and configurations**:

#### 1. **VPC Configuration**

* Create a **VPC** with the **CIDR block `10.0.0.0/16`**.
* The VPC must be created in the `us-east-1` region explicitly (even though it's the default, ensure clarity).
* Add `Tags`:

* `Environment`: provided via parameter (e.g., dev, stage, prod).
* `Project`: provided via parameter (e.g., myproject).

#### 2. **S3 Bucket**

* Create one **S3 bucket** named using the pattern `<project-name>-storage` (e.g., `myproject-storage`).
* The project name must come from a parameter named `ProjectName`.
* The bucket must:

* Be private.
* Use **AES256** encryption.
* Block all public access.
* Include **Environment** and **Project** tags.

#### 3. **IAM Role for S3 Read Access**

* Define an **IAM Role** that allows **S3 read-only access (`s3:GetObject`, `s3:ListBucket`)** to the above bucket.
* Use a predefined **IAM Group ARN** passed as a parameter to define the **trusted entities** or provide policy attachment logic accordingly.
* The IAM role must:

* Enforce **least privilege**.
* Contain proper tagging: `Environment` and `Project`.

#### 4. **Tagging Best Practices**

* **All resources** (VPC, S3 bucket, IAM role) must include the following tags:

* `Environment`: (parameterized)
* `Project`: (parameterized)

#### 5. **Region Constraint**

* All resources must be deployable in the **`us-east-1`** AWS region.

---

### **Validation Expectations**

* The template must pass all **CloudFormation validation checks**.
* Resource names and tags should be easily traceable to support billing and management.
* IAM policies must avoid wildcards unless justified (e.g., avoid `"Action": "*"`).

---

### **Output Format**

* Provide the CloudFormation **YAML** code.
* Use **Parameters**, **Mappings**, and **Conditions** where applicable for flexibility and best practices.
* Keep the structure clean, modular, and production-grade.

give me complete functional end to end yaml template