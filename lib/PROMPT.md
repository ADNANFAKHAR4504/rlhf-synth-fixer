We need a CloudFormation YAML template for a secure serverless deployment in us-west-2.

Use API Gateway as the entry point, but don’t configure a custom domain or TLS cert (those are external dependencies we want to skip). Stick with the default execute-api hostname. Protect the API with AWS WAF attached to the API stage. Wire the routes to Lambda functions, which should load sensitive environment variables from AWS Secrets Manager. Make sure CloudWatch logging is enabled. Tag everything consistently.

Include parameters for things like secret ARNs, stage name, log retention, and similar settings so the template can be reused across environments. Provide outputs for the API invoke URL and the Web ACL ARN.

The final deliverable is a single CloudFormation YAML template that passes validation and deploys without issues.

Important: return only the code of the template, nothing else.