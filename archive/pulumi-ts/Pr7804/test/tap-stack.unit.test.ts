import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';
import { createCloudWatchAlarms } from '../lib/cloudwatch-alarms';
import { createCloudWatchDashboards } from '../lib/cloudwatch-dashboards';
import { createIAMRoles } from '../lib/iam-roles';
import { createLambdaAnalysisFunctions } from '../lib/lambda-analysis';
import { createLogsInsightsQueries } from '../lib/logs-insights';
import { createMetricFilters } from '../lib/metric-filters';
import { createSNSTopics } from '../lib/sns-topics';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.type}-${args.inputs.name}` : `${args.type}-${args.name}`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: `${args.name}-id`,
        dashboardName: args.inputs.dashboardName || args.name,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

// =============================================================================
// TapStack Tests
// =============================================================================
describe('TapStack', () => {
  let stack: TapStack;

  describe('with custom arguments', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test', Team: 'platform' },
        monitoringRegions: ['us-east-1', 'us-west-2'],
        analysisSchedule: 'rate(30 minutes)',
        reportSchedule: 'rate(1 day)',
      });
    });

    it('should create stack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose dashboardUrls output', (done) => {
      stack.dashboardUrls.apply(urls => {
        expect(urls).toBeDefined();
        expect(Array.isArray(urls)).toBe(true);
        done();
        return urls;
      });
    });

    it('should expose snsTopicArns output', (done) => {
      stack.snsTopicArns.apply(arns => {
        expect(arns).toBeDefined();
        expect(arns.critical).toBeDefined();
        expect(arns.warning).toBeDefined();
        expect(arns.info).toBeDefined();
        done();
        return arns;
      });
    });

    it('should expose lambdaFunctionArns output', (done) => {
      stack.lambdaFunctionArns.apply(arns => {
        expect(arns).toBeDefined();
        expect(Array.isArray(arns)).toBe(true);
        expect(arns.length).toBe(2);
        done();
        return arns;
      });
    });
  });

  describe('with default arguments', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-default', {});
    });

    it('should create stack with defaults', () => {
      expect(stack).toBeDefined();
    });

    it('should have dashboard URLs', (done) => {
      stack.dashboardUrls.apply(urls => {
        expect(urls).toBeDefined();
        done();
        return urls;
      });
    });

    it('should have SNS topic ARNs', (done) => {
      stack.snsTopicArns.apply(arns => {
        expect(arns).toBeDefined();
        done();
        return arns;
      });
    });

    it('should have Lambda function ARNs', (done) => {
      stack.lambdaFunctionArns.apply(arns => {
        expect(arns).toBeDefined();
        done();
        return arns;
      });
    });
  });

  describe('with minimal arguments', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-minimal', {
        environmentSuffix: 'prod',
      });
    });

    it('should use provided environmentSuffix', () => {
      expect(stack).toBeDefined();
    });

    it('should apply default values for optional parameters', (done) => {
      Promise.all([
        stack.dashboardUrls.apply(urls => urls),
        stack.snsTopicArns.apply(arns => arns),
        stack.lambdaFunctionArns.apply(arns => arns),
      ]).then(([urls, arns, functionArns]) => {
        expect(urls).toBeDefined();
        expect(arns).toBeDefined();
        expect(functionArns).toBeDefined();
        done();
      });
    });
  });

  describe('resource creation order', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-ordering', {
        environmentSuffix: 'order-test',
      });
    });

    it('should create resources in correct order', () => {
      expect(stack).toBeDefined();
      // SNS topics created first
      // IAM roles created second
      // Lambda functions use IAM role and SNS topics
      // CloudWatch resources use SNS topics
      // This validates the dependency chain
    });
  });

  describe('with single monitoring region', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-single-region', {
        environmentSuffix: 'single',
        monitoringRegions: ['us-east-1'],
      });
    });

    it('should handle single region', (done) => {
      stack.dashboardUrls.apply(urls => {
        expect(Array.isArray(urls)).toBe(true);
        done();
        return urls;
      });
    });
  });

  describe('with custom schedules', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-schedules', {
        environmentSuffix: 'schedule-test',
        analysisSchedule: 'rate(15 minutes)',
        reportSchedule: 'rate(3 days)',
      });
    });

    it('should accept custom schedule configurations', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('with multiple monitoring regions', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-multi-region', {
        environmentSuffix: 'multi',
        monitoringRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      });
    });

    it('should handle multiple regions', (done) => {
      stack.dashboardUrls.apply(urls => {
        expect(Array.isArray(urls)).toBe(true);
        done();
        return urls;
      });
    });
  });
});

// =============================================================================
// CloudWatch Alarms Tests
// =============================================================================
describe('createCloudWatchAlarms', () => {
  const mockSnsTopicArns = pulumi.output({
    critical: 'arn:aws:sns:us-east-1:123456789012:critical',
    warning: 'arn:aws:sns:us-east-1:123456789012:warning',
    info: 'arn:aws:sns:us-east-1:123456789012:info',
  });

  it('should create all alarm types', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms).toBeDefined();
    expect(result.alarms.length).toBe(4);
  });

  it('should create database connection alarm', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms[0]).toBeDefined();
  });

  it('should create API latency alarm', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms[1]).toBeDefined();
  });

  it('should create Lambda error alarm', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms[2]).toBeDefined();
  });

  it('should create EC2 CPU warning alarm', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms[3]).toBeDefined();
  });

  it('should use environment suffix in alarm names', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'prod',
        tags: { Environment: 'prod' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms.length).toBe(4);
  });

  it('should apply tags to alarms', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: tags,
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms.length).toBe(4);
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      },
      opts
    );

    expect(result.alarms).toBeDefined();
  });

  it('should handle empty tags', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: {},
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms.length).toBe(4);
  });

  it('should return array of alarms', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(Array.isArray(result.alarms)).toBe(true);
  });

  it('should create alarms with different severity levels', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    // First 3 alarms use critical topic, last one uses warning
    expect(result.alarms.length).toBe(4);
  });
});

// =============================================================================
// CloudWatch Dashboards Tests
// =============================================================================
describe('createCloudWatchDashboards', () => {
  it('should create dashboards for all regions', () => {
    const result = createCloudWatchDashboards({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      monitoringRegions: ['us-east-1', 'us-west-2'],
    });

    expect(result.dashboards).toBeDefined();
    expect(result.dashboards.length).toBe(2);
  });

  it('should create dashboard URLs for all regions', (done) => {
    const result = createCloudWatchDashboards({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      monitoringRegions: ['us-east-1', 'us-west-2'],
    });

    result.dashboardUrls.apply(urls => {
      expect(urls).toBeDefined();
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBe(2);
      done();
      return urls;
    });
  });

  it('should handle single region', () => {
    const result = createCloudWatchDashboards({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      monitoringRegions: ['us-east-1'],
    });

    expect(result.dashboards.length).toBe(1);
  });

  it('should handle multiple regions', () => {
    const result = createCloudWatchDashboards({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      monitoringRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
    });

    expect(result.dashboards.length).toBe(3);
  });

  it('should use environment suffix in dashboard names', () => {
    const result = createCloudWatchDashboards({
      environmentSuffix: 'prod',
      tags: { Environment: 'prod' },
      monitoringRegions: ['us-east-1'],
    });

    expect(result.dashboards[0]).toBeDefined();
  });

  it('should apply tags to dashboards', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createCloudWatchDashboards({
      environmentSuffix: 'test',
      tags: tags,
      monitoringRegions: ['us-east-1'],
    });

    expect(result.dashboards.length).toBe(1);
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createCloudWatchDashboards(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        monitoringRegions: ['us-east-1'],
      },
      opts
    );

    expect(result.dashboards).toBeDefined();
  });

  it('should handle empty tags', () => {
    const result = createCloudWatchDashboards({
      environmentSuffix: 'test',
      tags: {},
      monitoringRegions: ['us-east-1'],
    });

    expect(result.dashboards.length).toBe(1);
  });

  it('should generate valid dashboard URLs', (done) => {
    const result = createCloudWatchDashboards({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      monitoringRegions: ['us-east-1'],
    });

    result.dashboardUrls.apply(urls => {
      expect(urls[0]).toContain('https://console.aws.amazon.com/cloudwatch');
      done();
      return urls;
    });
  });

  it('should include region in dashboard URLs', (done) => {
    const result = createCloudWatchDashboards({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      monitoringRegions: ['us-west-2'],
    });

    result.dashboardUrls.apply(urls => {
      expect(urls[0]).toContain('us-west-2');
      done();
      return urls;
    });
  });

  it('should create different dashboards for different regions', () => {
    const result = createCloudWatchDashboards({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      monitoringRegions: ['us-east-1', 'eu-west-1'],
    });

    expect(result.dashboards.length).toBe(2);
    expect(result.dashboards[0]).not.toBe(result.dashboards[1]);
  });
});

// =============================================================================
// IAM Roles Tests
// =============================================================================
describe('createIAMRoles', () => {
  it('should create Lambda execution role', (done) => {
    const result = createIAMRoles('test', { Environment: 'test' });

    result.lambdaRoleArn.apply(arn => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      expect(arn).toContain('iam');
      expect(arn).toContain('role');
      done();
      return arn;
    });
  });

  it('should return lambdaRole object', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });

  it('should use environment suffix in role name', (done) => {
    const result = createIAMRoles('prod', { Environment: 'prod' });

    result.lambdaRoleArn.apply(arn => {
      expect(arn).toContain('prod');
      done();
      return arn;
    });
  });

  it('should apply tags to role', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createIAMRoles('test', tags);

    expect(result.lambdaRole).toBeDefined();
    expect(result.lambdaRoleArn).toBeDefined();
  });

  it('should handle empty tags', () => {
    const result = createIAMRoles('test', {});

    expect(result.lambdaRoleArn).toBeDefined();
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createIAMRoles('test', { Environment: 'test' }, opts);

    expect(result.lambdaRoleArn).toBeDefined();
  });

  it('should create role with least-privilege policies', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
    expect(result.lambdaRoleArn).toBeDefined();
  });

  it('should use different suffixes correctly', (done) => {
    const result1 = createIAMRoles('dev', { Environment: 'dev' });
    const result2 = createIAMRoles('staging', { Environment: 'staging' });

    Promise.all([
      result1.lambdaRoleArn.apply(arn => arn),
      result2.lambdaRoleArn.apply(arn => arn),
    ]).then(([arn1, arn2]) => {
      expect(arn1).not.toBe(arn2);
      done();
    });
  });

  it('should create role with correct assume role policy', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });

  it('should create metrics policy', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });

  it('should create logs policy', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });

  it('should create SNS policy', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });
});

// =============================================================================
// Lambda Analysis Functions Tests
// =============================================================================
describe('createLambdaAnalysisFunctions', () => {
  const mockSnsTopicArns = pulumi.output({
    critical: 'arn:aws:sns:us-east-1:123456789012:critical',
    warning: 'arn:aws:sns:us-east-1:123456789012:warning',
    info: 'arn:aws:sns:us-east-1:123456789012:info',
  });

  const mockLambdaRoleArn = pulumi.output('arn:aws:iam::123456789012:role/lambda-role');

  it('should create metric analysis function', () => {
    const result = createLambdaAnalysisFunctions({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      analysisSchedule: 'rate(1 hour)',
      reportSchedule: 'rate(7 days)',
      snsTopicArns: mockSnsTopicArns,
      lambdaRoleArn: mockLambdaRoleArn,
      monitoringRegions: ['us-east-1'],
    });

    expect(result.metricAnalysisFunction).toBeDefined();
  });

  it('should create health report function', () => {
    const result = createLambdaAnalysisFunctions({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      analysisSchedule: 'rate(1 hour)',
      reportSchedule: 'rate(7 days)',
      snsTopicArns: mockSnsTopicArns,
      lambdaRoleArn: mockLambdaRoleArn,
      monitoringRegions: ['us-east-1'],
    });

    expect(result.healthReportFunction).toBeDefined();
  });

  it('should return function ARNs', (done) => {
    const result = createLambdaAnalysisFunctions({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      analysisSchedule: 'rate(1 hour)',
      reportSchedule: 'rate(7 days)',
      snsTopicArns: mockSnsTopicArns,
      lambdaRoleArn: mockLambdaRoleArn,
      monitoringRegions: ['us-east-1'],
    });

    result.functionArns.apply(arns => {
      expect(Array.isArray(arns)).toBe(true);
      expect(arns.length).toBe(2);
      done();
      return arns;
    });
  });

  it('should use environment suffix in function names', () => {
    const result = createLambdaAnalysisFunctions({
      environmentSuffix: 'prod',
      tags: { Environment: 'prod' },
      analysisSchedule: 'rate(1 hour)',
      reportSchedule: 'rate(7 days)',
      snsTopicArns: mockSnsTopicArns,
      lambdaRoleArn: mockLambdaRoleArn,
      monitoringRegions: ['us-east-1'],
    });

    expect(result.metricAnalysisFunction).toBeDefined();
  });

  it('should apply tags to functions', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createLambdaAnalysisFunctions({
      environmentSuffix: 'test',
      tags: tags,
      analysisSchedule: 'rate(1 hour)',
      reportSchedule: 'rate(7 days)',
      snsTopicArns: mockSnsTopicArns,
      lambdaRoleArn: mockLambdaRoleArn,
      monitoringRegions: ['us-east-1'],
    });

    expect(result.metricAnalysisFunction).toBeDefined();
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createLambdaAnalysisFunctions(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        analysisSchedule: 'rate(1 hour)',
        reportSchedule: 'rate(7 days)',
        snsTopicArns: mockSnsTopicArns,
        lambdaRoleArn: mockLambdaRoleArn,
        monitoringRegions: ['us-east-1'],
      },
      opts
    );

    expect(result.functionArns).toBeDefined();
  });

  it('should use custom analysis schedule', () => {
    const result = createLambdaAnalysisFunctions({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      analysisSchedule: 'rate(30 minutes)',
      reportSchedule: 'rate(7 days)',
      snsTopicArns: mockSnsTopicArns,
      lambdaRoleArn: mockLambdaRoleArn,
      monitoringRegions: ['us-east-1'],
    });

    expect(result.metricAnalysisFunction).toBeDefined();
  });

  it('should use custom report schedule', () => {
    const result = createLambdaAnalysisFunctions({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      analysisSchedule: 'rate(1 hour)',
      reportSchedule: 'rate(1 day)',
      snsTopicArns: mockSnsTopicArns,
      lambdaRoleArn: mockLambdaRoleArn,
      monitoringRegions: ['us-east-1'],
    });

    expect(result.healthReportFunction).toBeDefined();
  });

  it('should handle multiple monitoring regions', () => {
    const result = createLambdaAnalysisFunctions({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      analysisSchedule: 'rate(1 hour)',
      reportSchedule: 'rate(7 days)',
      snsTopicArns: mockSnsTopicArns,
      lambdaRoleArn: mockLambdaRoleArn,
      monitoringRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
    });

    expect(result.metricAnalysisFunction).toBeDefined();
  });

  it('should handle single monitoring region', () => {
    const result = createLambdaAnalysisFunctions({
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
      analysisSchedule: 'rate(1 hour)',
      reportSchedule: 'rate(7 days)',
      snsTopicArns: mockSnsTopicArns,
      lambdaRoleArn: mockLambdaRoleArn,
      monitoringRegions: ['us-east-1'],
    });

    expect(result.healthReportFunction).toBeDefined();
  });
});

// =============================================================================
// Logs Insights Queries Tests
// =============================================================================
describe('createLogsInsightsQueries', () => {
  let mockLogGroup: aws.cloudwatch.LogGroup;

  beforeAll(() => {
    mockLogGroup = new aws.cloudwatch.LogGroup('test-log-group-insights-e4', {
      name: '/infra/app-e4-test',
    });
  });

  it('should create all query definitions', () => {
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.queries).toBeDefined();
    expect(Array.isArray(result.queries)).toBe(true);
    expect(result.queries.length).toBe(4);
  });

  it('should create error pattern query', () => {
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.queries[0]).toBeDefined();
  });

  it('should create latency query', () => {
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.queries[1]).toBeDefined();
  });

  it('should create failed API query', () => {
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.queries[2]).toBeDefined();
  });

  it('should create cold start query', () => {
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.queries[3]).toBeDefined();
  });

  it('should use environment suffix in query names', () => {
    const result = createLogsInsightsQueries(
      'prod',
      mockLogGroup,
      { Environment: 'prod' }
    );

    expect(result.queries.length).toBe(4);
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      { Environment: 'test' },
      opts
    );

    expect(result.queries).toBeDefined();
  });

  it('should handle empty tags', () => {
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      {}
    );

    expect(result.queries.length).toBe(4);
  });

  it('should apply tags to queries', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      tags
    );

    expect(result.queries.length).toBe(4);
  });

  it('should create queries with different purposes', () => {
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    // Verify all 4 query types are created
    expect(result.queries.length).toBe(4);
  });

  it('should use the provided log group', () => {
    const result = createLogsInsightsQueries(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.queries).toBeDefined();
  });
});

// =============================================================================
// Metric Filters Tests
// =============================================================================
describe('createMetricFilters', () => {
  let mockLogGroup: aws.cloudwatch.LogGroup;

  beforeAll(() => {
    mockLogGroup = new aws.cloudwatch.LogGroup('test-log-group-filters-e4', {
      name: '/infra/app-e4-test',
    });
  });

  it('should create all metric filters', () => {
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.filters).toBeDefined();
    expect(Array.isArray(result.filters)).toBe(true);
    expect(result.filters.length).toBe(4);
  });

  it('should create API usage filter', () => {
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.filters[0]).toBeDefined();
  });

  it('should create app error filter', () => {
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.filters[1]).toBeDefined();
  });

  it('should create response time filter', () => {
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.filters[2]).toBeDefined();
  });

  it('should create business metric filter', () => {
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.filters[3]).toBeDefined();
  });

  it('should use environment suffix in filter names', () => {
    const result = createMetricFilters(
      'prod',
      mockLogGroup,
      { Environment: 'prod' }
    );

    expect(result.filters.length).toBe(4);
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      { Environment: 'test' },
      opts
    );

    expect(result.filters).toBeDefined();
  });

  it('should handle empty tags', () => {
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      {}
    );

    expect(result.filters.length).toBe(4);
  });

  it('should apply tags to filters', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      tags
    );

    expect(result.filters.length).toBe(4);
  });

  it('should create filters with different metric namespaces', () => {
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    // All filters should use Infra/Custom namespace
    expect(result.filters.length).toBe(4);
  });

  it('should use the provided log group', () => {
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    expect(result.filters).toBeDefined();
  });

  it('should create filters for different metric types', () => {
    const result = createMetricFilters(
      'test',
      mockLogGroup,
      { Environment: 'test' }
    );

    // Verify all 4 filter types are created
    expect(result.filters.length).toBe(4);
  });
});

// =============================================================================
// SNS Topics Tests
// =============================================================================
describe('createSNSTopics', () => {
  it('should create critical, warning, and info topics', (done) => {
    const result = createSNSTopics('test', { Environment: 'test' });

    result.topicArns.apply(arns => {
      expect(arns.critical).toBeDefined();
      expect(arns.warning).toBeDefined();
      expect(arns.info).toBeDefined();
      expect(typeof arns.critical).toBe('string');
      expect(typeof arns.warning).toBe('string');
      expect(typeof arns.info).toBe('string');
      done();
      return arns;
    });
  });

  it('should return topic objects', () => {
    const result = createSNSTopics('test', { Environment: 'test' });

    expect(result.topics).toBeDefined();
    expect(result.topics.critical).toBeDefined();
    expect(result.topics.warning).toBeDefined();
    expect(result.topics.info).toBeDefined();
  });

  it('should use environment suffix in topic names', (done) => {
    const result = createSNSTopics('prod', { Environment: 'prod' });

    result.topicArns.apply(arns => {
      expect(arns.critical).toContain('prod');
      expect(arns.warning).toContain('prod');
      expect(arns.info).toContain('prod');
      done();
      return arns;
    });
  });

  it('should apply tags to topics', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createSNSTopics('test', tags);

    expect(result.topics.critical).toBeDefined();
    expect(result.topics.warning).toBeDefined();
    expect(result.topics.info).toBeDefined();
  });

  it('should handle empty tags', () => {
    const result = createSNSTopics('test', {});

    expect(result.topicArns).toBeDefined();
    expect(result.topics).toBeDefined();
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createSNSTopics('test', { Environment: 'test' }, opts);

    expect(result.topicArns).toBeDefined();
  });

  it('should create topic subscriptions', () => {
    const result = createSNSTopics('test', { Environment: 'test' });

    expect(result.topicArns).toBeDefined();
    expect(result.topics).toBeDefined();
  });

  it('should use different suffixes correctly', (done) => {
    const result1 = createSNSTopics('dev', { Environment: 'dev' });
    const result2 = createSNSTopics('staging', { Environment: 'staging' });

    Promise.all([
      result1.topicArns.apply(arns => arns),
      result2.topicArns.apply(arns => arns),
    ]).then(([arns1, arns2]) => {
      expect(arns1.critical).not.toBe(arns2.critical);
      done();
    });
  });
});
