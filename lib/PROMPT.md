## Prompt

You are tasked with creating a **two-environment (prod and dev) infrastructure** using Pulumi in Python, implemented entirely in a **single file**.

Requirements:

1. Each environment must have a **unique set of configuration variables and secrets securely stored in AWS Secrets Manager**.
2. The infrastructure should automatically scale based on demand using **AWS Auto Scaling** but only for EC2 instances launched inside a **single VPC spanning exactly two availability zones**.
3. Deploy an **Elastic Load Balancer (ELB)** to distribute traffic across multiple EC2 instances.
4. Use **AWS RDS** with **multi-AZ deployment** for the database layer.
5. All EC2 instances **must use a single AMI ID consistent across both environments** to avoid drift.
6. Use **strict IAM roles enforcing least privilege** for all services and users.
7. Apply consistent **environment-specific tags** for resource tracking.
8. Set up **logging and monitoring via AWS CloudWatch**, including alarms and notifications through **SNS** for critical metrics.
9. Ensure **deployment rollbacks** can occur smoothly using native AWS services.
10. Deploy a simple sample web application that responds differently in **prod** and **dev** environments at a specific endpoint.

---

**Expected output:**  
A fully functional Pulumi Python program in **a single file** that deploys **both prod and dev environments**, uniquely configured as specified above. The program should implement scalable, secure infrastructure with proper secret handling, monitoring, and rollback capabilities, ready to deploy and test.

---
