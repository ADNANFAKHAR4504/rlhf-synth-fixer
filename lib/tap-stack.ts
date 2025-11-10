/**
 * tap-stack.ts
 *
 * This module defines the TapStack class for deploying a microservices architecture
 * on Kubernetes with Istio service mesh integration.
 *
 * Now includes EKS cluster creation for proper Kubernetes provider configuration.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  paymentApiImage?: string;
  fraudDetectorImage?: string;
  notificationServiceImage?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for deploying microservices on Kubernetes.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly namespaceName: pulumi.Output<string>;
  public readonly gatewayUrl: pulumi.Output<string>;
  public readonly paymentApiEndpoint: pulumi.Output<string>;
  public readonly fraudDetectorEndpoint: pulumi.Output<string>;
  public readonly notificationServiceEndpoint: pulumi.Output<string>;
  public readonly hpaStatus: pulumi.Output<any>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<any>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Updated to eu-west-2 (London) region
    const paymentApiImage =
      args.paymentApiImage ||
      '123456789012.dkr.ecr.eu-west-2.amazonaws.com/payment-api:latest';
    const fraudDetectorImage =
      args.fraudDetectorImage ||
      '123456789012.dkr.ecr.eu-west-2.amazonaws.com/fraud-detector:latest';
    const notificationServiceImage =
      args.notificationServiceImage ||
      '123456789012.dkr.ecr.eu-west-2.amazonaws.com/notification-service:latest';

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
      { parent: this }
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
      { parent: this }
    );

    // Create public subnets in two availability zones for high availability
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
        },
      },
      { parent: this }
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
        },
      },
      { parent: this }
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
      { parent: this }
    );

    // Create route to internet gateway
    const publicRoute = new aws.ec2.Route(
      `eks-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate route table with public subnets
    const rtAssoc1 = new aws.ec2.RouteTableAssociation(
      `eks-rt-assoc-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    const rtAssoc2 = new aws.ec2.RouteTableAssociation(
      `eks-rt-assoc-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    // Mark resources as used
    void publicRoute;
    void rtAssoc1;
    void rtAssoc2;

    // Create EKS Cluster
    const cluster = new eks.Cluster(
      `eks-cluster-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        publicSubnetIds: [publicSubnet1.id, publicSubnet2.id],
        privateSubnetIds: [],
        instanceType: 't3.medium',
        desiredCapacity: 2,
        minSize: 2,
        maxSize: 4,
        version: '1.28',
        enabledClusterLogTypes: [
          'api',
          'audit',
          'authenticator',
          'controllerManager',
          'scheduler',
        ],
        tags: {
          Name: `eks-cluster-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create explicit Kubernetes provider using the cluster's kubeconfig
    const k8sProvider = new k8s.Provider(
      `k8s-provider-${environmentSuffix}`,
      {
        kubeconfig: cluster.kubeconfig.apply(JSON.stringify),
        enableServerSideApply: true,
      },
      { parent: this }
    );

    // Kubernetes namespace
    const namespace = new k8s.core.v1.Namespace(
      'microservices-ns',
      {
        metadata: {
          name: `microservices-${environmentSuffix}`,
          labels: {
            'istio-injection': 'enabled',
          },
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // ConfigMaps for each service
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

    // Secrets for each service - Updated to eu-west-2 region
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
              annotations: {
                'sidecar.istio.io/inject': 'true',
              },
            },
            spec: {
              containers: [
                {
                  name: 'payment-api',
                  image: paymentApiImage,
                  ports: [
                    {
                      containerPort: 8080,
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
                      cpu: '250m',
                      memory: '512Mi',
                    },
                    limits: {
                      cpu: '500m',
                      memory: '1Gi',
                    },
                  },
                  livenessProbe: {
                    httpGet: {
                      path: '/health',
                      port: 8080,
                    },
                    initialDelaySeconds: 30,
                    periodSeconds: 10,
                    timeoutSeconds: 5,
                    failureThreshold: 3,
                  },
                  readinessProbe: {
                    httpGet: {
                      path: '/ready',
                      port: 8080,
                    },
                    initialDelaySeconds: 10,
                    periodSeconds: 5,
                    timeoutSeconds: 3,
                    failureThreshold: 3,
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
              annotations: {
                'sidecar.istio.io/inject': 'true',
              },
            },
            spec: {
              containers: [
                {
                  name: 'fraud-detector',
                  image: fraudDetectorImage,
                  ports: [
                    {
                      containerPort: 8080,
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
                      cpu: '250m',
                      memory: '512Mi',
                    },
                    limits: {
                      cpu: '500m',
                      memory: '1Gi',
                    },
                  },
                  livenessProbe: {
                    httpGet: {
                      path: '/health',
                      port: 8080,
                    },
                    initialDelaySeconds: 30,
                    periodSeconds: 10,
                    timeoutSeconds: 5,
                    failureThreshold: 3,
                  },
                  readinessProbe: {
                    httpGet: {
                      path: '/ready',
                      port: 8080,
                    },
                    initialDelaySeconds: 10,
                    periodSeconds: 5,
                    timeoutSeconds: 3,
                    failureThreshold: 3,
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
              annotations: {
                'sidecar.istio.io/inject': 'true',
              },
            },
            spec: {
              containers: [
                {
                  name: 'notification-service',
                  image: notificationServiceImage,
                  ports: [
                    {
                      containerPort: 8080,
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
                      cpu: '250m',
                      memory: '512Mi',
                    },
                    limits: {
                      cpu: '500m',
                      memory: '1Gi',
                    },
                  },
                  livenessProbe: {
                    httpGet: {
                      path: '/health',
                      port: 8080,
                    },
                    initialDelaySeconds: 30,
                    periodSeconds: 10,
                    timeoutSeconds: 5,
                    failureThreshold: 3,
                  },
                  readinessProbe: {
                    httpGet: {
                      path: '/ready',
                      port: 8080,
                    },
                    initialDelaySeconds: 10,
                    periodSeconds: 5,
                    timeoutSeconds: 3,
                    failureThreshold: 3,
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
              targetPort: 8080,
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
              targetPort: 8080,
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
              targetPort: 8080,
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
          behavior: {
            scaleDown: {
              stabilizationWindowSeconds: 300,
              policies: [
                {
                  type: 'Percent',
                  value: 50,
                  periodSeconds: 60,
                },
              ],
            },
            scaleUp: {
              stabilizationWindowSeconds: 0,
              policies: [
                {
                  type: 'Percent',
                  value: 100,
                  periodSeconds: 30,
                },
                {
                  type: 'Pods',
                  value: 2,
                  periodSeconds: 30,
                },
              ],
              selectPolicy: 'Max',
            },
          },
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
          behavior: {
            scaleDown: {
              stabilizationWindowSeconds: 300,
              policies: [
                {
                  type: 'Percent',
                  value: 50,
                  periodSeconds: 60,
                },
              ],
            },
            scaleUp: {
              stabilizationWindowSeconds: 0,
              policies: [
                {
                  type: 'Percent',
                  value: 100,
                  periodSeconds: 30,
                },
                {
                  type: 'Pods',
                  value: 2,
                  periodSeconds: 30,
                },
              ],
              selectPolicy: 'Max',
            },
          },
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
            behavior: {
              scaleDown: {
                stabilizationWindowSeconds: 300,
                policies: [
                  {
                    type: 'Percent',
                    value: 50,
                    periodSeconds: 60,
                  },
                ],
              },
              scaleUp: {
                stabilizationWindowSeconds: 0,
                policies: [
                  {
                    type: 'Percent',
                    value: 100,
                    periodSeconds: 30,
                  },
                  {
                    type: 'Pods',
                    value: 2,
                    periodSeconds: 30,
                  },
                ],
                selectPolicy: 'Max',
              },
            },
          },
        },
        { parent: this, provider: k8sProvider }
      );

    // Network Policies
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
              from: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      name: 'istio-system',
                    },
                  },
                },
              ],
              ports: [
                {
                  protocol: 'TCP',
                  port: 8080,
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
                  port: 8080,
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
            {
              to: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      name: 'istio-system',
                    },
                  },
                },
              ],
              ports: [
                {
                  protocol: 'TCP',
                  port: 15012,
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
                  port: 8080,
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
                  port: 8080,
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
            {
              to: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      name: 'istio-system',
                    },
                  },
                },
              ],
              ports: [
                {
                  protocol: 'TCP',
                  port: 15012,
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
                    port: 8080,
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
              {
                to: [
                  {
                    namespaceSelector: {
                      matchLabels: {
                        name: 'istio-system',
                      },
                    },
                  },
                ],
                ports: [
                  {
                    protocol: 'TCP',
                    port: 15012,
                  },
                ],
              },
            ],
          },
        },
        { parent: this, provider: k8sProvider }
      );

    // Istio PeerAuthentication for mTLS
    const peerAuth = new k8s.apiextensions.CustomResource(
      'peer-auth',
      {
        apiVersion: 'security.istio.io/v1beta1',
        kind: 'PeerAuthentication',
        metadata: {
          name: `mtls-strict-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          mtls: {
            mode: 'STRICT',
          },
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // Istio DestinationRules
    const paymentApiDestinationRule = new k8s.apiextensions.CustomResource(
      'payment-api-dr',
      {
        apiVersion: 'networking.istio.io/v1beta1',
        kind: 'DestinationRule',
        metadata: {
          name: `payment-api-dr-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          host: pulumi.interpolate`${paymentApiService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`,
          trafficPolicy: {
            tls: {
              mode: 'ISTIO_MUTUAL',
            },
            connectionPool: {
              tcp: {
                maxConnections: 100,
              },
              http: {
                http1MaxPendingRequests: 50,
                http2MaxRequests: 100,
                maxRequestsPerConnection: 2,
              },
            },
          },
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const fraudDetectorDestinationRule = new k8s.apiextensions.CustomResource(
      'fraud-detector-dr',
      {
        apiVersion: 'networking.istio.io/v1beta1',
        kind: 'DestinationRule',
        metadata: {
          name: `fraud-detector-dr-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          host: pulumi.interpolate`${fraudDetectorService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`,
          trafficPolicy: {
            tls: {
              mode: 'ISTIO_MUTUAL',
            },
            connectionPool: {
              tcp: {
                maxConnections: 100,
              },
              http: {
                http1MaxPendingRequests: 50,
                http2MaxRequests: 100,
                maxRequestsPerConnection: 2,
              },
            },
          },
        },
      },
      { parent: this, provider: k8sProvider }
    );

    const notificationServiceDestinationRule =
      new k8s.apiextensions.CustomResource(
        'notification-service-dr',
        {
          apiVersion: 'networking.istio.io/v1beta1',
          kind: 'DestinationRule',
          metadata: {
            name: `notification-service-dr-${environmentSuffix}`,
            namespace: namespace.metadata.name,
          },
          spec: {
            host: pulumi.interpolate`${notificationService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`,
            trafficPolicy: {
              tls: {
                mode: 'ISTIO_MUTUAL',
              },
              connectionPool: {
                tcp: {
                  maxConnections: 100,
                },
                http: {
                  http1MaxPendingRequests: 50,
                  http2MaxRequests: 100,
                  maxRequestsPerConnection: 2,
                },
              },
            },
          },
        },
        { parent: this, provider: k8sProvider }
      );

    // Istio Gateway
    const gateway = new k8s.apiextensions.CustomResource(
      'payment-gateway',
      {
        apiVersion: 'networking.istio.io/v1beta1',
        kind: 'Gateway',
        metadata: {
          name: `payment-gateway-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          selector: {
            istio: 'ingressgateway',
          },
          servers: [
            {
              port: {
                number: 80,
                name: 'http',
                protocol: 'HTTP',
              },
              hosts: ['*'],
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // Istio VirtualService for external access
    const paymentApiVirtualService = new k8s.apiextensions.CustomResource(
      'payment-api-vs',
      {
        apiVersion: 'networking.istio.io/v1beta1',
        kind: 'VirtualService',
        metadata: {
          name: `payment-api-vs-${environmentSuffix}`,
          namespace: namespace.metadata.name,
        },
        spec: {
          hosts: ['*'],
          gateways: [pulumi.interpolate`${gateway.metadata.name}`],
          http: [
            {
              match: [
                {
                  uri: {
                    prefix: '/api/payment',
                  },
                },
              ],
              route: [
                {
                  destination: {
                    host: pulumi.interpolate`${paymentApiService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`,
                    port: {
                      number: 8080,
                    },
                  },
                  weight: 100,
                },
              ],
              timeout: '30s',
              retries: {
                attempts: 3,
                perTryTimeout: '10s',
                retryOn: '5xx,reset,connect-failure,refused-stream',
              },
            },
          ],
        },
      },
      { parent: this, provider: k8sProvider }
    );

    // Create a LoadBalancer service for the gateway
    const gatewayService = new k8s.core.v1.Service(
      'gateway-loadbalancer',
      {
        metadata: {
          name: `gateway-lb-${environmentSuffix}`,
          namespace: namespace.metadata.name,
          labels: {
            istio: 'ingressgateway',
          },
        },
        spec: {
          type: 'LoadBalancer',
          selector: {
            istio: 'ingressgateway',
          },
          ports: [
            {
              port: 80,
              targetPort: 8080,
              name: 'http',
              protocol: 'TCP',
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
    void peerAuth;
    void paymentApiDestinationRule;
    void fraudDetectorDestinationRule;
    void notificationServiceDestinationRule;
    void paymentApiVirtualService;

    // Set outputs
    this.clusterName = cluster.eksCluster.name;
    this.kubeconfig = cluster.kubeconfig;
    this.namespaceName = namespace.metadata.name;
    this.gatewayUrl = pulumi.interpolate`http://${gatewayService.status.loadBalancer.ingress[0].hostname}/api/payment`;
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

    // Register the outputs of this component.
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
