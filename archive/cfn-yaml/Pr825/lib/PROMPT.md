# Prompt

You are tasked with designing an AWS CloudFormation template in YAML for a healthcare application with strict compliance requirements (e.g., HIPAA). Follow the specifications below:

## Infrastructure Requirements
Region: Deploy all resources in us-west-2.

**Security & Compliance:**

- All Amazon S3 buckets must have AWS KMS encryption enabled for data at rest.

- All sensitive credentials (such as database passwords, API keys) must be stored in AWS Secrets Manager.

**Tagging:** Apply the following tags to all resources:

- Project: HealthApp
- Environment: Production

**Maintainability:**

- The template must support updating infrastructure without replacing critical resources.

**Naming:** The solution must be saved in a file named `healthcare_infra.yml`.

## Output Requirements
- Provide a YAML-formatted AWS CloudFormation template meeting all requirements.
- The template must pass AWS CloudFormation validation.
- The template should be deployable without modification in AWS us-west-2.
- Include inline comments to explain key security and compliance configurations.