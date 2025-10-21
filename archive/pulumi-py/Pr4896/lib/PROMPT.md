# IoT Sensor Data Processing Infrastructure

I need help setting up infrastructure for our manufacturing facility's IoT sensor data processing system. We have about 10,000 requests per minute during peak times from sensors across the factory floor.

## Requirements

We need to deploy this in AWS ca-central-1 region with multi-AZ setup for high availability. The infrastructure should include:

1. API Gateway REST endpoint to receive sensor data
2. ElastiCache Redis cluster for caching real-time sensor readings
3. Aurora PostgreSQL Serverless v2 database for persistent storage (we need this for compliance)
4. Secrets Manager to handle database credentials

## Specific Configuration Needs

For the API Gateway, we need rate limiting set to 200 requests per second per client to prevent any single sensor or client from overwhelming the system.

The database credentials in Secrets Manager should rotate automatically every 30 days. I saw AWS has improved their automatic rotation features recently, so please use the managed rotation capabilities.

For the Redis cache, a small cluster should work since we are mainly caching the latest sensor readings. The Aurora database should be multi-AZ for compliance requirements.

## Implementation

Please provide Pulumi Python code for this infrastructure. Structure it properly with the main stack in tap_stack.py that can be imported by the main Pulumi application. Make sure all resources are properly configured for the ca-central-1 region.

I need one code block per file so I can easily copy and paste each file into my project.