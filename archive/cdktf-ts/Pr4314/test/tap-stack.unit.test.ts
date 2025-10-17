import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('instantiates successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'test123',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('applies environment suffix to resources', () => {
      app = new App();
      const testSuffix = 'uniquetest';
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: testSuffix,
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const resourceNames = Object.values(synthesized.resource || {})
        .flatMap((resourceType: any) =>
          Object.values(resourceType).map((r: any) => r.name || r.bucket)
        )
        .filter(Boolean);

      const hasEnvironmentSuffix = resourceNames.some((name: string) =>
        name.includes(testSuffix)
      );
      expect(hasEnvironmentSuffix).toBe(true);
    });

    test('uses specified AWS region when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider?.aws?.[0]?.region).toBe('us-west-2');
    });

    test('uses specified state bucket configuration', () => {
      app = new App();
      const customBucket = 'my-custom-state-bucket';
      const customRegion = 'eu-west-1';
      stack = new TapStack(app, 'TestStack', {
        stateBucket: customBucket,
        stateBucketRegion: customRegion,
        environmentSuffix: 'custom',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform?.backend?.s3?.bucket).toBe(customBucket);
      expect(synthesized.terraform?.backend?.s3?.region).toBe(customRegion);
    });

    test('uses default tags when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        defaultTags: {
          tags: {
            Environment: 'test',
            ManagedBy: 'Terraform',
          },
        },
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider?.aws?.[0]?.default_tags).toBeDefined();
    });

    test('handles missing optional props gracefully', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: undefined,
        stateBucket: undefined,
        awsRegion: undefined,
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider?.aws?.[0]?.region).toBe('us-east-1');
      expect(synthesized.terraform?.backend?.s3?.bucket).toBe('iac-rlhf-tf-states');
    });
  });

  describe('Content Delivery Resources', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates S3 buckets for content and artifacts', () => {
      const s3Buckets = synthesized.resource?.aws_s3_bucket || {};
      const bucketNames = Object.values(s3Buckets).map(
        (b: any) => b.bucket
      );

      expect(bucketNames).toEqual(
        expect.arrayContaining([
          expect.stringContaining('edu-content'),
          expect.stringContaining('pipeline-artifacts'),
        ])
      );
    });

    test('enables versioning on S3 buckets', () => {
      const versioningConfigs =
        synthesized.resource?.aws_s3_bucket_versioning || {};
      expect(Object.keys(versioningConfigs).length).toBeGreaterThanOrEqual(2);

      Object.values(versioningConfigs).forEach((config: any) => {
        expect(config.versioning_configuration?.status).toBe('Enabled');
      });
    });

    test('enables encryption on S3 buckets', () => {
      const encryptionConfigs =
        synthesized.resource
          ?.aws_s3_bucket_server_side_encryption_configuration || {};
      expect(Object.keys(encryptionConfigs).length).toBeGreaterThanOrEqual(2);

      Object.values(encryptionConfigs).forEach((config: any) => {
        expect(config.rule[0]?.apply_server_side_encryption_by_default?.sse_algorithm).toBe('AES256');
      });
    });

    test('blocks public access on S3 buckets', () => {
      const publicAccessBlocks =
        synthesized.resource?.aws_s3_bucket_public_access_block || {};
      expect(Object.keys(publicAccessBlocks).length).toBeGreaterThanOrEqual(2);

      Object.values(publicAccessBlocks).forEach((block: any) => {
        expect(block.block_public_acls).toBe(true);
        expect(block.block_public_policy).toBe(true);
        expect(block.ignore_public_acls).toBe(true);
        expect(block.restrict_public_buckets).toBe(true);
      });
    });

    test('configures lifecycle policies for S3 buckets', () => {
      const lifecycleConfigs =
        synthesized.resource?.aws_s3_bucket_lifecycle_configuration || {};
      expect(Object.keys(lifecycleConfigs).length).toBeGreaterThanOrEqual(2);
    });

    test('creates CloudFront distribution', () => {
      const distributions =
        synthesized.resource?.aws_cloudfront_distribution || {};
      expect(Object.keys(distributions).length).toBeGreaterThan(0);

      const distribution = Object.values(distributions)[0] as any;
      expect(distribution.enabled).toBe(true);
      expect(distribution.default_cache_behavior?.viewer_protocol_policy).toBe('redirect-to-https');
    });

    test('creates CloudFront Origin Access Control', () => {
      const oacs =
        synthesized.resource?.aws_cloudfront_origin_access_control || {};
      expect(Object.keys(oacs).length).toBeGreaterThan(0);

      const oac = Object.values(oacs)[0] as any;
      expect(oac.origin_access_control_origin_type).toBe('s3');
      expect(oac.signing_behavior).toBe('always');
      expect(oac.signing_protocol).toBe('sigv4');
    });
  });

  describe('Pipeline Resources', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates S3 source placeholder', () => {
      const s3Objects = synthesized.resource?.aws_s3_object || {};
      expect(Object.keys(s3Objects).length).toBeGreaterThan(0);

      const sourceObject = Object.values(s3Objects).find(
        (obj: any) => obj.key?.includes('source')
      );
      expect(sourceObject).toBeDefined();
    });

    test('creates CodeBuild project', () => {
      const projects = synthesized.resource?.aws_codebuild_project || {};
      expect(Object.keys(projects).length).toBeGreaterThan(0);

      const project = Object.values(projects)[0] as any;
      expect(project.name).toContain('edu-content-build');
      expect(project.environment?.image).toBe('aws/codebuild/standard:7.0');
    });

    test('creates CodeDeploy application and deployment group', () => {
      const apps = synthesized.resource?.aws_codedeploy_app || {};
      expect(Object.keys(apps).length).toBeGreaterThan(0);

      const deploymentGroups =
        synthesized.resource?.aws_codedeploy_deployment_group || {};
      expect(Object.keys(deploymentGroups).length).toBeGreaterThan(0);
    });

    test('creates CodePipeline', () => {
      const pipelines = synthesized.resource?.aws_codepipeline || {};
      expect(Object.keys(pipelines).length).toBeGreaterThan(0);

      const pipeline = Object.values(pipelines)[0] as any;
      expect(pipeline.stage).toHaveLength(3);
      expect(pipeline.stage.map((s: any) => s.name)).toEqual(['Source', 'Build', 'Deploy']);
    });

    test('creates EC2 instance for deployment', () => {
      const instances = synthesized.resource?.aws_instance || {};
      expect(Object.keys(instances).length).toBeGreaterThan(0);

      const instance = Object.values(instances)[0] as any;
      expect(instance.instance_type).toBe('t3.micro');
    });

    test('creates VPC and networking resources', () => {
      const vpcs = synthesized.resource?.aws_vpc || {};
      expect(Object.keys(vpcs).length).toBeGreaterThan(0);

      const subnets = synthesized.resource?.aws_subnet || {};
      expect(Object.keys(subnets).length).toBeGreaterThan(0);

      const igws = synthesized.resource?.aws_internet_gateway || {};
      expect(Object.keys(igws).length).toBeGreaterThan(0);
    });
  });

  describe('Monitoring Resources', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates CloudWatch log groups', () => {
      const logGroups = synthesized.resource?.aws_cloudwatch_log_group || {};
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(3);

      const logGroupNames = Object.values(logGroups).map((lg: any) => lg.name);
      expect(logGroupNames).toEqual(
        expect.arrayContaining([
          expect.stringContaining('pipeline'),
          expect.stringContaining('codebuild'),
          expect.stringContaining('codedeploy'),
        ])
      );
    });

    test('sets log retention to 14 days', () => {
      const logGroups = synthesized.resource?.aws_cloudwatch_log_group || {};
      Object.values(logGroups).forEach((lg: any) => {
        expect(lg.retention_in_days).toBe(14);
      });
    });

    test('creates SNS topic for notifications', () => {
      const topics = synthesized.resource?.aws_sns_topic || {};
      expect(Object.keys(topics).length).toBeGreaterThan(0);

      const topic = Object.values(topics)[0] as any;
      expect(topic.name).toContain('pipeline-notifications');
    });

    test('creates CloudWatch alarms', () => {
      const alarms = synthesized.resource?.aws_cloudwatch_metric_alarm || {};
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('IAM Resources', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates IAM roles for services', () => {
      const roles = synthesized.resource?.aws_iam_role || {};
      const roleNames = Object.values(roles).map((r: any) => r.name);

      expect(roleNames).toEqual(
        expect.arrayContaining([
          expect.stringContaining('codebuild-role'),
          expect.stringContaining('codedeploy-role'),
          expect.stringContaining('pipeline-role'),
          expect.stringContaining('ec2-codedeploy-role'),
        ])
      );
    });

    test('creates IAM policies', () => {
      const policies = synthesized.resource?.aws_iam_policy || {};
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });

    test('attaches policies to roles', () => {
      const attachments =
        synthesized.resource?.aws_iam_role_policy_attachment || {};
      expect(Object.keys(attachments).length).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('defines all required outputs', () => {
      const outputs = synthesized.output || {};
      const outputKeys = Object.keys(outputs);

      expect(outputKeys).toEqual(
        expect.arrayContaining([
          'source-bucket',
          'source-object-key',
          'codepipeline-name',
          'codebuild-project-name',
          'codedeploy-application-name',
          'codedeploy-deployment-group-name',
          'artifact-bucket-name',
          'content-bucket-name',
          'cloudfront-distribution-id',
          'cloudfront-domain-name',
          'sns-topic-arn',
          'ec2-instance-id',
        ])
      );
    });
  });

  describe('Security Configurations', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('S3 buckets have forceDestroy enabled for testing', () => {
      const s3Buckets = synthesized.resource?.aws_s3_bucket || {};
      Object.values(s3Buckets).forEach((bucket: any) => {
        expect(bucket.force_destroy).toBe(true);
      });
    });

    test('CloudFront enforces HTTPS', () => {
      const distributions =
        synthesized.resource?.aws_cloudfront_distribution || {};
      const distribution = Object.values(distributions)[0] as any;

      expect(distribution.default_cache_behavior?.viewer_protocol_policy).toBe('redirect-to-https');
    });
  });
});
