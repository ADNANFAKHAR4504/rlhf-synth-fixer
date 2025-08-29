I have an AWS CDK project in TypeScript with the following structure:

bin/tap.ts → entrypoint of the CDK app

lib/tapstack.ts → main stack definition

test/ → folder for unit/integration tests

I need you to generate CDK code that provisions a robust CI/CD pipeline in AWS using AWS CodePipeline with the following constraints:

The pipeline must include distinct stages for:

Source (e.g., CodeCommit or GitHub as source)

Build (with AWS CodeBuild)

Test (unit tests run automatically via CodeBuild)

Deploy (CloudFormation deploy action or CDK Pipelines)
The setup must be extensible so I can add new stages in the future.

AWS CodeBuild should handle both build & test phases, executing unit tests automatically.

Use AWS IAM roles with least privilege access for CodePipeline, CodeBuild, and deployment.

All resources should be deployed in the us-east-1 region.

Apply organizational tagging standards to all resources (e.g., Project=IaC - AWS Nova Model Breaking, Environment=Dev).

The deployment stage should provision application resources only if all preceding stages succeed, without requiring manual approval.

Provide accompanying tests in the test/ folder that validate pipeline creation and integration.

Make sure the generated CDK code follows best practices, uses constructs cleanly, and ensures security/scalability. Place the main pipeline stack definition in lib/tapstack.ts, reference it in bin/tap.ts, and create meaningful tests under test/.