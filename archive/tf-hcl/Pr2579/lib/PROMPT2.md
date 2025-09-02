Can you provide the code snippet to fix the below issue , may be I can declare an alias in my provider.tf to fix this issue?

```
│ Error: Provider configuration not present
│ 
│ To work with aws_s3_bucket_versioning.tap_bucket_versioning its original
│ provider configuration at
│ provider["registry.terraform.io/hashicorp/aws"].us_east_2 is required, but
│ it has been removed. This occurs when a provider configuration is removed
│ while objects created by that provider still exist in the state. Re-add the
│ provider configuration to destroy
│ aws_s3_bucket_versioning.tap_bucket_versioning, after which you can remove
│ the provider configuration again.
╵

my provder.tf file looks like
provider "aws" {
  region = var.aws_region
}
```
