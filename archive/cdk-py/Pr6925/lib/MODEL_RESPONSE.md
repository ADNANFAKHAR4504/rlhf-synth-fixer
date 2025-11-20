# Serverless Transaction Validation Pipeline - Complete Implementation

This implementation provides a production-ready serverless transaction validation pipeline using **AWS CDK with Python**. The solution implements all 12 mandatory requirements including Lambda functions, DynamoDB, Step Functions, SQS, EventBridge, API Gateway, and SNS with comprehensive monitoring and error handling.

## Architecture Overview

The pipeline processes transactions through three stages:
1. **Ingestion**: Validates schema and stores initial state
2. **Validation**: Applies business rules and fraud checks  
3. **Enrichment**: Adds external data and calculates risk scores

Event-driven triggers (EventBridge on S3 uploads) and REST API endpoints enable flexible transaction submission methods.

## File: lib/tap_stack.py

Complete CDK stack implementation with all 12 requirements.

## File: lib/lambda/ingestion.py

Ingestion Lambda function handler.

## File: lib/lambda/validation.py

Validation Lambda function handler.

## File: lib/lambda/enrichment.py

Enrichment Lambda function handler.

## File: tests/unit/test_tap_stack.py

Comprehensive unit tests for infrastructure.

## File: tests/integration/test_deployed_resources.py

Integration tests for deployed resources.

## File: lib/README.md

Documentation and usage instructions.
