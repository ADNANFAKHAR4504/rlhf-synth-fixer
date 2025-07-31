# Scalable Serverless IoT Data Processor with AWS CDK and TypeScript

You are tasked with creating a serverless infrastructure using the AWS Cloud Development Kit (CDK) with TypeScript to process IoT device data in near real-time. The solution must be scalable, resilient, and secure.

## Requirements

### Deployment Region
All resources must be deployed specifically to the **us-west-2** AWS region.

### Serverless Function
- Implement an AWS Lambda function named **IoTDataProcessor**
- The function must be triggered whenever a new data file is uploaded to a specified S3 bucket

### Scalability
The architecture must be capable of handling high traffic from multiple IoT devices, with the Lambda function able to scale to at least **500 concurrent requests per second**.

### Data Persistence and Error Handling
- The Lambda function will process the data and store the results in an AWS DynamoDB table
- The DynamoDB table should be configured for high, unpredictable traffic
- The Lambda function's code must include error handling for interactions with the DynamoDB table

### Security (Least Privilege)
Create a dedicated IAM role for the Lambda function. This role must grant only the necessary permissions:
- Read access to the source S3 bucket
- Write access to the destination DynamoDB table
- Permissions to write logs to CloudWatch

### Logging and Monitoring
- All processing activity must be logged to AWS CloudWatch Logs
- A specific log group must be created with the exact name `/aws/lambda/IoTDataProcessor`

## Expected Output

Generate a complete and functional AWS CDK project in TypeScript that creates the described serverless infrastructure. The project should be well-organized, and the CDK stack should deploy successfully to the **us-west-2** region. The final deliverable must include all CDK application code and clear documentation in a README.md file.