Need to set up production-grade serverless infrastructure for projectX using CloudFormation with proper security controls.

The architecture has two Lambda functions that work together in a pipeline. The dataProcessor Lambda is triggered first to receive and process incoming data, then it invokes the responseHandler Lambda which formats and returns the final response. Both functions write logs to CloudWatch so we can track what's happening across the pipeline.

Each function needs its own IAM role with least privilege permissions. The dataProcessor role gets permissions to invoke the responseHandler Lambda and write to its own CloudWatch log group. The responseHandler role just gets permissions to write to its log group. Both roles need permissions to send messages to their respective dead-letter queues for failed invocations.

Security requirements:
- Encrypt all CloudWatch log groups using a KMS customer-managed key. Set up the key policy to allow CloudWatch Logs service to use it for encryption.
- Add SQS dead-letter queues for both Lambda functions to capture failed invocations. Configure 14-day message retention and encrypt the queues.
- Set up CloudWatch alarms to monitor Lambda errors. Each function needs an alarm that triggers when errors occur.
- Add CloudWatch alarms for the dead-letter queues to alert when messages appear, which indicates failures.

Both CloudWatch log groups should have 30-day retention so we can track issues across the pipeline.

Everything goes in us-east-1, and all resource names should start with projectX-.

Build a production-ready YAML template with KMS encryption, error monitoring via CloudWatch alarms, and dead-letter queues for reliability. Show how these Lambda functions connect and trigger each other while maintaining security best practices.