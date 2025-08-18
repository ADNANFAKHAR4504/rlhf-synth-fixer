**Role & Instruction:**
You are an expert AWS CloudFormation architect. Your task is to generate a complete **AWS CloudFormation YAML template** that builds a **highly available, secure, and compliant web application infrastructure**. The YAML must be production-ready, follow AWS best practices, and be validated successfully by CloudFormation.

**Environment & Requirements:**
Design an AWS infrastructure stack in the `us-east-1` region that includes:

1. **Networking & Security**

   * Create a new VPC with **public and private subnets** across **two Availability Zones**.
   * Apply strict IAM least privilege policies.
   * Ensure all resources are tagged with `Environment: Production`.
   * Ensure compliance with **PCI-DSS standards**.

2. **Compute & Load Balancing**

   * Deploy an **Auto Scaling Group** with min=2, max=10 EC2 instances.
   * Place EC2 instances behind an **Application Load Balancer (ALB)**.
   * Configure ALB with an **HTTPS listener** using a **custom SSL certificate**.

3. **Database Layer**

   * Deploy an **Amazon RDS PostgreSQL** database in a **multi-AZ setup**.
   * Restrict database access to private subnets only.

4. **Storage & Content Delivery**

   * Create **S3 buckets** with **versioning** and **server-side encryption enabled**.
   * Use **CloudFront CDN** for global traffic distribution.

5. **Configuration & Logging**

   * Store application configs securely in **AWS Parameter Store**.
   * Implement **CloudWatch Logs with lifecycle policies** to manage log retention.

6. **Deployment Pattern**

   * Use a **nested stack approach** for modularity and maintainability.

**Constraints:**

* All resources must be deployed in **us-east-1**.
* Must pass `aws cloudformation validate-template` without errors.
* YAML should be clear, well-structured, and include inline comments.

**Expected Output:**
A **single CloudFormation YAML file** that provisions the above infrastructure and adheres to the defined constraints and compliance requirements.

---