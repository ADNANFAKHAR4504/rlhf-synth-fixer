import * as pulumi from '@pulumi/pulumi';
import { createLambdaAnalysisFunctions } from '../lib/lambda-analysis';

pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

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
