Write a complete Pulumi program in Python that provisions the following infrastructure on AWS, all defined within a single `__main__.py` file:

1. **Region:** All resources must be deployed in the `us-west-2` region.
2. **Lambda Function:** 
   - Use AWS Lambda with runtime `python3.8`.
   - The function should return a basic HTTP 200 response (e.g., "Hello from Lambda").
   - Define the function inline within the Pulumi code using an `AssetArchive` or `FileArchive`.
3. **API Gateway:**
   - Set up an HTTP API Gateway that triggers the Lambda function on a `GET /` request.
   - Configure the necessary permissions for API Gateway to invoke the Lambda.
4. **S3 Static Website:**
   - Create an S3 bucket configured for static website hosting.
   - Enable public read access.
   - Upload a simple `index.html` file with hardcoded HTML content directly from the Pulumi program.
5. **IAM Roles:**
   - Create an IAM Role for the Lambda function with the `AWSLambdaBasicExecutionRole` policy attached.
6. **RDS PostgreSQL:**
   - Provision an RDS PostgreSQL database (version 14 or higher).
   - Use a publicly accessible instance for simplicity.
   - Enable automated backups (e.g., 7-day retention).
   - Use a default username and password for testing.

Finally, export the following stack outputs:
- The S3 website URL
- The API Gateway invoke URL
- The RDS endpoint

Do not create separate files (e.g., `README.md`, `requirements.txt`, `lambda_function.py`). All logic and definitions must be included directly in the `__main__.py`. Keep the code minimal and focused on correct infrastructure deployment using the Pulumi AWS provider for Python.