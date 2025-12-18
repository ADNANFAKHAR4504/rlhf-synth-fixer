# Prompt

Your mission is to act as an expert AWS Solutions Architect specializing in event-driven architectures and serverless technologies. You will design an AWS infrastructure based on the user's requirements.

**Instructions:**

* Analyze the Requirements: Carefully review the provided task to understand each component and its desired interaction.
* Write the Architecture in cdk format: Propose a robust AWS infrastructure that fulfills all stated requirements, adhering to best practices for scalability, reliability, and cost-effectiveness.
* Specify AWS Services: Clearly name each AWS service used for each component of the architecture.
* Do not create lambdas unless its really necessary.

Output Format: AWS CDK + Typescript

**Here is the task you need to translate to cdk:**

You will crate a workflow to feed an TimeSeries Opensearch serverless dashboard
to analyze data that is stored in metadata.json files inside an s3 bucket in real time.

The workflow gets triggered with the addition of files into an S3 bucket called iac-rlhf-aws-release, in any child folder. Any file added to that bucket called metadata.json should trigger an event that hits the default eventBus.

An EventBridge Rule will target that event to a Step Function that will pick up the metadata.json file from the S3 bucket and store its content in a Timeseries OpenSearch Serverless collection called iac-rlhf-metadata-collection with a @timestamp field (that needs to be added on-the-fly). That OpenSearch collection should have openSearch dashboard enabled and public. If the Step Function fails, it should
store the execution's input and error cause into a DynamoDB table for Metadata Processing Failures and fail the state machine.

Finally, add a cloudwatch alarm to alert that the state machine has a failure.

Summarizing:

* A Bucket that will receive the metadata.json files inside random folders
* An EventBridge rule attached to the default eventBus to pick up Create Object events on that bucket for objects named metadata.json.
* A Step Function to receive the event, pick up the metadata.json file and store it in OpenSearch Serverless.
* A Timeseries OpenSearch Serverless collection to store the metadata and with the dashboard enabled, and public.
* A DynamoDB table to store failures in the State Machine
* A cloudwatch alarm to report failures in the State Machine.
