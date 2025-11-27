# Model Failure

This document outlines the failure conditions, incorrect behaviors, and unacceptable outputs for the CI/CD pipeline generation task. It defines what the model must avoid producing when responding to the prompt for the global gaming backend Cloud Build pipeline.

## Failure Conditions

1. Producing multiple CI/CD files instead of a single cloudbuild.yaml.
2. Embedding long deployment logic directly inside the YAML steps instead of delegating to external scripts.
3. Omitting required pipeline sections such as pre-flight validation, code linting, Terraform validation, security scanning, multi-region deployment, canary rollout, monitoring configuration, compliance checks, or rollback procedures.
4. Generating placeholder, incomplete, or pseudo code that does not follow Cloud Build syntax.
5. Adding emojis, informal language, or irrelevant commentary.
6. Hardcoding project-specific identifiers instead of using substitutions.
7. Failing to reference all required tools such as gcloud, kubectl, helm, Trivy, Grype, Nancy, Gosec, Semgrep, and the performance testing tools.
8. Excluding external scripts or embedding their full logic inline in the YAML.
9. Producing steps that exceed Cloud Build YAML structural limits or violate indentation rules.
10. Changing the required machine type, disabling dynamic substitutions, or altering the worker pool configuration.
11. Failing to implement parallel regional deployments using Cloud Build concurrency.
12. Providing an overly simplified pipeline missing mandatory components such as Agones integration, performance testing, or chaos testing.
13. Failing to support the environment modes and regional fan-out described in the requirements.
14. Using unverified or unsupported Docker images, commands, or workflows.
15. Introducing breaking syntax, invalid characters, or YAML that cannot be parsed by Cloud Build.

## Failure Examples

- Missing Terraform validation or tfsec scan.
- Missing performance or integration tests.
- Missing regional deployment steps for all 8 required production regions.
- Collapsing multi-step logic into a single oversized step.
- Omitting the required scripts directory or script references.
- Replacing required tool invocations with comments or vague placeholders.
- Producing output that does not fully implement the specification.
- Returning only partial content or truncated YAML.

## Required Constraints

- The model must produce a complete, production-grade pipeline.
- All required stages must be represented.
- All referenced scripts must be included in the output.
- The tone must be clear, neutral, and human-readable without emojis.
- The response must follow Cloud Build best practices and correct YAML structure.
