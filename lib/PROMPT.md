### ✅ Prompt: CloudFormation Template for Scalable Web Application Deployment (us-east-1)

You are an experienced AWS Cloud Architect tasked with developing a **CloudFormation YAML template** to provision a scalable and secure web application infrastructure. The deployment must meet the following **explicit requirements and constraints**:

---

### 🔧 Environment Specifications:

1. **Region**: All resources must be deployed in `us-east-1`.
2. **Compute**:

   * Use **EC2 instances** behind an **Application Load Balancer (ALB)** to handle incoming web traffic.
   * Instances must be launched in an **Auto Scaling Group** with:

     * **Minimum** capacity: `2`
     * **Maximum** capacity: `5`
     * A **launch template** or configuration using a **predefined AMI ID** (suitable for your web app).
3. **Load Balancer**:

   * Set up an **Application Load Balancer** that distributes traffic across at least **two EC2 instances**.
4. **Storage**:

   * Provision an **S3 bucket** to serve the application's **static content** (e.g., HTML, CSS, JS).
   * Enable **public read access** to allow users to access static assets via the web.
5. **Monitoring**:

   * Set up **CloudWatch alarms** that monitor the **CPU utilization** of the EC2 instances.
   * Alarms must **trigger notifications** when CPU usage exceeds **80%**.

---

### ⚙️ Constraints:

* **Region Constraint**: All resources must strictly reside in the `us-east-1` region.
* **Scalability**: EC2 instances must scale between 2 and 5 nodes.
* **Security & Best Practices**:

  * Use IAM roles where required.
  * Apply least-privilege principles.
  * Avoid hardcoding sensitive data.
* **Static Hosting**: S3 must be configured for **public website hosting** and accessible via direct HTTP requests.
* **Monitoring**: Alarms must be properly configured to respond to thresholds and integrated with SNS or another notification mechanism.

---

### 📦 Expected Output:

* A **validated CloudFormation YAML template** that successfully deploys the above environment.
* Deployment should complete **without errors** and meet **all specified constraints precisely**.
* The template should follow **AWS best practices** for **scalability, fault tolerance, and security**.

---

Would you like a template generated for this now? Or should I help break this into modular stacks (VPC, EC2, ALB, S3, CloudWatch) for better maintainability?
