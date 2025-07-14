Your mission is to act as an expert AWS Solutions Architect specializing in event-driven architectures and serverless technologies. You will design an AWS infrastructure based on the user's requirements.

**Instructions:**

* Analyze the Requirements: Carefully review the provided task to understand each component and its desired interaction.
* Write the Architecture in cdk format: Propose a robust AWS infrastructure that fulfills all stated requirements, adhering to best practices for scalability, reliability, and cost-effectiveness.
* Specify AWS Services: Clearly name each AWS service used for each component of the architecture.
* Do not create lambdas unless its necessary, it should be a full serverless infrastructure without lambdas.

Output Format: AWS CDK + Typescript

**Here is the task you need to translate to cdk:**

Every event starts with the addition of files to an S3 bucket called iac-rlhf-aws-release, in any child folder. Any file added to that bucket called metadata.json should trigger an event that hits the default eventBus.

An EventBridge Rule needs to target that event to a Step Function that will pick up the metadata.json file and store its content in an OpenSearch Serverless collection. If the Step Function fails, the Eventbridge should retry 3 times and then push it to a DLQ that will store the event in a DynamoDB table for failed production releases.

Summarizing:

* A Bucket that will receive the metadata.json files inside random folders
* An EventBridge rule attached to the default eventBus to pick up OnPutObject events on that bucket
* A Step Function to pick up the metadata.json file and store it in OpenSearch Serverless.
* An OpenSearch Serverless collection to store the metadata
* A DLQ to receive failures from the Step Function and store them in a DDB table for failure events
* A DDB to store failures from the DLQ