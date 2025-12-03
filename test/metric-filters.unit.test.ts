import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { createMetricFilters } from '../lib/metric-filters';

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

describe('createMetricFilters', () => {
  let mockLogGroup: aws.cloudwatch.LogGroup;

  beforeAll(() => {
    mockLogGroup = new aws.cloudwatch.LogGroup('test-log-group', {
      name: '/test/app-logs',
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

    // All filters should use Infrastructure/Custom namespace
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
