**terraform**

###  **Prompt:**

You are an expert Infrastructure-as-Code (IaC) engineer. Generate Terraform HCL code to provision a **multi-environment AWS infrastructure** following these **strict requirements**:

---

### **Constraints (DO NOT VIOLATE)**

1. **Environment State Separation**

   * Use separate state files for `development`, `staging`, and `production`.
   * Ensure **no cross-environment state leakage**.

2. **VPC Structure**

   * All environments must share a consistent VPC layout with:

     * 1 VPC per environment
     * 3 subnets: `public`, `private`, and `database` per environment.

3. **Modularization**

   * Use **Terraform modules** to encapsulate shared configurations (e.g., VPC, EC2, S3, IAM).
   * Allow **overrides** using variables and environment-specific `.tfvars` files.

4. **IAM Roles**

   * Define **least-privilege IAM roles** for each environment (no broad admin policies).
   * Use separate IAM resources per environment.

5. **EC2 Configuration**

   * Provision **environment-specific EC2 instances**.
   * Instances must attach to the correct subnet (public/private depending on use case).
   * Use **user\_data** to bootstrap per environment.

6. **Security Groups**

   * Define **custom security groups** for each environment.
   * Only allow required inbound/outbound traffic (no open 0.0.0.0/0 unless justified).
   * Use Terraform `ingress`/`egress` blocks appropriately.

7. **S3 Buckets**

   * Create an environment-specific S3 bucket.
   * Enforce **encryption at rest** using AES-256 or KMS.
   * Enable versioning and apply **lifecycle rules** to delete old objects in dev/staging.

8. **Logging and Monitoring**

   * Enable **AWS CloudWatch** for EC2, VPC flow logs, and S3 bucket access logs.
   * Configure CloudWatch log groups with proper retention policies per environment.

9. **Tagging Convention**

   * Tag all resources using:

     * `Environment`: `development` / `staging` / `production`
     * `Owner`, `Service`, `CostCenter`, etc.
     * Use consistent tag structure across all environments.

10. **Validation and Quality**

    * All code must pass:

      * `terraform validate`
      * `terraform plan` (no errors)
    * Avoid hardcoding values; use `locals`, `variables`, or `.tfvars`.

---

### **Environment Overview**

* Platform: AWS
* IaC Tool: Terraform (HCL format only)
* Environments: `development`, `staging`, `production`
* Core Services:

  * VPC
  * EC2
  * S3
  * IAM
  * CloudWatch

---

### **Expected Output:**

* Terraform configuration files:

  * `main.tf`, `variables.tf`, `outputs.tf`, `provider.tf`
  * `modules/` directory (for VPC, EC2, IAM, S3)
  * `.tfvars` files for each environment
* Backend configuration (preferably using S3 and DynamoDB for state locking)
* Readable, reusable, DRY, and validated Terraform HCL
* All outputs must be consistent with the original constraint set above