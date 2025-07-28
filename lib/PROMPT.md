### ✅ Prompt: Production-Grade Cloud Infrastructure Setup with CloudFormation (us-east-1)

**Act as a Solution Architect.**

You are tasked with designing and implementing a production-grade, secure, and highly available AWS infrastructure using **AWS CloudFormation in JSON format**. This infrastructure will support a multi-tier web application deployment and must comply with enterprise-level operational and security standards.

---

### 🔧 Requirements

1. **Region**

   * All resources must be deployed in the **`us-east-1`** AWS region.

2. **VPC & Networking**

   * Create a **VPC** with:

     * Both **public** and **private subnets**, each spread across **two Availability Zones**.
   * Attach an **Internet Gateway** and configure appropriate route tables.
   * Create a **NAT Gateway** in a public subnet to provide **outbound Internet access** for instances in private subnets.
   * Associate route tables properly with each subnet.

3. **Tagging**

   * All resources must be tagged with:

     ```json
     {
       "Key": "Environment",
       "Value": "Production"
     }
     ```

4. **EC2 Instance**

   * Deploy an **EC2 instance** in a public subnet.
   * Assign it an **Elastic IP address**.
   * Attach a **security group** that:

     * Allows **SSH (port 22)** only from a specific IP range (defined via parameter).
     * Allows **HTTP (port 80)** traffic only from a designated web server or load balancer.
   * Associate an **IAM role** if needed for future extensibility.
   * Set up **CloudWatch Alarm** to monitor **CPU Utilization > 80%**.

5. **RDS MySQL**

   * Deploy an **RDS MySQL** instance in the private subnets.
   * Enable **Multi-AZ** for high availability.
   * Use **KMS encryption at rest**.
   * Configure parameters like storage size, backup retention, etc.
   * Ensure only EC2 instance or relevant app tier can access the RDS using security groups.

6. **VPC Flow Logs**

   * Enable **VPC Flow Logs** for all subnets.
   * Store logs in an **S3 bucket** with appropriate logging and permissions.

7. **Parameters**

   * Include parameters for:

     * `VpcCidr`
     * `PublicSubnet1Cidr`
     * `PublicSubnet2Cidr`
     * `PrivateSubnet1Cidr`
     * `PrivateSubnet2Cidr`
     * `KeyName`
     * `InstanceType`
     * `DBInstanceClass`
     * `SSHLocation` (CIDR range for SSH access)

---

### 📤 Expected Output

Submit a single **CloudFormation template in JSON format**, named:

> `production_setup.json`

This template must:

* Be fully valid and executable using AWS CloudFormation CLI or Console.
* Pass all validation checks (e.g., `cfn-lint`, template validator).
* Reflect all infrastructure and constraints mentioned above.
* Follow JSON formatting best practices (indentation, readability, proper use of parameters/conditions/mappings if needed).

---
