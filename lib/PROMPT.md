## Building Our Serverless App

we need to put together a serverless application infrastructure using CloudFormation, in YAML. It needs to be pretty smart and secure.

Here's the general idea of what we're aiming for:

- **Scaling**: The whole thing should be able to automatically handle different amounts of work without us tweaking it.
- **Compute**: We'll use AWS Lambda functions for all the processing bits.
- **API**: Amazon API Gateway will manage all the incoming requests for our app.
- **Data**: We'll use an Amazon DynamoDB table for storing and getting data. Make sure it's set to "on-demand capacity" so we don't worry about scaling it ourselves.
- **Static Files**: Any static content, like images or HTML, will live in an Amazon S3 bucket.
- **Monitoring**: We need thorough monitoring and logging of everything using AWS CloudWatch.
- **One Region**: For compliance, everything needs to stay within a single AWS region.
- **Deployment**: Set up a full CI/CD pipeline using AWS CodePipeline to handle deployments smoothly.

We're going to deploy this in the `us-west-2` region. We need to follow our organization's naming rules, and all resources should get the right IAM roles for security. Remember to add some randomness to resource names to keep them unique. We also need to make sure there are no linting errors and that the code meets all security standards.

What we're looking for is a CloudFormation YAML template. It should do everything listed above and pass all the AWS validation checks.
