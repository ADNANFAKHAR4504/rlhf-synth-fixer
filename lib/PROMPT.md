**Role:**
You are an **expert Prompt Engineer** with **10 years of experience**. Your task is to create Infrastructure as Code (IaC) using **Terraform (HCL)**.

**Goal:**
Generate a complete, functional, and validated Terraform codebase that provisions a **robust, scalable, and secure multi-region AWS infrastructure** as described below. All provided details must remain **exactly intact** — do not modify or omit any data.

---

### **Environment**

* Two AWS regions: **us-east-1** and **eu-west-1**.
* Infrastructure must allow **cross-region redundancy** and **failover capabilities**.
* Naming conventions must associate resources with **environment** and **region**.
* All stages of environments must be managed via **Terraform workspaces**.

---

### **Constraints**

1. Use **Terraform's latest version** for all configurations.
2. Support configuration of **multiple AWS providers** for `us-east-1` and `eu-west-1`.
3. Ensure **high availability** by distributing resources across **multiple Availability Zones** in each region.
4. Incorporate **Terraform modules** for reusability and organizational standards.
5. Store all Terraform **state files** securely in an **S3 bucket** with **versioning enabled**.
6. Use **backend configuration** for remote state management with **locking mechanisms**.
7. Implement **Application Load Balancers (ALBs)** for distributing traffic to **multiple EC2 instances**.
8. Configure **Auto Scaling** for EC2 instances based on **CPU usage thresholds**.
9. Ensure **VPCs, subnets, and route tables** are configured for isolated and public/private traffic flow.
10. Deploy **RDS (PostgreSQL)** with **multi-AZ configuration** and **automatic backups**.
11. Include **CloudWatch alarms** to monitor performance and trigger autoscaling.
12. Integrate **IAM roles and policies** with the **principle of least privilege**.
13. Utilize **Terraform workspaces** for development, testing, and production.
14. Ensure all resource names comply with `<environment>-<service>-<region>` naming format.
15. Apply **tagging strategy** for all resources including `environment`, `project`, `owner`, `cost_center`.

---

### **Proposed Statement**

> Design a robust, scalable, and secure cloud environment setup using Terraform for a critical application deployment across multiple AWS regions. The infrastructure must support high availability and disaster recovery functionalities.

---

### **Requirements**

1. Use Terraform to configure **AWS VPCs**, subnets, route tables, security groups, and Internet gateways.
2. Deploy and manage **EC2 instances** with load balancing and auto-scaling configurations.
3. Set up **RDS** for database needs, ensuring **high availability** with backup solutions.
4. Apply best practices for infrastructure security via **IAM roles**, **S3 bucket policies** for state files, and **traffic isolation**.
5. Enable monitoring and logging via **CloudWatch**.
6. Use Terraform workspaces for **development**, **testing**, and **production**.
7. Follow **naming conventions** and apply **resource tagging** for management and cost tracking.

---

### **Expected Output**

* A **complete Terraform HCL configuration** meeting all requirements.
* Tested and validated against AWS infrastructure standards.
* Successfully deployable in **both regions** with no errors.
* Packaged as a **version-controlled repository**, ready for immediate deployment.