aws_region      = "us-east-1"
bucket_region   = "us-west-2"
environment     = "staging"
bucket_name     = "devs3-bucket"
localstack_mode = true
bucket_tags = {
  Project     = "ExampleProject"
  Environment = "dev"
  ManagedBy   = "terraform"
}
