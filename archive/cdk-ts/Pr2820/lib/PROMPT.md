You are a **Senior AWS Cloud Architect**. Produce **production-grade AWS CDK (TypeScript, v2)** code and concise documentation.

---

## Goal
Design a **high-availability web application infrastructure** in AWS (**region = us-west-2**) with the following components:

- Application Load Balancer (ALB) distributing traffic to EC2 Auto Scaling Group  
- EC2 instances (`t3.micro`) bootstrapped with **NGINX**  
- RDS MySQL Multi-AZ with credentials in **Secrets Manager**  
- Secure **VPC** with Flow Logs  
- **CloudWatch** monitoring (CPU + memory via CW Agent)  
- **S3 bucket** (versioned, AES-256) for logs with lifecycle → Glacier  
- **CloudFront** caching static S3 content  
- **IAM least-privilege** roles for EC2 (only necessary permissions)  
- **Lambda** scheduled every 12h to snapshot RDS  
- CloudFormation parameters for region & desired instance count  
- Tag all resources with **Environment=Production**  
- Fault tolerance and cost efficiency tradeoffs documented  

---

## Constraints
All of these must be satisfied:

1. Region: **us-west-2 only**  
2. At least one **ALB**  
3. Auto Scaling Group: **min=2, max=5**, desired from parameter (2..5)  
4. EC2: type **t3.micro**, installs & starts **NGINX** via UserData  
5. S3 logs bucket: **versioned + AES-256**  
6. CloudWatch: monitor **CPU & memory** (via CW Agent)  
7. RDS: **MySQL Multi-AZ**, secret stored in **Secrets Manager**  
8. IAM: EC2 can **only** access CW Agent + DB secret  
9. CloudFormation parameters: region + instance count  
10. Tag all resources: `Environment=Production`  
11. VPC Flow Logs enabled  
12. CloudFront distribution fronts S3 static content  
13. Security Groups: inbound **HTTP/HTTPS only**  
14. Lambda: automated **DB snapshot every 12h**  
15. S3 lifecycle policy: logs → **Glacier after N days**  

---

## Output Format
Your response must include exactly these **three sections**:

### 1. SUMMARY
6–10 bullets explaining what resources you are creating and why.

### 2. PROJECT
A **full AWS CDK TypeScript project**, including:
- File tree
- Complete code for each file
- All infrastructure consolidated in `lib/<project>-stack.ts`

### 3. VALIDATION
A checklist mapping each constraint → file & line/code section where it is satisfied.

---

## Quality Bar
- Use **CDK v2 imports** (`aws-cdk-lib/*`)  
- Output **compile-ready TypeScript** (no TODOs, no missing imports)  
- Provide **sensible defaults** and inline comments  
- IAM roles follow **least privilege principle**  
- **Do not** reveal hidden reasoning; only return code & explanations  

---

## Variables (customizable later)
- `project_name`: **ha-webapp**  
- `desired_capacity_default`: **2**  
- `glacier_transition_days`: **30**  