// Configuration - These are coming from cdk.out after cdk deploy
import fs from 'fs';
import https from 'https';
import axios from 'axios';
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
} from '@aws-sdk/client-servicediscovery';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
} from '@aws-sdk/client-application-auto-scaling';

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
  });

  test('should contain required outputs with valid formats', () => {
    expect(outputs.ClusterName).toContain('Tap');
    expect(outputs.DomainName).toContain('.local');
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
  });
});

describe('AWS Resources Integration Test', () => {
  const ecs = new ECSClient({ region: REGION });
  const elbv2 = new ElasticLoadBalancingV2Client({ region: REGION });
  const ssm = new SSMClient({ region: REGION });
  const acm = new ACMClient({ region: REGION });
  const ec2 = new EC2Client({ region: REGION });
  const servicediscovery = new ServiceDiscoveryClient({ region: REGION });
  const cloudwatch = new CloudWatchClient({ region: REGION });
  const autoScaling = new ApplicationAutoScalingClient({ region: REGION });

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
    const res = await servicediscovery.send(new ListNamespacesCommand({}));

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
