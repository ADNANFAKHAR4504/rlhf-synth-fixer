## **Task Overview**

Design a **secure, scalable, and efficient AWS Cloud Architecture** using **AWS CloudFormation (JSON format)** for a **mid-sized company**.
Your template must follow **AWS security best practices**, ensure **network isolation**, and meet **all requirements** listed below.

---

## **Requirements**

### **1. Region & Environment**

* All resources must be deployed in **`us-west-2`** (Oregon).
* Use a **dedicated VPC** to isolate resources from other environments.

---

### **2. Networking & Access**

* Create a **VPC** with at least two **public** and **private** subnets across **two Availability Zones**.
* Attach an **Internet Gateway** to the VPC.
* Deploy a **NAT Gateway** in a public subnet to provide secure internet access for instances in private subnets.
* Configure **route tables** for proper routing between public/private subnets.
* All traffic must use **SSL/TLS** for encryption in transit.
* Add a **bastion host** in the public subnet for secure SSH access to private EC2 instances.

---

### **3. EC2 Instances**

* Deploy EC2 instances in **private subnets**.
* Create a **Security Group** that allows only:

  * **HTTP (port 80)** inbound traffic from the internet via ALB or public subnet.
  * **SSH (port 22)** inbound traffic **only from the bastion host**.
* Configure **CloudWatch Alarms** to monitor **CPU utilization**.
* Associate an **IAM Role** with EC2 that follows the **principle of least privilege**.

---

### **4. S3 Buckets**

* Create S3 buckets for **data storage** and **access logs**.
* Enable **versioning** and **server access logging** on all buckets.
* Enforce **SSE-KMS encryption** for data at rest.
* Add **bucket policies** to **restrict public access** and enforce HTTPS (deny non-SSL requests).

---

### **5. RDS Instance**

* Launch an **Amazon RDS instance** in private subnets.
* Enable **storage encryption** using **AWS KMS**.
* Ensure **RDS connections** require SSL for data in transit.
* Use a **minimal IAM role** for RDS access control.
* Disallow public accessibility.

---

### **6. IAM & Security**

* Define **IAM Roles and Policies** for EC2, Lambda, and other services.
* Apply the **principle of least privilege** — each service should only have permissions necessary for its function.
* Deny all unnecessary public or cross-account access unless explicitly required.

---

### **7. Serverless Components (Lambda)**

* Add **AWS Lambda functions** for:

  * **Log processing** or **automation tasks**.
  * **S3 event triggers** (optional).
* Ensure Lambda execution roles have **restricted access** to S3 and CloudWatch Logs only.

---

### **8. Content Delivery**

* Configure a **CloudFront Distribution** for S3 bucket content delivery.
* Enforce **HTTPS (ViewerProtocolPolicy = redirect-to-https)**.
* Enable **Origin Access Control (OAC)** or **Origin Access Identity (OAI)** to secure direct S3 access.

---

### **9. Encryption & Monitoring**

* Use **AWS KMS** for encrypting:

  * RDS storage
  * S3 data
  * EC2 volumes (EBS)
* Enable **CloudWatch Metrics and Alarms** for monitoring critical resources (EC2, RDS, Lambda).
* Log all key service activities (S3 access logs, CloudWatch Logs, Lambda logs).

---

## **Expected Output**

A **validated CloudFormation template** written in **JSON**, that:

* Passes `aws cloudformation validate-template` and `cfn-lint` checks.
* Can be **deployed successfully** in **`us-west-2`** without modification.
* Implements all the requirements above using **secure defaults**.
* Includes:

  * **Parameters** for customizable inputs (VPC CIDR, KeyName, InstanceType, etc.)
  * **Resource Definitions** for networking, compute, storage, IAM, and monitoring.
  * **Outputs** for key resource information (e.g., VPC ID, Instance IDs, ALB DNS, etc.)

---

## **Validation Criteria**

 Valid JSON syntax and CloudFormation structure.
 Follows **AWS security best practices** (encryption, least privilege, no public exposure).
 Deploys cleanly without dependency or missing reference errors.
 Logging, versioning, and encryption configured for all storage.
 CloudWatch monitoring and alarms implemented for EC2 CPU usage.
 Proper subnet and route isolation (bastion in public, workloads in private).
 CloudFront configured for secure S3 content delivery.

---

## **Constraint Items**

| Constraint              | Description                                 |
| ----------------------- | ------------------------------------------- |
| Region                  | Must operate in `us-west-2`                 |
| VPC Isolation           | Use a dedicated VPC for all resources       |
| S3 Logging & Versioning | Must be enabled on all S3 buckets           |
| EC2 Security            | Only HTTP and SSH allowed                   |
| Bastion Host            | Required for secure SSH access              |
| NAT Gateway             | Required for private subnet internet access |
| IAM Roles               | Must follow least privilege                 |
| CloudFront              | Required for secure S3 delivery             |
| RDS                     | Must be encrypted with KMS                  |
| KMS                     | Must encrypt all data at rest               |
| CloudWatch              | Required for EC2 CPU monitoring             |
| Lambda                  | Required for serverless log processing      |
| SSL/TLS                 | Mandatory for encryption in transit         |

---
