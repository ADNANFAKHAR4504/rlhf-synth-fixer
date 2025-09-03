Need some terraform infrastructure for a multi-region AWS setup. Pretty straightforward requirements here.

We're working with production and staging environments across us-east-1 and us-west-2 regions. The naming should follow environment-resourceType-projectName pattern.

This needs to focus on three main AWS services: IAM, CloudWatch Logs, and KMS. Keep it simple and don't add extra services unless really needed.

What I'm looking for:

For IAM - set up roles and policies but keep permissions tight, only what's actually needed
For logging - get CloudWatch Logs working in both environments and regions so we can monitor what's happening  
For encryption - use KMS to encrypt data at rest, make sure it works across the different environments

The terraform code should be clean, pass validation, and be in a single .tf file. Just want the HCL code back, no explanations needed. 
