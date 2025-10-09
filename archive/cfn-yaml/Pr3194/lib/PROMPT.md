Media Storage System using AWS CloudFormation with yml in a single file

    •	A media app needs to handle 2,000 daily image uploads and store them securely.
    •	Each image should be saved in Amazon S3, with DynamoDB used to index metadata for quick lookups.
    •	AWS Lambda (Node.js) functions will process image uploads and manage interactions between S3 and DynamoDB.
    •	CloudWatch will capture basic usage metrics to monitor the system.
    •	IAM roles and policies will ensure secure access across all components.
    •	The entire solution should be serverless, cost-efficient, and described in a single CloudFormation YAML template for deployment.
