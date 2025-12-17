# LocalStack Deployment

This project is configured to use LocalStack for local AWS infrastructure testing.

## Prerequisites

- Docker installed and running
- LocalStack running on port 4566

## Getting Started

1. Start LocalStack:
   ```bash
   docker-compose up -d
   ```

2. Verify LocalStack is running:
   ```bash
   curl http://localhost:4566/_localstack/health
   ```

3. Deploy your infrastructure:
   ```bash
   ./scripts/localstack-deploy.sh
   ```

4. Run tests:
   ```bash
   ./scripts/localstack-test.sh
   ```

## Environment Variables

The following environment variables are configured for LocalStack:
- AWS_ENDPOINT_URL=http://localhost:4566
- AWS_ACCESS_KEY_ID=test
- AWS_SECRET_ACCESS_KEY=test
- AWS_DEFAULT_REGION=us-east-1

## Cleanup

Stop LocalStack:
```bash
docker-compose down
```
