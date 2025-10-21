```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import * as aws from '@cdktf/provider-aws';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

// Configuration constants following AWS Well-Architected Framework
const CONFIG = {
  project: 'iac-rlhf-amazon',
  primaryRegion: 'us-east-2',
  drRegion: 'eu-central-1',
  primaryCidr: '10.0.0.0/16',
  drCidr: '172.16.0.0/16',
  eksVersion: '1.27',
  nodeGroup: {
    minSize: 2,
    maxSize: 6,
    desiredSize: 3,
    instanceTypes: ['m5.xlarge'],
  },
  serviceMesh: {
    name: 'trading-platform-mesh',
    namespace: 'appmesh-system',
  },
  monitoring: {
    evaluationPeriods: 2,
    period: 60,
    threshold: 1,
  },
};

// Interface definitions for type safety
interface VPCResources {
  vpc: aws.vpc.Vpc;
  publicSubnets: aws.subnet.Subnet[];
  privateSubnets: aws.subnet.Subnet[];
  igw: aws.internetGateway.InternetGateway;
  natGateways: aws.natGateway.NatGateway[];
  eips: aws.eip.Eip[];
}

interface EKSResources {
  cluster: aws.eksCluster.EksCluster;
  nodeGroup: aws.eksNodeGroup.EksNodeGroup;
  oidcProvider: aws.iamOpenidConnectProvider.IamOpenidConnectProvider;
}

/**
 * Custom Construct for Network Infrastructure
 * Implements AWS best practices for multi-AZ VPC design
 */
class NetworkingConstruct extends Construct {
  public readonly vpcResources: VPCResources;

  constructor(scope: Construct, id: string, region: string, cidr: string) {
    super(scope, id);

    // Create VPC with DNS support for EKS
    const vpc = new aws.vpc.Vpc(this, `${id}-vpc`, {
      cidrBlock: cidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${CONFIG.project}-${region}-vpc`,
        Project: CONFIG.project,
        Region: region,
        'kubernetes.io/cluster/eks-cluster': 'shared',
      },
    });

    // Get availability zones for multi-AZ deployment
    const azs = new DataAwsAvailabilityZones(this, `${id}-azs`, {
      state: 'available',
    });

    // Create public subnets for load balancers
    const publicSubnets: aws.subnet.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.subnet.Subnet(this, `${id}-public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(cidr, 8, i),
        availabilityZone: Fn.element(azs.names, i),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${CONFIG.project}-${region}-public-${i}`,
          Project: CONFIG.project,
          Type: 'Public',
          'kubernetes.io/role/elb': '1',
          'kubernetes.io/cluster/eks-cluster': 'shared',
        },
      });
      publicSubnets.push(subnet);
    }

    // Create private subnets for EKS nodes
    const privateSubnets: aws.subnet.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.subnet.Subnet(this, `${id}-private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(cidr, 8, i + 100),
        availabilityZone: Fn.element(azs.names, i),
        tags: {
          Name: `${CONFIG.project}-${region}-private-${i}`,
          Project: CONFIG.project,
          Type: 'Private',
          'kubernetes.io/role/internal-elb': '1',
          'kubernetes.io/cluster/eks-cluster': 'shared',
        },
      });
      privateSubnets.push(subnet);
    }

    // Internet Gateway for public subnets
    const igw = new aws.internetGateway.InternetGateway(this, `${id}-igw`, {
      vpcId: vpc.id,
      tags: {
        Name: `${CONFIG.project}-${region}-igw`,
        Project: CONFIG.project,
      },
    });

    // Public route table with internet gateway route
    const publicRouteTable = new aws.routeTable.RouteTable(
      this,
      `${id}-public-rt`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `${CONFIG.project}-${region}-public-rt`,
          Project: CONFIG.project,
        },
      }
    );

    new aws.route.Route(this, `${id}-public-route`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `${id}-public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Create NAT Gateways for high availability (one per AZ)
    const eips: aws.eip.Eip[] = [];
    const natGateways: aws.natGateway.NatGateway[] = [];

    for (let i = 0; i < 3; i++) {
      const eip = new aws.eip.Eip(this, `${id}-nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `${CONFIG.project}-${region}-nat-eip-${i}`,
          Project: CONFIG.project,
        },
      });
      eips.push(eip);

      const natGateway = new aws.natGateway.NatGateway(this, `${id}-nat-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `${CONFIG.project}-${region}-nat-${i}`,
          Project: CONFIG.project,
        },
      });
      natGateways.push(natGateway);

      // Private route table per AZ for fault isolation
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `${id}-private-rt-${i}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `${CONFIG.project}-${region}-private-rt-${i}`,
            Project: CONFIG.project,
          },
        }
      );

      new aws.route.Route(this, `${id}-private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `${id}-private-rta-${i}`,
        {
          subnetId: privateSubnets[i].id,
          routeTableId: privateRouteTable.id,
        }
      );
    }

    this.vpcResources = {
      vpc,
      publicSubnets,
      privateSubnets,
      igw,
      natGateways,
      eips,
    };
  }
}

/**
 * Custom Construct for EKS Cluster
 * Implements production-grade EKS configuration
 */
class EKSClusterConstruct extends Construct {
  public readonly eksResources: EKSResources;

  constructor(
    scope: Construct,
    id: string,
    region: string,
    vpcResources: VPCResources
  ) {
    super(scope, id);

    // IAM role for EKS cluster with least privilege principle
    const clusterRole = new aws.iamRole.IamRole(this, `${id}-cluster-role`, {
      name: `${CONFIG.project}-${region}-eks-cluster-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'eks.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Project: CONFIG.project,
      },
    });

    // Attach required AWS managed policies
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${id}-cluster-policy`,
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
        role: clusterRole.name,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${id}-service-policy`,
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy',
        role: clusterRole.name,
      }
    );

    // Security group for EKS cluster with restrictive rules
    const clusterSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      `${id}-cluster-sg`,
      {
        name: `${CONFIG.project}-${region}-eks-cluster-sg`,
        description: 'Security group for EKS cluster control plane',
        vpcId: vpcResources.vpc.id,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `${CONFIG.project}-${region}-eks-cluster-sg`,
          Project: CONFIG.project,
        },
      }
    );

    // Create EKS cluster with encryption and logging
    const cluster = new aws.eksCluster.EksCluster(this, `${id}-cluster`, {
      name: `${CONFIG.project}-${region}-eks-cluster`,
      roleArn: clusterRole.arn,
      version: CONFIG.eksVersion,
      vpcConfig: {
        subnetIds: vpcResources.privateSubnets.map(s => s.id),
        securityGroupIds: [clusterSecurityGroup.id],
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
        publicAccessCidrs: ['0.0.0.0/0'], // Restrict in production
      },
      enabledClusterLogTypes: [
        'api',
        'audit',
        'authenticator',
        'controllerManager',
        'scheduler',
      ],
      encryptionConfig: {
        provider: {
          keyArn: new aws.kmsKey.KmsKey(this, `${id}-kms-key`, {
            description: `EKS cluster encryption key for ${region}`,
            tags: {
              Project: CONFIG.project,
            },
          }).arn,
        },
        resources: ['secrets'],
      },
      tags: {
        Name: `${CONFIG.project}-${region}-eks-cluster`,
        Project: CONFIG.project,
        Region: region,
      },
    });

    // Create OIDC provider for IRSA (IAM Roles for Service Accounts)
    const oidcProvider =
      new aws.iamOpenidConnectProvider.IamOpenidConnectProvider(
        this,
        `${id}-oidc`,
        {
          clientIdList: ['sts.amazonaws.com'],
          thumbprintList: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
          url: cluster.identity.get(0).oidc.get(0).issuer,
        }
      );

    // IAM role for node group
    const nodeRole = new aws.iamRole.IamRole(this, `${id}-node-role`, {
      name: `${CONFIG.project}-${region}-eks-node-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Project: CONFIG.project,
      },
    });

    // Attach required policies for node group
    const nodePolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    ];

    nodePolicies.forEach((policyArn, index) => {
      new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
        this,
        `${id}-node-policy-${index}`,
        {
          policyArn,
          role: nodeRole.name,
        }
      );
    });

    // Create managed node group with auto-scaling configuration
    const nodeGroup = new aws.eksNodeGroup.EksNodeGroup(
      this,
      `${id}-node-group`,
      {
        clusterName: cluster.name,
        nodeGroupName: `${CONFIG.project}-${region}-node-group`,
        nodeRoleArn: nodeRole.arn,
        subnetIds: vpcResources.privateSubnets.map(s => s.id),
        scalingConfig: {
          desiredSize: CONFIG.nodeGroup.desiredSize,
          maxSize: CONFIG.nodeGroup.maxSize,
          minSize: CONFIG.nodeGroup.minSize,
        },
        instanceTypes: CONFIG.nodeGroup.instanceTypes,
        diskSize: 100,
        amiType: 'AL2_x86_64',
        updateConfig: {
          maxUnavailable: 1,
        },
        labels: {
          environment: 'production',
          project: CONFIG.project,
          region: region,
        },
        tags: {
          Name: `${CONFIG.project}-${region}-node-group`,
          Project: CONFIG.project,
          Region: region,
        },
        dependsOn: [cluster],
      }
    );

    this.eksResources = {
      cluster,
      nodeGroup,
      oidcProvider,
    };
  }
}

/**
 * Custom Construct for AWS App Mesh
 * Implements service mesh for cross-region communication
 */
class AppMeshConstruct extends Construct {
  public readonly mesh: aws.appmeshMesh.AppmeshMesh;
  public readonly virtualGateway: aws.appmeshVirtualGateway.AppmeshVirtualGateway;

  constructor(scope: Construct, id: string, region: string) {
    super(scope, id);

    // Create App Mesh with egress filter for security
    this.mesh = new aws.appmeshMesh.AppmeshMesh(this, `${id}-mesh`, {
      name: `${CONFIG.serviceMesh.name}-${region}`,
      spec: {
        egressFilter: {
          type: 'ALLOW_ALL', // Change to DROP_ALL in production with explicit allow lists
        },
      },
      tags: {
        Name: `${CONFIG.serviceMesh.name}-${region}`,
        Project: CONFIG.project,
        Region: region,
      },
    });

    // Create Virtual Gateway for ingress traffic
    this.virtualGateway = new aws.appmeshVirtualGateway.AppmeshVirtualGateway(
      this,
      `${id}-vgw`,
      {
        name: `${CONFIG.project}-vgw-${region}`,
        meshName: this.mesh.name,
        spec: {
          listener: {
            portMapping: {
              port: 8080,
              protocol: 'http',
            },
          },
        },
        tags: {
          Name: `${CONFIG.project}-vgw-${region}`,
          Project: CONFIG.project,
        },
      }
    );

    // Create Virtual Node for trading service (example)
    const tradingVirtualNode = new aws.appmeshVirtualNode.AppmeshVirtualNode(
      this,
      `${id}-trading-vnode`,
      {
        name: `trading-service-${region}`,
        meshName: this.mesh.name,
        spec: {
          listener: {
            portMapping: {
              port: 8080,
              protocol: 'http',
            },
            healthCheck: {
              protocol: 'http',
              path: '/health',
              healthyThreshold: 2,
              unhealthyThreshold: 2,
              timeoutMillis: 2000,
              intervalMillis: 5000,
            },
          },
          serviceDiscovery: {
            dns: {
              hostname: `trading-service.${CONFIG.serviceMesh.namespace}.svc.cluster.local`,
            },
          },
          backend: {
            virtualService: {
              virtualServiceName: `market-data.${CONFIG.serviceMesh.namespace}.svc.cluster.local`,
            },
          },
        },
        tags: {
          Project: CONFIG.project,
        },
      }
    );

    // Create Virtual Router for traffic distribution
    const tradingRouter = new aws.appmeshVirtualRouter.AppmeshVirtualRouter(
      this,
      `${id}-trading-router`,
      {
        name: `trading-router-${region}`,
        meshName: this.mesh.name,
        spec: {
          listener: {
            portMapping: {
              port: 8080,
              protocol: 'http',
            },
          },
        },
        tags: {
          Project: CONFIG.project,
        },
      }
    );

    // Create Route with weighted targets for canary deployments
    new aws.appmeshRoute.AppmeshRoute(this, `${id}-trading-route`, {
      name: `trading-route-${region}`,
      meshName: this.mesh.name,
      virtualRouterName: tradingRouter.name,
      spec: {
        httpRoute: {
          match: {
            prefix: '/',
          },
          action: {
            weightedTarget: [
              {
                virtualNode: tradingVirtualNode.name,
                weight: 100,
              },
            ],
          },
          retryPolicy: {
            maxRetries: 3,
            perRetryTimeout: {
              value: 15,
              unit: 's',
            },
            httpRetryEvents: ['server-error', 'gateway-error'],
          },
        },
      },
      tags: {
        Project: CONFIG.project,
      },
    });

    // Create Virtual Service
    new aws.appmeshVirtualService.AppmeshVirtualService(
      this,
      `${id}-trading-vs`,
      {
        name: `trading-service.${CONFIG.serviceMesh.namespace}.svc.cluster.local`,
        meshName: this.mesh.name,
        spec: {
          provider: {
            virtualRouter: {
              virtualRouterName: tradingRouter.name,
            },
          },
        },
        tags: {
          Project: CONFIG.project,
        },
      }
    );
  }
}

/**
 * Custom Construct for Monitoring and Alerting
 * Implements CloudWatch monitoring for EKS and failover automation
 */
class MonitoringConstruct extends Construct {
  public readonly failoverLambda: aws.lambdaFunction.LambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    primaryCluster: aws.eksCluster.EksCluster,
    drCluster: aws.eksCluster.EksCluster
  ) {
    super(scope, id);

    // Create SNS topic for alerts
    const alertTopic = new aws.snsTopic.SnsTopic(this, `${id}-alert-topic`, {
      name: `${CONFIG.project}-eks-alerts`,
      tags: {
        Project: CONFIG.project,
      },
    });

    // Lambda execution role for failover automation
    const lambdaRole = new aws.iamRole.IamRole(this, `${id}-lambda-role`, {
      name: `${CONFIG.project}-failover-lambda-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      inlinePolicy: [
        {
          name: 'failover-policy',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'eks:*',
                  'route53:*',
                  'cloudwatch:*',
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: '*',
              },
            ],
          }),
        },
      ],
      tags: {
        Project: CONFIG.project,
      },
    });

    // Lambda function for automated failover
    this.failoverLambda = new aws.lambdaFunction.LambdaFunction(
      this,
      `${id}-failover-lambda`,
      {
        functionName: `${CONFIG.project}-eks-failover`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 900, // 15 minutes for RTO requirement
        environment: {
          variables: {
            PRIMARY_CLUSTER: primaryCluster.name,
            DR_CLUSTER: drCluster.name,
            PRIMARY_REGION: CONFIG.primaryRegion,
            DR_REGION: CONFIG.drRegion,
          },
        },
        filename: 'failover-lambda.zip',
        sourceCodeHash: Fn.filebase64sha256('failover-lambda.zip'),
        tags: {
          Project: CONFIG.project,
        },
      }
    );

    // CloudWatch Alarms for primary cluster
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      `${id}-primary-api-alarm`,
      {
        alarmName: `${CONFIG.project}-primary-eks-api-health`,
        alarmDescription: 'Alert when primary EKS API is unhealthy',
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: CONFIG.monitoring.evaluationPeriods,
        metricName: 'cluster_failed_node_count',
        namespace: 'ContainerInsights',
        period: CONFIG.monitoring.period,
        statistic: 'Sum',
        threshold: CONFIG.monitoring.threshold,
        treatMissingData: 'breaching',
        dimensions: {
          ClusterName: primaryCluster.name,
        },
        alarmActions: [alertTopic.arn],
        tags: {
          Project: CONFIG.project,
        },
      }
    );

    // CloudWatch Alarm for node group health
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      `${id}-primary-nodes-alarm`,
      {
        alarmName: `${CONFIG.project}-primary-node-health`,
        alarmDescription:
          'Alert when primary node group has insufficient healthy nodes',
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: CONFIG.monitoring.evaluationPeriods,
        metricName: 'node_cpu_utilization',
        namespace: 'ContainerInsights',
        period: CONFIG.monitoring.period,
        statistic: 'Average',
        threshold: 90, // CPU threshold
        dimensions: {
          ClusterName: primaryCluster.name,
        },
        alarmActions: [alertTopic.arn],
        tags: {
          Project: CONFIG.project,
        },
      }
    );

    // Create CloudWatch Dashboard
    new aws.cloudwatchDashboard.CloudwatchDashboard(this, `${id}-dashboard`, {
      dashboardName: `${CONFIG.project}-eks-dr-dashboard`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'ContainerInsights',
                  'cluster_node_count',
                  { stat: 'Average', label: 'Primary Nodes' },
                ],
                [
                  'ContainerInsights',
                  'cluster_failed_node_count',
                  { stat: 'Sum', label: 'Failed Nodes' },
                ],
              ],
              period: 300,
              stat: 'Average',
              region: CONFIG.primaryRegion,
              title: 'EKS Cluster Health',
            },
          },
        ],
      }),
    });
  }
}

/**
 * Custom Construct for Route53 DNS Failover
 * Implements global DNS with health checks and automatic failover
 */
class Route53FailoverConstruct extends Construct {
  public readonly failoverDNS: string;

  constructor(
    scope: Construct,
    id: string,
    primaryEndpoint: string,
    drEndpoint: string,
    zoneName: string
  ) {
    super(scope, id);

    // Create hosted zone for DNS management
    const hostedZone = new aws.route53Zone.Route53Zone(this, `${id}-zone`, {
      name: zoneName,
      tags: {
        Project: CONFIG.project,
      },
    });

    // Health check for primary region
    const primaryHealthCheck = new aws.route53HealthCheck.Route53HealthCheck(
      this,
      `${id}-primary-health`,
      {
        fqdn: primaryEndpoint,
        port: 443,
        type: 'HTTPS',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        measureLatency: true,
        tags: {
          Name: `${CONFIG.project}-primary-health-check`,
          Project: CONFIG.project,
        },
      }
    );

    // Health check for DR region
    const drHealthCheck = new aws.route53HealthCheck.Route53HealthCheck(
      this,
      `${id}-dr-health`,
      {
        fqdn: drEndpoint,
        port: 443,
        type: 'HTTPS',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        measureLatency: true,
        tags: {
          Name: `${CONFIG.project}-dr-health-check`,
          Project: CONFIG.project,
        },
      }
    );

    // Primary record with failover routing
    new aws.route53Record.Route53Record(this, `${id}-primary-record`, {
      zoneId: hostedZone.zoneId,
      name: `api.${zoneName}`,
      type: 'A',
      ttl: 60, // Low TTL for fast failover
      records: [primaryEndpoint],
      setIdentifier: 'Primary',
      failoverRoutingPolicy: {
        type: 'PRIMARY',
      },
      healthCheckId: primaryHealthCheck.id,
    });

    // DR record with failover routing
    new aws.route53Record.Route53Record(this, `${id}-dr-record`, {
      zoneId: hostedZone.zoneId,
      name: `api.${zoneName}`,
      type: 'A',
      ttl: 60,
      records: [drEndpoint],
      setIdentifier: 'DR',
      failoverRoutingPolicy: {
        type: 'SECONDARY',
      },
      healthCheckId: drHealthCheck.id,
    });

    this.failoverDNS = `api.${zoneName}`;
  }
}

/**
 * Main CDKTF Stack
 * Orchestrates all infrastructure components for multi-region EKS DR
 */
class MultiRegionEKSDRStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS providers for both regions
    const primaryProvider = new aws.provider.AwsProvider(this, 'aws-primary', {
      region: CONFIG.primaryRegion,
      defaultTags: [
        {
          tags: {
            Environment: 'Production',
            ManagedBy: 'CDKTF',
            Project: CONFIG.project,
          },
        },
      ],
    });

    const drProvider = new aws.provider.AwsProvider(this, 'aws-dr', {
      region: CONFIG.drRegion,
      alias: 'dr',
      defaultTags: [
        {
          tags: {
            Environment: 'DR',
            ManagedBy: 'CDKTF',
            Project: CONFIG.project,
          },
        },
      ],
    });

    // Get current AWS account ID
    const callerIdentity = new DataAwsCallerIdentity(this, 'current');

    // Deploy networking infrastructure in both regions
    const primaryNetwork = new NetworkingConstruct(
      this,
      'primary-network',
      CONFIG.primaryRegion,
      CONFIG.primaryCidr
    );

    const drNetwork = new NetworkingConstruct(
      this,
      'dr-network',
      CONFIG.drRegion,
      CONFIG.drCidr
    );

    // Deploy EKS clusters in both regions
    const primaryEKS = new EKSClusterConstruct(
      this,
      'primary-eks',
      CONFIG.primaryRegion,
      primaryNetwork.vpcResources
    );

    const drEKS = new EKSClusterConstruct(
      this,
      'dr-eks',
      CONFIG.drRegion,
      drNetwork.vpcResources
    );

    // Deploy App Mesh in both regions for service mesh capabilities
    const primaryMesh = new AppMeshConstruct(
      this,
      'primary-mesh',
      CONFIG.primaryRegion
    );

    const drMesh = new AppMeshConstruct(this, 'dr-mesh', CONFIG.drRegion);

    // Setup VPC Peering for cross-region communication
    const vpcPeering = new aws.vpcPeeringConnection.VpcPeeringConnection(
      this,
      'cross-region-peering',
      {
        vpcId: primaryNetwork.vpcResources.vpc.id,
        peerVpcId: drNetwork.vpcResources.vpc.id,
        peerRegion: CONFIG.drRegion,
        autoAccept: false, // Must be accepted in DR region
        tags: {
          Name: `${CONFIG.project}-cross-region-peering`,
          Project: CONFIG.project,
        },
      }
    );

    // Accept peering in DR region
    const peeringAccepter =
      new aws.vpcPeeringConnectionAccepter.VpcPeeringConnectionAccepter(
        this,
        'peering-accepter',
        {
          provider: drProvider,
          vpcPeeringConnectionId: vpcPeering.id,
          autoAccept: true,
          tags: {
            Name: `${CONFIG.project}-peering-accepter`,
            Project: CONFIG.project,
          },
        }
      );

    // Add routes for VPC peering
    new aws.route.Route(this, 'primary-to-dr-route', {
      routeTableId: primaryNetwork.vpcResources.privateSubnets[0].id,
      destinationCidrBlock: CONFIG.drCidr,
      vpcPeeringConnectionId: vpcPeering.id,
    });

    new aws.route.Route(this, 'dr-to-primary-route', {
      provider: drProvider,
      routeTableId: drNetwork.vpcResources.privateSubnets[0].id,
      destinationCidrBlock: CONFIG.primaryCidr,
      vpcPeeringConnectionId: vpcPeering.id,
    });

    // Setup monitoring and alerting
    const monitoring = new MonitoringConstruct(
      this,
      'monitoring',
      primaryEKS.eksResources.cluster,
      drEKS.eksResources.cluster
    );

    // Setup Route53 DNS failover (example endpoints - replace with actual ALB/NLB endpoints)
    const route53Failover = new Route53FailoverConstruct(
      this,
      'dns-failover',
      'primary.example.com', // Replace with actual primary endpoint
      'dr.example.com', // Replace with actual DR endpoint
      'trading-platform.example.com'
    );

    // Create Global Accelerator for ultra-low latency (optional enhancement)
    const globalAccelerator =
      new aws.globalacceleratorAccelerator.GlobalacceleratorAccelerator(
        this,
        'global-accelerator',
        {
          name: `${CONFIG.project}-accelerator`,
          ipAddressType: 'IPV4',
          enabled: true,
          attributes: {
            flowLogsEnabled: true,
            flowLogsS3Bucket: new aws.s3Bucket.S3Bucket(
              this,
              'flow-logs-bucket',
              {
                bucket: `${CONFIG.project}-flow-logs-${callerIdentity.accountId}`,
                tags: {
                  Project: CONFIG.project,
                },
              }
            ).id,
            flowLogsS3Prefix: 'flow-logs/',
          },
          tags: {
            Project: CONFIG.project,
          },
        }
      );

    // Outputs for reference
    new TerraformOutput(this, 'PrimaryEKSClusterName', {
      value: primaryEKS.eksResources.cluster.name,
      description: 'Name of the primary EKS cluster',
    });

    new TerraformOutput(this, 'DREKSClusterName', {
      value: drEKS.eksResources.cluster.name,
      description: 'Name of the DR EKS cluster',
    });

    new TerraformOutput(this, 'Route53FailoverDNS', {
      value: route53Failover.failoverDNS,
      description: 'Route53 DNS endpoint with automatic failover',
    });

    new TerraformOutput(this, 'AppMeshName', {
      value: primaryMesh.mesh.name,
      description: 'Name of the App Mesh service mesh',
    });

    new TerraformOutput(this, 'PrimaryVPCId', {
      value: primaryNetwork.vpcResources.vpc.id,
      description: 'VPC ID of the primary region',
    });

    new TerraformOutput(this, 'DRVPCId', {
      value: drNetwork.vpcResources.vpc.id,
      description: 'VPC ID of the DR region',
    });

    new TerraformOutput(this, 'GlobalAcceleratorDNS', {
      value: globalAccelerator.dnsName,
      description: 'Global Accelerator DNS name for ultra-low latency access',
    });
  }
}

// App initialization
const app = new App();
new MultiRegionEKSDRStack(app, 'multi-region-eks-dr');
app.synth();
```
