# Manufacturing Data Pipeline Infrastructure

I need help building infrastructure for a smart manufacturing data pipeline in Asia-Pacific. We operate factories that generate large amounts of sensor data from manufacturing equipment, and we need a reliable system to collect and process this data in real-time.

## What We Need

Our factories have IoT sensors on manufacturing equipment that send data continuously. During peak production times, we can see up to 100,000 events per second. We need to:

1. Collect this streaming data reliably
2. Process it quickly (under 500 milliseconds for critical alerts)
3. Store operational data in a database
4. Cache frequently accessed data for dashboards
5. Store files that multiple processing services need to access
6. Provide an API for external systems to integrate with
7. Keep credentials secure

## Technical Requirements

We're using CDKTF with TypeScript, and everything needs to be deployed in the eu-west-2 (London) region. Here are the specific requirements:

- Use Kinesis Data Streams with on-demand mode for ingesting the sensor data (this automatically scales with traffic)
- Deploy containerized processing applications using ECS Fargate
- Store operational data in Aurora PostgreSQL Serverless v2 (we need this to be serverless for cost optimization)
- Use ElastiCache Redis cluster in cluster mode for caching real-time metrics with multi-AZ
- Mount EFS volumes for shared storage across containers
- Set up API Gateway with REST APIs for external integrations
- Store database credentials and API keys in Secrets Manager

For reliability and compliance:
- Multi-AZ deployment for high availability across at least 2 availability zones
- All data must be encrypted in transit and at rest
- Keep critical sensor data for 7 years (use S3 with appropriate lifecycle policies for long-term storage)
- Support blue-green deployments for the ECS services

## Additional Considerations

Please make sure the Kinesis stream is configured with on-demand mode to handle the variable throughput automatically. For Aurora, please use the Serverless v2 configuration with appropriate min and max ACU scaling settings. The ElastiCache cluster should be configured in cluster mode with automatic failover enabled.

Can you provide the complete CDKTF TypeScript infrastructure code for this? Please structure it with separate modules or constructs for better organization. Include all necessary networking components like VPC, subnets, security groups, and NAT gateways configured for multi-AZ deployment. Each file should be in a separate code block so it's easy to extract.
