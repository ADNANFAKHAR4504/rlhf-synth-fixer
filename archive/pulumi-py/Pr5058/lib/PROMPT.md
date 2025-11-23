## Prompt

Hey there! We’re looking for a clean, production-ready Python script that uses Pulumi to manage an existing infrastructure stack in an idempotent way.
Please implement:

- Region and input handling: default to a sensible region if not provided.
- Core functionality: Define and deploy infrastructure in a declarative, Pulumi-based style, ensure idempotency so repeated runs don’t cause unnecessary changes, validate configuration before applying changes, provide robust logging and error handling for full visibility and resiliency, include a dry-run option to preview changes without applying them.
- Security and governance: Use least-privilege IAM roles and avoid broad permissions, favor environment- or config-driven values over hard-coded ones, tag resources consistently for governance and cost tracking.
- Observability and resiliency: Emit structured logs indicating start progress success and failure, surface meaningful metrics or events to monitor deployment health, return actionable error messages with guidance for retries.
- Inputs and outputs: Accept stack details from CLI or config, produce outputs such as deployed resource ARNs, endpoints, and region, support a dry-run mode.
- Testing guidance: Outline a plan to validate idempotency input validation and failure recovery, provide tips for a safe sandbox environment to run tests.
- Optional enhancements (if you want to extend it): Support for parameterized templates mapping to Pulumi components, lightweight CI workflow suggestions to automate deployments.

Notes: Avoid hard-coded secrets, use secure configuration methods. Keep the code modular and maintainable, with clear boundaries between config validation deployment and testing.
