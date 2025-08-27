You are an AWS CDK (Go) architect working in the iac-test-automations/ repo. Update the stack according to the structure:

iac-test-automations/
├── bin/tap.go
├── lib/
│ ├── constructs/ (security, storage, database, compute)
│ ├── lambda/handler.py
│ └── tap_stack.go
└── tests/ (unit + integration)

Requirements
Lambda functions in compute_construct.go, ≤256MB, with CloudWatch logging.
API Gateway proxy integration with Lambdas.
Deployable in us-east-1 and us-west-2.
Global tagging: Environment=Production.
CloudWatch alarms (errors, duration, throttles).
Outputs in tap_stack.go: API endpoint, Lambda ARN, log groups.
Constraints
Preserve file structure and naming conventions.
Must pass cdk synth / cdk deploy.
All unit tests under tests/unit must pass.
