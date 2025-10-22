# AWS Region Configuration

## Current Region: EU-WEST-2 (London)

This infrastructure is configured to deploy to the **eu-west-2** region (Europe - London).

## Region Configuration Locations

The AWS region is configured in multiple locations throughout the codebase:

### 1. Infrastructure Code

- **[lib/tap-stack.ts:31](lib/tap-stack.ts#L31)**: Default AWS region for infrastructure deployment
  ```typescript
  const awsRegion = AWS_REGION_OVERRIDE
    ? AWS_REGION_OVERRIDE
    : props?.awsRegion || 'eu-west-2';
  ```

- **[lib/tap-stack.ts:32](lib/tap-stack.ts#L32)**: State bucket region
  ```typescript
  const stateBucketRegion = props?.stateBucketRegion || 'eu-west-2';
  ```

- **[lib/data-processing-module.ts:201](lib/data-processing-module.ts#L201)**: CloudWatch Logs region for ECS
  ```typescript
  'awslogs-region': 'eu-west-2',
  ```

### 2. Test Files

- **[test/tap-stack.unit.test.ts:19-20](test/tap-stack.unit.test.ts#L19-L20)**: Test configuration
  ```typescript
  stateBucketRegion: 'eu-west-2',
  awsRegion: 'eu-west-2',
  ```

### 3. Documentation Files

- **[lib/PROMPT.md:19](lib/PROMPT.md#L19)**: Region requirement in the prompt
- **[lib/IDEAL_RESPONSE.md:214](lib/IDEAL_RESPONSE.md#L214)**: Deployment instructions
- **[lib/MODEL_RESPONSE.md](lib/MODEL_RESPONSE.md)**: Multiple locations in the model response

### 4. Metadata

- **[metadata.json:17](metadata.json#L17)**: AWS region metadata
  ```json
  "aws_region": "eu-west-2"
  ```

## Availability Zones

The infrastructure uses two availability zones within the eu-west-2 region:
- **eu-west-2a**
- **eu-west-2b**

These are automatically configured in [lib/tap-stack.ts:59](lib/tap-stack.ts#L59):
```typescript
availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
```

## Changing the Region

To change the AWS region for deployment:

1. Update the default region in **lib/tap-stack.ts** (lines 31-32)
2. Update the CloudWatch Logs region in **lib/data-processing-module.ts** (line 201)
3. Update test configurations in **test/tap-stack.unit.test.ts**
4. Update documentation files (PROMPT.md, IDEAL_RESPONSE.md, MODEL_RESPONSE.md)
5. Update **metadata.json** with the new region
6. Ensure the target region has at least 2 availability zones available

## State Bucket

The Terraform state is stored in an S3 bucket in the same region:
- **Bucket name**: `iac-rlhf-tf-states`
- **Region**: eu-west-2
- **Key pattern**: `${environmentSuffix}/${stackId}.tfstate`

## Deployment Environment Variable

You can override the region at deployment time by setting:
```bash
export AWS_REGION="eu-west-2"
```

Or pass it as a prop when instantiating the TapStack:
```typescript
new TapStack(app, 'MyStack', {
  awsRegion: 'eu-west-2',
  stateBucketRegion: 'eu-west-2'
});
```
