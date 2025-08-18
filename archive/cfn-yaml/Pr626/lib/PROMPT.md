### Prompt: Design and Implement Secure, Highly Available AWS Web App Infrastructure using CloudFormation

You are an AWS Professional Solutions Architect. Create a complete **CloudFormation template in YAML** that provisions a secure, high-availability infrastructure for a web application in the **us-west-2** region. Follow AWS best practices with a strong focus on **security, scalability, and observability**.

### Requirements

Your CloudFormation template must provision the following:

1. **EC2 Instances with Auto Scaling**:

   * Minimum of **2 EC2 instances**.
   * Launch configurations or templates with user data to bootstrap web servers.
   * Attached to an **Application Load Balancer** (ALB).
   * IAM role that allows **access to Amazon S3**, using **least privilege**.

2. **IAM Role**:

   * Attach to EC2 instances.
   * Only allow **read-only access to a specific S3 bucket**.
   * Follow **least privilege** principle strictly.

3. **Amazon RDS (MySQL)**:

   * **Multi-AZ deployment** enabled.
   * Encrypted at rest using **AWS-managed KMS keys**.
   * Deployed in **private subnets** only.
   * Public access disabled.

4. **VPC Configuration**:

   * Create a **custom VPC** with:

     * At least **2 public subnets** (for ALB/EC2).
     * At least **2 private subnets** (for RDS).
     * **NAT Gateway** to allow outbound internet access from private subnets.
     * Proper **route tables** and **Internet Gateway** for public subnets.

5. **Monitoring & Alerts**:

   * Create **CloudWatch Alarms** for:

     * EC2 CPU utilization.
     * RDS CPU/FreeStorageSpace.
   * Configure **SNS topic** and subscription to email alerts to a placeholder address.

6. **Security**:

   * Ensure **encryption at rest** using AWS-managed KMS keys for:

     * EC2 EBS volumes.
     * RDS database.
   * **Security Groups** to isolate web and database tiers.
   * No public access to database layer.

7. **Region**:

   * All resources must be deployed in **us-west-2**.

---

### Expected Output

A **ready-to-deploy CloudFormation YAML template**, conforming to the constraints and requirements above, including:

* Parameterized options for instance types, DB credentials (secure), and subnet CIDRs.
* Logical resource names.
* Outputs for critical infrastructure components (e.g., ALB DNS, RDS endpoint, Auto Scaling Group name).
* Verified structure that **can be deployed without manual post-edits**.

---

### Final Notes

* Adhere strictly to **least privilege IAM practices**.
* Ensure the template is **self-contained**, including dependencies such as IAM policies, subnets, and route tables.
