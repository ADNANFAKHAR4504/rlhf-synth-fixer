# model_failure

## Typical failure modes in this use case

* **ECS attempts to pull non-existent images**: Services start at a nonzero desired count while ECR repos are empty, causing repeated `CannotPullContainerError` and prolonged “creating” states.
* **Target groups not attached to a listener before service creation**: ECS fails service creation because the target group has no associated load balancer, due to races between listener rules and services.
* **Circular security group references**: Direct inter-service SG references create dependency loops that block stack creation.
* **Overly rigid environment parameters**: Hardcoded allowed values for environment names prevent flexible multi-environment rollouts and increase change friction.
* **Insufficient observability**: Missing log groups or disabled container insights impede troubleshooting, prolonging outages during first deployments.

## How the provided solution avoids these failures

* **Zero-desired-count on empty images**: Services begin at zero when image URIs are not provided, ensuring the stack completes even before images exist.
* **Deterministic listener rule dependency**: Unified, conditional listener rules exist before ECS services, guaranteeing target groups are associated with a listener at creation time.
* **Mesh-style security**: A shared mesh security group removes circular dependencies while still enforcing least-privilege port-level access.
* **Regex-based environment validation**: A safe naming regex preserves resilience without locking deployments to a brittle allowed-values list.
* **Built-in insights and logging**: Per-service log groups and container insights enable immediate diagnosis of health checks, startup failures, and scaling behavior.

## Consequences if not addressed

* Stacks hang or roll back on first deploy, delaying production readiness.
* Repeated failed tasks inflate costs and obscure the real root causes.
* Security groups and load balancer races cause intermittent, hard-to-reproduce provisioning errors.

## Deliverable

* A clear description of known pitfalls and the design measures included in the solution to prevent them, ensuring the stack can be created reliably and operated with predictable behavior.
