# Setting Up AWS CDK for Multiple Environments (TypeScript)

We want to use AWS CDK to manage our infrastructure and make sure we have a consistent setup for our web application across development, staging, and production.

### What We're Trying to Do

Our goal is to define the infrastructure once and then reuse it across environments without duplicating the code. At the same time, we need the flexibility to handle environment-specific configurations when necessary.

### Key Requirements

* Define common resources like VPCs, subnets, EC2 instances, RDS databases, and S3 buckets in one place.
* Use parameters or context values to handle things like network ranges, database endpoints, and custom AMIs that differ per environment.
* Apply a consistent naming convention — for example, prefixing resources with `dev-`, `staging-`, or `prod-`.
* Tag everything properly, especially with an `Environment` tag so it’s easy to manage and track costs.
* Keep the deployment limited to the us-east-1 region for now.

### What We Expect as a Deliverable

* A CDK app written in TypeScript that can generate CloudFormation templates for all three environments.
* The templates should be reusable and should deploy successfully without having to change the code for each environment.
* The solution should be easy for other developers on the team to understand and extend.