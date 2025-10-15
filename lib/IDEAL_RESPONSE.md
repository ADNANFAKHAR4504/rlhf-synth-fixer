```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import {
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  RouteTableAssociation,
  Eip,
  NatGateway,
} from '@cdktf/provider-aws/lib/vpc';
import {
  IamRole,
  IamRolePolicyAttachment,
  IamOpenidConnectProvider,
} from '@cdktf/provider-aws/lib/iam';
import { EksCluster, EksNodeGroup } from '@cdktf/provider-aws/lib/eks';
import {
  AppmeshMesh,
  AppmeshVirtualNode,
  AppmeshVirtualRouter,
  AppmeshRoute,
  AppmeshVirtualService,
} from '@cdktf/provider-aws/lib/appmesh';
import {
  Route53Zone,
  Route53Record,
  Route53HealthCheck,
} from '@cdktf/provider-aws/lib/route53';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

/**
 * @class RegionalEksInfra
 * A reusable construct to create all necessary regional resources,
 * including Networking, EKS, and App Mesh components.
 */
class RegionalEksInfra extends Construct {
  public readonly cluster: EksCluster;
  public readonly placeholderEndpointFqdn: string;

  constructor(
    scope: Construct,
    id: string,
    props: {
      provider: AwsProvider;
      region: string;
      vpcCidr: string;
      domainName: string;
      randomSuffix: string;
      tags: any;
    }
  ) {
    super(scope, id);
    const { provider, region, vpcCidr, domainName, randomSuffix, tags } = props;

    // --- 1. Networking ---
    // Creates a VPC with public subnets for NAT Gateways and private subnets for EKS nodes.
    const vpc = new Vpc(this, 'Vpc', {
      provider,
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `vpc-${region}-${randomSuffix}` },
    });
    const publicSubnet = new Subnet(this, 'PublicSubnet', {
      provider,
      vpcId: vpc.id,
      cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 1),
      availabilityZone: `${region}a`,
      mapPublicIpOnLaunch: true,
    });
    const privateSubnet = new Subnet(this, 'PrivateSubnet', {
      provider,
      vpcId: vpc.id,
      cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 2),
      availabilityZone: `${region}a`,
    });

    const igw = new InternetGateway(this, 'Igw', { provider, vpcId: vpc.id });
    const eip = new Eip(this, 'NatEip', { provider, domain: 'vpc' });
    const natGw = new NatGateway(this, 'NatGw', {
      provider,
      allocationId: eip.id,
      subnetId: publicSubnet.id,
      dependsOn: [igw],
    });

    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      provider,
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
    });
    new RouteTableAssociation(this, 'PublicRtAssoc', {
      provider,
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      provider,
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGw.id }],
    });
    new RouteTableAssociation(this, 'PrivateRtAssoc', {
      provider,
      subnetId: privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // --- 2. EKS Cluster & Nodes ---
    const clusterRole = new IamRole(this, 'EksClusterRole', {
      provider,
      name: `eks-cluster-role-${randomSuffix}`,
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
      provider,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      role: clusterRole.name,
    });

    const nodeRole = new IamRole(this, 'EksNodeRole', {
      provider,
      name: `eks-node-role-${randomSuffix}`,
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
      provider,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      role: nodeRole.name,
    });
    new IamRolePolicyAttachment(this, 'EksCniPolicyAttach', {
      provider,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      role: nodeRole.name,
    });
    new IamRolePolicyAttachment(this, 'Ec2ContainerRegistryReadOnlyAttach', {
      provider,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      role: nodeRole.name,
    });
    new IamRolePolicyAttachment(this, 'AppMeshPolicyAttach', {
      provider,
      policyArn: 'arn:aws:iam::aws:policy/AWSAppMeshFullAccess',
      role: nodeRole.name,
    });

    this.cluster = new EksCluster(this, 'EksCluster', {
      provider,
      name: `eks-cluster-${region}-${randomSuffix}`,
      roleArn: clusterRole.arn,
      version: '1.27',
      vpcConfig: { subnetIds: [privateSubnet.id] },
      tags,
    });

    const nodeGroup = new EksNodeGroup(this, 'NodeGroup', {
      provider,
      clusterName: this.cluster.name,
      nodeGroupName: `node-group-${region}-${randomSuffix}`,
      nodeRoleArn: nodeRole.arn,
      subnetIds: [privateSubnet.id],
      instanceTypes: ['m5.xlarge'],
      scalingConfig: { desiredSize: 2, minSize: 2, maxSize: 6 },
      tags,
    });

    // --- 3. App Mesh ---
    const mesh = new AppmeshMesh(this, 'AppMesh', {
      provider,
      name: `financial-mesh-${randomSuffix}`,
      tags,
    });
    const virtualNode = new AppmeshVirtualNode(this, 'TradingServiceNode', {
      provider,
      meshName: mesh.name,
      name: `trading-service-node-${region}-${randomSuffix}`,
      spec: {
        serviceDiscovery: {
          dns: { hostname: `trading-service.default.svc.cluster.local` },
        },
      },
    });
    const virtualRouter = new AppmeshVirtualRouter(
      this,
      'TradingServiceRouter',
      {
        provider,
        meshName: mesh.name,
        name: `trading-service-router-${region}-${randomSuffix}`,
        spec: { listener: [{ portMapping: { port: 8080, protocol: 'http' } }] },
      }
    );
    new AppmeshRoute(this, 'TradingServiceRoute', {
      provider,
      meshName: mesh.name,
      virtualRouterName: virtualRouter.name,
      name: `trading-service-route-${region}-${randomSuffix}`,
      spec: {
        httpRoute: {
          action: {
            weightedTarget: [{ virtualNode: virtualNode.name, weight: 1 }],
          },
        },
      },
    });
    new AppmeshVirtualService(this, 'TradingService', {
      provider,
      meshName: mesh.name,
      name: `trading-service.mesh.local`,
      spec: {
        provider: { virtualRouter: { virtualRouterName: virtualRouter.name } },
      },
    });

    // --- 4. Monitoring ---
    new CloudwatchMetricAlarm(this, 'NodeGroupCpuAlarm', {
      provider,
      alarmName: `EKSNodeGroupHighCPU-${region}-${randomSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 3,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        AutoScalingGroupName: nodeGroup.resources
          .get(0)
          .autoscalingGroups.get(0).name,
      },
    });

    // This FQDN represents the public endpoint of the EKS cluster, typically managed by a K8s Ingress controller.
    this.placeholderEndpointFqdn = `ingress.${region}.eks.${domainName}`;
  }
}

/**
 * @class EksDrStack
 * The main stack that orchestrates the multi-region deployment.
 */
export class EksDrStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const commonTags = { Project: 'iac-rlhf-amazon' };
    const domainName = `financial-trading-${randomSuffix}.com`;

    // Define providers for both primary and DR regions
    const primaryProvider = new AwsProvider(this, 'primary', {
      region: 'us-east-2',
      alias: 'us-east-2',
    });
    const drProvider = new AwsProvider(this, 'dr', {
      region: 'eu-central-1',
      alias: 'eu-central-1',
    });

    // Instantiate the regional infrastructure for both regions using the modular construct
    const primaryInfra = new RegionalEksInfra(this, 'PrimaryInfrastructure', {
      provider: primaryProvider,
      region: 'us-east-2',
      vpcCidr: '10.0.0.0/16',
      domainName,
      randomSuffix,
      tags: commonTags,
    });
    const drInfra = new RegionalEksInfra(this, 'DrInfrastructure', {
      provider: drProvider,
      region: 'eu-central-1',
      vpcCidr: '172.16.0.0/16',
      domainName,
      randomSuffix,
      tags: commonTags,
    });

    // Create the global DNS zone for failover
    const zone = new Route53Zone(this, 'DnsZone', {
      name: domainName,
      tags: commonTags,
    });

    // Create health checks that monitor the public endpoint of each regional cluster
    const primaryHealthCheck = new Route53HealthCheck(
      this,
      'PrimaryHealthCheck',
      {
        fqdn: primaryInfra.placeholderEndpointFqdn,
        type: 'HTTP',
        failureThreshold: 3,
        requestInterval: 10,
        tags: commonTags,
      }
    );
    const drHealthCheck = new Route53HealthCheck(this, 'DrHealthCheck', {
      fqdn: drInfra.placeholderEndpointFqdn,
      type: 'HTTP',
      failureThreshold: 3,
      requestInterval: 10,
      tags: commonTags,
    });

    // Create DNS records with a failover routing policy
    new Route53Record(this, 'PrimaryRecord', {
      zoneId: zone.id,
      name: `trading.${domainName}`,
      type: 'CNAME',
      ttl: 60,
      setIdentifier: 'primary-region',
      healthCheckId: primaryHealthCheck.id,
      failoverRoutingPolicy: { type: 'PRIMARY' },
      records: [primaryInfra.placeholderEndpointFqdn],
    });
    new Route53Record(this, 'DrRecord', {
      zoneId: zone.id,
      name: `trading.${domainName}`,
      type: 'CNAME',
      ttl: 60,
      setIdentifier: 'dr-region',
      healthCheckId: drHealthCheck.id,
      failoverRoutingPolicy: { type: 'SECONDARY' },
      records: [drInfra.placeholderEndpointFqdn],
    });

    // --- Outputs ---
    new TerraformOutput(this, 'PrimaryEKSClusterName', {
      value: primaryInfra.cluster.name,
    });
    new TerraformOutput(this, 'DREKSClusterName', {
      value: drInfra.cluster.name,
    });
    new TerraformOutput(this, 'Route53FailoverDNS', {
      value: `trading.${domainName}`,
    });
  }
}
```
