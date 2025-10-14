# Task: Application Deployment

## Background
A manufacturing company needs to modernize their factory monitoring system. They have multiple assembly lines with IoT sensors that generate data every 30 seconds. The data needs to be collected, processed, and stored securely while maintaining audit trails for compliance purposes.

## Problem Statement
Create a secure IoT data ingestion and processing pipeline for a manufacturing company that needs to collect sensor data from factory equipment. The system should handle real-time data processing and storage while maintaining compliance with manufacturing industry standards.

## Environment Requirements
Using Pulumi with Go, implement an infrastructure that includes: 1. API Gateway for data ingestion 2. ECS Fargate cluster for data processing 3. RDS PostgreSQL for structured data storage 4. ElastiCache Redis for temporary sensor data caching 5. SecretsManager for managing database credentials

## Constraints
All resources must be deployed in us-east-1 region (changed from ap-northeast-1 due to Elastic IP quota limitations in the Tokyo region) with proper availability zone distribution; Database credentials must be stored in SecretsManager (automatic rotation requires Lambda function implementation); ECS tasks must run in private subnets with outbound internet access through NAT Gateway

## Platform and Language
- Platform: Pulumi
- Language: Go
