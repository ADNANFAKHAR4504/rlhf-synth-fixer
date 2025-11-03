# Task: Infrastructure Analysis/Monitoring

## Background
EduTech Solutions needs to build a secure, scalable platform that processes student performance metrics in real-time while ensuring data privacy and compliance with FERPA regulations. The platform needs to ingest data from multiple sources, process it in real-time, and provide analytical insights to authorized personnel.

## Problem Statement
Design and implement a high-performance student analytics platform using CDKTF that processes real-time student performance data while maintaining FERPA compliance. The system must handle data from 100,000+ concurrent users across multiple educational institutions.

## Environment Requirements
Implement the following architecture using CDKTF: - Data ingestion layer using Kinesis Data Streams - Processing cluster using ECS Fargate - Redis-based caching layer using ElastiCache - RDS Aurora PostgreSQL for persistent storage - API Gateway for RESTful access - EFS for shared storage across ECS tasks - SecretsManager for credential management

## Constraints
All sensitive data must be encrypted at rest and in transit using KMS keys with automatic rotation; System must maintain sub-second response times for real-time analytics queries while handling 5000+ transactions per second; Infrastructure must support automatic failover with RPO < 1 minute and RTO < 5 minutes in the ap-northeast-1 region
