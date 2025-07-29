// Configuration - These are coming from cdk.out after cdk deploy
import fs from 'fs';
import https from 'https';
import axios from 'axios';
import dns from 'dns/promises';
import { ECSClient, DescribeTaskDefinitionCommand } from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { ACMClient, DescribeCertificateCommand } from '@aws-sdk/client-acm';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
} from '@aws-sdk/client-ec2';
import {
  Route53Client,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  ServiceDiscoveryClient,
  ListNamespacesCommand,
  DiscoverInstancesCommand,
  ListServicesCommand,
  ListInstancesCommand,
} from '@aws-sdk/client-servicediscovery';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';
// import { AutoScalingClient, DescribeAutoScalingGroupsCommand, DescribePoliciesCommand } from '@aws-sdk/client-autoscaling';

import { DescribeServicesCommand } from '@aws-sdk/client-ecs';

const environmentSuffix = process.env.CDK_CONTEXT_ENVIRONMENT_SUFFIX || 'dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
let outputs: Record<string, any> = {};
const outputsFile = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsFile)) {
  try {
    outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  } catch (error) {
    console.warn(`Failed to read outputs file: ${error}`);
  }
} else {
  console.warn(
    `Outputs file ${outputsFile} not found. Integration tests will be limited.`
  );
}

describe('Stack Integration Tests', () => {
  const domain = outputs.DomainName;
  const clusterName = outputs.ClusterName;
  const loadBalancerArn = outputs.LoadBalancerArn;
  const loadBalancerSecurityGroupId = outputs.LoadBalancerSecurityGroupId;
  const fargateServiceName = outputs.FargateServiceName;
  const ListenerArn = outputs.ListenerArn;
  const sslCertificateArn = outputs.SSLCertificateArn;
  const taskDefinitionArn = outputs.TaskDefinitionArn;
  const vpcId = outputs.VpcId;
  const loadBalanceDNS = outputs.LoadBalanceDNS;
  const ssmConfigParameterName = outputs.SSMConfigParameterName;
  const appPublicUrl =
    `https://${outputs.DomainName}` || `http://${outputs.LoadBalanceDNS}`; // Construct public URL based on DNS or LB DNS
  const hostedZoneName = outputs.HostedZoneName;
  const domainARecord = outputs.DomainARecord;
  const cloudMapNamespace = outputs.Namespace;
  const clusterArn = outputs.ClusterArn;

  test('should have all required outputs from CDK deployment', () => {
    expect(domain).toBeDefined();
    expect(clusterName).toBeDefined();
    expect(loadBalancerArn).toBeDefined();
    expect(loadBalancerSecurityGroupId).toBeDefined();
    expect(fargateServiceName).toBeDefined();
    expect(ListenerArn).toBeDefined();
    expect(sslCertificateArn).toBeDefined();
    expect(taskDefinitionArn).toBeDefined();
    expect(vpcId).toBeDefined();
    expect(loadBalanceDNS).toBeDefined();
    expect(ssmConfigParameterName).toBeDefined();
    expect(appPublicUrl).toBeDefined();
    // New output assertions
    if (outputs.HostedZoneName) {
      // Only if Route 53 is enabled
      expect(hostedZoneName).toBeDefined();
      expect(domainARecord).toBeDefined();
    }
    expect(cloudMapNamespace).toBeDefined();
    expect(clusterArn).toBeDefined();
  });

  test('should contain required outputs with valid formats', () => {
    expect(outputs.ClusterName).toContain('Tap');
    expect(outputs.DomainName).toContain('.local'); // This should match your domain setup, might be a real TLD
    expect(outputs.FargateServiceName).toContain('-svc');

    expect(outputs.ListenerArn).toMatch(
      /^arn:aws:elasticloadbalancing:[^:]+:\d+:listener\/.*/
    );
    expect(outputs.LoadBalancerArn).toMatch(
      /^arn:aws:elasticloadbalancing:[^:]+:\d+:loadbalancer\/.*/
    );
    expect(outputs.LoadBalancerSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    expect(outputs.SSLCertificateArn).toMatch(
      /^arn:aws:acm:[^:]+:\d+:certificate\/[a-f0-9-]+$/
    );
    expect(outputs.SSMConfigParameterName).toContain('/config');
    expect(outputs.TaskDefinitionArn).toMatch(
      /^arn:aws:ecs:[^:]+:\d+:task-definition\/[^:]+:\d+$/
    );
    expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
    expect(outputs.LoadBalanceDNS).toMatch(/elb\.amazonaws\.com$/);
    expect(appPublicUrl).toMatch(/^https?:\/\/[^\s$.?#].[^\s]*$/i);
    if (outputs.HostedZoneName) {
      expect(outputs.HostedZoneName).toMatch(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/); // Basic domain name regex
      expect(outputs.DomainARecord).toMatch(/^[a-zA-Z0-9.-]+$/); // Basic record name regex
    }
    expect(outputs.Namespace).toMatch(/^[a-zA-Z0-9.-]+$/); // Cloud Map Namespace format
    expect(outputs.ClusterArn).toMatch(/^arn:aws:ecs:[^:]+:\d+:cluster\/.*/);
  });
});

describe('AWS Resources Integration Test', () => {
  const ecs = new ECSClient({ region: REGION });
  const elbv2 = new ElasticLoadBalancingV2Client({ region: REGION });
  const ssm = new SSMClient({ region: REGION });
  const acm = new ACMClient({ region: REGION });
  const ec2 = new EC2Client({ region: REGION });
  const route53 = new Route53Client({ region: REGION });
  const cloudwatch = new CloudWatchClient({ region: REGION });
  const autoScaling = new ApplicationAutoScalingClient({ region: REGION });
  const serviceDiscovery = new ServiceDiscoveryClient({ region: REGION });

  it('should resolve ECS service from Cloud Map', async () => {
    const namespaceName = `${outputs.envName}.local`;

    const namespaces = await serviceDiscovery.send(
      new ListNamespacesCommand({})
    );
    const namespace = namespaces.Namespaces?.find(
      n => n.Name === namespaceName
    );
    expect(namespace).toBeDefined();

    const services = await serviceDiscovery.send(
      new DiscoverInstancesCommand({
        NamespaceName: namespaceName,
        ServiceName: 'app', // CloudMap service name from CDK
      })
    );

    expect(services.Instances?.length).toBeGreaterThan(0);
  });

  it('should verify ECS service is healthy and has all desired tasks running', async () => {
    const res = await ecs.send(
      new DescribeServicesCommand({
        cluster: outputs.ClusterName,
        services: [outputs.FargateServiceName],
      })
    );

    const service = res.services?.[0];
    expect(service?.runningCount).toBe(service?.desiredCount);
    expect(service?.healthCheckGracePeriodSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should verify ECS Fargate auto scaling is configured', async () => {
    const res = await autoScaling.send(
      new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
        ResourceIds: [
          `service/${outputs.ClusterName}/${outputs.FargateServiceName}`,
        ],
      })
    );

    const target = res.ScalableTargets?.[0];
    expect(target).toBeDefined();
    expect(target?.MinCapacity).toBe(2);
    expect(target?.MaxCapacity).toBe(10);
  });
  it('should confirm CloudWatch alarms can trigger (pseudo check)', async () => {
    const res = await cloudwatch.send(
      new DescribeAlarmsCommand({
        AlarmNames: [
          `${outputs.envName}:HighCpuAlarm`,
          `${outputs.envName}:HighMemoryAlarm`,
        ],
      })
    );
    const allInOk = res.MetricAlarms?.every(alarm => alarm.StateValue === 'OK');
    expect(allInOk).toBe(true); // Alternatively test for specific state
  });

  // CloudWatch monitoring & logs test
  it('should verify CloudWatch alarms exist and are configured for CPU and Memory', async () => {
    const commonAlarmParams = {
      AlarmNames: [
        `${outputs.envName}:HighCpuAlarm`,
        `${outputs.envName}:HighMemoryAlarm`,
      ],
    };

    const res = await cloudwatch.send(
      new DescribeAlarmsCommand(commonAlarmParams)
    );
    expect(res.MetricAlarms).toBeDefined();
    expect(res.MetricAlarms?.length).toBeGreaterThanOrEqual(2); // Expect at least two alarms

    const cpuAlarm = res.MetricAlarms?.find(
      alarm => alarm.AlarmName === `${outputs.envName}:HighCpuAlarm`
    );
    expect(cpuAlarm).toBeDefined();
    expect(cpuAlarm?.MetricName).toBe('CPUUtilization');
    expect(cpuAlarm?.Namespace).toBeDefined();
    expect(cpuAlarm?.Threshold).toBe(80);
    expect(cpuAlarm?.EvaluationPeriods).toBe(2);

    const memoryAlarm = res.MetricAlarms?.find(
      alarm => alarm.AlarmName === `${outputs.envName}:HighMemoryAlarm`
    );
    expect(memoryAlarm).toBeDefined();
    expect(memoryAlarm?.MetricName).toBe('MemoryUtilization');
    expect(memoryAlarm?.Namespace).toBeDefined();
    expect(memoryAlarm?.Threshold).toBe(80);
    expect(memoryAlarm?.EvaluationPeriods).toBe(2);
  });

  // ECS Container Insights and Cloud Map namespace functionality test
  it('should verify Cloud Map namespace exists and service is registered', async () => {
    if (
      !outputs.Namespace ||
      !outputs.ClusterName ||
      !outputs.FargateServiceName
    ) {
      console.warn(
        'Skipping Cloud Map test: Namespace, ClusterName, or FargateServiceName not defined in outputs.'
      );
      return;
    }

    // 1. Get the actual desired count from the ECS service
    const describeServicesRes = await ecs.send(
      new DescribeServicesCommand({
        cluster: outputs.ClusterName,
        services: [outputs.FargateServiceName],
      })
    );

    const ecsService = describeServicesRes.services?.[0];
    expect(ecsService).toBeDefined();
    const actualDesiredCount = ecsService?.desiredCount;
    expect(actualDesiredCount).toBeDefined();

    // 2. Verify Namespace exists
    const namespaceName = outputs.Namespace;
    const listNamespacesRes = await serviceDiscovery.send(
      new ListNamespacesCommand({})
    ); // Corrected
    const namespace = listNamespacesRes.Namespaces?.find(
      ns => ns.Name === namespaceName
    );
    expect(namespace).toBeDefined();
    const namespaceId = namespace?.Id;
    expect(namespaceId).toBeDefined();

    // 3. Verify the Cloud Map service exists within the namespace
    const listServicesRes = await serviceDiscovery.send(
      new ListServicesCommand({
        Filters: [{ Name: 'NAMESPACE_ID', Values: [namespaceId!] }],
      })
    ); // Corrected
    const cloudMapService = listServicesRes.Services?.find(
      svc => svc.Name === 'app'
    ); // Your CDK code defines service name as 'app'
    expect(cloudMapService).toBeDefined();
    const cloudMapServiceId = cloudMapService?.Id;
    expect(cloudMapServiceId).toBeDefined();

    // 4. Verify instances are registered for the service and match desired count
    const listInstancesRes = await serviceDiscovery.send(
      new ListInstancesCommand({ ServiceId: cloudMapServiceId! })
    ); // Corrected
    expect(listInstancesRes.Instances).toBeDefined();
    expect(listInstancesRes.Instances?.length).toBe(actualDesiredCount); // Should match the ECS desired count
  });

  // Auto Scaling configuration test
  it('should verify Auto Scaling policies are attached to the ECS service', async () => {
    if (!outputs.ClusterName || !outputs.FargateServiceName) {
      console.warn(
        'Skipping Auto Scaling test: ClusterName or FargateServiceName not defined in outputs.'
      );
      return;
    }

    const scalableTargetResourceId = `service/${outputs.ClusterName}/${outputs.FargateServiceName}`;

    const describeScalingPoliciesRes = await autoScaling.send(
      new DescribeScalingPoliciesCommand({
        ServiceNamespace: 'ecs',
        ResourceId: scalableTargetResourceId,
      })
    );

    expect(describeScalingPoliciesRes.ScalingPolicies).toBeDefined();
    expect(
      describeScalingPoliciesRes.ScalingPolicies?.length
    ).toBeGreaterThanOrEqual(2); // CPU and Memory

    const cpuScalingPolicy = describeScalingPoliciesRes.ScalingPolicies?.find(
      p => p.PolicyName?.includes('CpuScaling')
    );
    expect(cpuScalingPolicy).toBeDefined();
    expect(cpuScalingPolicy?.PolicyType).toBe('TargetTrackingScaling');
    expect(
      cpuScalingPolicy?.TargetTrackingScalingPolicyConfiguration?.TargetValue
    ).toBe(50);
    expect(
      cpuScalingPolicy?.TargetTrackingScalingPolicyConfiguration
        ?.PredefinedMetricSpecification?.PredefinedMetricType
    ).toBe('ECSServiceAverageCPUUtilization'); // Specific for ECS CPU

    const memoryScalingPolicy =
      describeScalingPoliciesRes.ScalingPolicies?.find(p =>
        p.PolicyName?.includes('MemoryScaling')
      );
    expect(memoryScalingPolicy).toBeDefined();
    expect(memoryScalingPolicy?.PolicyType).toBe('TargetTrackingScaling');
    expect(
      memoryScalingPolicy?.TargetTrackingScalingPolicyConfiguration?.TargetValue
    ).toBe(60);
    expect(
      memoryScalingPolicy?.TargetTrackingScalingPolicyConfiguration
        ?.PredefinedMetricSpecification?.PredefinedMetricType
    ).toBe('ECSServiceAverageMemoryUtilization'); // Specific for ECS Memory
    expect(
      memoryScalingPolicy?.TargetTrackingScalingPolicyConfiguration?.TargetValue
    ).toBe(60);
  });

  // it('should simulate ECS CPU utilization and verify scaling config', async () => {
  //   const res = await autoScaling.send(
  //     new DescribeScalableTargetsCommand({
  //       ServiceNamespace: 'ecs',
  //       ResourceIds: [
  //         `service/${outputs.ClusterName}/${outputs.FargateServiceName}`,
  //       ],
  //     })
  //   );
  //   const scalingTarget = res.ScalableTargets?.[0];
  //   expect(scalingTarget).toBeDefined();
  //   expect(scalingTarget?.MaxCapacity).toBeGreaterThanOrEqual(2);
  // });

  if (process.env.HOSTED_ZONE_NAME) {
    it('should verify Route53 A Record exists for domain', async () => {
      const zoneId = outputs.HostedZoneId; // Add this to your outputs
      const domainName = outputs.DomainARecord.endsWith('.')
        ? outputs.DomainARecord
        : `${outputs.DomainARecord}.`;
      const route53 = new Route53Client({ region: REGION });
      const res = await route53.send(
        new ListResourceRecordSetsCommand({ HostedZoneId: zoneId })
      );
      const record = res.ResourceRecordSets?.find(
        r => r.Name === domainName && r.Type === 'A'
      );

      expect(record).toBeDefined();
    });
  }

  it('should verify ECS Cloud Map namespace is registered', async () => {
    const res = await serviceDiscovery.send(new ListNamespacesCommand({}));

    const ns = res.Namespaces?.find(n => n.Name);
    expect(ns).toBeDefined();
  });

  it('should verify CloudWatch alarms exist for CPU and Memory', async () => {
    const res = await cloudwatch.send(new DescribeAlarmsCommand({}));

    const cpuAlarm = res.MetricAlarms?.find(alarm =>
      alarm.AlarmName?.includes('HighCpuAlarm')
    );
    const memAlarm = res.MetricAlarms?.find(alarm =>
      alarm.AlarmName?.includes('HighMemoryAlarm')
    );

    expect(cpuAlarm).toBeDefined();
    expect(memAlarm).toBeDefined();
  });

  it('should verify ECS Task Definition exists', async () => {
    const res = await ecs.send(
      new DescribeTaskDefinitionCommand({
        taskDefinition: outputs.TaskDefinitionArn,
      })
    );
    expect(res.taskDefinition?.taskDefinitionArn).toEqual(
      outputs.TaskDefinitionArn
    );
  });

  it('should verify Load Balancer exists', async () => {
    const res = await elbv2.send(
      new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.LoadBalancerArn],
      })
    );
    expect(res.LoadBalancers?.[0]?.LoadBalancerArn).toEqual(
      outputs.LoadBalancerArn
    );
  });

  it('should verify Listener exists', async () => {
    const res = await elbv2.send(
      new DescribeListenersCommand({
        ListenerArns: [outputs.ListenerArn],
      })
    );
    expect(res.Listeners?.[0]?.ListenerArn).toEqual(outputs.ListenerArn);
  });

  it('should verify SSL Certificate exists', async () => {
    const res = await acm.send(
      new DescribeCertificateCommand({
        CertificateArn: outputs.SSLCertificateArn,
      })
    );
    expect(res.Certificate?.CertificateArn).toEqual(outputs.SSLCertificateArn);
  });

  it('should verify SSM parameter exists', async () => {
    const res = await ssm.send(
      new GetParameterCommand({
        Name: outputs.SSMConfigParameterName,
      })
    );
    expect(res.Parameter?.Name).toEqual(outputs.SSMConfigParameterName);
  });

  it('should verify Security Group exists', async () => {
    const res = await ec2.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.LoadBalancerSecurityGroupId],
      })
    );
    expect(res.SecurityGroups?.[0]?.GroupId).toEqual(
      outputs.LoadBalancerSecurityGroupId
    );
  });

  it('should verify VPC exists', async () => {
    const res = await ec2.send(
      new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      })
    );
    expect(res.Vpcs?.[0]?.VpcId).toEqual(outputs.VpcId);
  });
});

// -----------------------------
// ✅ NEW: LIVE APPLICATION TEST
// -----------------------------

describe('Live App Test via Load Balancer', () => {
  const loadBalancerUrl = `https://${outputs.LoadBalanceDNS}`;

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // <-- Accept self-signed certs
  });

  it('should respond to HTTPS request on the public ALB', async () => {
    const response = await axios.get(loadBalancerUrl, {
      httpsAgent,
      timeout: 5000,
    });
    const { status } = response;
    expect(status).toBe(200);
  });

  it('should contain expected content in the homepage', async () => {
    const response = await axios.get(loadBalancerUrl, {
      httpsAgent,
      timeout: 5000,
    });

    expect(response.data).toMatch(/welcome|ok|running|alive|Hello/i);
  });
});
