-----

## Setting Up Our AWS Security: The Casual Version

Okay, we need to get a **secure AWS setup** going with Terraform.

Here's what we need to do:

  * Put everything in **`us-east-2`**.
  * All S3 buckets *have to* use **AES-256 encryption**.
  * We need a **custom VPC** (let's use `10.0.0.0/16` for its network block). Only traffic from **`203.0.113.0/24`** should be able to get to our services there.
  * Stick to **IAM roles** instead of those "inline policies" whenever possible. It's just cleaner.
  * Make sure data is **encrypted everywhere** for S3 and RDS – both when it's moving around and when it's just sitting there.
  * Turn on **CloudTrail** for auditing. We need to know who did what, and those logs need to be stored securely.
  * Keep the Terraform code **nicely organized** with separate bits for networking and for our compute stuff (like servers).
  * **Tag all our AWS resources** with 'Environment', 'Owner', and 'Department' for tracking.
  * **No hardcoded IAM access keys** in the code. Seriously, don't put them in there\!
  * Use **Terraform version 0.14 or newer**.
  * Our EC2 instances shouldn't be sitting out there exposed to the internet. Keep 'em private.

We're looking for the Terraform HCL files. They should be neat, **well-commented**, and definitely **not have any hardcoded secrets**. The big test: it needs to pass `terraform plan` and `terraform apply` without any warnings or failures, showing it meets all these security rules.

Good luck\!

---
