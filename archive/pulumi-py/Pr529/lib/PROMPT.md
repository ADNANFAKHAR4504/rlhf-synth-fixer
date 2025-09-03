You are a senior DevOps engineer and Infrastructure-as-Code (IaC) specialist.
Generate a complete Pulumi-based infrastructure definition written in Python for a multi-environment AWS CI/CD pipeline project.

The Pulumi code must be written in a single Python file, and all implementation must fit within the existing project folder structure shown below. Do not create or modify files outside of this structure.

Existing Files and Folders (changes must be limited to these):

Pulumi.yaml

metadata.json

tap.py

lib/

tap_stack.py

__init__.py

IDEAL_RESPONSE.md

MODEL_FAILURES.md

MODEL_RESPONSE.md

PROMPT.md

tests/integration/

test_tap_stack.py

__init__.py

tests/unit/

test_tap_stack.py

__init__.py

Project Name: IaC - AWS Nova Model Breaking

Proposed Statement:
The infrastructure will be deployed on AWS across multiple environments (development, testing, and production) using Pulumi with Python. Resources should be provisioned in a cost-effective manner while ensuring scalability, security, and high availability.

Requirements:

Use Pulumi with Python to define the entire AWS infrastructure.

Implement a multi-stage CI/CD pipeline including development, testing, and production environments.

Configure the pipeline using AWS CodePipeline, AWS CodeBuild, and AWS CodeDeploy.

Support a blue-green deployment strategy for application updates.

Use Pulumi stacks or configuration management to enable environment-specific settings.

Run automated tests in the pipeline using pytest, integrated with CodeBuild.

Securely manage secrets using AWS Secrets Manager.

Integrate Snyk security scanning as part of the build pipeline.

Include automatic rollback mechanisms on deployment failure using CodeDeploy features.

Incorporate AWS Lambda functions for serverless components.

Enable logging and monitoring using AWS CloudWatch Logs, Metrics, and Alarms.

Optimize infrastructure for cost efficiency by using appropriately sized resources or serverless where applicable.

Ensure high availability and redundancy, including multi-AZ deployments.

Follow AWS Well-Architected Framework best practices for security, performance, and resilience.

Document the solution with clear inline comments and docstrings explaining logic and usage.

Constraints:

All code must be written in a single Python file per component (one for tap_stack.py, one for test_tap_stack.py integration test, one for test_tap_stack.py unit test).

The implementations must reside within the existing folder structure shown above.

Do not introduce new files or folders.

Pulumi configuration (e.g., environment settings) should be handled in-code or via existing Pulumi stacks.

Only include Python code output, no extra explanations.

The code must be clean, production-ready, and immediately deployable and testable.