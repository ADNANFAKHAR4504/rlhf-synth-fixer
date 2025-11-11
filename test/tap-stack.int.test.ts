import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack, TapStackProps } from '../lib/tap-stack';

function build(ctx?: Record<string, any>, props?: TapStackProps) {
  const app = new cdk.App(ctx ? { context: ctx } : undefined);
  const tap = new TapStack(app, 'TestTapStack', props as any);

  const childStacks = tap.node.children.filter(c => {
    // include only constructs that look like Stack instances (have stackName)
    return (c as any).stackName !== undefined;
  }) as cdk.Stack[];

  const templates = childStacks.map(s => ({
    stack: s,
    id: s.node.id,
    template: Template.fromStack(s),
  }));

  return { app, tap, childStacks, templates };
}

function countResources(template: Template, type: string) {
  return Object.keys(template.findResources(type)).length;
}

function dashboardBodies(template: Template): string[] {
  const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
  return Object.values(dashboards).map((d: any) => {
    const body = d.Properties?.DashboardBody;
    if (!body) return '';
    try {
      return typeof body === 'string' ? body : JSON.stringify(body);
    } catch {
      return String(body);
    }
  });
}

function anyAlarmWithNamespace(template: Template, namespace: string) {
  const alarms = template.findResources('AWS::CloudWatch::Alarm');
  return Object.values(alarms).some((a: any) => {
    const props = a.Properties ?? {};
    if (props.Namespace && typeof props.Namespace === 'string') {
      return props.Namespace === namespace;
    }
    if (props.MetricName && typeof props.MetricName === 'string') {
      return false;
    }
    if (Array.isArray(props.Metrics)) {
      return props.Metrics.some((m: any) => m.Namespace === namespace);
    }
    return false;
  });
}

describe('TapStack Integration Tests', () => {
  test('orchestration: creates TapStack and monitoring child stacks', () => {
    const { tap, childStacks } = build(undefined, { environmentSuffix: 'int' });
    expect(tap).toBeDefined();
    expect(childStacks.length).toBeGreaterThanOrEqual(3);
  });

  test('core monitoring: at least one alarm and one dashboard exist across monitoring stacks', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let totalAlarms = 0;
    let totalDashboards = 0;
    for (const { template } of templates) {
      totalAlarms += countResources(template, 'AWS::CloudWatch::Alarm');
      totalDashboards += countResources(template, 'AWS::CloudWatch::Dashboard');
    }
    expect(totalAlarms).toBeGreaterThan(0);
    expect(totalDashboards).toBeGreaterThan(0);
  });

  test('service coverage: API Gateway monitoring is present', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let found = false;
    for (const { template } of templates) {
      const bodies = dashboardBodies(template);
      if (
        bodies.some(b =>
          /AWS\/ApiGateway|ApiGateway|Api Gateway|ApiGateway/.test(b)
        )
      ) {
        found = true;
        break;
      }
      if (anyAlarmWithNamespace(template, 'AWS/ApiGateway')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test('service coverage: RDS or ECS monitoring is present', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let found = false;
    for (const { template } of templates) {
      const bodies = dashboardBodies(template);
      if (bodies.some(b => /AWS\/RDS|AWS\/ECS|RDS|ECS/.test(b))) {
        found = true;
        break;
      }
      if (
        anyAlarmWithNamespace(template, 'AWS/RDS') ||
        anyAlarmWithNamespace(template, 'AWS/ECS')
      ) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test('aggregated lambdas, iam roles, s3 buckets, and outputs exist across stacks', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let lambdas = 0;
    let roles = 0;
    let buckets = 0;
    let outputs = 0;
    for (const { template } of templates) {
      lambdas += countResources(template, 'AWS::Lambda::Function');
      roles += countResources(template, 'AWS::IAM::Role');
      buckets += countResources(template, 'AWS::S3::Bucket');
      outputs += Object.keys(template.toJSON().Outputs || {}).length;
    }
    expect(lambdas).toBeGreaterThanOrEqual(1);
    expect(roles).toBeGreaterThanOrEqual(1);
    expect(buckets).toBeGreaterThanOrEqual(1);
    expect(outputs).toBeGreaterThanOrEqual(1);
  });

  test('logs and metric filters: at least one metric filter or log group exists', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let metricFilters = 0;
    let logGroups = 0;
    for (const { template } of templates) {
      metricFilters += countResources(template, 'AWS::Logs::MetricFilter');
      logGroups += countResources(template, 'AWS::Logs::LogGroup');
    }
    expect(metricFilters + logGroups).toBeGreaterThanOrEqual(1);
  });

  test('tag compliance: resources include Project and Environment tags', () => {
    const { templates } = build(undefined, {
      environmentSuffix: 'int',
      projectName: 'payment',
    });
    let anyTagged = false;
    for (const { template } of templates) {
      const resources = template.toJSON().Resources || {};
      for (const res of Object.values(resources) as any[]) {
        const tags = res?.Properties?.Tags;
        if (!Array.isArray(tags)) continue;
        const hasProject = tags.some(
          (t: any) => t.Key === 'Project' && typeof t.Value === 'string'
        );
        const hasEnv = tags.some(
          (t: any) => t.Key === 'Environment' && typeof t.Value === 'string'
        );
        if (hasProject && hasEnv) {
          anyTagged = true;
          break;
        }
      }
      if (anyTagged) break;
    }
    expect(anyTagged).toBe(true);
  });
});
