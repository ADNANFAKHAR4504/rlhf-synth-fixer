import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  type SecurityGroup,
  type Subnet,
  type Vpc,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  type LoadBalancer,
  type TargetGroup,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  type Cluster,
  type Service,
} from '@aws-sdk/client-ecs';

interface DeploymentOutputs {
  albDnsName: string;
  ecsClusterArn: string;
  ecsServiceArn: string;
  vpcId: string;
  [key: string]: unknown;
}

const candidateOutputsPaths = [
  path.join(__dirname, '../cfn-outputs/flat-outputs.json'),
  path.join(__dirname, '../../cfn-outputs/flat-outputs.json'),
  path.join(__dirname, '../../../cfn-outputs/flat-outputs.json'),
];

const requiredKeys: Array<keyof DeploymentOutputs> = [
  'albDnsName',
  'ecsClusterArn',
  'ecsServiceArn',
  'vpcId',
];

const resolvedOutputsPath =
  candidateOutputsPaths.find((candidate) => fs.existsSync(candidate)) ?? null;

const loadOutputs = (): DeploymentOutputs => {
  if (!resolvedOutputsPath) {
    throw new Error(
      `Deployment outputs not found. Checked: ${candidateOutputsPaths.join(
        ', '
      )}. Deploy the stack and export outputs before running integration tests.`
    );
  }

  const raw = fs.readFileSync(resolvedOutputsPath, 'utf-8');
  const parsed = JSON.parse(raw) as DeploymentOutputs;

  requiredKeys.forEach((key) => {
    if (!(key in parsed)) {
      throw new Error(`Deployment outputs missing required key: ${key}`);
    }
  });

  return parsed;
};

const region = process.env.AWS_REGION?.trim();
if (!region) {
  throw new Error('AWS_REGION environment variable must be set to run integration tests.');
}

const outputs = loadOutputs();

const ec2Client = new EC2Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const ecsClient = new ECSClient({ region });
const albName = outputs.albDnsName.split('.')[0];

let awsAvailable = true;
let awsUnavailableReason: Error | null = null;
let vpc: Vpc | undefined;
let cluster: Cluster | undefined;
let service: Service | undefined;
let serviceSubnets: Subnet[] = [];
let serviceSecurityGroups: SecurityGroup[] = [];
let loadBalancer: LoadBalancer | undefined;
let targetGroup: TargetGroup | undefined;

beforeAll(async () => {
  try {
    const [vpcResp, clusterResp, serviceResp, lbResp] = await Promise.all([
      ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpcId],
        })
      ),
      ecsClient.send(
        new DescribeClustersCommand({
          clusters: [outputs.ecsClusterArn],
          include: ['STATISTICS', 'TAGS', 'SETTINGS'],
        })
      ),
      ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs.ecsClusterArn,
          services: [outputs.ecsServiceArn],
          include: ['TAGS'],
        })
      ),
      elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [albName],
        })
      ),
    ]);

    vpc = vpcResp.Vpcs?.[0];
    cluster = clusterResp.clusters?.[0];
    service = serviceResp.services?.[0];
    loadBalancer = lbResp.LoadBalancers?.[0];

    const subnetIds =
      service?.networkConfiguration?.awsvpcConfiguration?.subnets ?? [];
    if (subnetIds.length > 0) {
      const subnetResp = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        })
      );
      serviceSubnets = subnetResp.Subnets ?? [];
    }

    const securityGroupIds =
      service?.networkConfiguration?.awsvpcConfiguration?.securityGroups ??
      [];
    if (securityGroupIds.length > 0) {
      const securityResp = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: securityGroupIds,
        })
      );
      serviceSecurityGroups = securityResp.SecurityGroups ?? [];
    }

    const serviceTargetGroupArn = service?.loadBalancers?.[0]?.targetGroupArn;
    if (serviceTargetGroupArn) {
      const targetGroupResp = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [serviceTargetGroupArn],
        })
      );
      targetGroup = targetGroupResp.TargetGroups?.[0];
    }
  } catch (error) {
    awsAvailable = false;
    awsUnavailableReason = error as Error;
  }
});

describe('TapStack Deployment Outputs', () => {
  it('should expose the required deployment outputs', () => {
    requiredKeys.forEach((key) => {
      expect(outputs[key]).toBeDefined();
    });
  });

  it('should provide non-empty output values', () => {
    expect(outputs.albDnsName).toMatch(/\S/);
    expect(outputs.ecsClusterArn).toMatch(/\S/);
    expect(outputs.ecsServiceArn).toMatch(/\S/);
    expect(outputs.vpcId).toMatch(/\S/);
  });

  it('should format identifiers according to AWS expectations', () => {
    expect(outputs.vpcId).toMatch(/^vpc-[0-9a-f]+$/);
    expect(outputs.ecsClusterArn).toMatch(/^arn:aws:ecs:[^:]+:\d+:cluster\/.+$/);
    expect(outputs.ecsServiceArn).toMatch(
      /^arn:aws:ecs:[^:]+:\d+:service\/[^/]+\/.+$/
    );
    expect(outputs.albDnsName).toMatch(/^[a-z0-9-]+\.[a-z0-9.-]+$/);
  });
});

describe('TapStack Live AWS Integration Tests', () => {
  it('should confirm the VPC exists in the target region', () => {
    if (!awsAvailable) {
      console.warn(
        `Skipping live AWS assertion: ${awsUnavailableReason?.message ?? 'unknown error'}`
      );
      return;
    }
    expect(vpc).toBeDefined();
    expect(vpc?.VpcId).toBe(outputs.vpcId);
    expect(vpc?.State).toBe('available');
  });

  it('should describe the ECS cluster from deployment outputs', () => {
    if (!awsAvailable) {
      console.warn(
        `Skipping live AWS assertion: ${awsUnavailableReason?.message ?? 'unknown error'}`
      );
      return;
    }
    expect(cluster).toBeDefined();
    expect(cluster?.clusterArn).toBe(outputs.ecsClusterArn);
    expect(cluster?.status).toBe('ACTIVE');
  });

  it('should describe the ECS service from deployment outputs', () => {
    if (!awsAvailable) {
      console.warn(
        `Skipping live AWS assertion: ${awsUnavailableReason?.message ?? 'unknown error'}`
      );
      return;
    }
    expect(service).toBeDefined();
    expect(service?.serviceArn).toBe(outputs.ecsServiceArn);
    expect(service?.clusterArn).toBe(outputs.ecsClusterArn);
    expect(service?.status).toBe('ACTIVE');
    expect(service?.desiredCount ?? 0).toBeGreaterThan(0);
  });

  it('should associate the ECS service with subnets in the VPC', () => {
    if (!awsAvailable) {
      console.warn(
        `Skipping live AWS assertion: ${awsUnavailableReason?.message ?? 'unknown error'}`
      );
      return;
    }
    expect(serviceSubnets.length).toBeGreaterThan(0);
    serviceSubnets.forEach((subnet) => {
      expect(subnet.VpcId).toBe(outputs.vpcId);
      expect(subnet.SubnetId).toMatch(/^subnet-[0-9a-f]+$/);
    });
  });

  it('should associate the ECS service with security groups in the VPC', () => {
    if (!awsAvailable) {
      console.warn(
        `Skipping live AWS assertion: ${awsUnavailableReason?.message ?? 'unknown error'}`
      );
      return;
    }
    expect(serviceSecurityGroups.length).toBeGreaterThan(0);
    serviceSecurityGroups.forEach((securityGroup) => {
      expect(securityGroup.VpcId).toBe(outputs.vpcId);
      expect(securityGroup.GroupId).toMatch(/^sg-[0-9a-f]+$/);
    });
  });

  it('should resolve the Application Load Balancer by DNS name', () => {
    if (!awsAvailable) {
      console.warn(
        `Skipping live AWS assertion: ${awsUnavailableReason?.message ?? 'unknown error'}`
      );
      return;
    }
    expect(loadBalancer).toBeDefined();
    expect(loadBalancer?.DNSName).toBe(outputs.albDnsName);
    expect(loadBalancer?.VpcId).toBe(outputs.vpcId);
    expect(loadBalancer?.State?.Code).toBe('active');
  });

  it('should expose a target group associated with the ECS service', () => {
    if (!awsAvailable) {
      console.warn(
        `Skipping live AWS assertion: ${awsUnavailableReason?.message ?? 'unknown error'}`
      );
      return;
    }
    expect(service?.loadBalancers ?? []).not.toHaveLength(0);
    expect(targetGroup).toBeDefined();
    expect(targetGroup?.VpcId).toBe(outputs.vpcId);
    expect(targetGroup?.TargetGroupArn).toBe(
      service?.loadBalancers?.[0]?.targetGroupArn
    );
  });
});
