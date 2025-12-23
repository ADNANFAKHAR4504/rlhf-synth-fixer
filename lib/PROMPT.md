Prompt:

You are an expert AWS Solutions Architect specializing in serverless and event-driven architectures. I need you to generate a complete AWS CDK (Cloud Development Kit) application written in Python. This CDK app should provision infrastructure for a simple web application with the following requirements:

Requirements:
AWS Region: All resources must be deployed to the us-west-2 region.

S3 Bucket:

Used to host static website content.

Must have static website hosting enabled.

Must allow public read access to serve static content (e.g., HTML, CSS).

Lambda Function:

Handles dynamic content requests.

Written in Python.

Must be deployed using the CDK.

IAM Role:

Should follow least privilege principles.

Must grant permissions only necessary to manage S3 and Lambda resources.

Additional Notes:
The CDK stack should support creation, updating, and destruction via standard CDK commands.

Please include a sample HTML file (e.g., index.html) that should be uploaded to the S3 bucket after deployment.

Also provide instructions or code to invoke the Lambda function for testing after deployment.

Expected Output:
A complete CDK Python app including:

app.py

Stack definition(s)

Lambda function source code

HTML content to be hosted

All necessary configuration to deploy the stack to us-west-2.

IAM policies and roles configured correctly.

Clear, concise, and secure code.

Make sure all CDK best practices are followed. Output only the Python CDK application with appropriate comments in the code.
