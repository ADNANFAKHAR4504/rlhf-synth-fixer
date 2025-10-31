Act as a Senior AWS Solutions Architect specialized in building highly available, scalable web platforms using the AWS Cloud Development Kit (CDK) in TypeScript. Your task is to generate a **complete, single-file CDK application** that deploys a resilient web infrastructure for an online bookstore, optimized for performance, scalability, and monitoring.

---
### **Mandatory Infrastructure Requirements:**

1.  **Networking (VPC):** Create a new VPC in `us-east-1` with the CIDR block `10.8.0.0/16`. The VPC must be configured with **two public subnets** (`10.8.1.0/24`, `10.8.2.0/24`) across different Availability Zones (AZs) for high availability.
2.  **Compute & Deployment:**
    * Deploy a minimum of two **EC2 instances** (`t3.small`) running the `Nginx` web server. Use `UserData` to install Nginx and start the service on instance launch.
    * Place the EC2 instances behind an **Auto Scaling Group (ASG)** to manage instance health and scaling.
3.  **Load Balancing & Connectivity:**
    * Deploy an **Application Load Balancer (ALB)** in the public subnets to distribute traffic.
    * Configure Security Groups to allow inbound `HTTP` (port 80) and `HTTPS` (port 443) traffic *only* to the **ALB**.
    * Configure a Security Group for the **EC2 instances** that *only* allows inbound traffic on port 80 from the **ALB's Security Group**, creating a secure, private chain of trust.
    * **Crucial Connection:** Explicitly register the ASG as the target for the ALB's Listener.
4.  **Content & Data:**
    * Create an **S3 Bucket** dedicated to storing application assets (e.g., product images).
    * **Enforce Versioning** on this S3 bucket for data durability and recovery.
5.  **Monitoring & Observability:**
    * Create a **CloudWatch Alarm** that monitors the average `CPU Utilization` metric for the **Auto Scaling Group**.
    * The alarm must trigger (`ALARM` state) when the average CPU usage exceeds **80%** for a minimum of three consecutive periods of five minutes each.

---
### **Expected Output Format:**

Provide a file, executable TypeScript file (`tap-stack.ts`) containing the full CDK stack definition and bin/main.ts. The code must be well-organized, use the latest CDK v2 constructs, and clearly demonstrate the secure flow of traffic from the internet (`ALB`) to the compute layer (`ASG/EC2`) and the integration with the storage (`S3`) and monitoring (`CloudWatch`) services. Include comments for all major resource connections and security rules.