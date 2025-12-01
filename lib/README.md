# Optimized Static Content Delivery Infrastructure

This Pulumi TypeScript program implements an optimized static content delivery infrastructure with consolidated resources and enhanced security.

## Optimization Changes

This implementation addresses all 9 optimization requirements:

### 1. S3 Bucket Consolidation
- **Before**: Multiple S3 buckets
- **After**: Single consolidated S3 bucket with intelligent tiering
- **Benefit**: Reduced management overhead, automatic cost optimization

### 2. CloudFront Distribution Consolidation
- **Before**: Three separate CloudFront distributions
- **After**: Single CloudFront distribution with multiple origins
- **Benefit**: Simplified management, reduced costs

### 3. Cache Behavior Configuration
- Implemented separate cache policies for:
  - Images (.jpg, .png): 1 day default TTL, 1 year max
  - CSS files (.css): 1 hour default TTL, 1 day max
  - JavaScript files (.js): 1 hour default TTL, 1 day max
- **Benefit**: Optimized caching per file type, improved performance

### 4. S3 Bucket Policy Security
- **Before**: Overly permissive bucket policies
- **After**: Origin Access Identity (OAI) with least privilege
- Bucket only accessible via CloudFront
- **Benefit**: Enhanced security, no public access

### 5. Lambda@Edge Optimization
- **Before**: 4 Lambda@Edge functions
- **After**: 2 optimized Lambda@Edge functions
  - `viewer-request`: Security headers, URI normalization
  - `origin-request`: Default documents, origin headers
- **Benefit**: Reduced costs, simplified maintenance

### 6. Resource Tagging Strategy
- Centralized tag object with:
  - environment
  - team
  - costCenter
  - Environment, Repository, Author, PRNumber, CreatedAt
- **Benefit**: Consistent tagging, better cost tracking

### 7. Region-Agnostic Configuration
- **Before**: Hardcoded regions
- **After**: Uses Pulumi config and environment variables
- Defaults to us-east-1 if not specified
- **Benefit**: Deploy to any region without code changes

### 8. CloudFront Price Class Optimization
- **Before**: PriceClass_All
- **After**: PriceClass_100 (US, Canada, Europe)
- **Benefit**: Cost optimization while maintaining reach

### 9. Stack Outputs
- `distributionUrl`: CloudFront distribution URL
- `bucketName`: S3 bucket name for uploads
- `invalidationCommand`: AWS CLI command for cache invalidation

## Architecture

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  CloudFront Distribution            │
│  - Price Class: 100                 │
│  - Viewer Request Lambda@Edge       │
│  - Origin Request Lambda@Edge       │
│  - Cache policies per file type     │
└──────┬──────────────────────────────┘
       │ (via OAI)
       ▼
┌─────────────────────────────────────┐
│  S3 Bucket (Consolidated)           │
│  - Intelligent Tiering              │
│  - Private (no public access)       │
│  - Accessible only via CloudFront   │
└─────────────────────────────────────┘
```

## Deployment

### Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS credentials configured

### Install Dependencies

```bash
npm install
```

### Deploy

```bash
# Deploy to default region (us-east-1)
pulumi up

# Deploy to specific region
pulumi config set aws:region us-west-2
pulumi up

# Deploy with custom environment suffix
ENVIRONMENT_SUFFIX=prod pulumi up
```

### Outputs

After deployment, the stack exports:

```bash
# Get distribution URL
pulumi stack output distributionUrl

# Get bucket name
pulumi stack output bucketName

# Get invalidation command
pulumi stack output invalidationCommand
```

## Usage

### Upload Content

```bash
BUCKET_NAME=$(pulumi stack output bucketName)
aws s3 cp ./local-file.jpg s3://$BUCKET_NAME/file.jpg
```

### Invalidate Cache

```bash
# Run the exported invalidation command
$(pulumi stack output invalidationCommand)
```

### Access Content

```bash
DISTRIBUTION_URL=$(pulumi stack output distributionUrl)
curl $DISTRIBUTION_URL/file.jpg
```

## Testing

Run unit tests:

```bash
npm test
```

## Security Features

- **No Public S3 Access**: Bucket is fully private
- **OAI Authentication**: Only CloudFront can access S3
- **HTTPS Only**: All traffic redirected to HTTPS
- **Security Headers**: X-Frame-Options, X-Content-Type-Options added via Lambda@Edge
- **Least Privilege**: Minimal IAM permissions

## Cost Optimization

- **Intelligent Tiering**: Automatic storage class transitions
- **PriceClass_100**: Reduced edge location costs
- **Lambda@Edge Consolidation**: 50% reduction in function costs
- **Compression Enabled**: Reduced data transfer costs

## Maintenance

### Update Lambda@Edge Functions

Modify the inline code in `lib/tap-stack.ts` and redeploy:

```bash
pulumi up
```

### Modify Cache Policies

Adjust TTL values in the cache policy configurations and redeploy.

### Change Price Class

Modify the `priceClass` property in the CloudFront distribution configuration.
