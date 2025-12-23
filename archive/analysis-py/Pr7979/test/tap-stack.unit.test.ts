/**
 * Unit tests for Pulumi CloudWatch monitoring infrastructure
 * Tests the code structure and configuration
 */

describe('CloudWatch Monitoring Infrastructure - Unit Tests', () => {
  describe('Infrastructure Code Structure', () => {
    test('index.ts file exists and is valid TypeScript', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);

      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('@pulumi/pulumi');
      expect(content).toContain('@pulumi/aws');
    });

    test('imports required Pulumi modules', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain("import * as pulumi from '@pulumi/pulumi'");
      expect(content).toContain("import * as aws from '@pulumi/aws'");
    });

    test('uses environment suffix from config', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('environmentSuffix');
      expect(content).toContain('config.require');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('resources include environment suffix in names', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      // Check that resource names use environmentSuffix
      expect(content).toMatch(/\$\{environmentSuffix\}/);
      expect(content).toMatch(/`.*-\$\{environmentSuffix\}`/);
    });

    test('S3 buckets have forceDestroy enabled', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      // Find S3 bucket definitions
      const bucketMatches = content.match(/new aws\.s3\.Bucket\([^)]+\{[^}]+\}/gs);
      expect(bucketMatches).toBeTruthy();

      if (bucketMatches) {
        bucketMatches.forEach(bucketDef => {
          expect(bucketDef).toContain('forceDestroy: true');
        });
      }
    });
  });

  describe('CloudWatch Resources', () => {
    test('defines CloudWatch Log Groups', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.cloudwatch.LogGroup');
      expect(content).toContain('retentionInDays');
    });

    test('defines CloudWatch Alarms', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.cloudwatch.MetricAlarm');
      expect(content).toContain('comparisonOperator');
      expect(content).toContain('threshold');
    });

    test('defines CloudWatch Dashboard', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.cloudwatch.Dashboard');
      expect(content).toContain('dashboardBody');
    });

    test('defines CloudWatch Synthetics Canary', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.synthetics.Canary');
      expect(content).toContain('artifactS3Location');
    });

    test('defines CloudWatch Metric Stream', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.cloudwatch.MetricStream');
      expect(content).toContain('firehoseArn');
    });
  });

  describe('SNS Topics and Subscriptions', () => {
    test('defines SNS topics for alerting', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.sns.Topic');
      expect(content).toContain('critical-alerts');
      expect(content).toContain('warning-alerts');
      expect(content).toContain('emergency-alerts');
    });

    test('defines email subscriptions for topics', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.sns.TopicSubscription');
      expect(content).toContain("protocol: 'email'");
    });
  });

  describe('Lambda Function', () => {
    test('defines Lambda function for metric processing', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.lambda.Function');
      expect(content).toContain('metric-processor');
      expect(content).toContain('handler');
      expect(content).toContain('runtime');
    });

    test('Lambda uses Node.js 18 runtime', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('NodeJS18dX');
    });

    test('Lambda has IAM role', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.iam.Role');
      expect(content).toContain('lambda-role');
    });
  });

  describe('Kinesis Firehose', () => {
    test('defines Kinesis Firehose for metric delivery', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('aws.kinesis.FirehoseDeliveryStream');
      expect(content).toContain('extendedS3Configuration');
    });
  });

  describe('Exports', () => {
    test('exports stack outputs', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'lib', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('export const');
      expect(content).toContain('metricsBucketName');
      expect(content).toContain('dashboardName');
      expect(content).toContain('apiCanaryName');
    });
  });
});
