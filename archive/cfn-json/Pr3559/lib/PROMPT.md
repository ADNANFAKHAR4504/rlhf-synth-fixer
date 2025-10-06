Act as an expert AWS CloudFormation engineer. Your task is to create a complete CloudFormation template in **JSON** format to deploy a serverless static website infrastructure in the `us-west-2` region.

The infrastructure is for a portfolio website and must include a backend to process contact form submissions. Adhere to all specified best practices.

## 1. Storage (S3):

- Create an S3 bucket to store the static website files (HTML, CSS, JS).
- Configure the bucket for **static website hosting**.
- The bucket should have a public-read policy to allow access to its objects.

## 2. Content Delivery (CloudFront):

- Set up a CloudFront distribution to serve content from the S3 bucket.
- The distribution must enforce **HTTPS** for all viewer connections.
- Configure it to use the S3 bucket as its origin.

## 3. DNS (Route 53):

- Create a Route 53 'A' record that aliases a custom domain name to the CloudFront distribution.
- The domain name should be provided via a template parameter named `DomainName`.

## 4. API Backend (API Gateway):

- Create a REST API Gateway.
- Define a resource at the path `/contact` with a `POST` method.
- This `POST` method must be integrated to trigger the Lambda function defined below.
- **Crucially, enable CORS** on this endpoint to allow requests from the website's domain.

## 5. Compute (Lambda):

- Create a Lambda function using the **Python 3.9** runtime.
- The function's purpose is to process JSON data from the contact form (`{ "name": "...", "email": "...", "message": "..." }`) and send an email using SES.
- It must have an associated IAM Role granting it permissions to write logs to CloudWatch and send emails via SES (`ses:SendEmail`).
- The sender and receiver email addresses for the form should be passed to the function using environment variables.

## 6. Email Service (SES):

- The solution should be configured to send emails via SES.
- Use parameters for the `SenderEmail` and `ReceiverEmail`. You can assume these email identities are already verified in SES in the `us-west-2` region.

## 7. Monitoring (CloudWatch):

- Create a CloudWatch Alarm that monitors the Lambda function for errors.
- The alarm should trigger if the `Errors` metric is greater than 0 for a period of 5 minutes.

## 8. Parameters & Outputs:

- Use the `Parameters` section for `DomainName`, `SenderEmail`, and `ReceiverEmail`.
- Use the `Outputs` section to expose the `WebsiteURL`, `ApiEndpoint`, `S3BucketName`, and `CloudFrontDistributionId`.

## 9. Tagging:

- Tag all created resources with the key `Project` and value `iac-rlhf-amazon`.

Ensure the final output is a single, valid JSON object.
