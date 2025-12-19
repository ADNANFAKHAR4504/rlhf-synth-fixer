We want to design and deploy a **secure, highly available web app environment** on AWS using **CDK for Terraform (TypeScript)**.  
The setup is originally described as a CloudFormation YAML template, but we’re implementing it in **CDKTF** instead.  

---

## What we want to achieve

- **VPC Setup**  
  - Create a VPC with CIDR `10.0.0.0/16`.  
  - Two **public subnets** (`10.0.1.0/24`, `10.0.2.0/24`).  
  - Two **private subnets** (`10.0.3.0/24`, `10.0.4.0/24`).  
  - Spread across multiple AZs for high availability.  

- **Internet & NAT Gateways**  
  - Attach an **Internet Gateway** for public subnets.  
  - Add a **NAT Gateway** so private subnets can access the internet securely.  

- **Security Groups**  
  - Public subnets → allow only HTTP (80) + HTTPS (443) inbound from the internet.  
  - Database/private subnets → no direct internet access.  

- **EC2 Instances**  
  - Launch one EC2 instance in each public subnet.  
  - Each runs a simple web server (user-data or CFN-init equivalent).  
  - Attach IAM roles that allow logging to CloudWatch.  

- **Monitoring & Logging**  
  - Store EC2 logs in S3 (encrypted at rest).  
  - Enable CloudWatch alarms to monitor CPU usage of at least one EC2.  
  - Ensure logs + alarms follow least privilege IAM policies.  

- **Tagging**  
  - All resources must include tags: `Name`, `Environment`, etc.  

---

## Files to create

- **modules.ts** → Define all infrastructure resources:  
  - VPC, subnets (public + private).  
  - Internet + NAT gateways.  
  - Security groups.  
  - EC2 instances with IAM role for CloudWatch.  
  - S3 bucket (for logs, with encryption).  
  - CloudWatch alarms.  

- **tap-stack.ts** → Glue code:  
  - Import the modules.  
  - Wire up variables like approved CIDRs, AMI IDs, instance types.  
  - Outputs: VPC ID, subnet IDs, EC2 instance IDs, S3 bucket name, CloudWatch alarm ARN.  

---

## Key Requirements

- Region must be **us-west-2**.  
- VPC with 2 public + 2 private subnets, across AZs.  
- Internet Gateway for public traffic.  
- NAT Gateway for private subnet egress.  
- Public subnets only allow 80/443 from internet.  
- Database/private subnets → isolated.  
- EC2 in each public subnet, with IAM role for CloudWatch.  
- CloudWatch alarm on CPU utilization.  
- EC2 logs go to encrypted S3 bucket.  
- All resources tagged properly.  
- IAM policies must follow least privilege.  
- Infrastructure should pass `terraform validate` and `terraform plan`.  

---

## What to deliver

Two TypeScript files:  

1. `modules.ts` → resource definitions.  
2. `tap-stack.ts` → wiring + outputs.  

Both files must include inline comments explaining **why** each piece is configured for security and availability.  

---