# Task: StreamFlix Media Streaming Metadata API Infrastructure

## Background
StreamFlix, a growing video-on-demand platform, needs to create a scalable infrastructure for their metadata API service. This service handles requests for movie/show descriptions, ratings, cast information, and user preferences. The solution needs to implement proper caching to handle high-traffic periods and maintain data consistency.

## Problem Statement
Design and implement a CloudFormation template for a media streaming metadata API infrastructure that serves a video-on-demand platform. The infrastructure should handle metadata requests for media content with proper caching and data persistence.

## Environment Requirements
Create a CloudFormation template that implements:
1. API Gateway for the RESTful API endpoint
2. ElastiCache Redis cluster for metadata caching
3. RDS PostgreSQL instance for persistent storage
4. SecretsManager for database credentials
5. Proper networking configuration in eu-west-1

## Constraints
- The RDS instance must be configured in Multi-AZ mode for high availability
- ElastiCache must use encryption at rest and in-transit
- All resources should be properly tagged and follow AWS best practices
- The solution should implement proper security groups and network isolation

## Subtask Focus
Failure Recovery and High Availability

## AWS Services Required
- AWS::ApiGateway::RestApi
- AWS::ElastiCache::ReplicationGroup
- AWS::RDS::DBInstance
- AWS::SecretsManager::Secret
- AWS::EC2::VPC, Subnets, SecurityGroups
