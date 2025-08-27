We need to clean up and restructure our current CDKTF setup so that it can handle multiple AWS environments (dev, staging, prod) without having to duplicate code. The goal is to make the configuration reusable, secure, and easier to maintain long term.

A few key things we’re looking for:

- Everything should be built with CDKTF. The same codebase should be able to spin up infrastructure in different environments just by switching input values.

- Use context or input variables so that details like VPC CIDRs, instance sizes, and tags can vary per environment.

- Add outputs that give us useful info after deployment—things like VPC IDs, subnet IDs, RDS endpoints, and S3 bucket names.

- Make use of built-in Terraform/CDKTF functions (conditionals, validations, computed values, etc.) so that misconfigurations get caught early instead of failing mid-deploy.

The final setup should:

- Work across dev, staging, and prod with minimal changes.

- Pass cdktf synth and terraform validate cleanly.

- Be structured in a way that’s easy to extend when we add more infrastructure later.

In short: one codebase, multiple environments, safer deployments.
