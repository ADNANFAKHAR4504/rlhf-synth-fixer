We need to design and deploy a **scalable and production-ready AWS web application environment** using **CDK for Terraform (TypeScript)**.  
The original problem was written for CloudFormation in JSON, but here we’ll implement the same requirements using **CDKTF** with clean file separation.  

---

## What we want to achieve

- **Region**  
  - All resources must be deployed in **us-west-2**.  
  - Tag everything with `Environment: Production`.  

- **Elastic Load Balancer (ELB)**  
  - Distribute all inbound traffic across EC2 instances.  
  - Route all DNS traffic via **Amazon Route 53** pointing to the ELB DNS name.  

- **EC2 Instances & Auto Scaling**  
  - Use an **Auto Scaling Group** with min = 2 and max = 5 instances.  
  - Launch configuration must define the **AMI ID** (parameterized) and instance type.  
  - All EC2 instances run the web application.  
  - Attach a **security group** allowing inbound traffic only on port 80 (HTTP).  

- **RDS Database**  
  - Deploy an **RDS instance** in **Multi-AZ mode** for high availability.  
  - Must support replication with a secondary instance.  
  - Ensure the database is **not exposed publicly**.  
  - Store database credentials securely in **AWS Secrets Manager**.  

- **Monitoring**  
  - Use **Amazon CloudWatch** to monitor EC2 instance health and RDS metrics.  
  - Configure alarms for failures or unhealthy states.  

- **DNS**  
  - Route 53 must be configured to route web traffic to the ELB.  
  - Output the **ELB DNS name** as part of the deployment.  

---

## Files to create

- **modules.ts** → Define AWS resources:  
  - VPC + subnets (if required for EC2 and RDS).  
  - Security groups for EC2 + RDS.  
  - IAM roles (EC2 → CloudWatch + Secrets Manager).  
  - ELB (Application or Classic Load Balancer).  
  - Launch Configuration + Auto Scaling Group.  
  - EC2 instances (via ASG).  
  - RDS Multi-AZ database instance.  
  - Secrets Manager resource for DB credentials.  
  - CloudWatch alarms.  
  - Route 53 hosted zone + record set.  

- **tap-stack.ts** → Orchestration:  
  - Import the modules and wire them together.  
  - Pass variables (AMI ID, instance type, DB credentials, domain name, etc.).  
  - Outputs: ELB DNS name, ASG name, RDS endpoint, Secrets Manager ARN.  

---

## Key Requirements

- Region = `us-west-2`.  
- ELB distributes traffic to EC2 instances.  
- Auto Scaling Group (min 2, max 5) with Launch Configuration.  
- Security group for EC2 = allow HTTP (80) inbound.  
- RDS in Multi-AZ with replication, not publicly accessible.  
- Store DB credentials in Secrets Manager.  
- CloudWatch monitors EC2 + RDS health.  
- Route 53 DNS routes to ELB.  
- All resources tagged: `Environment: Production`.  
- Outputs must include ELB DNS name.  
- Code must pass `terraform validate` + `terraform plan`.  

---

## What to deliver

Two TypeScript files:  

1. **modules.ts** → contains all resource definitions.  
2. **tap-stack.ts** → glues them together, sets variables, defines outputs.  

Both must include **inline comments** explaining why certain resources/configurations are chosen (e.g., why Multi-AZ RDS, why Secrets Manager for credentials).  

---