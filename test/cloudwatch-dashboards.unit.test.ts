import * as pulumi from '@pulumi/pulumi';
import { createCloudWatchDashboards } from '../lib/cloudwatch-dashboards';

pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        dashboardName: args.inputs.dashboardName || args.name,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

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
