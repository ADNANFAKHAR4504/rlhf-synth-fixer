
# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Development Environment
module "dev_environment" {
  source = "./modules/environment"

  environment          = "dev"
  environment_suffix   = var.environment_suffix
  vpc_cidr             = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, 2)

  instance_type = "t2.micro"

  common_tags = var.common_tags
}

# Staging Environment
# Depends on dev to serialize environment creation for LocalStack
module "staging_environment" {
  source = "./modules/environment"

  environment          = "staging"
  environment_suffix   = var.environment_suffix
  vpc_cidr             = "10.1.0.0/16"
  public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnet_cidrs = ["10.1.10.0/24", "10.1.20.0/24"]
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, 2)

  instance_type = "t2.micro" # Fixed for LocalStack

  common_tags = var.common_tags

  depends_on = [module.dev_environment]
}

# Production Environment
# Depends on staging to serialize environment creation for LocalStack
module "prod_environment" {
  source = "./modules/environment"

  environment          = "prod"
  environment_suffix   = var.environment_suffix
  vpc_cidr             = "10.2.0.0/16"
  public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
  private_subnet_cidrs = ["10.2.10.0/24", "10.2.20.0/24"]
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, 2)

  instance_type = "t2.micro" # Fixed for LocalStack

  common_tags = var.common_tags

  depends_on = [module.staging_environment]
}