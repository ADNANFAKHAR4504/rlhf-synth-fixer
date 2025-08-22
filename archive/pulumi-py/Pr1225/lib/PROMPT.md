# Claude Sonnet Prompt: Deploy AWS Web Application using Pulumi and Python

## Objective:

Generate a Python script using Pulumi's API that provisions AWS infrastructure for a web application with the following environment-specific behaviors and resource definitions.

---

## Requirements:

1. **Environment Support**
- The infrastructure should support two distinct environments: `development` and `production`.
- Switching between environments should be achievable via environment variables or Pulumi configuration.
- Use Pulumi's configuration system or native Python environment handling to set the current environment.
- Environment-specific values should be handled cleanly in the code (e.g., conditional resource tags, configurations).

2. **AWS Region**
- The deployment must target the AWS region: `us-west-2`.

3. **Resources to Define**
- **EC2 Instance**
- Use the latest Amazon Linux 2 AMI.
- Associate a security group that allows inbound HTTP (port 80) and SSH (port 22) access.
- Tag the EC2 instance with environment-specific tags (e.g., `"Environment": "development"` or `"Environment": "production"`).
- **S3 Bucket**
- Create a uniquely named S3 bucket, incorporating the environment name into the bucket name.
- Enable versioning on the bucket.
- Tag the bucket similarly with the environment identifier.

4. **Environment Variable Management**
- Implement toggling of the following variables based on environment:
- `DEBUG = true` for development, `false` for production.
- `LOG_LEVEL = "info"` for production, `"debug"` for development.
- These variables can be printed, logged, or configured as EC2 instance user data (bash script) depending on best practices.

---

## Expected Output:

A single, self-contained Python script that:

- Uses Pulumis Python SDK
- Implements logic to switch behavior and configurations between `development` and `production`
- Defines an EC2 instance and an S3 bucket as per the criteria above
- Can be executed by running `pulumi up` after setting the proper Pulumi configuration or environment variable

---

## Output Format:

```python
# Python script using Pulumi to deploy the required infrastructure
# (Include Pulumi imports, configuration handling, resource definitions, and comments)
```
