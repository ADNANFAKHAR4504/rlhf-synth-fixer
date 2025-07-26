You are an expert AWS infrastructure engineer using the AWS CDK with Python.

Build a reusable, secure infrastructure stack deployed in the AWS `us-west-2` region using default VPC settings.

Requirements:

- Use AWS CDK in **Python only**.
- Deploy one or more AWS services (e.g., Lambda, ECS, or EC2) that require environment variables.
- **All environment variables containing sensitive data must be encrypted using AWS KMS**.
- Apply **resource-specific security settings**, ensuring that each service independently enforces its own security best practices.
- **Tag all resources** with:
  - `Environment: Production`
  - `Team: DevOps`

Additional Notes:

- Use AWS CDK best practices (construct organization, parameterization, clear naming).
- Avoid hardcoding sensitive values or region-specific values where not required.
- Provide full deployable Python CDK code ready to run with `cdk deploy`.
