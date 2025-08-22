# **Prompt:**

You are an expert AWS Infrastructure Engineer tasked with creating a **production-ready CloudFormation template in YAML** that implements a **robust, multi-region security configuration** across multiple AWS services. The configuration must enforce strict security best practices and pass AWS CloudFormation validation with no errors.

---

## **Environment**

* **Regions**: `us-east-1` (primary), `eu-west-1` (secondary)
* **Naming Convention**:

  ```
  projectname-env-resourcetype
  ```

  Where `env` can be:

  * `dev`
  * `test`
  * `prod`

---

## **Requirements**

### **1. Security Groups**

* Define **specific inbound and outbound rules**
* Restrict traffic to/from **designated IP ranges** and **protocols** only

### **2. S3 Buckets**

* HTTPS-only access enforced via **bucket policies**
* Deny non-SSL requests

### **3. AWS Config**

* Track configuration changes
* Compliance rules for:

  * Security Group modifications
  * IAM Role modifications

### **4. IAM Roles**

* Enforce **multi-factor authentication (MFA)** for console access

### **5. Encryption**

* Use **AWS KMS** to encrypt:

  * RDS instances
  * DynamoDB tables

### **6. CloudTrail**

* Enabled across all regions
* Log all account actions to an **S3 bucket** with:

  * Versioning enabled
  * MFA Delete enabled

### **7. GuardDuty**

* Enabled in all regions
* Send actionable alerts for intrusion detection

### **8. Centralized Logging**

* Send security logs and monitoring data to **CloudWatch Logs**

### **9. Lambda Functions**

* No public access
* Restrict execution to necessary IAM roles only

### **10. Web Application Firewall (WAF)**

* Protect against **common web exploits**

### **11. RDS Instances**

* Accept connections **only from whitelisted IPs or VPCs**

---

## **Constraints**

* **Language**: YAML
* **Platform**: AWS CloudFormation
* Must be **valid and deployable** without modification
* Follow AWS **security best practices**
* Use **least privilege** for all IAM policies and roles
* Ensure **multi-region compatibility**

---

## **Output**

* Provide the **complete YAML CloudFormation template** implementing **all** of the above requirements
* Include all necessary:

  * **Resources**
  * **Parameters**
  * **Outputs**
  * **Metadata**
* Ensure the template passes:

  ```
  aws cloudformation validate-template
  ```

  with no errors