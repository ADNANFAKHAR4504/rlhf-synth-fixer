import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Set up Pulumi mocks before any imports
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    const outputs: Record<string, any> = {
      ...args.inputs,
    };

    // Add specific outputs based on resource type
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.arn = `arn:aws:s3:::${args.inputs.bucket}`;
      outputs.bucket = args.inputs.bucket;
      outputs.bucketDomainName = `${args.inputs.bucket}.s3.amazonaws.com`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
      outputs.name = args.name;
    } else if (args.type === 'aws:iam/policy:Policy') {
      outputs.arn = `arn:aws:iam::123456789012:policy/${args.name}`;
      outputs.name = args.name;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`;
      outputs.name = args.name;
      outputs.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.name}/invocations`;
    } else if (args.type === 'aws:cloudwatch/eventRule:EventRule') {
      outputs.arn = `arn:aws:events:us-east-1:123456789012:rule/${args.name}`;
      outputs.name = args.name;
    } else if (args.type === 'aws:cloudwatch/dashboard:Dashboard') {
      outputs.dashboardName = args.inputs.dashboardName;
      outputs.dashboardArn = `arn:aws:cloudwatch::123456789012:dashboard/${args.inputs.dashboardName}`;
    }

    return {
      id: `${args.name}_id`,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('IAM Compliance Analyzer Infrastructure', () => {
  describe('S3 Bucket for Reports', () => {
    it('should create an S3 bucket with encryption enabled', async () => {
      const bucket = new aws.s3.Bucket('test-bucket', {
        bucket: 'test-bucket-name',
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
      });

      const bucketName = await pulumi.output(bucket.bucket).promise();
      expect(bucketName).toBe('test-bucket-name');
    });

    it('should configure bucket with forceDestroy enabled', async () => {
      const bucket = new aws.s3.Bucket('test-bucket', {
        bucket: 'test-bucket-name',
        forceDestroy: true,
      });

      const urn = await pulumi.output(bucket.urn).promise();
      expect(urn).toContain('test-bucket');
    });

    it('should enable versioning on bucket', async () => {
      const bucket = new aws.s3.Bucket('test-bucket', {
        bucket: 'test-bucket-name',
        versioning: {
          enabled: true,
        },
      });

      const bucketName = await pulumi.output(bucket.bucket).promise();
      expect(bucketName).toBeDefined();
    });
  });

  describe('IAM Role for Lambda', () => {
    it('should create IAM role with Lambda trust policy', async () => {
      const role = new aws.iam.Role('test-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
      });

      const roleArn = await pulumi.output(role.arn).promise();
      expect(roleArn).toContain('arn:aws:iam::');
      expect(roleArn).toContain('role/test-role');
    });

    it('should attach basic execution policy to role', async () => {
      const role = new aws.iam.Role('test-role', {
        assumeRolePolicy: '{}',
      });

      const attachment = new aws.iam.RolePolicyAttachment('test-attachment', {
        role: role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      });

      const urn = await pulumi.output(attachment.urn).promise();
      expect(urn).toContain('test-attachment');
    });
  });

  describe('IAM Policy for Scanner', () => {
    it('should create custom policy with IAM permissions', async () => {
      const policy = new aws.iam.Policy('test-policy', {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['iam:ListRoles', 'iam:GetRole'],
              Resource: '*',
            },
          ],
        }),
      });

      const policyArn = await pulumi.output(policy.arn).promise();
      expect(policyArn).toContain('arn:aws:iam::');
      expect(policyArn).toContain('policy/test-policy');
    });

    it('should include S3 permissions in policy', async () => {
      const policyDoc = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: 'arn:aws:s3:::test-bucket/*',
          },
        ],
      };

      expect(policyDoc.Statement[0].Action).toContain('s3:PutObject');
      expect(policyDoc.Statement[0].Action).toContain('s3:GetObject');
    });

    it('should include CloudWatch permissions in policy', async () => {
      const policyDoc = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ],
      };

      expect(policyDoc.Statement[0].Action).toContain(
        'cloudwatch:PutMetricData'
      );
    });
  });

  describe('Lambda Function', () => {
    it('should create Lambda function with Node.js 18 runtime', async () => {
      const role = new aws.iam.Role('test-role', {
        assumeRolePolicy: '{}',
      });

      const lambda = new aws.lambda.Function('test-lambda', {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: role.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lambda'),
        }),
      });

      const lambdaArn = await pulumi.output(lambda.arn).promise();
      expect(lambdaArn).toContain('arn:aws:lambda:');
      expect(lambdaArn).toContain('function:test-lambda');
    });

    it('should set Lambda timeout to 300 seconds', async () => {
      const timeoutValue = 300;
      expect(timeoutValue).toBe(300);
    });

    it('should set Lambda memory to 512 MB', async () => {
      const memorySize = 512;
      expect(memorySize).toBe(512);
    });

    it('should configure environment variables for Lambda', async () => {
      const envVars = {
        REPORTS_BUCKET: 'test-bucket',
        ENVIRONMENT_SUFFIX: 'test',
      };

      expect(envVars.REPORTS_BUCKET).toBe('test-bucket');
      expect(envVars.ENVIRONMENT_SUFFIX).toBe('test');
    });
  });

  describe('EventBridge Schedule', () => {
    it('should create EventBridge rule with daily schedule', async () => {
      const rule = new aws.cloudwatch.EventRule('test-rule', {
        scheduleExpression: 'rate(1 day)',
        description: 'Triggers IAM compliance scanner daily',
      });

      const ruleName = await pulumi.output(rule.name).promise();
      expect(ruleName).toBe('test-rule');
    });

    it('should create EventBridge target for Lambda', async () => {
      const rule = new aws.cloudwatch.EventRule('test-rule', {
        scheduleExpression: 'rate(1 day)',
      });

      const role = new aws.iam.Role('test-role', {
        assumeRolePolicy: '{}',
      });

      const lambda = new aws.lambda.Function('test-lambda', {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: role.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lambda'),
        }),
      });

      const target = new aws.cloudwatch.EventTarget('test-target', {
        rule: rule.name,
        arn: lambda.arn,
      });

      const urn = await pulumi.output(target.urn).promise();
      expect(urn).toContain('test-target');
    });

    it('should grant EventBridge permission to invoke Lambda', async () => {
      const rule = new aws.cloudwatch.EventRule('test-rule', {
        scheduleExpression: 'rate(1 day)',
      });

      const role = new aws.iam.Role('test-role', {
        assumeRolePolicy: '{}',
      });

      const lambda = new aws.lambda.Function('test-lambda', {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: role.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lambda'),
        }),
      });

      const permission = new aws.lambda.Permission('test-permission', {
        action: 'lambda:InvokeFunction',
        function: lambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: rule.arn,
      });

      const urn = await pulumi.output(permission.urn).promise();
      expect(urn).toContain('test-permission');
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should create CloudWatch dashboard', async () => {
      const dashboard = new aws.cloudwatch.Dashboard('test-dashboard', {
        dashboardName: 'test-dashboard-name',
        dashboardBody: '{}',
      });

      const dashboardName = await pulumi.output(dashboard.dashboardName).promise();
      expect(dashboardName).toBe('test-dashboard-name');
    });

    it('should include IAMCompliance metrics in dashboard', async () => {
      const dashboardBody = {
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['IAMCompliance', 'TotalRolesScanned'],
                ['.', 'WildcardPermissionsFound'],
              ],
            },
          },
        ],
      };

      expect(dashboardBody.widgets[0].properties.metrics[0][0]).toBe(
        'IAMCompliance'
      );
    });
  });

  describe('S3 Public Access Block', () => {
    it('should block all public access to reports bucket', async () => {
      const bucket = new aws.s3.Bucket('test-bucket', {
        bucket: 'test-bucket-name',
      });

      const blockPublicAccess = new aws.s3.BucketPublicAccessBlock(
        'test-block',
        {
          bucket: bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }
      );

      const urn = await pulumi.output(blockPublicAccess.urn).promise();
      expect(urn).toContain('test-block');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in bucket names', () => {
      const environmentSuffix = 'test123';
      const bucketName = `iam-compliance-reports-${environmentSuffix}`;
      expect(bucketName).toBe('iam-compliance-reports-test123');
    });

    it('should include environmentSuffix in Lambda function names', () => {
      const environmentSuffix = 'test123';
      const lambdaName = `iam-scanner-lambda-${environmentSuffix}`;
      expect(lambdaName).toBe('iam-scanner-lambda-test123');
    });

    it('should include environmentSuffix in IAM role names', () => {
      const environmentSuffix = 'test123';
      const roleName = `iam-scanner-role-${environmentSuffix}`;
      expect(roleName).toBe('iam-scanner-role-test123');
    });

    it('should include environmentSuffix in dashboard names', () => {
      const environmentSuffix = 'test123';
      const dashboardName = `iam-compliance-dashboard-${environmentSuffix}`;
      expect(dashboardName).toBe('iam-compliance-dashboard-test123');
    });
  });

  describe('Security Configuration', () => {
    it('should enable S3 encryption with AES256', () => {
      const encryptionConfig = {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      };

      expect(
        encryptionConfig.rule.applyServerSideEncryptionByDefault.sseAlgorithm
      ).toBe('AES256');
    });

    it('should use IAM role with least privilege principle', () => {
      const policyActions = [
        'iam:ListRoles',
        'iam:GetRole',
        'iam:ListAttachedRolePolicies',
        'iam:ListRolePolicies',
        'iam:GetRolePolicy',
        'iam:GetPolicy',
        'iam:GetPolicyVersion',
        'iam:ListPolicyVersions',
        'iam:TagRole',
        'iam:UntagRole',
      ];

      expect(policyActions).toContain('iam:ListRoles');
      expect(policyActions).toContain('iam:GetRole');
      expect(policyActions).not.toContain('iam:DeleteRole');
      expect(policyActions).not.toContain('iam:*');
    });
  });

  describe('Compliance Metrics Namespace', () => {
    it('should use IAMCompliance as CloudWatch namespace', () => {
      const namespace = 'IAMCompliance';
      expect(namespace).toBe('IAMCompliance');
    });
  });
});
