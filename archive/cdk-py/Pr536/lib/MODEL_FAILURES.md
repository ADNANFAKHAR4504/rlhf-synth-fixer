❌ When provisioning a cost-effective AWS environment with Pulumi and Python, you may encounter the following common issues:
1. Incorrect Region or Environment Misconfiguration

    Resources not appearing or failing to deploy if the us-east-1 region is not explicitly set in Pulumi config.

    Using the wrong environment tag (e.g., prod instead of preprod) may cause naming or isolation issues.

2. Improper Naming Convention

    Resource names not matching the project-env-resource pattern can lead to confusion, misidentification, or conflicts with naming policies or automation.

3. Unsupported or Misused AWS Services

    Attempting to use services outside the cost-saving list (S3, DynamoDB, Lambda) may result in increased costs or unnecessary complexity.

    Using provisioned capacity instead of on-demand in DynamoDB can overspend in low-traffic environments.