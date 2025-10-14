I’d like your help designing a real-time, serverless Image processing pipeline on AWS using Pulumi with Python.

The goal is to handle incoming JSON transaction data for a financial system, process it through multiple transformation stages, and store both the raw and processed data in a compliant, auditable way. Think of it as a flow where API Gateway ingests transaction events, different Lambda functions handle each Image processing step, and DynamoDB and S3 manage persistence for metadata and data respectively.

Please write the Pulumi Python program that defines all of these components—APIs, Lambdas, tables, buckets, queues, events, and IAM policies—wired together cleanly and following Pulumi best practices. Include any function code inline or as helper files if needed, and make sure IAM roles follow the principle of least privilege. Show how events move through the system from ingestion to storage and how failures or alerts are handled.

Use natural resource naming, meaningful outputs (API endpoint, queue ARNs, bucket names, etc.), and explain briefly how the architecture achieves compliance and resilience for financial transaction data. I’ll be running this in us-east-1 with Pulumi already set up, so just focus on the infrastructure and orchestration logic that brings the pipeline to life.
