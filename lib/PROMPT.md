# Serverless REST API with Lambda and API Gateway

Need to build a simple serverless API using AWS CDK with Python. The Lambda functions should be exposed through API Gateway so they can handle HTTP requests from the internet.

## What I need

Set up a REST API where API Gateway receives HTTP requests and forwards them to Lambda functions for processing. The Lambda should return responses back through the Gateway to the client.

Key integration: API Gateway connects directly to Lambda using proxy integration, so all request data gets passed through.

## Stack structure

Use this folder layout:
```
root/
├── tap.py              # CDK app entry point
└── lib/
    └── tap_stack.py    # Stack with Lambda + API Gateway
```

## Requirements

1. **Lambda Function**: Create a Python Lambda that handles incoming requests. Can be simple, just needs to return a JSON response.

2. **API Gateway HTTP API**: Set up an HTTP API that routes requests to the Lambda. Should be publicly accessible.

3. **Integration**: Wire API Gateway to trigger the Lambda on HTTP requests. Use proxy integration so Lambda gets full request context.

4. **Region**: Deploy everything to us-east-1

5. **Cost-conscious**: Stay within Free Tier - Lambda gets 1M free invocations per month

## Expected deliverables

CDK Python project with:

- `tap.py` - CDK app initialization
- `lib/tap_stack.py` - Stack definition with Lambda and API Gateway wired together
- Lambda handler code inline or in separate file
- API Gateway configured to route to Lambda
- README with setup and deployment instructions

The final result should let me run `cdk deploy` and get a working API endpoint that invokes the Lambda.
