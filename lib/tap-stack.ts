/**
 * tap-stack.ts
 *
 * Creates EKS cluster using native AWS resources in eu-west-2 (London)
 * Uses nginx demo images for testing
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  paymentApiImage?: string;
  fraudDetectorImage?: string;
  notificationServiceImage?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly namespaceName: pulumi.Output<string>;
  public readonly gatewayUrl: pulumi.Output<string>;
  public readonly paymentApiEndpoint: pulumi.Output<string>;
  public readonly fraudDetectorEndpoint: pulumi.Output<string>;
  public readonly notificationServiceEndpoint: pulumi.Output<string>;
  public readonly hpaStatus: pulumi.Output<any>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Create explicit AWS provider for eu-west-2 (London)
    const awsProvider = new aws.Provider(
      `aws-provider-${environmentSuffix}`,
      {
        region: 'eu-west-2',
      },
      { parent: this }
    );

    // Use nginx as default - publicly available and works without authentication
    const paymentApiImage = args.paymentApiImage || 'nginx:1.25-alpine';
    const fraudDetectorImage = args.fraudDetectorImage || 'nginx:1.25-alpine';
    const notificationServiceImage =
      args.notificationServiceImage || 'nginx:1.25-alpine';

    // Create VPC for EKS cluster
    const vpc = new aws.ec2.Vpc(
      `eks-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `eks-vpc-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `eks-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `eks-igw-${environmentSuffix}`,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create public subnets in two availability zones
    const publicSubnet1 = new aws.ec2.Subnet(
      `eks-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'eu-west-2a',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `eks-public-subnet-1-${environmentSuffix}`,
          'kubernetes.io/role/elb': '1',
          [`kubernetes.io/cluster/eks-cluster-${environmentSuffix}`]: 'shared',
        },
      },
      { parent: this, provider: awsProvider }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `eks-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'eu-west-2b',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `eks-public-subnet-2-${environmentSuffix}`,
          'kubernetes.io/role/elb': '1',
          [`kubernetes.io/cluster/eks-cluster-${environmentSuffix}`]: 'shared',
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `eks-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `eks-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create route to internet gateway
    new aws.ec2.Route(
      `eks-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this, provider: awsProvider }
    );

    // Associate route table with public subnets
    new aws.ec2.RouteTableAssociation(
      `eks-rt-assoc-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this, provider: awsProvider }
    );

    new aws.ec2.RouteTableAssociation(
      `eks-rt-assoc-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this, provider: awsProvider }
    );

    // Create IAM role for EKS cluster
    const eksRole = new aws.iam.Role(
      `eks-cluster-role-${environmentSuffix}`,
      {
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
      },
      { parent: this, provider: awsProvider }
    );

    // Attach required policies to EKS cluster role
    new aws.iam.RolePolicyAttachment(
      `eks-cluster-policy-${environmentSuffix}`,
      {
        role: eksRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      },
      { parent: this, provider: awsProvider }
    );

    // Create security group for EKS cluster
    const clusterSecurityGroup = new aws.ec2.SecurityGroup(
      `eks-cluster-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'EKS cluster security group',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `eks-cluster-sg-${environmentSuffix}`,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create EKS cluster
    const cluster = new aws.eks.Cluster(
      `eks-cluster-${environmentSuffix}`,
      {
        name: `eks-cluster-${environmentSuffix}`,
        roleArn: eksRole.arn,
        vpcConfig: {
          subnetIds: [publicSubnet1.id, publicSubnet2.id],
          securityGroupIds: [clusterSecurityGroup.id],
          endpointPublicAccess: true,
          endpointPrivateAccess: false,
        },
        version: '1.28',
        tags: {
          Name: `eks-cluster-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: awsProvider, dependsOn: [eksRole] }
    );

    // Create IAM role for node group
    const nodeRole = new aws.iam.Role(
      `eks-node-role-${environmentSuffix}`,
      {
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
      },
      { parent: this, provider: awsProvider }
    );

    // Attach required policies to node role
    new aws.iam.RolePolicyAttachment(
      `eks-worker-node-policy-${environmentSuffix}`,
      {
        role: nodeRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      },
      { parent: this, provider: awsProvider }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cni-policy-${environmentSuffix}`,
      {
        role: nodeRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      },
      { parent: this, provider: awsProvider }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-container-registry-policy-${environmentSuffix}`,
      {
        role: nodeRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      },
      { parent: this, provider: awsProvider }
    );

    // Create EKS node group
    const nodeGroup = new aws.eks.NodeGroup(
      `eks-node-group-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        nodeGroupName: `eks-node-group-${environmentSuffix}`,
        nodeRoleArn: nodeRole.arn,
        subnetIds: [publicSubnet1.id, publicSubnet2.id],
        scalingConfig: {
          desiredSize: 2,
          minSize: 2,
          maxSize: 4,
        },
        instanceTypes: ['t3.medium'],
        tags: {
          Name: `eks-node-group-${environmentSuffix}`,
        },
      },
      { parent: this, provider: awsProvider, dependsOn: [cluster, nodeRole] }
    );

    // Generate kubeconfig
    const kubeconfig = pulumi
      .all([cluster.name, cluster.endpoint, cluster.certificateAuthority])
      .apply(([clusterName, endpoint, certAuth]) =>
        JSON.stringify({
          apiVersion: 'v1',
          kind: 'Config',
          clusters: [
            {
              cluster: {
                server: endpoint,
                'certificate-authority-data': certAuth.data,
              },
              name: 'kubernetes',
            },
          ],
          contexts: [
            {
              context: {
                cluster: 'kubernetes',
                user: 'aws',
              },
              name: 'aws',
            },
          ],
          'current-context': 'aws',
          users: [
            {
              name: 'aws',
              user: {
                exec: {
                  apiVersion: 'client.authentication.k8s.io/v1beta1',
                  command: 'aws',
                  args: [
                    'eks',
                    'get-token',
                    '--cluster-name',
                    clusterName,
                    '--region',
                    'eu-west-2',
                  ],
                },
              },
            },
          ],
        })
      );

    // Create explicit Kubernetes provider
    const k8sProvider = new k8s.Provider(
      `k8s-provider-${environmentSuffix}`,
      {
        kubeconfig: kubeconfig,
        enableServerSideApply: true,
      },
      { parent: this, dependsOn: [nodeGroup] }
    );

    // Kubernetes namespace - no Istio injection
    const namespace = new k8s.core.v1.Namespace(
      'microservices-ns',
      {
        metadata: {
          name: `microservices-${environmentSuffix}`,
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // ConfigMaps
    const paymentApiConfigMap = new k8s.core.v1.ConfigMap(
      'payment-api-config',
      {
        metadata: {
          name: `payment-api-config-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        data: {
          FRAUD_DETECTOR_URL: pulumi.interpolate`http://fraud-detector-service-${environmentSuffix}.${namespace.metadata.name}.svc.cluster.local:8080`,
          FEATURE_FLAG_ENABLE_FRAUD_CHECK: 'true',
          FEATURE_FLAG_ENABLE_LOGGING: 'true',
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const fraudDetectorConfigMap = new k8s.core.v1.ConfigMap(
      'fraud-detector-config',
      {
        metadata: {
          name: `fraud-detector-config-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        data: {
          NOTIFICATION_SERVICE_URL: pulumi.interpolate`http://notification-service-${environmentSuffix}.${namespace.metadata.name}.svc.cluster.local:8080`,
          FEATURE_FLAG_ML_ENABLED: 'true',
          FEATURE_FLAG_REALTIME_ALERTS: 'true',
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const notificationServiceConfigMap = new k8s.core.v1.ConfigMap(
      'notification-service-config',
      {
        metadata: {
          name: `notification-service-config-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        data: {
          FEATURE_FLAG_EMAIL_ENABLED: 'true',
          FEATURE_FLAG_SMS_ENABLED: 'true',
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // Secrets - Updated to eu-west-2 region
    const paymentApiSecret = new k8s.core.v1.Secret(
      'payment-api-secret',
      {
        metadata: {
          name: `payment-api-secret-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        type: 'Opaque',
        stringData: {
          DB_CONNECTION_STRING:
            'postgresql://user:pass@payment-db.cluster.eu-west-2.rds.amazonaws.com:5432/payments',
          STRIPE_API_KEY: 'sk_test_placeholder',
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const fraudDetectorSecret = new k8s.core.v1.Secret(
      'fraud-detector-secret',
      {
        metadata: {
          name: `fraud-detector-secret-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        type: 'Opaque',
        stringData: {
          DB_CONNECTION_STRING:
            'postgresql://user:pass@fraud-db.cluster.eu-west-2.rds.amazonaws.com:5432/fraud',
          ML_API_KEY: 'ml_api_placeholder',
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const notificationServiceSecret = new k8s.core.v1.Secret(
      'notification-service-secret',
      {
        metadata: {
          name: `notification-service-secret-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        type: 'Opaque',
        stringData: {
          DB_CONNECTION_STRING:
            'postgresql://user:pass@notification-db.cluster.eu-west-2.rds.amazonaws.com:5432/notifications',
          TWILIO_API_KEY: 'twilio_placeholder',
          SENDGRID_API_KEY: 'sendgrid_placeholder',
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // Payment API Deployment
    const paymentApiDeployment = new k8s.apps.v1.Deployment(
      'payment-api',
      {
        metadata: {
          name: `payment-api-${environmentSuffix}`,
          namespace: namespace.metadata.name,
          labels: {
            app: 'payment-api',
            'app.kubernetes.io/name': 'payment-api',
            'app.kubernetes.io/component': 'backend',
          },
        },
        spec: {
          replicas: 2,
          selector: {
            matchLabels: {
              app: 'payment-api',
              version: 'v1',
            },
          },
          template: {
            metadata: {
              labels: {
                app: 'payment-api',
                version: 'v1',
              },
            },
            spec: {
              containers: [
                {
                  name: 'payment-api',
                  image: paymentApiImage,
                  ports: [
                    {
                      containerPort: 80,
                      name: 'http',
                      protocol: 'TCP',
                    },
                  ],
                  envFrom: [
                    {
                      configMapRef: {
                        name: paymentApiConfigMap.metadata.name,
                      },
                    },
                    {
                      secretRef: {
                        name: paymentApiSecret.metadata.name,
                      },
                    },
                  ],
                  resources: {
                    requests: {
                      cpu: '100m',
                      memory: '128Mi',
                    },
                    limits: {
                      cpu: '200m',
                      memory: '256Mi',
                    },
                  },
                },
              ],
            },
          },
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // Fraud Detector Deployment
    const fraudDetectorDeployment = new k8s.apps.v1.Deployment(
      'fraud-detector',
      {
        metadata: {
          name: `fraud-detector-${environmentSuffix}`,
          namespace: namespace.metadata.name,
          labels: {
            app: 'fraud-detector',
            'app.kubernetes.io/name': 'fraud-detector',
            'app.kubernetes.io/component': 'ml-service',
          },
        },
        spec: {
          replicas: 2,
          selector: {
            matchLabels: {
              app: 'fraud-detector',
              version: 'v1',
            },
          },
          template: {
            metadata: {
              labels: {
                app: 'fraud-detector',
                version: 'v1',
              },
            },
            spec: {
              containers: [
                {
                  name: 'fraud-detector',
                  image: fraudDetectorImage,
                  ports: [
                    {
                      containerPort: 80,
                      name: 'http',
                      protocol: 'TCP',
                    },
                  ],
                  envFrom: [
                    {
                      configMapRef: {
                        name: fraudDetectorConfigMap.metadata.name,
                      },
                    },
                    {
                      secretRef: {
                        name: fraudDetectorSecret.metadata.name,
                      },
                    },
                  ],
                  resources: {
                    requests: {
                      cpu: '100m',
                      memory: '128Mi',
                    },
                    limits: {
                      cpu: '200m',
                      memory: '256Mi',
                    },
                  },
                },
              ],
            },
          },
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // Notification Service Deployment
    const notificationServiceDeployment = new k8s.apps.v1.Deployment(
      'notification-service',
      {
        metadata: {
          name: `notification-service-${environmentSuffix}`,
          namespace: namespace.metadata.name,
          labels: {
            app: 'notification-service',
            'app.kubernetes.io/name': 'notification-service',
            'app.kubernetes.io/component': 'notification',
          },
        },
        spec: {
          replicas: 2,
          selector: {
            matchLabels: {
              app: 'notification-service',
              version: 'v1',
            },
          },
          template: {
            metadata: {
              labels: {
                app: 'notification-service',
                version: 'v1',
              },
            },
            spec: {
              containers: [
                {
                  name: 'notification-service',
                  image: notificationServiceImage,
                  ports: [
                    {
                      containerPort: 80,
                      name: 'http',
                      protocol: 'TCP',
                    },
                  ],
                  envFrom: [
                    {
                      configMapRef: {
                        name: notificationServiceConfigMap.metadata.name,
                      },
                    },
                    {
                      secretRef: {
                        name: notificationServiceSecret.metadata.name,
                      },
                    },
                  ],
                  resources: {
                    requests: {
                      cpu: '100m',
                      memory: '128Mi',
                    },
                    limits: {
                      cpu: '200m',
                      memory: '256Mi',
                    },
                  },
                },
              ],
            },
          },
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // Kubernetes Services
    const paymentApiService = new k8s.core.v1.Service(
      'payment-api-service',
      {
        metadata: {
          name: `payment-api-service-${environmentSuffix}`,
          namespace: namespace.metadata.name,
          labels: {
            app: 'payment-api',
          },
        },
        spec: {
          selector: {
            app: 'payment-api',
          },
          type: 'ClusterIP',
          ports: [
            {
              port: 8080,
              targetPort: 80,
              name: 'http',
              protocol: 'TCP',
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const fraudDetectorService = new k8s.core.v1.Service(
      'fraud-detector-service',
      {
        metadata: {
          name: `fraud-detector-service-${environmentSuffix}`,
          namespace: namespace.metadata.name,
          labels: {
            app: 'fraud-detector',
          },
        },
        spec: {
          selector: {
            app: 'fraud-detector',
          },
          type: 'ClusterIP',
          ports: [
            {
              port: 8080,
              targetPort: 80,
              name: 'http',
              protocol: 'TCP',
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const notificationService = new k8s.core.v1.Service(
      'notification-service',
      {
        metadata: {
          name: `notification-service-${environmentSuffix}`,
          namespace: namespace.metadata.name,
          labels: {
            app: 'notification-service',
          },
        },
        spec: {
          selector: {
            app: 'notification-service',
          },
          type: 'ClusterIP',
          ports: [
            {
              port: 8080,
              targetPort: 80,
              name: 'http',
              protocol: 'TCP',
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // Gateway LoadBalancer Service - points directly to payment-api
    const gatewayService = new k8s.core.v1.Service(
      'gateway-loadbalancer',
      {
        metadata: {
          name: `gateway-lb-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          type: 'LoadBalancer',
          selector: {
            app: 'payment-api',
          },
          ports: [
            {
              port: 80,
              targetPort: 80,
              name: 'http',
              protocol: 'TCP',
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // HorizontalPodAutoscalers
    const paymentApiHpa = new k8s.autoscaling.v2.HorizontalPodAutoscaler(
      'payment-api-hpa',
      {
        metadata: {
          name: `payment-api-hpa-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          scaleTargetRef: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: paymentApiDeployment.metadata.name,
          },
          minReplicas: 2,
          maxReplicas: 10,
          metrics: [
            {
              type: 'Resource',
              resource: {
                name: 'cpu',
                target: {
                  type: 'Utilization',
                  averageUtilization: 50,
                },
              },
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const fraudDetectorHpa = new k8s.autoscaling.v2.HorizontalPodAutoscaler(
      'fraud-detector-hpa',
      {
        metadata: {
          name: `fraud-detector-hpa-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          scaleTargetRef: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: fraudDetectorDeployment.metadata.name,
          },
          minReplicas: 2,
          maxReplicas: 10,
          metrics: [
            {
              type: 'Resource',
              resource: {
                name: 'cpu',
                target: {
                  type: 'Utilization',
                  averageUtilization: 50,
                },
              },
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const notificationServiceHpa =
      new k8s.autoscaling.v2.HorizontalPodAutoscaler(
        'notification-service-hpa',
        {
          metadata: {
            name: `notification-service-hpa-${environmentSuffix}`,
            namespace: namespace.metadata.name,
          },
          spec: {
            scaleTargetRef: {
              apiVersion: 'apps/v1',
              kind: 'Deployment',
              name: notificationServiceDeployment.metadata.name,
            },
            minReplicas: 2,
            maxReplicas: 10,
            metrics: [
              {
                type: 'Resource',
                resource: {
                  name: 'cpu',
                  target: {
                    type: 'Utilization',
                    averageUtilization: 50,
                  },
                },
              },
            ],
          },
        },
        { parent: this, provider: k8sProvider }
      );

    // Network Policies - simplified without Istio
    const paymentApiNetworkPolicy = new k8s.networking.v1.NetworkPolicy(
      'payment-api-netpol',
      {
        metadata: {
          name: `payment-api-netpol-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          podSelector: {
            matchLabels: {
              app: 'payment-api',
            },
          },
          policyTypes: ['Ingress', 'Egress'],
          ingress: [
            {
              from: [],
              ports: [
                {
                  protocol: 'TCP',
                  port: 80,
                },
              ],
            },
          ],
          egress: [
            {
              to: [
                {
                  podSelector: {
                    matchLabels: {
                      app: 'fraud-detector',
                    },
                  },
                },
              ],
              ports: [
                {
                  protocol: 'TCP',
                  port: 80,
                },
              ],
            },
            {
              to: [
                {
                  namespaceSelector: {},
                },
              ],
              ports: [
                {
                  protocol: 'TCP',
                  port: 53,
                },
                {
                  protocol: 'UDP',
                  port: 53,
                },
              ],
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const fraudDetectorNetworkPolicy = new k8s.networking.v1.NetworkPolicy(
      'fraud-detector-netpol',
      {
        metadata: {
          name: `fraud-detector-netpol-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          podSelector: {
            matchLabels: {
              app: 'fraud-detector',
            },
          },
          policyTypes: ['Ingress', 'Egress'],
          ingress: [
            {
              from: [
                {
                  podSelector: {
                    matchLabels: {
                      app: 'payment-api',
                    },
                  },
                },
              ],
              ports: [
                {
                  protocol: 'TCP',
                  port: 80,
                },
              ],
            },
          ],
          egress: [
            {
              to: [
                {
                  podSelector: {
                    matchLabels: {
                      app: 'notification-service',
                    },
                  },
                },
              ],
              ports: [
                {
                  protocol: 'TCP',
                  port: 80,
                },
              ],
            },
            {
              to: [
                {
                  namespaceSelector: {},
                },
              ],
              ports: [
                {
                  protocol: 'TCP',
                  port: 53,
                },
                {
                  protocol: 'UDP',
                  port: 53,
                },
              ],
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const notificationServiceNetworkPolicy =
      new k8s.networking.v1.NetworkPolicy(
        'notification-service-netpol',
        {
          metadata: {
            name: `notification-service-netpol-${environmentSuffix}`,
            namespace: namespace.metadata.name,
          },
          spec: {
            podSelector: {
              matchLabels: {
                app: 'notification-service',
              },
            },
            policyTypes: ['Ingress', 'Egress'],
            ingress: [
              {
                from: [
                  {
                    podSelector: {
                      matchLabels: {
                        app: 'fraud-detector',
                      },
                    },
                  },
                ],
                ports: [
                  {
                    protocol: 'TCP',
                    port: 80,
                  },
                ],
              },
            ],
            egress: [
              {
                to: [
                  {
                    namespaceSelector: {},
                  },
                ],
                ports: [
                  {
                    protocol: 'TCP',
                    port: 53,
                  },
                  {
                    protocol: 'UDP',
                    port: 53,
                  },
                ],
              },
            ],
          },
        },
        { parent: this, provider: k8sProvider }
      );

    // Mark resources as used to satisfy linter
    void paymentApiNetworkPolicy;
    void fraudDetectorNetworkPolicy;
    void notificationServiceNetworkPolicy;

    // Set outputs
    this.clusterName = cluster.name;
    this.kubeconfig = kubeconfig;
    this.namespaceName = namespace.metadata.name;
    this.gatewayUrl = pulumi.interpolate`http://${gatewayService.status.loadBalancer.ingress[0].hostname}`;
    this.paymentApiEndpoint = pulumi.interpolate`http://${paymentApiService.metadata.name}.${namespace.metadata.name}.svc.cluster.local:8080`;
    this.fraudDetectorEndpoint = pulumi.interpolate`http://${fraudDetectorService.metadata.name}.${namespace.metadata.name}.svc.cluster.local:8080`;
    this.notificationServiceEndpoint = pulumi.interpolate`http://${notificationService.metadata.name}.${namespace.metadata.name}.svc.cluster.local:8080`;
    this.hpaStatus = pulumi
      .all([
        paymentApiHpa.metadata.name,
        fraudDetectorHpa.metadata.name,
        notificationServiceHpa.metadata.name,
      ])
      .apply(([payment, fraud, notification]) => ({
        paymentApiHpa: payment,
        fraudDetectorHpa: fraud,
        notificationServiceHpa: notification,
      }));

    this.registerOutputs({
      clusterName: this.clusterName,
      kubeconfig: this.kubeconfig,
      namespaceName: this.namespaceName,
      gatewayUrl: this.gatewayUrl,
      paymentApiEndpoint: this.paymentApiEndpoint,
      fraudDetectorEndpoint: this.fraudDetectorEndpoint,
      notificationServiceEndpoint: this.notificationServiceEndpoint,
      hpaStatus: this.hpaStatus,
    });
  }
}
