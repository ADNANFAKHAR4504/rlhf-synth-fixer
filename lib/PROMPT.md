> **Act as an AWS Solutions Architect.**
> Design a **CloudFormation template in JSON format** to provision a secure, highly available, and monitorable cloud environment in the **`us-east-1` region**. Follow AWS best practices for networking, IAM, logging, and resource availability.

---

### 🧩 **Requirements Overview**:

You are setting up infrastructure for a **web application** that must meet **enterprise-grade cloud architecture standards**.

#### 1. **Networking (VPC & Subnets)**:

* Create a **VPC**.
* Include **subnets in multiple Availability Zones** to support **high availability** for EC2 instances.

#### 2. **Compute (EC2)**:

* Launch **EC2 instances** within the VPC.
* Attach **IAM roles** to instances to securely access AWS services (avoid hardcoded credentials).
* Enable **CloudWatch monitoring** on all EC2 instances.

#### 3. **Security**:

* Configure **security groups** to:

  * **Block all incoming traffic by default**.
  * Allow **only HTTP (port 80)** and **HTTPS (port 443)** from the public internet.

#### 4. **Storage (S3 Logs)**:

* Create an **S3 bucket with versioning enabled** for **application logging**.

#### 5. **Database (DynamoDB)**:

* Create a **DynamoDB table** with **on-demand (pay-per-request) capacity mode**.

---

### 🔐 **Compliance & Naming Constraints**:

* Resources must be deployed in **`us-east-1`**.
* **Resource names** must follow this pattern:
  `AppResource-<Stage>-<RandomId>`
* Use **IAM roles** to securely access AWS services.
* Ensure **high availability** through **multi-AZ** deployments.
* Enable **CloudWatch monitoring** on all EC2 instances.
* Avoid exposing unnecessary ports — **only 80 & 443** should be public.

---

### 📦 **Expected Output**:

A **CloudFormation template in valid JSON format** that:

* Provisions all required resources as described.
* Passes CloudFormation validation and is ready to deploy.
* Meets **all functional and security constraints** mentioned above.

---