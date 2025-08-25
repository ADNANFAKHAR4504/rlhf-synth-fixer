# Prompt.md

Design and deliver a **fault-tolerant AWS infrastructure** using **CloudFormation** for a critical web application under the project name **“IaC – AWS Nova Model Breaking.”**  

The environment must span **two AWS regions (us-east-1 and us-west-2)** to achieve **high availability** and **disaster recovery**. The system should follow AWS best practices for security, scalability, and compliance.  

### Key Requirements
1. **Multi-Region Architecture**  
   - Distribute resources across **us-east-1** and **us-west-2** for automatic failover.  
   - Implement **Route 53 DNS failover routing** with health checks to direct traffic to healthy regions.  

2. **Application Layer**  
   - Deploy application servers in **Auto Scaling Groups** behind an **Elastic Load Balancer (ELB)**.  
   - Application servers must run inside a **secure VPC** with **public subnets** (for load balancers) and **private subnets** (for app/database).  

3. **Database Layer**  
   - Use **Amazon RDS with Multi-AZ deployment** for resilience and redundancy.  
   - Ensure encryption at rest with **AWS KMS** and enforce **TLS/SSL in transit**.  

4. **Storage & Logging**  
   - Centralize logs in an **S3 bucket** with:  
     - **Versioning enabled**  
     - **Lifecycle policies** to transition/expire logs securely  

5. **Security**  
   - Enforce **IAM roles and policies** with **least-privilege access**.  
   - All sensitive data must be encrypted with **KMS** and served over **SSL/TLS**.  

6. **Monitoring & Alerts**  
   - Use **CloudWatch alarms** to monitor system health, scaling events, and RDS performance.  
   - Alarms should notify operators automatically when thresholds are breached.  

### Expected Output
- A **CloudFormation YAML template** that provisions all resources according to the above requirements.  
- The template must successfully deploy without errors and pass validation for:  
  - **High availability**  
  - **Disaster recovery readiness**  
  - **Security compliance** (IAM least privilege, encryption, subnet isolation)  
  - **Operational monitoring** (CloudWatch alarms)  

The final solution should be **production-ready**, robust against regional outages, and capable of handling **scaling workloads** automatically.
