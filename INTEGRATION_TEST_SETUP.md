# Integration Test Setup Guide

## Option 1: Use Real AWS Credentials (Recommended for Dev/CI)

### For Local Development:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
npm test
```

### For CI/CD (GitHub Actions example):
```yaml
- name: Run Integration Tests
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_DEFAULT_REGION: us-east-1
  run: npm test
```

## Option 2: Use AWS CLI Configuration
```bash
aws configure set aws_access_key_id your_access_key
aws configure set aws_secret_access_key your_secret_key
aws configure set default.region us-east-1
npm test
```

## Option 3: Use IAM Roles (for EC2/ECS environments)
No additional configuration needed if running on AWS infrastructure with proper IAM roles.
