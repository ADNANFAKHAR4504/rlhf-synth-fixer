# IaC – AWS Nova Model Breaking  

We need to design and deliver a **fault-tolerant AWS infrastructure** using **CloudFormation** for a critical web application. The deployment should be **production-ready** and built under the project name *“IaC – AWS Nova Model Breaking.”*  

The infrastructure must run across **two AWS regions (us-east-1 and us-west-2)** to ensure both **high availability** and **disaster recovery**. The design should strictly follow AWS best practices around security, scalability, and compliance.  

---

## Scope & Requirements  

### 1. Multi-Region Setup  
- Resources must be distributed across **us-east-1** and **us-west-2**.  
- Implement **Route 53 failover routing** with health checks so that traffic automatically shifts to the healthy region in case of issues.  

### 2. Application Layer  
- Application servers must run in **Auto Scaling Groups** placed behind an **Elastic Load Balancer (ELB)**.  
- Deploy servers inside a **dedicated VPC**, with:  
  - **Public subnets** for the load balancers  
  - **Private subnets** for the application and database tiers  

### 3. Database Layer  
- Use **Amazon RDS** with **Multi-AZ** enabled to provide resilience and redundancy.  
- Databases must be encrypted at rest using **KMS** and enforce **TLS/SSL** for in-transit encryption.  

### 4. Storage & Logging  
- Centralize logs in an **S3 bucket** with:  
  - **Versioning enabled**  
  - **Lifecycle policies** to transition or expire logs securely over time  

### 5. Security Controls  
- Apply **IAM roles and policies** that follow the **least-privilege principle**.  
- Encrypt all sensitive data with **KMS**.  
- Ensure that all traffic is served securely over **SSL/TLS**.  

### 6. Monitoring & Alerts  
- Configure **CloudWatch alarms** for:  
  - Application health and scaling events  
  - RDS performance  
- Alarms should automatically notify the operations team if thresholds are breached.  

---

## Deliverable  

- A **CloudFormation YAML template** that provisions the complete infrastructure above.  
- The template must:  
  - Deploy cleanly without errors  
  - Provide **high availability** and **failover between regions**  
  - Comply with **security best practices** (IAM least privilege, encryption, subnet isolation)  
  - Include **CloudWatch monitoring and alarms**  

The end result should be a **robust, production-ready system** that can handle regional outages gracefully and automatically scale to meet workload demands.  
