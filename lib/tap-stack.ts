/**
 * tap-stack.ts
 *
 * This module defines the TapStack class for deploying a microservices architecture
 * on Kubernetes with Istio service mesh integration.
 *
 * It includes:
 * - 3 microservices: payment-api, fraud-detector, and notification-service
 * - Kubernetes Services (ClusterIP) for each microservice
 * - ConfigMaps and Secrets for configuration management
 * - HorizontalPodAutoscalers for automatic scaling based on CPU utilization
 * - NetworkPolicies for secure service-to-service communication
 * - Istio service mesh configuration with strict mTLS
 * - Istio Gateway for external access to payment-api
 */
import * as pulumi from '@pulumi/pulumi';
import * as k8s from '@pulumi/kubernetes';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * ECR image URI for payment-api service
   */
  paymentApiImage?: string;

  /**
   * ECR image URI for fraud-detector service
   */
  fraudDetectorImage?: string;

  /**
   * ECR image URI for notification-service
   */
  notificationServiceImage?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for deploying microservices on Kubernetes.
 *
 * This component orchestrates the deployment of payment processing microservices
 * with Istio service mesh, network policies, and horizontal pod autoscaling.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly namespaceName: pulumi.Output<string>;
  public readonly gatewayUrl: pulumi.Output<string>;
  public readonly paymentApiEndpoint: pulumi.Output<string>;
  public readonly fraudDetectorEndpoint: pulumi.Output<string>;
  public readonly notificationServiceEndpoint: pulumi.Output<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly hpaStatus: pulumi.Output<any>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and container images.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const paymentApiImage =
      args.paymentApiImage ||
      '123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-api:latest';
    const fraudDetectorImage =
      args.fraudDetectorImage ||
      '123456789012.dkr.ecr.us-east-1.amazonaws.com/fraud-detector:latest';
    const notificationServiceImage =
      args.notificationServiceImage ||
      '123456789012.dkr.ecr.us-east-1.amazonaws.com/notification-service:latest';

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
      { parent: this }
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
      { parent: this }
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
      { parent: this }
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
      { parent: this }
    );

    // Secrets for each service
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
            'postgresql://user:pass@payment-db.cluster.us-east-1.rds.amazonaws.com:5432/payments',
          STRIPE_API_KEY: 'sk_test_placeholder',
        },
      },
      { parent: this }
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
            'postgresql://user:pass@fraud-db.cluster.us-east-1.rds.amazonaws.com:5432/fraud',
          ML_API_KEY: 'ml_api_placeholder',
        },
      },
      { parent: this }
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
            'postgresql://user:pass@notification-db.cluster.us-east-1.rds.amazonaws.com:5432/notifications',
          TWILIO_API_KEY: 'twilio_placeholder',
          SENDGRID_API_KEY: 'sendgrid_placeholder',
        },
      },
      { parent: this }
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
      { parent: this }
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
      { parent: this }
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
      { parent: this }
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
      { parent: this }
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
      { parent: this }
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
      { parent: this }
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
      { parent: this }
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
      { parent: this }
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
        { parent: this }
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
      { parent: this }
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
      { parent: this }
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
        { parent: this }
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
      { parent: this }
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
      { parent: this }
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
      { parent: this }
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
        { parent: this }
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
      { parent: this }
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
      { parent: this }
    );

    // Get Istio ingress gateway service to export the URL
    const istioIngressService = k8s.core.v1.Service.get(
      'istio-ingress',
      'istio-system/istio-ingressgateway'
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
    this.namespaceName = namespace.metadata.name;
    this.gatewayUrl = pulumi.interpolate`http://${istioIngressService.status.loadBalancer.ingress[0].hostname}/api/payment`;
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
      namespaceName: this.namespaceName,
      gatewayUrl: this.gatewayUrl,
      paymentApiEndpoint: this.paymentApiEndpoint,
      fraudDetectorEndpoint: this.fraudDetectorEndpoint,
      notificationServiceEndpoint: this.notificationServiceEndpoint,
      hpaStatus: this.hpaStatus,
    });
  }
}
