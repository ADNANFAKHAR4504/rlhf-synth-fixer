# MODEL FAILURES

## Critical Deployment Failures

### 1. Lambda Function Deployment Package Failure 

**Deployment Error:**
```
Error: reading ZIP file (lambda.zip): open lambda.zip: no such file or directory
```

**Model Response (BROKEN):**
```typescript
// lib/modules.ts - LambdaFunctionConstruct
const lambdaFunction = new LambdaFunction(this, 'function', {
  functionName: props.name,
  role: props.roleArn,
  handler: props.handler,
  runtime: props.runtime,
  filename: 'lambda.zip',  // X References non-existent file
  // ...
});

// Attempted to create zip file at runtime - DOES NOT WORK
const fs = require('fs');
const archiver = require('archiver');
const output = fs.createWriteStream('lambda.zip');
const archive = archiver('zip', { zlib: { level: 9 } });
archive.pipe(output);
archive.append(props.code, { name: 'index.js' });
archive.finalize();
```

**Ideal Response (FIXED):**
```typescript
// lib/modules.ts - LambdaModule
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';

// .Properly uses CDKTF Archive Provider
const archive = new DataArchiveFile(this, 'lambda-archive', {
  type: 'zip',
  outputPath: `${props.projectName}-${props.environment}-processor.zip`,
  source: [
    {
      content: handlerCode,  // Inline code content
      filename: 'index.js',
    },
  ],
});

this.function = new LambdaFunction(this, 'function', {
  functionName: `${props.projectName}-${props.environment}-processor`,
  runtime: 'nodejs18.x',
  handler: 'index.handler',
  role: props.roleArn,
  filename: archive.outputPath,  // .Uses archive output
  sourceCodeHash: archive.outputBase64Sha256,  // .Includes hash for change detection
  // ...
});
```

---

### 2. CloudWatch Alarm ALB Dimension Failure X

**Deployment Error:**
```
Error: creating CloudWatch Metric Alarm
ValidationError: 1 validation error detected: Value '' at 'dimensions.1.member.value' 
failed to satisfy constraint: Member must have length greater than or equal to 1
```

**Model Response (BROKEN):**
```typescript
// MODEL_RESPONSE - No CloudWatch alarm for ALB metrics
// Missing proper ALB dimension handling
```

**Ideal Response (FIXED):**
```typescript
// lib/modules.ts - CloudWatchModule
// .Proper ALB ARN parsing and validation
if (props.albArn && props.albArn.includes('loadbalancer/app/')) {
  const albDimension = props.albArn.split('loadbalancer/')[1] || '';

  if (albDimension) {  // .Validates dimension is not empty
    new CloudwatchMetricAlarm(this, 'alb-unhealthy-hosts', {
      alarmName: `${props.projectName}-${props.environment}-unhealthy-hosts`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 0,
      dimensions: {
        LoadBalancer: albDimension,  // .Properly extracted dimension
      },
      treatMissingData: 'notBreaching',
    });
  }
}
```

---

### 3. Missing Archive Provider Configuration X

**Model Response (BROKEN):**
```typescript
// tap-stack.ts
export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, config: TapStackConfig) {
    super(scope, name);
    
    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: region
    });
    // X Missing Archive Provider - causes Lambda deployment to fail
```

**Ideal Response (FIXED):**
```typescript
// tap-stack.ts
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);
    
    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // .Configure Archive Provider - REQUIRED for Lambda deployments
    new ArchiveProvider(this, 'archive');
```

---

### 4. ALB Target Group VPC ID Extraction Failure X

**Model Response (BROKEN):**
```typescript
// modules.ts - ApplicationLoadBalancerConstruct
const targetGroup = new AlbTargetGroup(this, 'target-group', {
  name: `${props.name}-tg`,
  port: 80,
  protocol: 'HTTP',
  // X Attempts to extract VPC ID from subnet ID - DOES NOT WORK
  vpcId: Fn.element(Fn.split('-', Fn.element(props.subnetIds, 0)), 0),
  // ...
});
```

**Ideal Response (FIXED):**
```typescript
// modules.ts - AlbModule
constructor(
  scope: Construct,
  id: string,
  props: {
    projectName: string;
    environment: string;
    vpcId: string;  // .VPC ID passed as parameter
    // ...
  }
) {
  this.targetGroup = new AlbTargetGroup(this, 'tg', {
    name: `${props.projectName}-${props.environment}-tg`,
    port: 80,
    protocol: 'HTTP',
    vpcId: props.vpcId,  // .Uses provided VPC ID directly
    // ...
  });
}
```

---

### 5. CloudWatch Log Group Dependency Management Failure X

**Deployment Error:**
```
Error: creating CloudWatch Logs Log Group (/aws/lambda/myapp-pr4163-processor): 
ResourceAlreadyExistsException: The specified log group already exists
```

**Model Response (BROKEN):**
```typescript
// modules.ts - LambdaFunctionConstruct
const logGroup = new CloudwatchLogGroup(this, 'log-group', {
  name: `/aws/lambda/${props.name}`,
  retentionInDays: 7,
  tags: props.tags
});

const lambdaFunction = new LambdaFunction(this, 'function', {
  functionName: props.name,
  // ...
  dependsOn: [logGroup]  // X Dependency doesn't prevent Lambda from auto-creating log group
});
```

**Ideal Response (FIXED):**
```typescript
// modules.ts - LambdaModule
// .Creates log group BEFORE Lambda function with explicit name
new CloudwatchLogGroup(this, 'lambda-log-group', {
  name: `/aws/lambda/${props.projectName}-${props.environment}-processor`,
  retentionInDays: 7,
});

this.function = new LambdaFunction(this, 'function', {
  functionName: `${props.projectName}-${props.environment}-processor`,
  // .Lambda will use pre-existing log group, no conflict
  // No explicit dependsOn needed when names match
});
```

---

### 6. S3 Backend State Locking Configuration Failure X

**Model Response (BROKEN):**
```typescript
// tap-stack.ts
// X No S3 backend configuration - uses local state file
// Missing state locking completely
```

**Ideal Response (FIXED):**
```typescript
// tap-stack.ts
// .Configure S3 Backend with native state locking
new S3Backend(this, {
  bucket: stateBucket,
  key: `${environmentSuffix}/${id}.tfstate`,
  region: stateBucketRegion,
  encrypt: true,
});

// .Enable state locking using escape hatch
this.addOverride('terraform.backend.s3.use_lockfile', true);
```

---

### 7. Module Dependency Ordering Failure X

**Model Response (BROKEN):**
```typescript
// tap-stack.ts - Wrong module creation order
// Creates IAM roles before SQS queue exists
const lambdaRole = new IamRoleConstruct(this, 'lambda-role', {
  inlinePolicies: [{
    policy: {
      Statement: [{
        Action: ['sqs:ReceiveMessage'],
        Resource: '*'  // X Uses wildcard instead of specific queue ARN
      }]
    }
  }]
});

// SQS created after IAM role
const sqsQueue = new SqsQueueConstruct(this, 'sqs-queue', {
  // ...
});
```

**Ideal Response (FIXED):**
```typescript
// tap-stack.ts - Correct dependency order
// .1. Create SQS Module first
const sqsModule = new SqsModule(this, 'sqs', {
  queueName: `${projectName}-${environment}-processing-queue`,
  environment,
});

// .2. Create IAM Roles with specific queue ARN
const iamRolesModule = new IamRolesModule(this, 'iam-roles', {
  projectName,
  environment,
  sqsQueueArn: sqsModule.queue.arn,  // .Uses actual queue ARN
});
```

---

### 8. ALB Access Logs S3 Bucket Policy Failure X

**Model Response (BROKEN):**
```typescript
// modules.ts - ApplicationLoadBalancerConstruct
const alb = new Alb(this, 'alb', {
  accessLogs: {
    enabled: false  // X Logs disabled, no bucket configuration
  },
});
```

**Ideal Response (FIXED):**
```typescript
// modules.ts - AlbModule
// .Creates S3 bucket with proper ALB logging permissions
new S3BucketPolicy(this, 'alb-logs-policy', {
  bucket: logBucket.id,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          AWS: 'arn:aws:iam::127311923021:root'  // .ELB service account for us-east-1
        },
        Action: 's3:PutObject',
        Resource: `${logBucket.arn}/*`,
      },
    ],
  }),
});

this.alb = new Alb(this, 'alb', {
  accessLogs: {
    bucket: logBucket.bucket,
    enabled: true,  // .Enabled with proper bucket
    prefix: 'alb',
  },
});
```

---

### 9. Lambda Event Source Mapping Configuration Failure X

**Model Response (BROKEN):**
```typescript
// modules.ts - Hard-coded Lambda code in constructor
code: `
exports.handler = async (event) => {
  // Inline code string - not maintainable
};
`
```

**Ideal Response (FIXED):**
```typescript
// modules.ts - LambdaModule
// .Properly structured Lambda handler code
const handlerCode = `
exports.handler = async (event) => {
  console.log('Processing SQS messages:', JSON.stringify(event));
  
  for (const record of event.Records) {
    const messageBody = record.body;
    console.log('Processing message:', messageBody);
    
    try {
      const data = JSON.parse(messageBody);
      console.log('Parsed message data:', data);
      
      // Process message logic here
      await processMessage(data);
      
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;  // .Proper error propagation for DLQ handling
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Messages processed successfully' })
  };
};

async function processMessage(data) {
  // .Separated business logic function
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Message processed:', data);
}
`;
```

---

### 10. Auto Scaling Group Launch Template User Data Encoding X

**Model Response (BROKEN):**
```typescript
// modules.ts - AutoScalingGroupConstruct
userData: Fn.base64encode(props.userData),  // X Double encoding
```

**Ideal Response (FIXED):**
```typescript
// modules.ts - AsgModule
const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${props.projectName}-${props.environment}</h1>" > /var/www/html/index.html
`;

const launchTemplate = new LaunchTemplate(this, 'lt', {
  userData: Buffer.from(userData).toString('base64'),  // .Proper base64 encoding
});
```