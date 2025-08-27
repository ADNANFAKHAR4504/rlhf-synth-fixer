# MODEL_RESPONSE

The model attempted to generate a Terraform configuration for “Security Configuration as Code”, but the response was incomplete and insecure. Below is the raw model output.

---

### provider.tf

```hcl
provider "aws" {
  region = "us-east-1"
}

resource "aws_cloudtrail" "main" {
  name           = "main-trail"
  s3_bucket_name = "insecure-logs-bucket"
  is_multi_region_trail = true
}

variable "region" {
  default = "us-east-1"
}
```
