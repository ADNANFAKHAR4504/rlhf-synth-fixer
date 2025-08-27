---
description: CDK Java Project Workflow Prompt
auto_execution_mode: 1
---

Instructions: This is a CDK JAVA project.
Ignore any files inside the archive/ folder.
Test code is in the tests folder:

tests/unit/java/app/MainTest.java

tests/integration/java/app/MainIntegrationTest.java

All the requirements are in lib/PROMPT.MD.
The language and platform are also confirmed in metadata.json as JAVA.

What this is:

A CDK JAVA project where all infrastructure code lives in one file: Main.java.

Using Model Responses

If a MODEL_RESPONSE*.MD file exists, always use the latest one as the basis for implementation and verification (e.g., MODEL_RESPONSE3.MD if present).

When running any project commands, report any issues you encounter by creating a new prompt file named PROMPTX.MD (e.g., PROMPT2.MD, PROMPT3.MD, …) describing the problems clearly and concisely in a human tone.

Task 1: Requirements Implementation

Ensure that the infrastructure in lib/src/main/java/app/Main.java fully covers all requirements in lib/PROMPT.MD.

If the current code does not satisfy requirements, fix it before proceeding.

Write complete code covering requirements:

Follow least privileges in IAM roles/policies (no wildcards *).

Ensure proper dependencies/relationships between resources.

Apply security & compliance best practices across all resources:

S3 buckets → versioning, encryption, block public access, secure transport.

Networking → tight security groups, least-open ingress/egress.

KMS where applicable, logging/monitoring enabled where relevant.

Code must be well-structured, modular, and easy to understand.

Task 2: Build Job

Review and understand the CI/CD pipeline under .github/workflows/ci-cd.yml.

Ensure the build step completes successfully.

Commands:

./scripts/lint.sh
./scripts/build.sh
./scripts/synth.sh
./scripts/deploy.sh

Task 3: Unit Tests

Write and build unit tests with 100% coverage and fully passing.

Tests validate that Main.java meets requirements from lib/PROMPT.MD.

Command:

./scripts/unit-tests.sh

Task 4: Integration Tests

Write and build integration tests with 100% coverage and fully passing.

Do not run cdk init or cdk deploy within tests.

Tests perform read-only checks against AWS using pipeline outputs.

The CI/CD pipeline generates cfn-outputs/all-outputs.json during “Get Deployment Outputs”; tests must read from this path.

Note: Integration tests should rely on the presence of this outputs file rather than performing any deploy actions.

Task 5: Lint and Syntax

Ensure lint and syntax checks are passing.

Command:

./scripts/lint.sh

Task 6: Ideal and Failure Response Docs

Generate Ideal Response file at ./lib/IDEAL_RESPONSE.MD containing:

// Complete code in Main.java


Generate lib/MODEL_FAILURES.MD documenting differences by comparing IDEAL_RESPONSE.MD against the latest MODEL_RESPONSE*.MD (manually added by the user). List all deviations and fixes applied.

Task 7: Markdown Lint

Run markdownlint on all .md files in lib/.

Files must be self-contained (do not reference other .md files).