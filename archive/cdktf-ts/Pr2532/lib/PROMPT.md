We need to design and deploy a **secure and scalable cloud environment** on AWS using **CDK for Terraform (TypeScript)**.  
The original requirement was defined in CloudFormation, but we’ll be implementing it in **CDKTF**.  

---

## What we want to achieve

- **VPC Setup**  
  - Create a VPC with CIDR `10.0.0.0/16`.  
  - Add one **public subnet** (`/24`) and one **private subnet** (`/24`).  

- **Networking**  
  - Attach an **Internet Gateway** for the public subnet.  
  - Add a **NAT Gateway** so the private subnet can reach the internet securely.  

- **EC2 Instance**  
  - Launch an EC2 instance in the public subnet.  
  - Use AMI ID `ami-12345678`.  
  - Instance must run with an IAM role that grants **read-only access to S3**.  

- **S3 Bucket**  
  - Create an S3 bucket with **versioning enabled**.  
  - Deny public access (no public ACLs, no bucket policies allowing wide-open access).  

- **Auto Scaling Group**  
  - Configure an ASG with a **desired capacity of 2 EC2 instances** for availability + scalability.  

- **Security Groups**  
  - Public subnet SG → allow **HTTP (80)** + **SSH (22)** inbound.  
  - Restrict everything else to least privilege.  

- **Monitoring**  
  - Set up **CloudWatch alarms** to monitor EC2 CPU usage.  

- **DNS**  
  - Provision a **Route 53 hosted zone** for domain management.  

- **Best Practices**  
  - Apply IAM least privilege across all roles/policies.  
  - Tag resources with project/environment identifiers.  
  - Ensure S3 and other data is encrypted at rest.  

---

## Files to create

- **modules.ts** → Define all AWS resources:  
  - VPC, subnets, Internet + NAT gateways.  
  - Security groups.  
  - EC2 instance (with IAM role).  
  - S3 bucket (with versioning + public access blocked).  
  - Auto Scaling Group.  
  - CloudWatch alarms.  
  - Route 53 hosted zone.  

- **tap-stack.ts** → Glue code:  
  - Import modules.  
  - Wire up variables (AMI ID, subnet IDs, ASG size, etc.).  
  - Outputs: VPC ID, subnet IDs, EC2 instance IDs, S3 bucket name, Route 53 zone ID, CloudWatch alarm ARN.  

---

## Key Requirements

- All resources in **us-east-1**.  
- VPC CIDR = `10.0.0.0/16`.  
- Public + private subnets (`/24` each).  
- Internet Gateway + NAT Gateway configured.  
- EC2 instance (AMI `ami-12345678`) with IAM role for S3 read-only.  
- S3 bucket → versioning enabled + public access denied.  
- Auto Scaling Group → desired capacity = 2.  
- Security Group → allow HTTP + SSH only.  
- CloudWatch alarm → monitor CPU usage.  
- Route 53 hosted zone provisioned.  
- IAM policies follow least privilege.  
- All infra passes `terraform validate` + `terraform plan`.  

---

## What to deliver

Two TypeScript files:  

1. `modules.ts` → defines all resources.  
2. `tap-stack.ts` → handles wiring + outputs.  

Both should include inline comments explaining **security choices and scaling design decisions**.  

---