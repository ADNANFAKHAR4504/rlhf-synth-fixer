### Prompt

You are an expert AWS DevOps and Terraform engineer.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** that provisions a **cross-region disaster recovery (DR) solution** for a **mission-critical financial trading platform** running on **ECS with Aurora PostgreSQL**.  

All code must include:  
- **Variable declarations** (with default values where applicable)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file that defines AWS provider configuration using a variable named `aws_region`.  
Ensure the Terraform code correctly references this `aws_region` variable throughout.  

This must be a **brand new stack**, meaning:  
- Create all infrastructure modules from scratch (no references to existing resources).  
- Do not use any pre-existing or remote modules.  
- Terraform logic must precisely match what is needed for this scenario.  

Follow **AWS Well-Architected Framework best practices** for **high availability**, **disaster recovery**, and **secure automation**.  

---

### Business Use Case

A **financial services company** operates a **containerized trading platform** on **ECS** and must remain operational even during a **regional AWS outage**.  
The system must support **automated failover**, ensuring:  
- **RTO (Recovery Time Objective)** < 15 minutes  
- **RPO (Recovery Point Objective)** < 1 minute  
- **No manual intervention required during failover**  

The DR solution must include **Blue/Green deployment strategy** and allow **failover testing** without impacting production traffic.  

---

### Required Infrastructure Components

1. **Regions**
   - **Primary region:** `us-east-1`  
   - **Secondary (DR) region:** `us-west-2`  
   - Terraform must use multiple AWS providers with region aliases (`primary` and `secondary`).  

2. **Networking (VPC & Connectivity)**
   - Create **VPCs** in both regions (CIDR: `10.0.0.0/16`).  
   - Public and private subnets across at least **two AZs** per region.  
   - Include **Internet Gateways**, **NAT Gateways**, and proper **Route Tables**.  
   - Configure **VPC Peering or Transit Gateway** for secure cross-region communication.  

3. **Database Layer**
   - Deploy **Aurora PostgreSQL Global Database** with primary cluster in `us-east-1` and secondary cluster in `us-west-2`.  
   - Enable **cross-region replication** with <1 minute RPO.  
   - Enforce **KMS encryption at rest** and **TLS for in-transit encryption**.  
   - Automatic backups and **Point-in-Time Recovery** enabled.  

4. **ECS Clusters (Fargate)**
   - Create **ECS clusters** in both regions using **Fargate launch type**.  
   - Deploy **containerized microservices** representing the trading platform.  
   - Integrate ECS services with **Application Load Balancers (ALB)** for request distribution.  
   - Blue/Green deployment support using **AWS CodeDeploy or ECS Deployment Controllers**.  

5. **Application Load Balancers**
   - Create **ALBs** in both regions.  
   - Configure health checks for ECS services.  
   - Use **HTTPS (port 443)** with ACM-managed certificates.  

6. **DynamoDB Global Tables**
   - Implement **DynamoDB Global Tables** to synchronize **user sessions and trade states** across both regions.  
   - Enable **auto-scaling** and **KMS encryption**.  

7. **Route 53 & Failover**
   - Use **Route 53 health checks** for ECS endpoints.  
   - Configure **DNS failover policies** for automated traffic redirection to DR region.  
   - Health checks must trigger failover within **minutes of outage detection**.  

8. **CloudWatch, Alarms & Lambda Automation**
   - Enable **CloudWatch metrics and alarms** for ECS, Aurora, and ALBs.  
   - Create **Lambda functions** triggered by health check events or CloudWatch alarms to automate failover.  
   - Send **SNS notifications** for all failover or health events (KMS-encrypted topics).  

9. **Security & IAM**
   - IAM roles must use **least privilege** principles.  
   - Enable **CloudTrail** for auditing all resource actions.  
   - All resources encrypted at rest (KMS) and in transit (TLS).  
   - Security Groups must follow default-deny rules, allowing only required ports.  

10. **Blue/Green Deployment**
    - Include **ECS Blue/Green setup** for zero-downtime deployments.  
    - Provide a mechanism to **simulate failover testing** without production downtime.  

11. **Tagging**
    - All resources must include tags:  
      - `Environment`  
      - `Owner`  
      - `Project`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all variables, logic, and outputs.  
- Creates all AWS resources and modules from scratch.  
- Implements a **multi-region ECS architecture** with automated DR failover.  
- Ensures **RTO < 15 minutes** and **RPO < 1 minute**.  
- Enables **Blue/Green deployment** and **non-impactful failover testing**.  
- Adheres to **AWS best practices** for **security**, **resilience**, and **automation**.