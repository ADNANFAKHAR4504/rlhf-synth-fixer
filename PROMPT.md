# Task: Design and implement a CloudFormation template for a manufacturing company's IoT sensor data processing platform

## Context
SmartFactory Inc. needs to process sensor data from their manufacturing floor equipment. They need to store data securely, maintain audit trails, and ensure data processing meets compliance standards. The solution should handle approximately 10,000 sensor readings per minute and maintain data for 90 days.

## Objective
Design and implement a CloudFormation template for a manufacturing company's IoT sensor data processing platform that meets ISO 27001 compliance requirements for data handling and audit logging.

## Requirements
Create a CloudFormation template that implements:
1. An ECS cluster for data processing applications
2. RDS instance for structured sensor data storage
3. ElastiCache Redis cluster for real-time sensor data caching
4. SecretsManager for database credentials
5. Kinesis Data Streams for sensor data ingestion
6. API Gateway for external system integration

**Region**: eu-west-2

## Constraints
- All resources must be deployed in eu-west-2 region
- All database credentials must be managed through SecretsManager with automatic rotation enabled
- Data at rest must be encrypted using AWS KMS keys
- Infrastructure must support audit logging for all data access and modifications

## Deliverables
- CloudFormation template (YAML format)
- Complete infrastructure setup following AWS best practices
- Compliance with ISO 27001 requirements for data handling and audit logging
