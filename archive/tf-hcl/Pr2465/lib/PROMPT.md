# Create a Serverless Web API with Terraform

I need you to build a Terraform configuration (in HCL) for a simple serverless web application. Here's what I want:

## Core Features:
- A web API that can be called from any website (with CORS enabled)
- A database table to store information
- A serverless function that handles the API requests
- Proper logging and monitoring

## Technical Requirements:
- Use Node.js for the serverless function
- Set up the database with 5 read/write capacity units
- Deploy everything in us-east-1
- Make environment variables configurable using Terraform variables
- Give the function only the permissions it actually needs
- Keep the database when we destroy the infrastructure (don't lose our data!)
- Set up API versioning with different stages
- Alert us if the function has more than 5% errors
- Log all API calls for debugging
- Tag everything with project name, environment, and owner

## What I'm Building:
Think of this as a simple web service that other applications can call to store and retrieve data. The API Gateway handles web requests, the Lambda function processes them, and DynamoDB stores the data. Everything should be properly monitored and logged.

Can you create the Terraform HCL configuration files for this setup? I'd like all the code in a single file named `tap-stack.tf`. I will provide the `provider.tf` at deployment.