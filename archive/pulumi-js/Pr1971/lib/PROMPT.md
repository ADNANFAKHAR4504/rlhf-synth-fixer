I need to create a secure infrastructure setup using Pulumi with JavaScript. The system should handle multi-region deployment across us-west-2 and eu-central-1 regions with comprehensive security controls.

Here are the specific requirements I need to implement:

1. Set up S3 buckets with AWS KMS encryption at rest across both regions. All objects should be encrypted automatically, and I want to use customer-managed KMS keys for better control over access policies. Make sure to enable S3 bucket keys to reduce KMS API costs.

2. Implement proper SSL/TLS encryption for data in transit. All API endpoints and data transfers must use valid certificates and secure protocols.

3. Create IAM roles and policies following the principle of least privilege. Each role should only have permissions absolutely necessary for its specific function. Use condition keys where possible to add extra security constraints.

4. Include AWS IAM Access Analyzer integration to help identify and reduce excessive permissions over time.

5. Set up proper key rotation policies for the KMS keys - I want to use the newer flexible rotation periods available in 2025 instead of the default annual rotation.

The infrastructure should be organized into separate components for better maintainability. Please provide the complete Pulumi JavaScript code with proper error handling and security best practices. Include unit tests to verify that encryption is working correctly and IAM permissions are properly restricted.

Make sure the code is production-ready with proper resource naming, tagging, and follows current AWS security best practices for 2025.