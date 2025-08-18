We need to build a **highly available and resilient AWS web application environment** using CDK for Terraform (TypeScript).  
The implementation should be structured into two files:

1. `modules.ts`  
   - Define all core infrastructure modules:
     - **VPC** spanning at least three Availability Zones.  
     - **Elastic Load Balancer (ELB)** for distributing incoming traffic across multiple AZs.  
     - **Auto Scaling Groups (ASG)** to manage EC2 instances across three AZs.  
     - **RDS (Multi-AZ enabled)** for the relational database layer with automated backup configuration.  
   - Add inline comments explaining each resource and how it contributes to high availability and failure recovery.  

2. `tap-stack.ts`  
   - Import and instantiate the modules defined in `modules.ts`.  
   - Wire variables for AZ selection, instance types, scaling thresholds, and DB configuration.  
   - Ensure outputs are defined for critical resources like ELB DNS name, RDS endpoint, and Auto Scaling Group details.  
   - No hardcoded credentials — use variables or secret references.  

---

### Requirements
- **Region:** us-east-1.  
- **RDS:**  
  - Multi-AZ enabled.  
  - Automated backups with a **minimum 7-day retention period**.  
- **Elastic Load Balancer (ELB):**  
  - Must balance traffic evenly across at least **three AZs**.  
- **Auto Scaling Groups (ASG):**  
  - Must scale EC2 instances dynamically.  
  - Instances must be spread across at least **three AZs**.  
- **High Availability:**  
  - The entire system must survive the failure of any single AZ without downtime.  

---

### Deliverables
- `modules.ts`: Resource definitions for VPC, ELB, ASG, RDS with comments.  
- `tap-stack.ts`: Composition file that sets variables, instantiates modules, and declares outputs.  
- Code must be valid CDKTF TypeScript, passing `terraform validate` and `terraform plan`.  

---

### Expectations
- Apply AWS best practices for HA and DR.  
- Keep modules reusable and cleanly separated.  
- Comment on architectural choices, especially how resilience and failover are handled.  
- Ensure the resulting infrastructure matches CloudFormation equivalent requirements but is implemented in **CDKTF TypeScript**.  
