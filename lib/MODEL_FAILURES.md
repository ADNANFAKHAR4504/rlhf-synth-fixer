# model_failure

## Failure Summary

A response would be considered failing if it omitted required components, introduced linter errors, created unintended Internet exposure, or reused existing resources. The following issues describe typical failure modes and how they manifest.

## Common Failure Modes

* Missing critical resources, such as one or more NAT Gateways, gateway endpoints, or route tables.
* Database subnets receiving a default route to either the Internet Gateway or a NAT Gateway.
* Using a single NAT Gateway across multiple AZs, creating a zonal dependency and violating the high-availability requirement.
* Implicit route table associations, resulting in unpredictable routing or reliance on main route tables.
* Missing explicit deny rules for SSH from public subnets to the database tier in the NACL configuration.
* Inconsistent or missing tags, particularly Environment, Team, and CostCenter.
* Resource names that do not include the environment suffix, leading to collisions across environments.
* Unused parameters or properties causing linter warnings or template rejections.
* Attaching flow logs without proper IAM or log group setup, preventing delivery.
* Referencing pre-existing resources, undermining the “build everything new” constraint.

## Symptoms to Watch For

* Linter warnings such as “parameter not used,” or route and association references that don’t exist.
* Validation or deployment failures related to dependency ordering for IGW attachment and public routes.
* Private subnets failing to reach the Internet due to missing or cross-AZ NAT routing.
* Database instances gaining unintended egress due to a stray default route.
* Flow logs stuck in delivery failure due to missing permissions or log group.

## Consequences

* Broken isolation guarantees and potential security incidents.
* Reduced availability due to single-AZ dependencies.
* Increased egress cost if endpoints are not used.
* Difficult tear-downs requiring manual cleanup of dependent resources.

## Remediation Guidance

* Enforce per-AZ design for NAT Gateways and keep each private route table local to its NAT.
* Keep database route tables free of default routes and validate NACL deny rules for SSH.
* Apply gateway endpoints to private and database route tables to keep traffic private.
* Maintain strict, consistent tagging and environment-suffixed names.
* Define and validate all parameters; remove unused ones.
* Create the CloudWatch log group and IAM role within the stack before enabling VPC Flow Logs.
* Use explicit dependencies for Internet Gateway attachment and NAT Gateways to ensure deterministic creation and deletion.

## Final Note

A compliant, high-quality response must adhere to the requested structure and scope, remain linter-clean, and deliver a fully isolated, multi-AZ VPC foundation ready for both containerized and VM workloads.
