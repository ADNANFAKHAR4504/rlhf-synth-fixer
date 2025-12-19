import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import { AppmeshMesh } from '@cdktf/provider-aws/lib/appmesh-mesh';
import { AppmeshVirtualNode } from '@cdktf/provider-aws/lib/appmesh-virtual-node';
import { AppmeshVirtualRouter } from '@cdktf/provider-aws/lib/appmesh-virtual-router';
import { AppmeshRoute } from '@cdktf/provider-aws/lib/appmesh-route';
import { AppmeshVirtualService } from '@cdktf/provider-aws/lib/appmesh-virtual-service';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

// --- Modular Construct for Regional Networking ---
class Networking extends Construct {
  public readonly vpc: Vpc;
  public readonly privateSubnets: Subnet[];

  constructor(
    scope: Construct,
    id: string,
    props: {
      provider: AwsProvider;
      region: string;
      cidr: string;
      randomSuffix: string;
      tags: any;
    }
  ) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, 'Azs', {
      provider: props.provider,
      state: 'available',
    });

    this.vpc = new Vpc(this, 'Vpc', {
      provider: props.provider,
      cidrBlock: props.cidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: `vpc-${props.region}-${props.randomSuffix}`,
      },
    });

    // FIX: Use Fn.element() to access list elements that are resolved during deployment
    const publicSubnetA = new Subnet(this, 'PublicSubnetA', {
      provider: props.provider,
      vpcId: this.vpc.id,
      cidrBlock: Fn.cidrsubnet(props.cidr, 8, 1),
      availabilityZone: Fn.element(azs.names, 0),
      mapPublicIpOnLaunch: true,
    });
    const publicSubnetB = new Subnet(this, 'PublicSubnetB', {
      provider: props.provider,
      vpcId: this.vpc.id,
      cidrBlock: Fn.cidrsubnet(props.cidr, 8, 2),
      availabilityZone: Fn.element(azs.names, 1),
      mapPublicIpOnLaunch: true,
    });

    const privateSubnetA = new Subnet(this, 'PrivateSubnetA', {
      provider: props.provider,
      vpcId: this.vpc.id,
      cidrBlock: Fn.cidrsubnet(props.cidr, 8, 10),
      availabilityZone: Fn.element(azs.names, 0),
    });
    const privateSubnetB = new Subnet(this, 'PrivateSubnetB', {
      provider: props.provider,
      vpcId: this.vpc.id,
      cidrBlock: Fn.cidrsubnet(props.cidr, 8, 11),
      availabilityZone: Fn.element(azs.names, 1),
    });
    this.privateSubnets = [privateSubnetA, privateSubnetB];

    const igw = new InternetGateway(this, 'Igw', {
      provider: props.provider,
      vpcId: this.vpc.id,
    });
    const eip = new Eip(this, 'NatEip', {
      provider: props.provider,
      domain: 'vpc',
    });
    const natGw = new NatGateway(this, 'NatGw', {
      provider: props.provider,
      allocationId: eip.id,
      subnetId: publicSubnetA.id,
      dependsOn: [igw],
    });

    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      provider: props.provider,
      vpcId: this.vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
    });
    new RouteTableAssociation(this, 'PublicRtAssocA', {
      provider: props.provider,
      subnetId: publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });
    new RouteTableAssociation(this, 'PublicRtAssocB', {
      provider: props.provider,
      subnetId: publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });

    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      provider: props.provider,
      vpcId: this.vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGw.id }],
    });
    new RouteTableAssociation(this, 'PrivateRtAssocA', {
      provider: props.provider,
      subnetId: privateSubnetA.id,
      routeTableId: privateRouteTable.id,
    });
    new RouteTableAssociation(this, 'PrivateRtAssocB', {
      provider: props.provider,
      subnetId: privateSubnetB.id,
      routeTableId: privateRouteTable.id,
    });
  }
}

// --- Modular Construct for Regional EKS ---
class Eks extends Construct {
  public readonly cluster: EksCluster;
  public readonly nodeGroup: EksNodeGroup;

  constructor(
    scope: Construct,
    id: string,
    props: {
      provider: AwsProvider;
      region: string;
      randomSuffix: string;
      vpcId: string;
      subnetIds: string[];
      tags: any;
    }
  ) {
    super(scope, id);

    const clusterRole = new IamRole(this, 'EksClusterRole', {
      provider: props.provider,
      name: `eks-cluster-role-${props.region}-${props.randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'eks.amazonaws.com' },
          },
        ],
      }),
    });
    new IamRolePolicyAttachment(this, 'EksClusterPolicyAttach', {
      provider: props.provider,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      role: clusterRole.name,
    });

    const nodeRole = new IamRole(this, 'EksNodeRole', {
      provider: props.provider,
      name: `eks-node-role-${props.region}-${props.randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
    });
    new IamRolePolicyAttachment(this, 'EksWorkerNodePolicyAttach', {
      provider: props.provider,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      role: nodeRole.name,
    });
    new IamRolePolicyAttachment(this, 'EksCniPolicyAttach', {
      provider: props.provider,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      role: nodeRole.name,
    });
    new IamRolePolicyAttachment(this, 'Ec2ContainerRegistryReadOnlyAttach', {
      provider: props.provider,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      role: nodeRole.name,
    });
    new IamRolePolicyAttachment(this, 'AppMeshPolicyAttach', {
      provider: props.provider,
      policyArn: 'arn:aws:iam::aws:policy/AWSAppMeshFullAccess',
      role: nodeRole.name,
    });

    this.cluster = new EksCluster(this, 'EksCluster', {
      provider: props.provider,
      name: `eks-cluster-${props.region}-${props.randomSuffix}`,
      roleArn: clusterRole.arn,
      vpcConfig: { subnetIds: props.subnetIds },
      tags: props.tags,
    });

    this.nodeGroup = new EksNodeGroup(this, 'NodeGroup', {
      provider: props.provider,
      clusterName: this.cluster.name,
      nodeGroupName: `node-group-${props.region}-${props.randomSuffix}`,
      nodeRoleArn: nodeRole.arn,
      subnetIds: props.subnetIds,
      instanceTypes: ['m5.xlarge'],
      scalingConfig: { desiredSize: 2, minSize: 2, maxSize: 6 },
      tags: props.tags,
      dependsOn: [this.cluster],
    });

    new CloudwatchMetricAlarm(this, 'NodeGroupCpuAlarm', {
      provider: props.provider,
      alarmName: `EKSNodeGroupHighCPU-${props.region}-${props.randomSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 3,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        AutoScalingGroupName: this.nodeGroup.resources
          .get(0)
          .autoscalingGroups.get(0).name,
      },
    });
  }
}

// --- Modular Construct for Regional App Mesh ---
class ServiceMesh extends Construct {
  public readonly mesh: AppmeshMesh;
  constructor(
    scope: Construct,
    id: string,
    props: { provider: AwsProvider; randomSuffix: string; tags: any }
  ) {
    super(scope, id);
    this.mesh = new AppmeshMesh(this, 'AppMesh', {
      provider: props.provider,
      name: `financial-mesh-${props.randomSuffix}`,
      tags: props.tags,
    });
    const virtualNode = new AppmeshVirtualNode(this, 'TradingServiceNode', {
      provider: props.provider,
      meshName: this.mesh.name,
      name: `trading-service-node-${props.randomSuffix}`,
      spec: {
        serviceDiscovery: {
          dns: { hostname: 'trading-service.default.svc.cluster.local' },
        },
        listener: [{ portMapping: { port: 8080, protocol: 'http' } }],
      },
      tags: props.tags,
    });
    const virtualRouter = new AppmeshVirtualRouter(
      this,
      'TradingServiceRouter',
      {
        provider: props.provider,
        meshName: this.mesh.name,
        name: `trading-service-router-${props.randomSuffix}`,
        spec: { listener: [{ portMapping: { port: 8080, protocol: 'http' } }] },
        tags: props.tags,
      }
    );
    new AppmeshRoute(this, 'TradingServiceRoute', {
      provider: props.provider,
      meshName: this.mesh.name,
      virtualRouterName: virtualRouter.name,
      name: `trading-service-route-${props.randomSuffix}`,
      spec: {
        httpRoute: {
          match: { prefix: '/' },
          action: {
            weightedTarget: [{ virtualNode: virtualNode.name, weight: 1 }],
          },
        },
      },
    });
    new AppmeshVirtualService(this, 'TradingService', {
      provider: props.provider,
      meshName: this.mesh.name,
      name: 'trading-service.mesh.local',
      spec: {
        provider: { virtualRouter: { virtualRouterName: virtualRouter.name } },
      },
      tags: props.tags,
    });
  }
}

// --- Main Stack Definition ---
export class EksDrStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const commonTags = { Project: 'iac-rlhf-amazon' };
    const domainName = `financial-trading-${randomSuffix}.com`;
    const primaryProvider = new AwsProvider(this, 'primary', {
      region: 'us-east-2',
      alias: 'us-east-2',
    });
    const drProvider = new AwsProvider(this, 'dr', {
      region: 'eu-central-1',
      alias: 'eu-central-1',
    });
    const primaryNet = new Networking(this, 'PrimaryNetworking', {
      provider: primaryProvider,
      region: 'us-east-2',
      cidr: '10.0.0.0/16',
      randomSuffix,
      tags: commonTags,
    });
    const drNet = new Networking(this, 'DrNetworking', {
      provider: drProvider,
      region: 'eu-central-1',
      cidr: '172.16.0.0/16',
      randomSuffix,
      tags: commonTags,
    });
    const primaryEks = new Eks(this, 'PrimaryEks', {
      provider: primaryProvider,
      region: 'us-east-2',
      randomSuffix,
      vpcId: primaryNet.vpc.id,
      subnetIds: primaryNet.privateSubnets.map(s => s.id),
      tags: commonTags,
    });
    const drEks = new Eks(this, 'DrEks', {
      provider: drProvider,
      region: 'eu-central-1',
      randomSuffix,
      vpcId: drNet.vpc.id,
      subnetIds: drNet.privateSubnets.map(s => s.id),
      tags: commonTags,
    });
    const primaryMesh = new ServiceMesh(this, 'PrimaryAppMesh', {
      provider: primaryProvider,
      randomSuffix,
      tags: commonTags,
    });
    new ServiceMesh(this, 'DrAppMesh', {
      provider: drProvider,
      randomSuffix,
      tags: commonTags,
    });
    const zone = new Route53Zone(this, 'DnsZone', {
      name: domainName,
      tags: commonTags,
    });
    const primaryEndpointFqdn = 'ingress.us-east-2.eks.example.com';
    const drEndpointFqdn = 'ingress.eu-central-1.eks.example.com';
    const primaryHealthCheck = new Route53HealthCheck(
      this,
      'PrimaryHealthCheck',
      {
        fqdn: primaryEndpointFqdn,
        type: 'HTTP',
        failureThreshold: 3,
        requestInterval: 10,
        tags: commonTags,
      }
    );
    const drHealthCheck = new Route53HealthCheck(this, 'DrHealthCheck', {
      fqdn: drEndpointFqdn,
      type: 'HTTP',
      failureThreshold: 3,
      requestInterval: 10,
      tags: commonTags,
    });
    new Route53Record(this, 'PrimaryRecord', {
      zoneId: zone.id,
      name: `trading.${domainName}`,
      type: 'CNAME',
      ttl: 60,
      setIdentifier: 'primary-region',
      healthCheckId: primaryHealthCheck.id,
      failoverRoutingPolicy: { type: 'PRIMARY' },
      records: [primaryEndpointFqdn],
    });
    new Route53Record(this, 'DrRecord', {
      zoneId: zone.id,
      name: `trading.${domainName}`,
      type: 'CNAME',
      ttl: 60,
      setIdentifier: 'dr-region',
      healthCheckId: drHealthCheck.id,
      failoverRoutingPolicy: { type: 'SECONDARY' },
      records: [drEndpointFqdn],
    });
    new TerraformOutput(this, 'PrimaryEKSClusterName', {
      value: primaryEks.cluster.name,
    });
    new TerraformOutput(this, 'DREKSClusterName', {
      value: drEks.cluster.name,
    });
    new TerraformOutput(this, 'Route53FailoverDNS', {
      value: `trading.${domainName}`,
    });
    new TerraformOutput(this, 'AppMeshName', { value: primaryMesh.mesh.name });
  }
}
