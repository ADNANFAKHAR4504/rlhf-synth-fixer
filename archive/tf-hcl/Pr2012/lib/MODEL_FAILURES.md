# Model Failures

* Add `terraform.tfvars` (defaults) at repo root and load env overrides via `-var-file=environments/<env>.tfvars`.
* In `outputs.tf`, change region output to use the data source ID:

  ```hcl
  output "region" {
    value = data.aws_region.current.id
  }
  ```
  
* In `modules/s3-backend/main.tf`, actually use the `aws_region` variable by adding a provider block:

  ```hcl
  provider "aws" {
    region = var.aws_region
  }
  ```
  
* Remove/avoid dynamic timestamp tag that causes perpetual diffs. Delete this from provider default\_tags or make it static:

  ```hcl
  # remove CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  ```
  
* In `modules/s3-backend/variables.tf`, keep `aws_region` only if you use the provider override above; otherwise delete the unused variable.
