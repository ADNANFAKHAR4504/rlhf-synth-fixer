Need to set up serverless infrastructure for projectX using CloudFormation.

The architecture has two Lambda functions that work together in a pipeline. The dataProcessor Lambda is triggered first to receive and process incoming data, then it invokes the responseHandler Lambda which formats and returns the final response. Both functions write logs to CloudWatch Logs so we can monitor the complete data flow.

Each function needs its own IAM role. The dataProcessor role gets permissions to invoke the responseHandler Lambda and write to its own CloudWatch log group. The responseHandler role just gets permissions to write to its log group.

Both CloudWatch log groups should have 30-day retention so we can track issues across the pipeline.

Everything goes in us-east-1, and all resource names should start with projectX-.

Just a straightforward YAML template that shows how these Lambda functions connect and trigger each other. Keep it simple but production-ready.