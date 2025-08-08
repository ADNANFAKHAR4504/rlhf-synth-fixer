**Problem ID:** `PulumiPython_9m7fhw2z3k6j`

You are an expert AWS Cloud Engineer specializing in creating production-grade infrastructure using Pulumi with Python. Your task is to generate a complete infrastructure definition based on the requirements below.

### Objective
Create the AWS infrastructure for a scalable and highly-available web application.

### IaC Specification
* **Tool:** Pulumi
* **Language:** Python
* **AWS Region:** `us-east-1` (This should be configured directly in the Pulumi program).

---

### Core Requirements

1.  **Networking (VPC):**
    * Provision a new default VPC to house all the resources.

2.  **Compute & Auto-Scaling:**
    * Create an EC2 Auto Scaling Group for the web application servers.
    * Configure it to use a standard **Amazon Linux 2 AMI**.
    * Set the instance type to `t3.micro`.
    * Implement an auto-scaling policy that scales the number of instances based on average **CPU utilization**, targeting 50%. The group should scale between a minimum of **1** and a maximum of **3** instances.

3.  **Load Balancing:**
    * Set up an **Application Load Balancer (ALB)** to distribute incoming HTTP traffic evenly across the instances in the Auto Scaling Group.
    * Configure a listener on port 80 and a target group that performs health checks on the instances.

4.  **Monitoring & Alerting:**
    * Create an **SNS Topic** for sending alerts.
    * Implement a **CloudWatch Alarm** that monitors the health of the application. The alarm should trigger and notify the SNS topic if the number of `UnHealthyHosts` in the ALB's target group is greater than or equal to 1 for two consecutive periods of 60 seconds.

---

### Expected Output

Your response must be a single code block containing the complete Python code for the Pulumi program (`__main__.py`). The code must be self-contained, well-commented, and ready for deployment using the `pulumi up` command. Do not include any explanatory text or commands outside of the code itself.Provide the prompt that made the model fail
