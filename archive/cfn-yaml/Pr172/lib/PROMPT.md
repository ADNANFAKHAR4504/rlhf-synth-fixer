Here is a **comprehensive, structured prompt** you can use to generate or test a CloudFormation YAML template for your use case:

---

### Prompt Title:

**Generate secure AWS infrastructure using CloudFormation YAML for production in `us-east-1`**

---

### Prompt Description:

Act as an expert AWS Solutions Architect. You are tasked with designing a secure, production-grade infrastructure using **AWS CloudFormation YAML** syntax. The infrastructure must align with **AWS security, networking, and IAM best practices** and must be **fully deployable** via a new CloudFormation stack in the **`us-east-1` region**.

---

### Required Modules & Constraints:

Develop a complete CloudFormation YAML template named **`secure_infrastructure.yaml`** that satisfies the following requirements:

---

#### 1. **VPC and Subnet Configuration**

* Create a **VPC** with appropriate CIDR (e.g., 10.0.0.0/16).
* Provision **2 public subnets** and **2 private subnets** across **2 Availability Zones** (AZs).
* Enable **DNS support and DNS hostnames** in the VPC.
* Associate **route tables** for public and private subnets properly.
* Use **NAT Gateway** for outbound internet access from private subnets.
* Attach an **Internet Gateway (IGW)** to the VPC.

---

#### 2. **IAM Role & EC2 Access to S3**

* Create an **IAM role** with least privilege to allow **EC2 instances** to access a **specific S3 bucket**.
* Include an **Instance Profile** to attach this IAM Role to EC2 instances.

---

#### 3. **S3 Bucket with AWS-managed KMS Encryption**

* Create an **S3 bucket** for application storage.
* Enable **server-side encryption** using **AWS-managed KMS (SSE-KMS)**.
* Restrict public access and enforce **SSL-only access**.

---

#### 4. **CloudTrail Setup**

* Enable **CloudTrail** to log events **across all AWS resources** in the region.
* Store CloudTrail logs in the above **S3 bucket** with encryption.
* Configure the appropriate **log file validation** and **multi-region trail** option.

---

#### 5. **Security Group Rules**

* Create a **Security Group** for EC2 that:

* **Allows only inbound HTTPS (TCP 443)** traffic from a **known CIDR block** (e.g., `203.0.113.0/24`).
* Allows only **required outbound traffic**.
* Deny all other traffic implicitly.

---

#### 6. **Resource Tagging**

* Apply the following **mandatory tags to *all* resources**:

* `Environment: Production`
* `Owner: TeamA`

---

### Output Requirements:

* Provide a complete **CloudFormation YAML template** named **`secure_infrastructure.yaml`**.
* The template **must be deployable** using AWS CLI or Console.
* Ensure the template passes **AWS CloudFormation Linter and Stack Validation**.
* Structure resources using **logical naming conventions** and **reusability (e.g., mappings, parameters, outputs)**.
* Use **`!Sub` or `!Ref`** where applicable to maintain clean, dynamic configuration.
* Use **`Metadata` or `Tags`** section for tagging compliance.

---

### Additional Instructions:

* Do **not** include placeholder text like `REPLACE_ME` in final output.
* Do **not** use overly permissive IAM policies (`*:*`).
* Avoid unnecessary resources or modules.
* Use **us-east-1 availability zones** like `us-east-1a` and `us-east-1b`.