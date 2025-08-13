---

**Prompt:**
You are an expert AWS Infrastructure Engineer specializing in security-focused Infrastructure as Code (IaC) using Terraform.
Design and implement a **secure, scalable, production-grade AWS environment** in the `us-east-1` region for a web application running on Amazon ECS. Your Terraform configuration must:

1. **Networking**:

   * Create a VPC with at least **2 public** and **2 private** subnets, distributed across multiple Availability Zones for high availability.

2. **Security & Access Control**:

   * Apply the **principle of least privilege** for all ECS task IAM roles and other service roles.
   * Configure Security Groups to restrict access by specific IP ranges and necessary ports only.
   * Ensure **no public access** to S3 buckets by default, and enable **versioning** on all buckets.

3. **Data Protection**:

   * Encrypt all data at rest with AWS KMS.
   * Ensure encryption for ECS storage, RDS databases, and S3 buckets.

4. **Compute & Application Hosting**:

   * Deploy an Amazon ECS cluster and services using Terraform modules.
   * Configure **auto scaling** based on load.

5. **Database**:

   * Provision an Amazon RDS instance with **multi-AZ** enabled for high availability.

6. **Monitoring & Logging**:

   * Create a dedicated CloudWatch Logs group and centralize logs from ECS, RDS, and other services.

7. **Tagging & Organization**:

   * Tag all resources with `Environment = Production` and other meaningful identifiers.

**Constraints**:

* All resources must be deployable via Terraform in `us-east-1`.
* capable of successful deployment (`terraform apply`) without manual post-deployment changes.
* Aside from the provider definition, put all other configurations in the `main.tf` file with terraform style comments to group resources.

**Expected Output**:
A complete set of Terraform HCL configuration files meeting all requirements, fully deployable in AWS.

---