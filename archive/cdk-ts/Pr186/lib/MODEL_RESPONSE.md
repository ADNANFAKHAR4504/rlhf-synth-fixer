# Serverless Image Processing Infrastructure - Model Response

This document describes how the CDK constructs infrastructure based on the given requirements: integrating an existing S3 bucket, Lambda function, API Gateway, IAM roles, and SNS topic in a secure, modular, and testable way.

---

## ✅ Component Overview

### 📦 S3 Bucket (Existing)
Referenced instead of being created:

```ts
const imageBucket = s3.Bucket.fromBucketName(this, 'ExistingImageBucket', 'existing-bucket-name');
```

---

### 🧠 Lambda Function (in `lambda/imageProcessor.ts`)
Handles API requests and publishes to SNS:

```ts
const imageProcessorLambda = new lambda.Function(this, 'ImageProcessor', {
  runtime: lambda.Runtime.NODEJS_18_X,
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
  handler: 'imageProcessor.handler',
  environment: {
    BUCKET_NAME: imageBucket.bucketName,
    SNS_TOPIC_ARN: notificationTopic.topicArn,
  },
});
```

---

### 🔐 IAM Permissions
Use `grant*` methods for least privilege:

```ts
imageBucket.grantReadWrite(imageProcessorLambda);
notificationTopic.grantPublish(imageProcessorLambda);
```

---

### 🌐 API Gateway
Expose REST endpoint `/process` to trigger the Lambda:

```ts
const api = new apigateway.RestApi(this, 'ImageApi');
const process = api.root.addResource('process');
process.addMethod('POST', new apigateway.LambdaIntegration(imageProcessorLambda));
```

---

### 📣 SNS Topic
Created to notify on successful Lambda execution:

```ts
const notificationTopic = new sns.Topic(this, 'ImageNotification');
notificationTopic.grantPublish(imageProcessorLambda);
```

---

## 🔒 Security Best Practices

- Avoid `*` in IAM policies.
- Use CDK’s scoped grants (`grantReadWrite`, `grantPublish`).
- Ensure environment variables are safely injected.
- Apply resource tagging for QA cleanup:

```ts
Tags.of(this).add('Environment', 'Test');
```

---

## 🗂 Directory Structure

```
.
├── bin/
│   └── tap.ts
├── lambda/
│   ├── imageProcessor.ts   # Lambda handler source (TS)
│   ├── imageProcessor.js   # Compiled JS output
│   └── package.json        # Lambda dependencies
├── lib/
│   ├── tap-stack.ts        # CDK stack definition
│   ├── PROMPT.md
│   ├── MODEL_RESPONSE.md   # (this file)
│   ├── MODEL_FAILURES.md
│   └── IDEAL_RESPONSE.md
├── test/
│   ├── tap-stack.unit.test.ts
│   └── tap-stack.int.test.ts
└── metadata.json
```

---

## 🧪 Testing

Run integration tests via:

```bash
npm run test:integration
```

Sample API invocation:

```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/process -d '{"image": "base64content"}'
```

---

## ✅ Summary

This setup ensures:

- All components are connected securely.
- IAM permissions follow least privilege.
- API Gateway integration works with Lambda.
- SNS is used for async notifications.
- Compliant with QA pipeline and directory structure.
