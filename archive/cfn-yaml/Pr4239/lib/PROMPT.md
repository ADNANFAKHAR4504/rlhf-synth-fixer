A financial firm processes 1 million nightly transactions. The system must complete within a 4-hour window, handle failures gracefully, and provide detailed tracking. Compliance with audit requirements is mandatory.

Create a single CloudFormation template to deploy a batch processing system using:

    •	AWS Batch: compute environments and job queues for scalable processing
    •	Lambda: orchestration and job submission
    •	S3: storage of raw and processed transaction data
    •	DynamoDB: track job status and audit logs
    •	CloudWatch: monitoring and metrics
    •	SNS: alerts for failures or job completion
    •	IAM: secure access and execution permissions
