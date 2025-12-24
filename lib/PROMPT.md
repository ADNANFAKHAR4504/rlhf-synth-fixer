Need to set up serverless infrastructure for projectX using CloudFormation.

The architecture has two Lambda functions working together - dataProcessor receives incoming data and processes it, then passes the results to responseHandler which formats and returns the response. Both functions share log data through CloudWatch Logs so we can monitor the full request flow.

Each function needs its own IAM role with just the logging permissions it needs (no wildcards). The dataProcessor role should only access its log group, same for responseHandler.

CloudWatch log groups for both functions should have 30-day retention so we can track issues across the data flow.

Everything goes in us-east-1, and all resource names should start with projectX-.

Just a straightforward YAML template that shows how these Lambda functions connect through their shared logging infrastructure. Keep it simple but production-ready.