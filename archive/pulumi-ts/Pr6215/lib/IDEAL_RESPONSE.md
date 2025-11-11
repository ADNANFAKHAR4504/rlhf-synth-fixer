# Pulumi TypeScript Microservices Deployment with Istio - IDEAL RESPONSE

This is the corrected implementation with improvements for production readiness.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// ECR image URIs - these should be configured in Pulumi config
const paymentApiImage = config.require("paymentApiImage");
const fraudDetectorImage = config.require("fraudDetectorImage");
const notificationServiceImage = config.require("notificationServiceImage");

// Kubernetes namespace
const namespace = new k8s.core.v1.Namespace("microservices-ns", {
    metadata: {
        name: `microservices-${environmentSuffix}`,
        labels: {
            "istio-injection": "enabled",
        },
    },
});

// ConfigMaps for each service
const paymentApiConfigMap = new k8s.core.v1.ConfigMap("payment-api-config", {
    metadata: {
        name: `payment-api-config-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    data: {
        FRAUD_DETECTOR_URL: pulumi.interpolate`http://fraud-detector-service-${environmentSuffix}.${namespace.metadata.name}.svc.cluster.local:8080`,
        FEATURE_FLAG_ENABLE_FRAUD_CHECK: "true",
        FEATURE_FLAG_ENABLE_LOGGING: "true",
    },
});

const fraudDetectorConfigMap = new k8s.core.v1.ConfigMap("fraud-detector-config", {
    metadata: {
        name: `fraud-detector-config-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    data: {
        NOTIFICATION_SERVICE_URL: pulumi.interpolate`http://notification-service-${environmentSuffix}.${namespace.metadata.name}.svc.cluster.local:8080`,
        FEATURE_FLAG_ML_ENABLED: "true",
        FEATURE_FLAG_REALTIME_ALERTS: "true",
    },
});

const notificationServiceConfigMap = new k8s.core.v1.ConfigMap("notification-service-config", {
    metadata: {
        name: `notification-service-config-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    data: {
        FEATURE_FLAG_EMAIL_ENABLED: "true",
        FEATURE_FLAG_SMS_ENABLED: "true",
    },
});

// Secrets for each service
const paymentApiSecret = new k8s.core.v1.Secret("payment-api-secret", {
    metadata: {
        name: `payment-api-secret-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    type: "Opaque",
    stringData: {
        DB_CONNECTION_STRING: "postgresql://user:pass@payment-db.cluster.eu-west-2.rds.amazonaws.com:5432/payments",
        STRIPE_API_KEY: "sk_test_placeholder",
    },
});

const fraudDetectorSecret = new k8s.core.v1.Secret("fraud-detector-secret", {
    metadata: {
        name: `fraud-detector-secret-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    type: "Opaque",
    stringData: {
        DB_CONNECTION_STRING: "postgresql://user:pass@fraud-db.cluster.eu-west-2.rds.amazonaws.com:5432/fraud",
        ML_API_KEY: "ml_api_placeholder",
    },
});

const notificationServiceSecret = new k8s.core.v1.Secret("notification-service-secret", {
    metadata: {
        name: `notification-service-secret-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    type: "Opaque",
    stringData: {
        DB_CONNECTION_STRING: "postgresql://user:pass@notification-db.cluster.eu-west-2.rds.amazonaws.com:5432/notifications",
        TWILIO_API_KEY: "twilio_placeholder",
        SENDGRID_API_KEY: "sendgrid_placeholder",
    },
});

// Payment API Deployment
const paymentApiDeployment = new k8s.apps.v1.Deployment("payment-api", {
    metadata: {
        name: `payment-api-${environmentSuffix}`,
        namespace: namespace.metadata.name,
        labels: {
            app: "payment-api",
            "app.kubernetes.io/name": "payment-api",
            "app.kubernetes.io/component": "backend",
        },
    },
    spec: {
        replicas: 2,
        selector: {
            matchLabels: {
                app: "payment-api",
                version: "v1",
            },
        },
        template: {
            metadata: {
                labels: {
                    app: "payment-api",
                    version: "v1",
                },
                annotations: {
                    "sidecar.istio.io/inject": "true",
                },
            },
            spec: {
                containers: [{
                    name: "payment-api",
                    image: paymentApiImage,
                    ports: [{
                        containerPort: 8080,
                        name: "http",
                        protocol: "TCP",
                    }],
                    envFrom: [{
                        configMapRef: {
                            name: paymentApiConfigMap.metadata.name,
                        },
                    }, {
                        secretRef: {
                            name: paymentApiSecret.metadata.name,
                        },
                    }],
                    resources: {
                        requests: {
                            cpu: "250m",
                            memory: "512Mi",
                        },
                        limits: {
                            cpu: "500m",
                            memory: "1Gi",
                        },
                    },
                    livenessProbe: {
                        httpGet: {
                            path: "/health",
                            port: 8080,
                        },
                        initialDelaySeconds: 30,
                        periodSeconds: 10,
                        timeoutSeconds: 5,
                        failureThreshold: 3,
                    },
                    readinessProbe: {
                        httpGet: {
                            path: "/ready",
                            port: 8080,
                        },
                        initialDelaySeconds: 10,
                        periodSeconds: 5,
                        timeoutSeconds: 3,
                        failureThreshold: 3,
                    },
                }],
            },
        },
    },
});

// Fraud Detector Deployment
const fraudDetectorDeployment = new k8s.apps.v1.Deployment("fraud-detector", {
    metadata: {
        name: `fraud-detector-${environmentSuffix}`,
        namespace: namespace.metadata.name,
        labels: {
            app: "fraud-detector",
            "app.kubernetes.io/name": "fraud-detector",
            "app.kubernetes.io/component": "ml-service",
        },
    },
    spec: {
        replicas: 2,
        selector: {
            matchLabels: {
                app: "fraud-detector",
                version: "v1",
            },
        },
        template: {
            metadata: {
                labels: {
                    app: "fraud-detector",
                    version: "v1",
                },
                annotations: {
                    "sidecar.istio.io/inject": "true",
                },
            },
            spec: {
                containers: [{
                    name: "fraud-detector",
                    image: fraudDetectorImage,
                    ports: [{
                        containerPort: 8080,
                        name: "http",
                        protocol: "TCP",
                    }],
                    envFrom: [{
                        configMapRef: {
                            name: fraudDetectorConfigMap.metadata.name,
                        },
                    }, {
                        secretRef: {
                            name: fraudDetectorSecret.metadata.name,
                        },
                    }],
                    resources: {
                        requests: {
                            cpu: "250m",
                            memory: "512Mi",
                        },
                        limits: {
                            cpu: "500m",
                            memory: "1Gi",
                        },
                    },
                    livenessProbe: {
                        httpGet: {
                            path: "/health",
                            port: 8080,
                        },
                        initialDelaySeconds: 30,
                        periodSeconds: 10,
                        timeoutSeconds: 5,
                        failureThreshold: 3,
                    },
                    readinessProbe: {
                        httpGet: {
                            path: "/ready",
                            port: 8080,
                        },
                        initialDelaySeconds: 10,
                        periodSeconds: 5,
                        timeoutSeconds: 3,
                        failureThreshold: 3,
                    },
                }],
            },
        },
    },
});

// Notification Service Deployment
const notificationServiceDeployment = new k8s.apps.v1.Deployment("notification-service", {
    metadata: {
        name: `notification-service-${environmentSuffix}`,
        namespace: namespace.metadata.name,
        labels: {
            app: "notification-service",
            "app.kubernetes.io/name": "notification-service",
            "app.kubernetes.io/component": "notification",
        },
    },
    spec: {
        replicas: 2,
        selector: {
            matchLabels: {
                app: "notification-service",
                version: "v1",
            },
        },
        template: {
            metadata: {
                labels: {
                    app: "notification-service",
                    version: "v1",
                },
                annotations: {
                    "sidecar.istio.io/inject": "true",
                },
            },
            spec: {
                containers: [{
                    name: "notification-service",
                    image: notificationServiceImage,
                    ports: [{
                        containerPort: 8080,
                        name: "http",
                        protocol: "TCP",
                    }],
                    envFrom: [{
                        configMapRef: {
                            name: notificationServiceConfigMap.metadata.name,
                        },
                    }, {
                        secretRef: {
                            name: notificationServiceSecret.metadata.name,
                        },
                    }],
                    resources: {
                        requests: {
                            cpu: "250m",
                            memory: "512Mi",
                        },
                        limits: {
                            cpu: "500m",
                            memory: "1Gi",
                        },
                    },
                    livenessProbe: {
                        httpGet: {
                            path: "/health",
                            port: 8080,
                        },
                        initialDelaySeconds: 30,
                        periodSeconds: 10,
                        timeoutSeconds: 5,
                        failureThreshold: 3,
                    },
                    readinessProbe: {
                        httpGet: {
                            path: "/ready",
                            port: 8080,
                        },
                        initialDelaySeconds: 10,
                        periodSeconds: 5,
                        timeoutSeconds: 3,
                        failureThreshold: 3,
                    },
                }],
            },
        },
    },
});

// Kubernetes Services
const paymentApiService = new k8s.core.v1.Service("payment-api-service", {
    metadata: {
        name: `payment-api-service-${environmentSuffix}`,
        namespace: namespace.metadata.name,
        labels: {
            app: "payment-api",
        },
    },
    spec: {
        selector: {
            app: "payment-api",
        },
        type: "ClusterIP",
        ports: [{
            port: 8080,
            targetPort: 8080,
            name: "http",
            protocol: "TCP",
        }],
    },
});

const fraudDetectorService = new k8s.core.v1.Service("fraud-detector-service", {
    metadata: {
        name: `fraud-detector-service-${environmentSuffix}`,
        namespace: namespace.metadata.name,
        labels: {
            app: "fraud-detector",
        },
    },
    spec: {
        selector: {
            app: "fraud-detector",
        },
        type: "ClusterIP",
        ports: [{
            port: 8080,
            targetPort: 8080,
            name: "http",
            protocol: "TCP",
        }],
    },
});

const notificationService = new k8s.core.v1.Service("notification-service", {
    metadata: {
        name: `notification-service-${environmentSuffix}`,
        namespace: namespace.metadata.name,
        labels: {
            app: "notification-service",
        },
    },
    spec: {
        selector: {
            app: "notification-service",
        },
        type: "ClusterIP",
        ports: [{
            port: 8080,
            targetPort: 8080,
            name: "http",
            protocol: "TCP",
        }],
    },
});

// HorizontalPodAutoscalers
const paymentApiHpa = new k8s.autoscaling.v2.HorizontalPodAutoscaler("payment-api-hpa", {
    metadata: {
        name: `payment-api-hpa-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        scaleTargetRef: {
            apiVersion: "apps/v1",
            kind: "Deployment",
            name: paymentApiDeployment.metadata.name,
        },
        minReplicas: 2,
        maxReplicas: 10,
        metrics: [{
            type: "Resource",
            resource: {
                name: "cpu",
                target: {
                    type: "Utilization",
                    averageUtilization: 50,
                },
            },
        }],
        behavior: {
            scaleDown: {
                stabilizationWindowSeconds: 300,
                policies: [{
                    type: "Percent",
                    value: 50,
                    periodSeconds: 60,
                }],
            },
            scaleUp: {
                stabilizationWindowSeconds: 0,
                policies: [{
                    type: "Percent",
                    value: 100,
                    periodSeconds: 30,
                }, {
                    type: "Pods",
                    value: 2,
                    periodSeconds: 30,
                }],
                selectPolicy: "Max",
            },
        },
    },
});

const fraudDetectorHpa = new k8s.autoscaling.v2.HorizontalPodAutoscaler("fraud-detector-hpa", {
    metadata: {
        name: `fraud-detector-hpa-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        scaleTargetRef: {
            apiVersion: "apps/v1",
            kind: "Deployment",
            name: fraudDetectorDeployment.metadata.name,
        },
        minReplicas: 2,
        maxReplicas: 10,
        metrics: [{
            type: "Resource",
            resource: {
                name: "cpu",
                target: {
                    type: "Utilization",
                    averageUtilization: 50,
                },
            },
        }],
        behavior: {
            scaleDown: {
                stabilizationWindowSeconds: 300,
                policies: [{
                    type: "Percent",
                    value: 50,
                    periodSeconds: 60,
                }],
            },
            scaleUp: {
                stabilizationWindowSeconds: 0,
                policies: [{
                    type: "Percent",
                    value: 100,
                    periodSeconds: 30,
                }, {
                    type: "Pods",
                    value: 2,
                    periodSeconds: 30,
                }],
                selectPolicy: "Max",
            },
        },
    },
});

const notificationServiceHpa = new k8s.autoscaling.v2.HorizontalPodAutoscaler("notification-service-hpa", {
    metadata: {
        name: `notification-service-hpa-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        scaleTargetRef: {
            apiVersion: "apps/v1",
            kind: "Deployment",
            name: notificationServiceDeployment.metadata.name,
        },
        minReplicas: 2,
        maxReplicas: 10,
        metrics: [{
            type: "Resource",
            resource: {
                name: "cpu",
                target: {
                    type: "Utilization",
                    averageUtilization: 50,
                },
            },
        }],
        behavior: {
            scaleDown: {
                stabilizationWindowSeconds: 300,
                policies: [{
                    type: "Percent",
                    value: 50,
                    periodSeconds: 60,
                }],
            },
            scaleUp: {
                stabilizationWindowSeconds: 0,
                policies: [{
                    type: "Percent",
                    value: 100,
                    periodSeconds: 30,
                }, {
                    type: "Pods",
                    value: 2,
                    periodSeconds: 30,
                }],
                selectPolicy: "Max",
            },
        },
    },
});

// Network Policies
const paymentApiNetworkPolicy = new k8s.networking.v1.NetworkPolicy("payment-api-netpol", {
    metadata: {
        name: `payment-api-netpol-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        podSelector: {
            matchLabels: {
                app: "payment-api",
            },
        },
        policyTypes: ["Ingress", "Egress"],
        ingress: [{
            from: [{
                namespaceSelector: {
                    matchLabels: {
                        name: "istio-system",
                    },
                },
            }],
            ports: [{
                protocol: "TCP",
                port: 8080,
            }],
        }],
        egress: [{
            to: [{
                podSelector: {
                    matchLabels: {
                        app: "fraud-detector",
                    },
                },
            }],
            ports: [{
                protocol: "TCP",
                port: 8080,
            }],
        }, {
            to: [{
                namespaceSelector: {},
            }],
            ports: [{
                protocol: "TCP",
                port: 53,
            }, {
                protocol: "UDP",
                port: 53,
            }],
        }, {
            to: [{
                namespaceSelector: {
                    matchLabels: {
                        name: "istio-system",
                    },
                },
            }],
            ports: [{
                protocol: "TCP",
                port: 15012,
            }],
        }],
    },
});

const fraudDetectorNetworkPolicy = new k8s.networking.v1.NetworkPolicy("fraud-detector-netpol", {
    metadata: {
        name: `fraud-detector-netpol-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        podSelector: {
            matchLabels: {
                app: "fraud-detector",
            },
        },
        policyTypes: ["Ingress", "Egress"],
        ingress: [{
            from: [{
                podSelector: {
                    matchLabels: {
                        app: "payment-api",
                    },
                },
            }],
            ports: [{
                protocol: "TCP",
                port: 8080,
            }],
        }],
        egress: [{
            to: [{
                podSelector: {
                    matchLabels: {
                        app: "notification-service",
                    },
                },
            }],
            ports: [{
                protocol: "TCP",
                port: 8080,
            }],
        }, {
            to: [{
                namespaceSelector: {},
            }],
            ports: [{
                protocol: "TCP",
                port: 53,
            }, {
                protocol: "UDP",
                port: 53,
            }],
        }, {
            to: [{
                namespaceSelector: {
                    matchLabels: {
                        name: "istio-system",
                    },
                },
            }],
            ports: [{
                protocol: "TCP",
                port: 15012,
            }],
        }],
    },
});

const notificationServiceNetworkPolicy = new k8s.networking.v1.NetworkPolicy("notification-service-netpol", {
    metadata: {
        name: `notification-service-netpol-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        podSelector: {
            matchLabels: {
                app: "notification-service",
            },
        },
        policyTypes: ["Ingress", "Egress"],
        ingress: [{
            from: [{
                podSelector: {
                    matchLabels: {
                        app: "fraud-detector",
                    },
                },
            }],
            ports: [{
                protocol: "TCP",
                port: 8080,
            }],
        }],
        egress: [{
            to: [{
                namespaceSelector: {},
            }],
            ports: [{
                protocol: "TCP",
                port: 53,
            }, {
                protocol: "UDP",
                port: 53,
            }],
        }, {
            to: [{
                namespaceSelector: {
                    matchLabels: {
                        name: "istio-system",
                    },
                },
            }],
            ports: [{
                protocol: "TCP",
                port: 15012,
            }],
        }],
    },
});

// Istio PeerAuthentication for mTLS
const peerAuth = new k8s.apiextensions.CustomResource("peer-auth", {
    apiVersion: "security.istio.io/v1beta1",
    kind: "PeerAuthentication",
    metadata: {
        name: `mtls-strict-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        mtls: {
            mode: "STRICT",
        },
    },
});

// Istio DestinationRules
const paymentApiDestinationRule = new k8s.apiextensions.CustomResource("payment-api-dr", {
    apiVersion: "networking.istio.io/v1beta1",
    kind: "DestinationRule",
    metadata: {
        name: `payment-api-dr-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        host: pulumi.interpolate`${paymentApiService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`,
        trafficPolicy: {
            tls: {
                mode: "ISTIO_MUTUAL",
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
});

const fraudDetectorDestinationRule = new k8s.apiextensions.CustomResource("fraud-detector-dr", {
    apiVersion: "networking.istio.io/v1beta1",
    kind: "DestinationRule",
    metadata: {
        name: `fraud-detector-dr-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        host: pulumi.interpolate`${fraudDetectorService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`,
        trafficPolicy: {
            tls: {
                mode: "ISTIO_MUTUAL",
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
});

const notificationServiceDestinationRule = new k8s.apiextensions.CustomResource("notification-service-dr", {
    apiVersion: "networking.istio.io/v1beta1",
    kind: "DestinationRule",
    metadata: {
        name: `notification-service-dr-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        host: pulumi.interpolate`${notificationService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`,
        trafficPolicy: {
            tls: {
                mode: "ISTIO_MUTUAL",
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
});

// Istio Gateway
const gateway = new k8s.apiextensions.CustomResource("payment-gateway", {
    apiVersion: "networking.istio.io/v1beta1",
    kind: "Gateway",
    metadata: {
        name: `payment-gateway-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        selector: {
            istio: "ingressgateway",
        },
        servers: [{
            port: {
                number: 80,
                name: "http",
                protocol: "HTTP",
            },
            hosts: ["*"],
        }],
    },
});

// Istio VirtualService for external access
const paymentApiVirtualService = new k8s.apiextensions.CustomResource("payment-api-vs", {
    apiVersion: "networking.istio.io/v1beta1",
    kind: "VirtualService",
    metadata: {
        name: `payment-api-vs-${environmentSuffix}`,
        namespace: namespace.metadata.name,
    },
    spec: {
        hosts: ["*"],
        gateways: [pulumi.interpolate`${gateway.metadata.name}`],
        http: [{
            match: [{
                uri: {
                    prefix: "/api/payment",
                },
            }],
            route: [{
                destination: {
                    host: pulumi.interpolate`${paymentApiService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`,
                    port: {
                        number: 8080,
                    },
                },
                weight: 100,
            }],
            timeout: "30s",
            retries: {
                attempts: 3,
                perTryTimeout: "10s",
                retryOn: "5xx,reset,connect-failure,refused-stream",
            },
        }],
    },
});

// Get Istio ingress gateway service to export the URL
const istioIngressService = k8s.core.v1.Service.get("istio-ingress", "istio-system/istio-ingressgateway");

// Exports
export const gatewayUrl = pulumi.interpolate`http://${istioIngressService.status.loadBalancer.ingress[0].hostname}/api/payment`;
export const paymentApiEndpoint = pulumi.interpolate`http://${paymentApiService.metadata.name}.${namespace.metadata.name}.svc.cluster.local:8080`;
export const fraudDetectorEndpoint = pulumi.interpolate`http://${fraudDetectorService.metadata.name}.${namespace.metadata.name}.svc.cluster.local:8080`;
export const notificationServiceEndpoint = pulumi.interpolate`http://${notificationService.metadata.name}.${namespace.metadata.name}.svc.cluster.local:8080`;
export const namespaceName = namespace.metadata.name;
export const hpaStatus = pulumi.all([
    paymentApiHpa.metadata.name,
    fraudDetectorHpa.metadata.name,
    notificationServiceHpa.metadata.name,
]).apply(([payment, fraud, notification]) => ({
    paymentApiHpa: payment,
    fraudDetectorHpa: fraud,
    notificationServiceHpa: notification,
}));
```

## File: package.json

```json
{
  "name": "microservices-k8s-istio",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/kubernetes": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "bin",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "bin"
  ]
}
```

## File: Pulumi.yaml

```yaml
name: microservices-k8s-istio
runtime: nodejs
description: Microservices deployment on Kubernetes with Istio service mesh
config:
  environmentSuffix:
    description: Environment suffix for resource naming
    default: dev
  paymentApiImage:
    description: ECR image URI for payment-api
    default: 123456789012.dkr.ecr.eu-west-2.amazonaws.com/payment-api:latest
  fraudDetectorImage:
    description: ECR image URI for fraud-detector
    default: 123456789012.dkr.ecr.eu-west-2.amazonaws.com/fraud-detector:latest
  notificationServiceImage:
    description: ECR image URI for notification-service
    default: 123456789012.dkr.ecr.eu-west-2.amazonaws.com/notification-service:latest
```

## File: .eslintrc.json

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off"
  }
}
```

## File: README.md

```markdown
# Microservices Deployment on Kubernetes with Istio

This Pulumi TypeScript program deploys a microservices architecture on Amazon EKS with Istio service mesh integration.

## Architecture

The deployment creates:
- 3 microservices: payment-api, fraud-detector, and notification-service
- Kubernetes Services (ClusterIP) for each microservice
- ConfigMaps and Secrets for configuration management
- HorizontalPodAutoscalers with scaling behaviors for automatic scaling based on CPU utilization
- NetworkPolicies for secure service-to-service communication with Istio control plane access
- Istio service mesh configuration with strict mTLS
- Istio Gateway for external access to payment-api
- Health checks (liveness and readiness probes) for all services
- Connection pooling and retry policies in Istio

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 18+ and npm
- kubectl configured to access your EKS cluster
- EKS cluster with Istio 1.19 pre-installed
- ECR repositories with container images

## Configuration

Set the following Pulumi configuration values:

```bash
pulumi config set environmentSuffix <your-env-suffix>
pulumi config set paymentApiImage <ecr-uri-for-payment-api>
pulumi config set fraudDetectorImage <ecr-uri-for-fraud-detector>
pulumi config set notificationServiceImage <ecr-uri-for-notification-service>
```

## Deployment

```bash
npm install
pulumi up
```

## Stack Outputs

The stack exports:
- `gatewayUrl`: External URL to access the payment-api through Istio ingress gateway
- `paymentApiEndpoint`: Internal Kubernetes service endpoint for payment-api
- `fraudDetectorEndpoint`: Internal Kubernetes service endpoint for fraud-detector
- `notificationServiceEndpoint`: Internal Kubernetes service endpoint for notification-service
- `namespaceName`: Name of the Kubernetes namespace
- `hpaStatus`: Names of all HorizontalPodAutoscalers

## Security Features

- Istio PeerAuthentication with STRICT mTLS mode
- NetworkPolicies restricting communication:
  - payment-api can only communicate with fraud-detector and Istio control plane
  - fraud-detector can only communicate with notification-service and Istio control plane
  - notification-service can only communicate with Istio control plane
  - All services can perform DNS lookups (TCP and UDP port 53)
- Secrets management for sensitive configuration
- Resource limits and requests for all containers
- Health checks for production readiness

## Scaling

Each service is configured with:
- Initial replicas: 2
- Min replicas: 2
- Max replicas: 10
- CPU utilization target: 50%
- Scale up: Fast (100% or 2 pods every 30s)
- Scale down: Conservative (50% every 60s with 5 min stabilization)

## Health Checks

All services include:
- Liveness probe at /health (checks if service is running)
- Readiness probe at /ready (checks if service can accept traffic)

## Traffic Management

- Retry policies: 3 attempts with 10s per-try timeout
- Request timeout: 30s
- Connection pooling: Configured for optimal performance

## Testing

Stack outputs are written to `cfn-outputs/flat-outputs.json` for integration testing.
```
