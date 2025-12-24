We need a Terraform file (`main.tf`) that sets up a security group in AWS.
The provider config already exists in `provider.tf`, and it uses a variable called `aws_region`.
This means `main.tf` has to declare `aws_region` and any other variables we need for this setup.
Everything should be in this one file — no pulling in other modules or splitting across multiple files.

The main goal: only allow inbound traffic on **port 80 (HTTP)** and **port 443 (HTTPS)**,
and only from certain IP ranges we specify.
Everything else inbound should be blocked.

Some things to keep in mind:

* We’ll need a `vpc_id` variable (no default) so the security group can attach to the right VPC.
* Add variables for allowed IPv4 and IPv6 CIDRs.
  By default these can be empty lists, but if both are empty we should fail or at least warn the user.
* Let’s have a toggle for whether outbound traffic is wide open or locked down (`allow_all_outbound`).
* Give the SG a sensible default name and description, but make them configurable.
* Add some default tags like `Owner` and `Environment`, but allow overrides.

Outputs should include at least:

* The security group ID
* ARN
* Name
* A summary of ingress rules

Make sure `main.tf` includes Terraform’s `required_providers` and `required_version` so it’s self-contained (but skip the actual `provider` block since that’s already in `provider.tf`).

At the top of the file, add a quick comment explaining how to run it (`terraform init`, `terraform plan`, `terraform apply`)
and maybe an example of passing in `vpc_id` and an IP range.

We’re aiming for something minimal, secure, and easy to understand — no unnecessary permissive rules.


