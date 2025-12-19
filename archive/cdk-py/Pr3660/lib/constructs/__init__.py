"""
Constructs package for the TAP (Test Automation Platform) inventory management system.

This package contains reusable CDK constructs for building a serverless inventory API:
- DatabaseConstruct: DynamoDB table with auto-scaling and GSIs
- LambdaConstruct: Lambda functions for CRUD operations
- ApiConstruct: API Gateway REST API with proper validation and security
"""
