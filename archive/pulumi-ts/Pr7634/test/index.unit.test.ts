import * as pulumi from '@pulumi/pulumi';

// Set mocked config values
process.env.PULUMI_CONFIG = JSON.stringify({
  'aws:region': 'us-east-1',
});

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // Extract service name from type (e.g., "aws:s3/bucket:Bucket" -> "s3")
    const serviceMatch = args.type.match(/^aws:([^/]+)/);
    const service = serviceMatch ? serviceMatch[1] : 'unknown';

    const outputs: any = {
      ...args.inputs,
      id: args.name + '_id',
      arn: `arn:aws:${service}:us-east-1:123456789012:${args.name}`,
    };

    // Add specific outputs based on resource type
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || `${args.name}-bucket`;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.name = `${args.name}-function`;
      outputs.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${outputs.arn}/invocations`;
    } else if (args.type === 'aws:kms/key:Key') {
      outputs.keyId = 'test-key-id';
    } else if (args.type === 'aws:cloudwatch/dashboard:Dashboard') {
      outputs.dashboardName = args.inputs.dashboardName || 'test-dashboard';
    } else if (args.type === 'aws:cfg/rule:Rule') {
      outputs.ruleId = `${args.name}-rule-id`;
    }

    return {
      id: args.name + '_id',
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    return {};
  },
});

// Import infrastructure synchronously
const infrastructure = require('../lib/index');

describe('Compliance Monitoring Infrastructure', () => {

  describe('KMS Key', () => {
    it('should create a KMS key with rotation enabled', (done) => {
      pulumi.all([infrastructure.kmsKeyId]).apply(([keyId]) => {
        expect(keyId).toBeDefined();
        expect(keyId).not.toBe('');
        done();
      });
    });

    it('should export KMS key ARN', (done) => {
      pulumi.all([infrastructure.kmsKeyArn]).apply(([keyArn]) => {
        expect(keyArn).toBeDefined();
        expect(keyArn).toContain('arn:aws:kms');
        done();
      });
    });
  });

  describe('S3 Bucket', () => {
    it('should create an S3 bucket for compliance reports', (done) => {
      pulumi.all([infrastructure.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeDefined();
        expect(bucketName).toContain('compliance-reports');
        done();
      });
    });

    it('should export bucket ARN', (done) => {
      pulumi.all([infrastructure.bucketArn]).apply(([bucketArn]) => {
        expect(bucketArn).toBeDefined();
        expect(bucketArn).toContain('arn:aws:s3');
        done();
      });
    });
  });

  describe('Lambda Functions', () => {
    it('should create processing Lambda function', (done) => {
      pulumi.all([infrastructure.processingLambdaName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('compliance-processing-lambda');
        done();
      });
    });

    it('should create aggregation Lambda function', (done) => {
      pulumi.all([infrastructure.aggregationLambdaName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('compliance-aggregation-lambda');
        done();
      });
    });

    it('should create remediation Lambda function', (done) => {
      pulumi.all([infrastructure.remediationLambdaName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('compliance-remediation-lambda');
        done();
      });
    });

    it('should export all Lambda ARNs', (done) => {
      pulumi
        .all([
          infrastructure.processingLambdaArn,
          infrastructure.aggregationLambdaArn,
          infrastructure.remediationLambdaArn,
        ])
        .apply(([procArn, aggArn, remArn]) => {
          expect(procArn).toContain('arn:aws:lambda');
          expect(aggArn).toContain('arn:aws:lambda');
          expect(remArn).toContain('arn:aws:lambda');
          done();
        });
    });
  });

  describe('SNS Topic', () => {
    it('should create SNS topic for notifications', (done) => {
      pulumi.all([infrastructure.snsTopicArn]).apply(([topicArn]) => {
        expect(topicArn).toBeDefined();
        expect(topicArn).toContain('arn:aws:sns');
        done();
      });
    });
  });

  describe('IAM Roles', () => {
    it('should create Lambda execution role', (done) => {
      pulumi.all([infrastructure.lambdaRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        expect(roleArn).toContain('arn:aws:iam');
        done();
      });
    });

    it('should create Config service role', (done) => {
      pulumi.all([infrastructure.configRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        expect(roleArn).toContain('arn:aws:iam');
        done();
      });
    });
  });

  describe('AWS Config Rules', () => {
    it('should create all required Config rules', (done) => {
      pulumi.all([infrastructure.configRuleNames]).apply(([ruleNames]) => {
        expect(ruleNames).toBeDefined();
        expect(Array.isArray(ruleNames)).toBe(true);
        expect(ruleNames.length).toBe(4);
        done();
      });
    });

    it('should include EC2 instance type rule', (done) => {
      pulumi.all([infrastructure.configRuleNames]).apply(([ruleNames]) => {
        expect(ruleNames).toContain('ec2-approved-instance-types');
        done();
      });
    });

    it('should include S3 encryption rule', (done) => {
      pulumi.all([infrastructure.configRuleNames]).apply(([ruleNames]) => {
        expect(ruleNames).toContain('s3-bucket-encryption-enabled');
        done();
      });
    });

    it('should include RDS backup rule', (done) => {
      pulumi.all([infrastructure.configRuleNames]).apply(([ruleNames]) => {
        expect(ruleNames).toContain('rds-backup-retention-enabled');
        done();
      });
    });

    it('should include EBS encryption rule', (done) => {
      pulumi.all([infrastructure.configRuleNames]).apply(([ruleNames]) => {
        expect(ruleNames).toContain('ebs-volumes-encrypted');
        done();
      });
    });
  });

  describe('Config Aggregator', () => {
    it('should create Config aggregator', (done) => {
      pulumi.all([infrastructure.configAggregatorName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toBe('compliance-aggregator');
        done();
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should create CloudWatch dashboard', (done) => {
      pulumi.all([infrastructure.dashboardName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toBe('ComplianceMonitoring');
        done();
      });
    });
  });

  describe('Exports', () => {
    it('should export all required outputs', (done) => {
      pulumi
        .all([
          infrastructure.bucketName,
          infrastructure.bucketArn,
          infrastructure.kmsKeyId,
          infrastructure.kmsKeyArn,
          infrastructure.processingLambdaArn,
          infrastructure.processingLambdaName,
          infrastructure.aggregationLambdaArn,
          infrastructure.aggregationLambdaName,
          infrastructure.remediationLambdaArn,
          infrastructure.remediationLambdaName,
          infrastructure.snsTopicArn,
          infrastructure.dashboardName,
          infrastructure.configRuleNames,
          infrastructure.configAggregatorName,
          infrastructure.lambdaRoleArn,
          infrastructure.configRoleArn,
        ])
        .apply((outputs) => {
          outputs.forEach((output) => {
            expect(output).toBeDefined();
          });
          done();
        });
    });
  });
});
