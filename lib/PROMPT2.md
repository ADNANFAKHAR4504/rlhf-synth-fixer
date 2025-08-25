Failing in deploy stage with this error

Run ./scripts/bootstrap.sh
Bootstrapping infrastructure...
Project: platform=tf, language=hcl
Environment configuration:
  Environment suffix: pr2217
  Repository: TuringGpt/iac-test-automations
  Commit author: jpoola-turing
Terraform project detected, setting up environment...
Terraform state bucket: iac-rlhf-tf-states
Terraform state bucket region: us-east-1
Using state key: prs/pr2217/terraform.tfstate
Initializing Terraform with PR-specific backend...
TF_INIT_OPTS: -backend-config=bucket=iac-rlhf-tf-states       -backend-config=key=prs/pr2217/terraform.tfstate       -backend-config=region=us-east-1       -backend-config=encrypt=true       -backend-config=use_lockfile=true
Initializing the backend...

Successfully configured the backend "s3"! Terraform will automatically
use this backend unless the backend configuration changes.
╷
│ Error: Terraform encountered problems during initialisation, including problems
│ with the configuration, described below.
│ 
│ The Terraform configuration must be valid before initialization so that
│ Terraform can determine which modules and providers need to be installed.
│ 
│ 
╵
╷
│ Error: Duplicate provider configuration
│ 
│   on tap_stack.tf line 1:
│    1: provider "aws" {
│ 
│ A default (non-aliased) provider configuration for "aws" was already given
│ at provider.tf:18,1-15. If multiple configurations are required, set the
│ "alias" argument for alternative configurations.
╵
Error: Terraform exited with code 1.
Error: Process completed with exit code 1.