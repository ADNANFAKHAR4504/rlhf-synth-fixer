I need a single CloudFormation template called **TapStack.yml** that I can deploy as a brand-new stack in **us-east-1** without editing anything. Please output only the YAML (no extra commentary). Follow the specs precisely and use current best practices.

### What to build (must-haves)

* **VPC (10.0.0.0/16) in us-east-1** with **at least two AZs** using `Fn::GetAZs` (don’t hardcode AZ names).
* **Public subnets** and **private application subnets**, one of each per AZ (so 2+ public + 2+ private).
* **InternetGateway** + **public route tables** with a default route to the IGW for the public subnets.
* **NAT Gateways (one per AZ)** in each public subnet with dedicated Elastic IPs; **private route tables** defaulting to the NAT in the same AZ (for HA).
* **Security Groups**:

  * **ALB SG**: allow inbound **80 and 443** from the internet (0.0.0.0/0), egress ephemeral open.
  * **App/EC2 SG**: allow inbound **80 only from the ALB SG**; no other inbound. Egress open for package installs.
* **Application Load Balancer (ALB)** spanning the public subnets with:

  * **HTTP listener on 80** forwarding to a target group on port 80.
  * Health check path **/health** (fast-to-pass config).
  * **Access logs to S3** (see bucket below). Don’t require any domain/ACM; this must work out-of-the-box.
* **Auto Scaling Group (preferred) or at least 2 EC2 instances** in the private subnets (across both AZs) behind the ALB:

  * Use a **Launch Template**.
  * **AMI** via SSM dynamic reference (no parameters required), e.g. Amazon Linux 2.
  * **UserData** installs a tiny web app (nginx or httpd), serves a basic index page, and exposes a **/health** endpoint returning 200 quickly.
  * Desired = 2, Min = 2, Max = 4.
* **S3 bucket for ALB access logs**:

  * Block public access, SSE-S3 encryption, bucket policy permitting us-east-1 ALB log delivery account to write (include the correct principal for us-east-1).
  * Prefix for logs (e.g., `alb/`).
* **IAM role + instance profile** for the EC2 instances with an inline policy that allows **read/write to the logs bucket** (ListBucket, GetObject, PutObject on the bucket and its prefix).
  *(Yes, I know ALB itself writes the logs; still grant EC2 R/W per requirement.)*
* **High Availability**: everything spread across at least two AZs, NAT per AZ, multi-AZ ALB, multi-AZ instances/ASG.
* **Tagging (company policy)**: **Tag every resource** with `Environment: Production`.

### Template format & style

* **YAML**, single file named **TapStack.yml**.
* **No external/interactive inputs** needed at deploy time (use sensible defaults and dynamic references).
* Include **Parameters** (with defaults if needed), **Mappings** (if helpful), **Conditions** (if helpful), **Outputs**, and resource **DependsOn** where needed to avoid race conditions.
* Use **intrinsic functions** appropriately (`!Ref`, `!Sub`, `!GetAtt`, `!Select`, `!Split`, `!Join`, `!If`, `!FindInMap`, etc.).
* Avoid nested stacks, transforms, custom resources, or anything that requires manual steps (no ACM validation, no domain, no KeyPair).
* Keep security tight (least privilege IAM, no public exposure to EC2, only via ALB).

### ALB logging bucket policy (region-specific)

* Configure the bucket policy to allow the **us-east-1 ALB log delivery account** to write access logs to `s3://<bucket>/alb/AWSLogs/<account-id>/*`, including the condition that enforces `bucket-owner-full-control` where required.

### Outputs (at minimum)

Provide clear outputs:

* `VpcId`
* `PublicSubnetIds` (comma-joined)
* `PrivateSubnetIds` (comma-joined)
* `AlbDnsName`
* `TargetGroupArn`
* `AutoScalingGroupName` (or instance IDs if you used fixed instances)
* `InstanceRoleArn`
* `LogsBucketName`
* `AlbSecurityGroupId`
* `AppSecurityGroupId`

### Acceptance criteria

* Deploys in **us-east-1** with **no manual edits**.
* ALB health checks pass and the target(s) register healthy.
* Hitting the **ALB DNS** on port 80 returns the app’s index page.
* All resources are **tagged** with `Environment: Production`.
* Uses **at least two AZs** for HA, with **NAT per AZ**, and private subnets routing through the **same-AZ** NAT.
* S3 logging bucket is encrypted, private, and has a correct policy for ALB log delivery in **us-east-1**.
* IAM role and instance profile grant the EC2 instances **read/write** to the logging bucket.

Finally, output only the **TapStack.yml** contents inside a single YAML code block.
