# Build AWS Serverless App with CDK TypeScript

Create a complete CDK-TS project for serverless web app.

## Stack
- Region: `us-west-1` 
- S3 static hosting + API Gateway + Lambda + RDS PostgreSQL
- Single stack, no hardcoded secrets

## Infrastructure
- **VPC:** `10.0.0.0/16`, public/private subnets, 2+ AZs
- **S3:** Static hosting, public read, auto-delete
- **Lambda:** Python 3.8, private subnets, connects to RDS
- **RDS:** PostgreSQL 14, t3.micro, private, 7-day backups
- **API Gateway:** REST `/api` GET, CORS enabled
- **Security:** Proper SGs, RDS secrets in Secrets Manager

## Lambda Code
- Connect to RDS via Secrets Manager
- Return `{status: "success"}`
- Dependencies: `psycopg2-binary`, `aws-secretsmanager-caching`

## Output
Complete working code ready for `cdk deploy`. Include all files.