Need to set up serverless infrastructure for projectX using CloudFormation.

The setup needs two Lambda functions - dataProcessor and responseHandler. Each function should have its own IAM role with just the permissions it needs (no wildcards).

Also need CloudWatch log groups for both functions with 30-day retention so we can monitor what's happening.

Everything goes in us-east-1, and all resource names should start with projectX-.

Just a straightforward YAML template that deploys these components. Keep it simple but production-ready.