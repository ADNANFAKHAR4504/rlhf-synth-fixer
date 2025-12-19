### **Functional scope**

Develop a **secure and compliant AWS CloudFormation stack** from scratch in **YAML format** (not JSON), named `TapStack.yml`, designed to provision all foundational components under a new environment.
The template must deploy **all resources** without referencing or pointing to any pre-existing ones. It should create a complete, standalone infrastructure environment under region **`us-east-1`**, following **organization-wide security and compliance best practices**.

### **Implementation requirements:**

1. **Regional Enforcement**

   * All resources must explicitly deploy in `us-east-1` using `AWS::Region` conditions and metadata.

2. **IAM and Access Control**

   * Implement IAM Roles with **principle of least privilege**.
   * Enforce **MFA for all IAM users** via account password policy and conditional statements.

3. **S3 Security and Logging**

   * Every S3 bucket (including log and data buckets) must:

     * Enforce **server-side encryption (SSE-KMS)** using a **customer-managed KMS CMK**.
     * **Block all public access** and disallow ACLs.
     * Enable **access logging** to a centralized log bucket.
   * Create a dedicated **S3 bucket for CloudTrail logs** that only allows write access from the CloudTrail service principal.

4. **Networking and Security Groups**

   * Security Groups must **restrict ingress** to known IPs.
   * Only **port 80 (HTTP)** and **port 443 (HTTPS)** are permitted from `0.0.0.0/0`.
   * Outbound rules may allow all egress for updates and external connectivity.

5. **Monitoring and Compliance (AWS Config & CloudTrail)**

   * Enable **AWS Config** to monitor all resource configurations and compliance status.
   * Enable **AWS CloudTrail (multi-region)** with logs encrypted using CMK and delivered to the CloudTrail bucket.

6. **RDS and Database Security**

   * Provision an **RDS instance** within **private subnets only** (no public access).
   * Encrypt storage and snapshots with CMK.

7. **API Gateway + WAF Integration**

   * Deploy **API Gateway** with logging enabled for all stages.
   * Integrate **AWS WAF WebACL** for API protection.

8. **High Availability (Auto Scaling)**

   * Configure **Auto Scaling Groups** with Launch Templates for EC2 instances in multiple AZs to ensure HA and fault tolerance.

9. **Encryption Management**

   * Define a **KMS CMK** for use by all encryptable resources (S3, RDS, CloudTrail).
   * Include least-privilege key policy permitting access to required services only.

10. **Naming Convention**

    * All resources must include the **`${EnvironmentSuffix}`** variable in their logical and physical names to avoid cross-deployment conflicts.

---

### **Deliverable:**

Provide a **single file named `TapStack.yml`** that includes:

* **AWSTemplateFormatVersion** and **Description**
* **Parameters** for EnvironmentSuffix, CIDR ranges, KMS alias, known IPs, DB credentials, etc.
* **Conditions** enforcing deployment in `us-east-1`
* **Resources** section defining:

  * VPC, Subnets (Public/Private), Internet/NAT Gateways
  * Security Groups with restricted ingress
  * IAM Roles/Policies (least privilege, MFA enforcement)
  * KMS Key with strict policy
  * AWS Config Recorder and Delivery Channel
  * CloudTrail (multi-region) with encrypted S3 log bucket
  * RDS instance (private, encrypted)
  * API Gateway + WAF
  * Auto Scaling Group and Launch Template
  * Log and data S3 buckets with encryption and logging
* **Outputs** summarizing key ARNs, Bucket names, VPC ID, RDS Endpoint, CloudTrail ARN, WAF WebACL ARN, etc.