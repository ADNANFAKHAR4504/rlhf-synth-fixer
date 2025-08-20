You are an expert **DevOps/SRE engineer** specializing in **CDKTF (Cloud Development Kit for Terraform)** and **enterprise-grade AWS infrastructure management**. Your task is to **refactor and optimize** an existing Terraform configuration (expressed in CDKTF TypeScript) to meet **expert-level practices** and ensure **future-proof infrastructure management**.

---

## **Objective**

Refactor the existing configuration into a **modular, secure, and maintainable CDKTF setup** while implementing **remote state management**, **naming conventions**, and **lifecycle protections** for critical resources. The goal is to produce **production-ready infrastructure code** that is easy to manage across multiple environments.

---

## **Requirements**

### **1. Remote State Management**

- Configure a **secure remote backend** using AWS S3 for state storage and DynamoDB for state locking.
- Apply **access control** to prevent unauthorized reads or writes to the state file.
- Use environment-specific S3 buckets and DynamoDB tables for isolation.

---

### **2. Modularization**

- Refactor existing resources into **reusable CDKTF Constructs** for better organization and maintenance.
- At a minimum, create the following constructs:
- `NetworkingModule` VPC, subnets, route tables, and gateways.
- `ComputeModule` EC2 instances, Auto Scaling Groups, and Launch Templates.
- `DatabaseModule` RDS instances and related resources.

- Each module should accept **TypeScript interfaces** for configuration (e.g., CIDR blocks, instance sizes, tags).

---

### **3. Lifecycle Policies**

- Implement `lifecycle` rules for critical resources (e.g., VPC, RDS, IAM roles) to:
- Prevent accidental deletion (`prevent_destroy = true`).
- Allow scaling or updates without downtime.

---

### **4. Naming Conventions**

- Apply a **consistent and descriptive naming standard** for all resources:
- Format: `{env}-{resource-type}-{unique-id}` (e.g., `prod-vpc-001`, `dev-db-002`).
- Ensure the convention is enforced across all constructs by centralizing the naming logic.

---

## **Expected Output Structure**

- **Main Stack File** (e.g., `main.ts`) instantiating the monolith constructs for all modules.
- **Required Modules**:
- `networking-module`
- `compute-module`
- `database-module`

- **Backend Configuration File** (S3 + DynamoDB) for remote state.
- All code must be **syntactically correct**, **TypeScript CDKTF idiomatic**, and pass:
- `cdktf synth`
- `terraform validate`
- `terraform plan`

---

## **Deliverables**

- CDKTF TypeScript code implementing:
- **Secure remote state** with AWS S3 + DynamoDB.
- **Reusable modules** for Networking, Compute, and Database.
- **Lifecycle protections** for critical resources.
- **Naming convention enforcement** across all resources.

- No hardcoded secrets or credentials.
- Assume AWS provider credentials are configured via `~/.aws/credentials` or environment variables.
