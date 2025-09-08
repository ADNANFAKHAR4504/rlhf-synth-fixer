**Prompt to generate `TapStack.yml`:**

Create **one** CloudFormation template named **`TapStack.yml`** (YAML) that builds a brand-new, production-grade web application stack in **us-east-1**. The template must be self-contained (no references to existing resources) and include **Parameters, Mappings (if helpful), Conditions (if helpful), Metadata (Interface groups), Resources, and Outputs** — all in this single file.

### Guardrails (please follow exactly)

* **Do not add any SSL certificate configuration at all.** Skip ACM certificate parameters, validation resources, and HTTPS listener certificate blocks.
* Assume the stack is deployed in **us-east-1** and launch **all EC2** in that region.
* Use **best practices** (HA subnets, least privilege, encryption, logging, tagging, deletion policies).

### What to build (resources & behavior)

1. **Networking (new VPC):**

   * A new VPC (default `10.0.0.0/16`) with **2 AZs** minimum (e.g., `us-east-1a`, `us-east-1b`).
   * **Public subnets** (for ALB), **private app subnets** (for EC2/ASG), **private DB subnets** (for RDS).
   * **IGW**, **NAT Gateway per AZ**, route tables and associations for true HA.
2. **Security Groups (locked down):**

   * **ALB SG**: inbound **80 & 443** from `0.0.0.0/0`; egress all.
   * **App/EC2 SG**: inbound **80** **only from ALB SG**; egress all.
   * **DB SG**: inbound **3306** **only from App/EC2 SG**; egress all.
3. **S3 for application & ALB logs (new bucket):**

   * Block Public Access (all four flags), **server-side encryption (SSE-S3/AES256)**, **versioning enabled**, and a basic lifecycle rule (e.g., move to IA after 30 days, expire after 90 days).
   * Bucket policy must **require TLS (aws\:SecureTransport)** and allow **ALB access logs** writes from the correct AWS ELB log delivery principal for **us-east-1**.
4. **ALB (internet-facing):**

   * Deployed in public subnets, target group (HTTP on port 80), health checks, and **an HTTP (80) listener that forwards to the target group**.
   * **Do not** create or reference any HTTPS listener certificate blocks (intentionally omitted). You may leave a comment noting that an HTTPS listener can be added later once an ACM certificate is available.
5. **EC2 Auto Scaling (high availability):**

   * Use a **Launch Template (not Launch Configuration)** with:

     * **Amazon Linux 2** AMI ID resolved via SSM public parameter
       (`/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`) and set as the **ImageId**.
     * Instance type parameter (default `t3.micro`), key pair parameter (optional).
     * **Detailed monitoring enabled**.
     * Instance profile/role for CloudWatch Logs (see IAM below).
     * **UserData** that: updates packages, installs a simple web server (nginx or httpd), writes a “Hello from TapStack” index page, installs & starts **CloudWatch Agent or CloudWatch Logs** to ship app and web logs; prints instance identity to logs.
   * **AutoScalingGroup** across **private app subnets**, with **MinSize=2, MaxSize=6, DesiredCapacity=2**, health checks integrated with the ALB target group, and rolling update/instance refresh settings that avoid downtime.
6. **IAM for instances (least privilege):**

   * An **IAM Role + Instance Profile** allowing the EC2 instances to **write to CloudWatch Logs** (use managed `CloudWatchAgentServerPolicy` or minimal inline permissions for `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`).
7. **CloudWatch Logs:**

   * Create a **Log Group** (e.g., `/tapstack/app`) with a retention policy (e.g., 30 days).
8. **RDS MySQL (new instance):**

   * Engine **MySQL 5.7 or higher** (prefer **8.0**) with a Parameter Group if needed, **Multi-AZ enabled**, storage encrypted, deletion policy **Snapshot**, performance insights optional, and DB subnet group across the private **DB subnets**.
   * Master username/password via **Parameters** (`NoEcho` on password).
   * Security: Only allow port **3306** from the **App/EC2 SG** (never from the internet).
9. **Tagging (mandatory):**

   * **Every resource that supports Tags** must include at least: `Environment: Production` (and you may also add `Project: TapStack`, `Owner`, etc.).
10. **Outputs (clear & useful):**

* VPCId, PublicSubnetIds, PrivateAppSubnetIds, PrivateDbSubnetIds
* AlbArn, **AlbDnsName**, TargetGroupArn
* AutoScalingGroupName, LaunchTemplateId/LatestVersion
* InstanceRoleArn, InstanceProfileName
* LogsBucketName
* RdsEndpointAddress, RdsArn, DbSubnetGroupName

### Parameters (with sensible defaults & constraints)

* `VpcCidr` (default `10.0.0.0/16`, CIDR pattern validation)
* `AZs` (List[AWS::EC2::AvailabilityZone::Name](AWS::EC2::AvailabilityZone::Name), default two us-east-1 AZs)
* `PublicSubnetCidrs`, `PrivateAppSubnetCidrs`, `PrivateDbSubnetCidrs` (Lists with CIDR validations)
* `InstanceType` (default `t3.micro`, allowed values for common types)
* `KeyName` (AWS::EC2::KeyPair::KeyName, optional)
* `DesiredCapacity` (default `2`, Min=2, Max=6), `MinSize=2`, `MaxSize=6`
* `DbName` (default `tapstack`), `DbUsername` (default `admin`, regex), `DbPassword` (**NoEcho**, min length/complexity),
* `DbInstanceClass` (default `db.t3.micro`), `DbAllocatedStorage` (e.g., default `20`)
* `LogsRetentionDays` (default `30`)
* **No ACM/SSL parameters at all**.

### Other expectations

* Use **DeletionPolicy: Snapshot** on the DB; retain the Log Group (optional).
* Use **Ref/ImportValue/Export** only within this file; no cross-stack references.
* Prefer **intrinsics** (`!Sub`, `!Join`, `!If`, `!FindInMap`) over hardcoding where it improves portability.
* Add a concise **Interface/Metadata** section to group parameters in the console.
* Pass **`Environment: Production`** tag everywhere resources accept tags.

### Validation

* The template must be **valid YAML**, pass **cfn-lint**, and should deploy cleanly in **us-east-1**.
* Remember: **do not include any SSL certificate or ACM configuration**. Only an HTTP (80) listener is created; security groups still allow 80/443 for future HTTPS enablement.

**Deliverable:** Output only the complete **`TapStack.yml`** content (no extra commentary).