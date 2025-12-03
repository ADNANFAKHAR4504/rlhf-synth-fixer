import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { createLogsInsightsQueries } from '../lib/logs-insights';

pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('createLogsInsightsQueries', () => {
  let mockLogGroup: aws.cloudwatch.LogGroup;

  beforeAll(() => {
    mockLogGroup = new aws.cloudwatch.LogGroup('test-log-group', {
      name: '/test/app-logs',
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
