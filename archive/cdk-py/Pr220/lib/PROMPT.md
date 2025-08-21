# CDK-015-Hard-Single-Serverless-Event-Processing-Pipeline

You are an AWS Solutions Architect, Create a **serverless event processing pipeline** using **CDK Python** that demonstrates **event-driven architecture for IoT sensor data ingestion and processing**.

## Considerations

- **Framework:** CDK Python
- **Deployment:** Serverless architecture using AWS managed services
- **Region:** AWS us-east-1
- **Architecture:** Event-driven data processing pipeline
- **Security:** Well-defined IAM roles and policies with least privilege access
- **Data Flow:** S3 Lambda DynamoDB with threshold-based notifications

---

## Requirements

### 1. **Problem Statement**

Design and implement a serverless data ingestion and processing pipeline for a simple IoT device simulator. The simulator will periodically send small JSON payloads representing sensor readings. These readings need to be stored, and a notification should be triggered if a specific threshold is exceeded.

### 2. **Infrastructure Requirements**

Your **AWS CDK (Python)** code should provision and connect the following three core AWS services:

- **Amazon S3 Bucket:** To act as the initial landing zone for raw sensor data payloads
- **AWS Lambda Function (Python):** To process new data files arriving in the S3 bucket. This function will parse the JSON, store it in a structured database, and check for a threshold condition
- **Amazon DynamoDB Table:** To persistently store the processed sensor readings in a structured format

### 3. **Service Connectivity and Data Flow**

- **S3 to Lambda:** Configure the S3 bucket to trigger the Lambda function whenever a new object (sensor data file) is uploaded to a specific prefix within the bucket. This establishes the event-driven ingestion
- **Lambda to DynamoDB:** The Lambda function must be granted appropriate IAM permissions to write (put item) processed sensor data into the DynamoDB table. The Lambda function will parse the incoming JSON from S3 and store relevant fields in DynamoDB

### 4. **Medium-Level Considerations**

This task is considered medium-level because it requires:

- **Understanding and implementing event-driven architecture** (S3 event notifications)
- **Configuring cross-service IAM permissions** (Lambda's access to S3 and DynamoDB)
- **Defining and connecting multiple distinct AWS services** that form a functional data flow
- **Basic data transformation logic** within the Lambda function

### 5. **AWS CDK Stack Implementation**

- **S3 Bucket Configuration:** Create bucket with event notification triggers
- **Lambda Function Setup:** Python runtime with proper IAM execution role
- **DynamoDB Table Design:** Define table schema for sensor data storage
- **IAM Roles and Policies:** Configure least privilege access between services
- **Event Source Mapping:** Connect S3 events to Lambda function invocation

### 6. **Lambda Function Requirements**

- **JSON Parsing:** Read and parse sensor data from S3 objects
- **Data Validation:** Validate incoming JSON payload structure
- **Threshold Checking:** Implement logic to check sensor values against thresholds
- **DynamoDB Integration:** Write processed data to DynamoDB table
- **Error Handling:** Implement proper exception handling and logging

---

## Expected Output

**Provide the complete AWS CDK Python code** for the stack, including:

- **S3 bucket definition** with event notification configuration
- **Lambda function definition** with proper runtime and handler specification
- **DynamoDB table definition** with appropriate schema design
- **IAM roles and event triggers** with necessary permissions
- **Basic Python handler function** for the Lambda that demonstrates reading from S3 and writing to DynamoDB

---

## Technical Implementation Details

### **CDK Stack Components:**

- **S3 Bucket Resource:** Configure with event notifications for specific prefix
- **Lambda Function Resource:** Python 3.9+ runtime with environment variables
- **DynamoDB Table Resource:** On-demand billing with appropriate partition key
- **IAM Role Resource:** Lambda execution role with S3 read and DynamoDB write permissions
- **Event Source Mapping:** S3 bucket notifications triggering Lambda function

### **Lambda Handler Logic:**

- **S3 Event Processing:** Extract bucket name and object key from event
- **JSON Data Retrieval:** Download and parse JSON payload from S3
- **Data Transformation:** Convert raw sensor data to structured format
- **Threshold Evaluation:** Check sensor values against predefined thresholds
- **DynamoDB Storage:** Store processed data with timestamp and metadata
- **Error Logging:** CloudWatch logging for debugging and monitoring

### **Data Flow Architecture:**

1. **IoT Simulator** uploads JSON sensor data to S3 bucket
2. **S3 Event Notification** triggers Lambda function execution
3. **Lambda Function** processes JSON data and validates format
4. **DynamoDB Write** stores structured sensor readings
5. **Threshold Check** evaluates sensor values for alert conditions
6. **CloudWatch Logs** capture execution details and errors

---

## Deliverables

- **Complete CDK Python stack** with all required AWS resources
- **Lambda function code** with comprehensive data processing logic
- **IAM policies** configured with least privilege access
- **Event-driven architecture** demonstrating S3 to Lambda to DynamoDB flow
- **Working example** of serverless IoT data ingestion pipeline