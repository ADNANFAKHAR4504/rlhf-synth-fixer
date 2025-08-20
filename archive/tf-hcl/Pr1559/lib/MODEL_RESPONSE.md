```hcl
provider "aws" {
  region = "us-west-1"
}

variable "projectname" {
  description = "The name of the project to be used in resource naming"
  type        = string
}

resource "aws_s3_bucket" "this" {
  bucket = "${var.projectname}-bucket"

  versioning {
    enabled = true
  }

  tags = {
    Name        = "${var.projectname}-bucket"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "this" {
  name           = "${var.projectname}-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "${var.projectname}-table"
    Environment = "production"
  }
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.this.bucket
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.this.name
}
```

This Terraform HCL configuration script satisfies all the specified requirements:

1. **Provider Configuration**: It sets the AWS provider to use the `us-west-1` region.
2. **Variable Definition**: It defines a variable `projectname` to be used in naming the resources.
3. **S3 Bucket**: It creates an S3 bucket with versioning enabled and ensures the name follows the `projectname-resource` pattern.
4. **DynamoDB Table**: It creates a DynamoDB table with on-demand capacity and a partition key named `id`, adhering to the naming convention.
5. **Outputs**: It provides outputs for the S3 bucket name and DynamoDB table name for easy reference.

This configuration is ready to be saved as a `.tf` file and can be applied directly to set up the specified AWS resources.
