You are an **expert DevOps/SRE engineer** skilled in **CDKTF (Cloud Development Kit for Terraform)** and **AWS security-first architecture**. Your task is to generate **idiomatic, production-ready CDKTF TypeScript code** that provisions a **secure, multi-region AWS infrastructure** adhering to advanced security protocols and AWS best practices.

---

## **Objective**

Provision AWS resources in **three regions** — `us-east-1`, `us-west-2`, and `eu-central-1` — ensuring strict security controls, zero unnecessary public exposure, centralized logging, and encryption for all stored and transmitted data.

---

## **Requirements**

### **Networking & VPC Setup**

- Deploy **one VPC per region** with **three subnets**:
  - **Public subnet** – Only for necessary entry points like ALBs, tightly restricted via security groups.
  - **Private subnet** – For application workloads, no direct internet access.
  - **Database subnet** – Fully isolated, accessible only via allowed private traffic.

- Configure **route tables**, **security groups**, and **NACLs** to ensure no resource is directly reachable from the public internet.

---

### **Security & Access Control**

- Integrate **AWS Secrets Manager** or **SSM Parameter Store** for secure storage of sensitive data (e.g., database credentials) and reference them in CDKTF code.
- Implement **least privilege IAM policies** for all roles and services.
- Ensure **encryption at rest and in transit** for all supported resources (S3, RDS, etc.).

---

### **Logging & Monitoring**

- Enable **access logging** for all relevant AWS services (e.g., S3, ALB).
- Create a **centralized S3 bucket** for log storage with defined **retention policies** and **audit access logging**.
- Enable **VPC Flow Logs** for all subnets in every region, storing logs in the centralized logging bucket.

---

### **Tagging & Governance**

- Enforce a **strict tagging policy** for all resources, including:
  - `Environment`
  - `Owner`
  - `Project`
  - `Region`

---

### **Expected Output Structure**

- **Main stack file** (`main.ts` or `stack.ts`) for the overall infrastructure orchestration.
- Separate **CDKTF Constructs** for modularity but keep in same main stack file only:
  - `NetworkingConstruct` – VPCs, subnets, route tables, SGs, NACLs.
  - `SecurityConstruct` – IAM roles/policies, secrets management.
  - `LoggingConstruct` – Centralized logging bucket, VPC flow logs.
  - `StorageConstruct` – Encrypted S3 buckets, encrypted RDS.

- Clear **TypeScript interfaces** for configuration (e.g., CIDR blocks, retention days, subnet sizes).

---

### **Constraints**

- No hardcoded secrets — must pull from AWS Secrets Manager or Parameter Store.
- Must pass `cdktf synth` without errors.
- Must follow AWS **Well-Architected Framework Security Pillar** best practices.

---

## **Deliverables**

- Complete CDKTF TypeScript configuration meeting all requirements.
- Modular code structure for easy scaling and maintenance.
- Validated output using `cdktf synth`, `cdktf plan`, and `cdktf deploy`.
