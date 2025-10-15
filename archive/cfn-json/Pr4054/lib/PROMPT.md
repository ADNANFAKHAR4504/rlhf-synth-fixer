**Goal:**
Write a production-ready **AWS CloudFormation template in JSON** that stands up a multi-AZ, multi-tier environment and can be replicated across environments. **Do not include ACM, AWS Config rules, or Config recorders.**

**Requirements (build all of these):**

1. **Networking**

* Create a VPC with CIDR **10.0.0.0/16**.
* Create **three subnets**, each in a **different AZ**. Tag/label them clearly as **Public** or **Private**. Public subnets must have `MapPublicIpOnLaunch: true`.
* Create and attach an **Internet Gateway**.
* Create **one NAT Gateway** (with EIP) in a **public** subnet.
* Add **route tables**: public route table routes `0.0.0.0/0` to IGW; private route table routes `0.0.0.0/0` to the NAT.

2. **Compute**

* Launch **two EC2 instances** using a recent Amazon Linux 2 AMI (pull from SSM Parameter Store):

  * **Public EC2** in a public subnet.
  * **Private EC2** in a private subnet.
* Security groups must **allow HTTP (80) and HTTPS (443)** ingress for **both** instances. (Note: the private instance won’t be publicly reachable, but keep the rules as specified.)
* Create an **Application Load Balancer** in the public subnets with a target group pointing to the **public EC2**; add an HTTP (80) listener (you may include a placeholder for HTTPS 443 if needed, but do **not** integrate ACM).
* Attach an **IAM role + instance profile** to **both EC2 instances** with least-privilege permissions to read/write to the backup S3 bucket.

3. **Database**

* Provision an **RDS MySQL** DB instance in **private subnets** using a **DB Subnet Group**.
* Set **BackupRetentionPeriod ≥ 7 days**.
* Create an RDS security group that **only allows inbound 3306 from the private EC2 instance security group**.
* Ensure the **public EC2 can access the RDS** without opening RDS to the world (e.g., through application routing or tunneling via the private EC2; do not broaden the RDS SG beyond the private EC2 SG).

4. **Monitoring & Logging**

* Create **CloudWatch Alarms** for **both EC2 instances**: alarm when **CPUUtilization ≥ 80%** over a reasonable evaluation period (e.g., 2 of 5 minutes).
* Enable **VPC Flow Logs** and send them to **CloudWatch Logs** (include the required IAM role/policy and a Log Group).

5. **Storage**

* Create an **S3 bucket for backups** with **SSE-S3 (AES-256)** encryption enabled. Add a bucket policy that **requires** SSE-S3 on writes.

6. **Connectivity**

* Create a **VPN Gateway** (Virtual Private Gateway) and **attach it** to the VPC (no customer gateway or tunnels needed in this template).

**Tagging:**

* **Tag every resource** (where supported) with `Environment: Production`. Also add sensible `Name` tags (e.g., `Public-Subnet-A`, `Private-Subnet-B`, etc.).

**Template quality & operability:**

* Use parameters where sensible (e.g., `EnvironmentName`, `InstanceType`, optional `KeyPairName`, `DBInstanceClass`, `DBName`, `DBUsername`, `DBPassword` as NoEcho).
* Use `Fn::GetAZs` + `Fn::Select` to pick three different AZs.
* Create meaningful **Outputs** (VPC ID, Subnet IDs, ALB DNS name, Instance IDs, DB endpoint, S3 bucket name, etc.).
* Ensure the template **validates and deploys without errors**.

**Output:**

* Return a **single CloudFormation JSON template** that implements all of the above, production-ready, with clear logical IDs and comments where helpful.
