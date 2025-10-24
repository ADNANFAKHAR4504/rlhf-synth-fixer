# IoT Sensor Data Processing Infrastructure

I need to set up infrastructure for a manufacturing plant's IoT sensor monitoring system. We have assembly lines with sensors that track equipment performance, temperature, and vibration data. This data needs to be processed in real-time and stored for future analysis.

## Requirements

We need to build a data processing pipeline with the following components:

1. A streaming service to ingest real-time sensor data from our equipment
2. A caching layer to temporarily hold data for quick access
3. A database to store historical data for analysis
4. Secure credential management for database access

## Technical Details

- Use Amazon Kinesis Data Streams for data ingestion
- Set up Amazon ElastiCache Redis for caching (data should only be cached for 24 hours max)
- Deploy Amazon RDS PostgreSQL for persistent storage
- Store all database credentials and connection strings in AWS Secrets Manager
- Deploy to eu-central-1 region
- Use Pulumi with Python for infrastructure code

## Additional Considerations

- Make sure the Redis cache automatically expires data after 24 hours
- All resources should follow proper naming conventions with environment suffixes
- Include appropriate security groups and networking setup
- Tag resources appropriately for tracking

Please provide the complete Pulumi Python code with one code block per file. The code should be production-ready and follow AWS best practices.
