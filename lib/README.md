# Lambda Image Processing Pipeline - Optimized Infrastructure

This Pulumi TypeScript project implements an optimized Lambda-based image processing pipeline with ARM64 architecture, SnapStart for Java functions, and comprehensive observability.

## Architecture Overview

The infrastructure consists of:
- **3 Lambda Functions**: Thumbnail Generator, Watermark Applier (Java with SnapStart), Metadata Extractor
- **2 S3 Buckets**: Input and output buckets for image processing
- **Lambda Layers**: Shared dependencies for Node.js and Java functions
- **CloudWatch Logs**: 7-day retention for all functions
- **X-Ray Tracing**: Active tracing for performance monitoring
- **Function URLs**: Direct HTTPS endpoints with CORS configuration
- **IAM Roles**: Least-privilege access for each function

## Key Optimizations

1. **ARM64 Architecture**: All functions use ARM64 for ~20% cost savings
2. **Lambda SnapStart**: Java function uses SnapStart to reduce cold start latency
3. **Reserved Concurrency**: Thumbnail (50), Watermark (25), Metadata (25)
4. **Memory Optimization**: Right-sized memory allocations based on profiling
5. **Lambda Layers**: Shared dependencies reduce deployment package sizes
6. **Log Retention**: 7-day retention prevents unlimited log growth

## Requirements Implemented

- Requirement 1: ARM64 architecture for all three Lambda functions
- Requirement 2: Lambda SnapStart for Java watermark function
- Requirement 3: Reserved concurrency (50 for thumbnail, 25 for others)
- Requirement 4: Memory allocations (1024MB, 512MB, 256MB)
- Requirement 5: Lambda layers for shared dependencies
- Requirement 6: CloudWatch log retention set to 7 days
- Requirement 7: X-Ray tracing enabled for all functions
- Requirement 8: Least-privilege IAM roles with S3 access
- Requirement 9: Lambda function URLs with CORS configuration
- Requirement 10: Environment variables from Pulumi config

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI installed
- AWS credentials configured
- Java 21 and Maven (for building Java Lambda)

## Configuration

Set the following Pulumi configuration values:

```bash
pulumi config set inputBucketName my-input-bucket
pulumi config set outputBucketName my-output-bucket
```

Or use default naming based on environment suffix.

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Build Lambda functions:
```bash
# Build Node.js Lambda layers
cd lib/lambda/layers/nodejs && npm install && cd -

# Build Java Lambda function
cd lib/lambda/watermark-applier && mvn package && cd -
```

3. Deploy infrastructure:
```bash
export ENVIRONMENT_SUFFIX=dev
pulumi up
```

## Outputs

After deployment, the following outputs are available:

- `thumbnailFunctionUrl`: HTTPS endpoint for thumbnail generation
- `watermarkFunctionUrl`: HTTPS endpoint for watermark application
- `metadataFunctionUrl`: HTTPS endpoint for metadata extraction
- `inputBucketName`: Name of the input S3 bucket
- `outputBucketName`: Name of the output S3 bucket

## Testing Function URLs

Test the thumbnail generator:
```bash
curl -X POST https://<thumbnail-url> \
  -H "Content-Type: application/json" \
  -d '{"sourceKey": "test-image.jpg"}'
```

Test the watermark applier:
```bash
curl -X POST https://<watermark-url> \
  -H "Content-Type: application/json" \
  -d '{"sourceKey": "test-image.jpg"}'
```

Test the metadata extractor:
```bash
curl -X POST https://<metadata-url> \
  -H "Content-Type: application/json" \
  -d '{"sourceKey": "test-image.jpg"}'
```

## Monitoring

- **CloudWatch Logs**: All functions log to `/aws/lambda/<function-name>-<env-suffix>`
- **X-Ray Traces**: View performance traces in AWS X-Ray console
- **Metrics**: Monitor invocations, errors, duration in CloudWatch Metrics

## Cost Optimization Notes

- ARM64 architecture provides ~20% cost savings vs x86_64
- Lambda SnapStart reduces Java cold starts, improving user experience
- 7-day log retention prevents unlimited CloudWatch storage costs
- Reserved concurrency ensures predictable performance and cost
- Lambda layers reduce deployment times and storage

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Architecture Diagram

```
┌─────────────┐
│   Input S3  │
│   Bucket    │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       v              v
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Thumbnail  │  │  Watermark  │  │  Metadata   │
│  Generator  │  │   Applier   │  │  Extractor  │
│  (Node.js)  │  │   (Java)    │  │  (Node.js)  │
│   ARM64     │  │   ARM64     │  │   ARM64     │
│  1024MB/50  │  │  512MB/25   │  │  256MB/25   │
│  + X-Ray    │  │  + SnapStart│  │  + X-Ray    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                        v
                ┌─────────────┐
                │  Output S3  │
                │   Bucket    │
                └─────────────┘
```

## License

MIT
