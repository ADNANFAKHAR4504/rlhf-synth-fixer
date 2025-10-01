resource_suffix    = "dev"
db_username        = "dbadmin"
# db_password must be injected by the pipeline (as TF_VAR_db_password or via secret file) — DO NOT commit it here
# db_password        = "REPLACE_ME"
db_name            = "application_db"
db_instance_class  = "db.t3.micro"
ec2_instance_type  = "t3.micro"
use_ssm            = true   # recommended for CI-only pipelines (no SSH required)
# If you set use_ssm = false, you MUST provide:
# ssh_cidr_blocks = ["YOUR_PIPELINE_IP/32"]
# ssh_public_key  = "ssh-rsa AAAA... user@host"