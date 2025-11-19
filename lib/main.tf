module "payment_app" {
  source = "./modules/payment-app"

  environment             = var.environment
  pr_number               = var.pr_number != "" ? var.pr_number : var.environment
  aws_region              = var.aws_region
  vpc_cidr                = var.vpc_cidr
  db_instance_class       = var.db_instance_class
  ec2_instance_type       = var.ec2_instance_type
  backup_retention_period = var.backup_retention_period
  rds_cpu_threshold       = var.rds_cpu_threshold
  instance_count          = var.instance_count
  db_username             = var.db_username
  db_password             = var.db_password
  ssh_key_name            = var.ssh_key_name
  ami_id                  = var.ami_id
  certificate_arn         = var.certificate_arn
  alb_internal            = var.alb_internal
}