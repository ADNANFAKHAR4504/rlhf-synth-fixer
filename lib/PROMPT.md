Here’s a minimal but complete version of your prompt, still in `.md` format, covering all aspects without unnecessary repetition:
# LLM Prompt: Production-Grade AWS CDK-TS Serverless App

## Role
Act as an expert AWS Cloud Engineer specializing in AWS CDK with TypeScript.

## Objective
Generate a **fully functional CDK-TypeScript project** that provisions a **serverless web app** with:
- Frontend: S3 static hosting
- API: API Gateway + Lambda (Python)
- Data: RDS PostgreSQL in a secure VPC

Output must include **entire project structure & code**, deployable with `cdk deploy`.

## Requirements

### General
- Region: `us-west-1`
- Language: TypeScript
- Use L2 constructs, no hardcoded secrets (Secrets Manager).
- Add comments, type-safe code.

### Networking
- VPC `10.0.0.0/16` with public + private subnets (≥2 AZs).
- Lambda & RDS in private subnets.

### S3 (Frontend)
- Static site hosting (`index.html`, `error.html`)
- `publicReadAccess: true`
- `removalPolicy: DESTROY`, `autoDeleteObjects: true`

### RDS (Data)
- PostgreSQL 14, t3.micro
- Private subnets, SG allows port 5432 from Lambda SG only
- Credentials in Secrets Manager
- Backups: enabled, retention 7 days

### Lambda (Compute)
- Runtime: Python 3.8
- Location: `lambda/handler.py`
- Inside private subnets
- IAM Role: basic exec, VPC access, read RDS secret
- Env var: DB secret ARN
- Code: fetch secret, connect to DB, return JSON `{status: success}`
- `requirements.txt`: `psycopg2-binary`, `aws-secretsmanager-caching`

### API Gateway
- REST API, Lambda Proxy Integration
- Resource `/api` with GET
- Enable CORS (*)
- Output endpoint URL

## Project Structure


my-serverless-app/
├── bin/my-serverless-app.ts
├── lib/my-serverless-app-stack.ts
   ├── lambda/
            ├── handler.py
            ├── requirements.txt
├── .gitignore
├── cdk.json
├── package.json
├── README.md
└── tsconfig.json



## Final Instructions
- Provide all files/code in one response.  
- Must pass `cdk synth` & `cdk deploy` without edits.  

