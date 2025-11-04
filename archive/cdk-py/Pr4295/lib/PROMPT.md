# Task: Application Deployment

## Background
StreamTech Japan, a media streaming company, needs to process thousands of video files daily. They require a scalable infrastructure to handle video metadata extraction, storage, and quick access to popular content. The solution must comply with Japanese broadcasting regulations and maintain low latency for the AP region.

## Problem Statement
Create a CDK infrastructure for a video processing pipeline that handles incoming media files for a Japanese entertainment company. The system needs to process videos, store metadata in a database, and cache frequently accessed content.

## Environment
Using AWS CDK with Python, implement a solution that includes: 1. ECS Cluster for video processing tasks 2. RDS PostgreSQL for metadata storage 3. ElastiCache Redis cluster for caching popular content metadata 4. EFS for temporary video processing storage 5. API Gateway for metadata access

## Constraints
All resources must be deployed in ap-northeast-1 region with multi-AZ configuration where applicable; Database passwords and API keys must be managed through SecretsManager; ElastiCache cluster must maintain at least 2 nodes for high availability

## Subject Labels
["CI/CD Pipeline"]
