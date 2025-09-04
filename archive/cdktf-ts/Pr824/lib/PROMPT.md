**Role:**
You are an **expert Prompt Engineer** with **10 years of experience**. Your task is to create Infrastructure as Code (IaC) using **CDK for Terraform (CDKTF)** with **TypeScript**.

**Goal:**
Generate a complete, functional, and validated CDKTF TypeScript codebase that provisions a **robust, scalable, and secure multi-region AWS infrastructure** as described below. All provided details must remain **exactly intact** do not modify or omit any data.

---

### **Environment**

* Two AWS regions: **us-east-1** and **eu-west-1**.
* Infrastructure must allow **cross-region redundancy** and **failover capabilities**.
* Naming conventions must associate resources with **environment** and **region**.
* All stages of environments must be managed via **CDKTF workspaces**.

---

### **Constraints**

1. Use **CDKTF with TypeScript** for all configurations.
2. Support configuration of **multiple AWS providers** for `us-east-1` and `eu-west-1`.
3. Ensure **high availability** by distributing resources across **multiple Availability Zones** in each region.
4. Incorporate **reusable CDKTF modules** for organization and maintainability.
5. Store all **state files** securely in an **S3 bucket** with **versioning enabled**.
6. Use **backend configuration** with **locking mechanisms** for remote state management.
7. Implement **Application Load Balancers (ALBs)** to distribute traffic to **multiple EC2 instances**.
8. Configure **Auto Scaling** for EC2 instances based on **CPU usage thresholds**.
9. Ensure **VPCs, subnets, and route tables** are configured for isolated and public/private traffic flow.
10. Deploy **RDS (PostgreSQL)** with **multi-AZ configuration** and **automatic backups**.
11. Include **CloudWatch alarms** to monitor performance and trigger auto-scaling.
12. Integrate **IAM roles and policies** using the **principle of least privilege**.
13. Utilize **CDKTF workspaces** for development, testing, and production environments.
14. Ensure all resource names follow the `<environment>-<service>-<region>` naming format.
15. Apply a **tagging strategy** for all resources, including `environment`, `project`, `owner`, and `cost_center`.

---

### **Proposed Statement**

> Design a robust, scalable, and secure cloud environment setup using **CDKTF** for a critical application deployment across multiple AWS regions. The infrastructure must support high availability and disaster recovery functionalities.

---

### **Requirements**

1. Use **CDKTF with TypeScript** to configure **AWS VPCs**, subnets, route tables, security groups, and Internet gateways.
2. Deploy and manage **EC2 instances** with load balancing and auto-scaling configurations.
3. Set up **RDS** for database needs, ensuring **high availability** with backup solutions.
4. Apply best practices for infrastructure security via **IAM roles**, **S3 bucket policies** for state files, and **traffic isolation**.
5. Enable monitoring and logging via **CloudWatch**.
6. Use **CDKTF workspaces** for **development**, **testing**, and **production**.
7. Follow **naming conventions** and apply **resource tagging** for management and cost tracking.

---

### **Expected Output**

* A **complete CDKTF TypeScript configuration** meeting all requirements.
* Successfully tested and validated against AWS infrastructure standards.
* Deployable in **both regions** with no errors.
* Packaged as a **version-controlled repository**, ready for immediate deployment.

---