I’m working in AWS, region us-west-2, and I need a single Terraform file called `main.tf` that sets up the full stack for an app.  
The AWS provider is already in `provider.tf` and reads `var.aws_region`, so in `main.tf` just declare `variable "aws_region"` with default `"us-west-2"`. Don’t add another provider block.

Everything needs to be self-contained in `main.tf`: variables, locals, resources, IAM, data sources, outputs — all of it. No pulling in registry modules. Tag everything with `project` (default `"iac-nova-model-breaking"`) and `environment` (default `"dev"`) plus a Name tag like `<project>-<env>-<suffix>`. Use a local like `local.name_prefix` for naming and `local.common_tags` for tags.

### Networking
Create a fresh VPC (DNS hostnames/support on) with 2 public and 2 private subnets split across at least two AZs in us-west-2 (use `data aws_availability_zones`). Public subnets route to an IGW, private subnets route to a NAT gateway (one per AZ is fine). Proper route tables for each.  

### Load balancer & compute
ALB in the public subnets, with HTTP target group and health check, listener on port 80. ALB SG should allow 80 and 443 from 0.0.0.0/0.  
Behind that, an Auto Scaling Group in the private subnets, using a Launch Template.  
AMI should be the latest Amazon Linux 2023 via SSM parameter.  
User data: install nginx, write a simple `index.html` that shows the instance ID from metadata, install and run CloudWatch Agent sending syslog and nginx logs to CloudWatch Logs. Ideally fetch the agent config from SSM, but inline JSON is fine too.  
ASG min=2, desired=2, max=4, instance refresh enabled on template change. Target group attached.

### Database
RDS PostgreSQL (Multi-AZ), recent stable version 14 or 15. Encrypted storage (AWS-managed OK), backup retention at least 7 days, auto minor version upgrades, log exports for `postgresql` (and `upgrade` if supported). Small burstable class like `db.t4g.micro`. Deletion protection on. Use a subnet group with the private subnets only. RDS SG allows inbound 5432 only from the EC2 SG.

### Security / IAM
Create an EC2 instance role and profile with these managed policies: `AmazonSSMManagedInstanceCore` and `CloudWatchAgentServerPolicy`.  
Add an inline policy allowing SSM parameter reads for the path `/app/${local.name_prefix}/` and `kms:Decrypt` for the `alias/aws/ssm` key (get its ARN via data source). Only those actions.

### SSM parameters
Make three parameters:  
- `/app/${local.name_prefix}/app/config_json` (type String, example JSON)  
- `/app/${local.name_prefix}/db/username` (String)  
- `/app/${local.name_prefix}/db/password` (SecureString)  

Generate the password using `random_password` and use it in both the SSM param and RDS master password.

### CloudWatch logs
Log groups for the app (EC2 logs) and RDS logs, retention ~30 days. If RDS will create its own, pre-create to set retention.

### Security groups
ALB SG: inbound 80/443 from anywhere, outbound open.  
EC2 SG: inbound 80 from ALB SG, outbound open.  
RDS SG: inbound 5432 from EC2 SG.

### Variables (with defaults)
- `aws_region` = `"us-west-2"`
- `project` = `"iac-nova-model-breaking"`
- `environment` = `"dev"`
- `vpc_cidr` = `"10.0.0.0/16"`
- `public_subnet_cidrs` and `private_subnet_cidrs` = two /24 blocks each
- `instance_type` = `"t3.micro"` (or `t4g.micro` if arm64)
- `asg_min_size`=2, `asg_desired_capacity`=2, `asg_max_size`=4
- `db_instance_class` = `"db.t4g.micro"`, `db_name` = `"appdb"`, `db_username` = `"appuser"`
- `log_retention_days` = 30

### Outputs
Need outputs for:  
- VPC ID  
- Public and private subnet IDs  
- ALB DNS name  
- ASG name  
- RDS endpoint address  
- The SSM parameter names or ARNs  
- Security group IDs for ALB, EC2, and RDS

No placeholders. Defaults should work in a fresh account (`terraform init && plan && apply`).
