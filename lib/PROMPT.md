You are an expert Terraform engineer. Using Sonnet best prompt practices, generate one single Terraform file named main.tf (no extra files or modules) that fully implements the infrastructure described below, ready to run with Terraform v1.x and the AWS provider. Produce only the complete Terraform HCL contents (no extra explanation, no chatty preface). Include comments inside the file where helpful.

High-level goal (translate original CloudFormation goal into Terraform):
Build a secure, production-ready web-application stack in us-east-1 with all resources tagged Environment = "Production". The final file must satisfy every constraint below and follow AWS security best practices (least privilege, private DB subnets, minimal open ports, etc.). Also include outputs for important resources (ALB DNS, web server public IP, RDS endpoint).

Hard constraints (must be implemented exactly):

All resources must be created in the us-east-1 region.

All resources must be tagged with Environment = "Production" (apply tags uniformly).

VPC CIDR must be 10.0.0.0/16.

Create a public subnet with CIDR 10.0.1.0/24 for the EC2 web server.

Create a private subnet with CIDR 10.0.2.0/24 for the RDS instance.
Note: Because Multi-AZ RDS requires subnets in at least two AZs, also create an additional private subnet 10.0.3.0/24 in a second AZ and place the RDS DB subnet group across the private subnets. Keep 10.0.2.0/24 as the primary private subnet per the original requirement.

Web server EC2 instance must have an attached IAM role granting S3 read-only access (least privilege policy for s3:GetObject, s3:ListBucket on relevant resources). Do not give unnecessary permissions.

Configure an Application Load Balancer (ALB) to distribute HTTPS traffic to the web server. ALB must:

Use HTTPS listener with an ACM certificate. Because ACM certificate issuance often requires domain validation, do not attempt to auto-provision a validated public certificate; instead accept an input variable var.acm_certificate_arn and use it for the ALB listener. Document (in a comment) that the user must supply a valid ACM cert ARN in us-east-1.

Use a Target Group and register the EC2 instance.

Health checks appropriate for a typical web server (HTTP path /, interval/sample settings).

RDS PostgreSQL instance:

Engine: Postgres (specify a recent minor version, e.g., 13.7 or similar).

Place RDS in the private subnets via a DB subnet group across the 10.0.2.0/24 and 10.0.3.0/24 private subnets.

Ensure Multi-AZ is enabled.

The database must only accept incoming connections from the web server security group (i.e., DB SG inbound allows only web server SG on port 5432).

Use CloudWatch to monitor ALB and RDS:

Enable ALB access logging to an S3 bucket (create bucket) and create a CloudWatch metric filter or at least enable standard ALB metrics (the AWS provider ALB provides metrics automatically — also add an example aws_cloudwatch_metric_alarm for high CPU on the web server or high DB CPU).

For RDS enable enhanced monitoring and export relevant logs/metrics to CloudWatch.

Follow AWS security best practices:

Do not open 0.0.0.0/0 to the DB port.

Limit inbound SSH to a variable var.my_allowed_cidr (default could be your IP CIDR, but require it as a variable).

Use aws_iam_role + aws_iam_policy attachments for least-privilege S3 read-only.

Use default_tags in the provider to apply Environment = "Production" to all resources.

Implementation details & requirements for the single file:

Provide a terraform block with required provider constraints and required_version.

Configure the AWS provider to region = "us-east-1" and use default_tags to apply the Environment tag.

Expose variables at the top of the file for:

var.vpc_cidr (default 10.0.0.0/16)

var.public_subnet_cidr (default 10.0.1.0/24)

var.private_subnet_cidr_primary (default 10.0.2.0/24)

var.private_subnet_cidr_secondary (default 10.0.3.0/24)

var.acm_certificate_arn (no default — required)

var.key_pair_name (EC2 key pair name to allow SSH)

var.instance_ami (AMI id; default comment instructing to choose an Amazon Linux 2 or other secure image in us-east-1)

var.instance_type (default t3.micro or t3.small)

var.rds_username, var.rds_password (sensitive) and var.rds_allocated_storage

var.my_allowed_cidr (for SSH; no default or set to "0.0.0.0/0" only if user intentionally wants it)

Create resources in a secure minimal way (NAT gateway only if necessary — for this exercise you can avoid creating a NAT if not required; but ensure RDS has no public accessibility).

Generate a minimal user-data script for the EC2 instance that installs a simple web server (e.g., nginx) and registers with the ALB target group health check. Keep secrets out of user-data other than templated DB connection info via placeholder.

Create Security Groups:

sg_alb allowing inbound 443 from 0.0.0.0/0 (HTTPS) and optionally 80 → redirect to 443.

sg_web allowing inbound 443 and 80 from sg_alb (or allow from ALB via target group), allow SSH only from var.my_allowed_cidr, outbound to the internet as needed.

sg_db allowing inbound 5432 only from sg_web's Security Group ID, outbound minimal.

RDS: publicly_accessible = false, multi_az = true, skip_final_snapshot = false (or comment why snapshot settings are chosen), enable monitoring_interval and monitoring_role_arn (create an IAM role for enhanced monitoring) and set performance_insights_enabled = true.

ALB: create listeners, target group, listener rule to forward to instance target. Use HTTPS listener with var.acm_certificate_arn.

CloudWatch: add at least two example alarms (one for ALB 5xx rate or target unhealthy hosts, one for RDS CPU > 80%) using aws_cloudwatch_metric_alarm resources. Also enable ALB access logging to an S3 bucket (create aws_s3_bucket and required bucket policy).

Add outputs for alb_dns_name, web_instance_public_ip, rds_endpoint_address, rds_endpoint_port.

Add inline comments that indicate where the operator must supply real values (AMI, ACM certificate ARN, key pair).

Ensure resource attribute names and references are correct and consistent (e.g., SG referencing, subnet associations, DB subnet group).

Testing / validation requirement (in the same single file):

In comments at the bottom of the file include exact terraform CLI commands to run to validate the deployment, for example:

terraform init

terraform validate

terraform plan -var 'acm_certificate_arn=arn:aws:acm:...' -var 'key_pair_name=...' -var 'my_allowed_cidr=YOUR_IP/32' -var 'rds_password=...'

Also include a short inline null_resource with local-exec (optional) that runs aws sts get-caller-identity for a quick sanity check during apply — but keep this optional and clearly commented.

Important:

Produce only the single Terraform file content as HCL. Do not output CloudFormation or Python code — the user explicitly wants Terraform in a single file. Do not ask clarifying questions; assume us-east-1 and the variables above.

Where real-world actions require pre-existing resources (for example, a valid ACM cert for the domain), do not attempt to bypass domain validation — use a variable for the certificate ARN and explain only via comment that the ARN must be in us-east-1.

Keep IAM policies minimal and scoped to only the required S3 read operations.

Now generate the single main.tf file implementing all of the above.