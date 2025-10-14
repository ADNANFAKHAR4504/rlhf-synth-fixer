I’d like your help designing a real-time, serverless Image processing pipeline on AWS using Pulumi with Python.

The goal is to handle incoming image uploads for ML inference, process them through preprocessing and inference stages, and store both the raw images and inference results in an efficient, scalable way. Think of it as a flow where API Gateway provides upload endpoints, different Lambda functions handle each image processing step (preprocessing and ML inference), and DynamoDB and S3 manage persistence for results metadata and image data respectively.

Please write the Pulumi Python program that defines all of these components—APIs, Lambdas, tables, buckets, queues, events, and IAM policies—wired together cleanly and following Pulumi best practices. Include any function code inline or as helper files if needed, and make sure IAM roles follow the principle of least privilege. Show how events move through the system from ingestion to storage and how failures or alerts are handled.

Use natural resource naming, meaningful outputs (API endpoint, queue ARNs, bucket names, etc.), and explain briefly how the architecture achieves scalability and resilience for image processing and ML inference workloads. I'll be running this in us-east-1 with Pulumi already set up, so just focus on the infrastructure and orchestration logic that brings the pipeline to life.
