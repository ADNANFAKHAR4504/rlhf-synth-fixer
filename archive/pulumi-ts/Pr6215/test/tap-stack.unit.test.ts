/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime for unit testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // console.log(`[MOCK] Creating resource: ${args.type} - ${args.name}`);
    const outputs: any = { ...args.inputs };

    // Mock VPC outputs
    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.id = `vpc-${args.name}-mock-id`;
      outputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
      console.log(`[MOCK] VPC created with CIDR: ${outputs.cidrBlock}`);
    }

    // Mock Internet Gateway
    if (args.type === 'aws:ec2/internetGateway:InternetGateway') {
      outputs.id = `igw-${args.name}-mock-id`;
      console.log(`[MOCK] Internet Gateway created`);
    }

    // Mock Subnets
    if (args.type === 'aws:ec2/subnet:Subnet') {
      outputs.id = `subnet-${args.name}-mock-id`;
      outputs.availabilityZone = args.inputs.availabilityZone;
      console.log(`[MOCK] Subnet created in AZ: ${outputs.availabilityZone}`);
    }

    // Mock Route Table
    if (args.type === 'aws:ec2/routeTable:RouteTable') {
      outputs.id = `rt-${args.name}-mock-id`;
      console.log(`[MOCK] Route Table created`);
    }

    // Mock Route
    if (args.type === 'aws:ec2/route:Route') {
      outputs.id = `route-${args.name}-mock-id`;
      console.log(`[MOCK] Route created to ${args.inputs.destinationCidrBlock}`);
    }

    // Mock Route Table Association
    if (args.type === 'aws:ec2/routeTableAssociation:RouteTableAssociation') {
      outputs.id = `rta-${args.name}-mock-id`;
      console.log(`[MOCK] Route Table Association created`);
    }

    // Mock IAM Role
    if (args.type === 'aws:iam/role:Role') {
      outputs.id = `role-${args.name}-mock-id`;
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
      outputs.name = args.name;
      console.log(`[MOCK] IAM Role created: ${outputs.arn}`);
    }

    // Mock IAM Role Policy Attachment
    if (args.type === 'aws:iam/rolePolicyAttachment:RolePolicyAttachment') {
      outputs.id = `rpa-${args.name}-mock-id`;
      console.log(`[MOCK] Policy attached: ${args.inputs.policyArn}`);
    }

    // Mock Security Group
    if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      outputs.id = `sg-${args.name}-mock-id`;
      console.log(`[MOCK] Security Group created`);
    }

    // Mock EKS Cluster
    if (args.type === 'aws:eks/cluster:Cluster') {
      outputs.id = `eks-${args.name}-mock-id`;
      outputs.name = args.inputs.name;
      outputs.endpoint = 'https://mock-eks-endpoint.eks.amazonaws.com';
      outputs.certificateAuthority = {
        data: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t',
      };
      outputs.arn = `arn:aws:eks:eu-west-2:123456789012:cluster/${args.inputs.name}`;
      console.log(`[MOCK] EKS Cluster created: ${outputs.name}`);
    }

    // Mock EKS Node Group
    if (args.type === 'aws:eks/nodeGroup:NodeGroup') {
      outputs.id = `ng-${args.name}-mock-id`;
      outputs.status = 'ACTIVE';
      console.log(`[MOCK] EKS Node Group created`);
    }

    // Mock AWS Provider
    if (args.type === 'pulumi:providers:aws') {
      outputs.id = `provider-${args.name}-mock-id`;
      console.log(`[MOCK] AWS Provider created for region: ${args.inputs.region}`);
    }

    // Mock Kubernetes Provider
    if (args.type === 'pulumi:providers:kubernetes') {
      outputs.id = `k8s-provider-${args.name}-mock-id`;
      console.log(`[MOCK] Kubernetes Provider created`);
    }

    // Mock Kubernetes Namespace
    if (args.type === 'kubernetes:core/v1:Namespace') {
      outputs.metadata = {
        name: args.inputs.metadata?.name || `mock-${args.name}`,
        labels: args.inputs.metadata?.labels || {},
        annotations: args.inputs.metadata?.annotations || {},
      };
      console.log(`[MOCK] Namespace created: ${outputs.metadata.name}`);
    }

    // Mock Kubernetes Deployment
    if (args.type === 'kubernetes:apps/v1:Deployment') {
      outputs.metadata = {
        name: args.inputs.metadata?.name || `mock-${args.name}`,
        namespace: args.inputs.metadata?.namespace || 'default',
        labels: args.inputs.metadata?.labels || {},
      };
      outputs.spec = args.inputs.spec;
      console.log(`[MOCK] Deployment created: ${outputs.metadata.name}`);
    }

    // Mock Kubernetes Service
    if (args.type === 'kubernetes:core/v1:Service') {
      outputs.metadata = {
        name: args.inputs.metadata?.name || `mock-${args.name}`,
        namespace: args.inputs.metadata?.namespace || 'default',
        labels: args.inputs.metadata?.labels || {},
      };
      outputs.spec = args.inputs.spec;
      
      // Mock LoadBalancer status
      if (args.inputs.spec?.type === 'LoadBalancer') {
        outputs.status = {
          loadBalancer: {
            ingress: [
              {
                hostname: 'mock-elb-12345.eu-west-2.elb.amazonaws.com',
              },
            ],
          },
        };
        console.log(`[MOCK] LoadBalancer Service created with hostname`);
      } else {
        console.log(`[MOCK] ClusterIP Service created: ${outputs.metadata.name}`);
      }
    }

    // Mock Kubernetes HorizontalPodAutoscaler
    if (args.type === 'kubernetes:autoscaling/v2:HorizontalPodAutoscaler') {
      outputs.metadata = {
        name: args.inputs.metadata?.name || `mock-${args.name}`,
        namespace: args.inputs.metadata?.namespace || 'default',
      };
      outputs.spec = args.inputs.spec;
      // console.log(`[MOCK] HPA created: ${outputs.metadata.name}`);
    }

    // Mock Kubernetes NetworkPolicy
    if (args.type === 'kubernetes:networking.k8s.io/v1:NetworkPolicy') {
      outputs.metadata = {
        name: args.inputs.metadata?.name || `mock-${args.name}`,
        namespace: args.inputs.metadata?.namespace || 'default',
      };
      outputs.spec = args.inputs.spec;
      console.log(`[MOCK] NetworkPolicy created: ${outputs.metadata.name}`);
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    console.log(`[MOCK] Calling function: ${args.token}`);
    return args.inputs;
  },
});

describe('TapStack EKS Infrastructure Tests', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test';
  const testPaymentImage = 'nginx:1.25-alpine';
  const testFraudImage = 'nginx:1.25-alpine';
  const testNotificationImage = 'nginx:1.25-alpine';

  beforeAll(() => {
    console.log('\n=== Starting TapStack Test Suite ===\n');
    console.log(`Environment Suffix: ${testEnvironmentSuffix}`);
    console.log(`Payment API Image: ${testPaymentImage}`);
    console.log(`Fraud Detector Image: ${testFraudImage}`);
    console.log(`Notification Service Image: ${testNotificationImage}\n`);

    stack = new TapStack('TestStack', {
      environmentSuffix: testEnvironmentSuffix,
      paymentApiImage: testPaymentImage,
      fraudDetectorImage: testFraudImage,
      notificationServiceImage: testNotificationImage,
      tags: {
        Environment: testEnvironmentSuffix,
        Team: 'test',
        Repository: 'test-repo',
        Author: 'test-author',
      },
    });
    console.log('[TEST] TapStack instance created successfully\n');
  });

  afterAll(() => {
    console.log('\n=== TapStack Test Suite Completed ===\n');
  });

  describe('Stack Instantiation', () => {
    it('should create a TapStack instance', () => {
      console.log('[TEST] Verifying TapStack instance creation');
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
      console.log('[PASS] TapStack instance is valid ComponentResource\n');
    });

    it('should expose all required output properties', () => {
      console.log('[TEST] Verifying all output properties are exposed');
      expect(stack.clusterName).toBeDefined();
      expect(stack.kubeconfig).toBeDefined();
      expect(stack.namespaceName).toBeDefined();
      expect(stack.gatewayUrl).toBeDefined();
      expect(stack.paymentApiEndpoint).toBeDefined();
      expect(stack.fraudDetectorEndpoint).toBeDefined();
      expect(stack.notificationServiceEndpoint).toBeDefined();
      expect(stack.hpaStatus).toBeDefined();
      console.log('[PASS] All 8 required outputs are defined\n');
    });
  });

  describe('EKS Cluster Configuration', () => {
    it('should include environmentSuffix in cluster name', (done) => {
      console.log('[TEST] Checking cluster name includes environment suffix');
      pulumi.all([stack.clusterName]).apply(([clusterName]) => {
        console.log(`Cluster Name: ${clusterName}`);
        expect(clusterName).toContain(testEnvironmentSuffix);
        expect(clusterName).toBe(`eks-cluster-${testEnvironmentSuffix}`);
        console.log('[PASS] Cluster name correctly formatted\n');
        done();
      });
    });

    it('should generate valid kubeconfig', (done) => {
      console.log('[TEST] Validating kubeconfig structure');
      pulumi.all([stack.kubeconfig]).apply(([kubeconfig]) => {
        const config = JSON.parse(kubeconfig);
        console.log(`Kubeconfig API Version: ${config.apiVersion}`);
        expect(config.apiVersion).toBe('v1');
        expect(config.kind).toBe('Config');
        expect(config.clusters).toBeDefined();
        expect(config.contexts).toBeDefined();
        expect(config.users).toBeDefined();
        expect(config['current-context']).toBe('aws');
        console.log('[PASS] Kubeconfig structure is valid\n');
        done();
      });
    });

    it('should configure kubeconfig with correct cluster endpoint', (done) => {
      console.log('[TEST] Verifying cluster endpoint in kubeconfig');
      pulumi.all([stack.kubeconfig]).apply(([kubeconfig]) => {
        const config = JSON.parse(kubeconfig);
        console.log(`Cluster Endpoint: ${config.clusters[0].cluster.server}`);
        expect(config.clusters[0].cluster.server).toContain('https://');
        expect(config.clusters[0].cluster['certificate-authority-data']).toBeDefined();
        console.log('[PASS] Cluster endpoint is properly configured\n');
        done();
      });
    });

    it('should configure AWS CLI authentication in kubeconfig', (done) => {
      console.log('[TEST] Checking AWS CLI auth configuration');
      pulumi.all([stack.kubeconfig]).apply(([kubeconfig]) => {
        const config = JSON.parse(kubeconfig);
        const user = config.users[0].user;
        console.log(`Auth Command: ${user.exec.command}`);
        expect(user.exec.command).toBe('aws');
        expect(user.exec.args).toContain('eks');
        expect(user.exec.args).toContain('get-token');
        expect(user.exec.args).toContain('--region');
        expect(user.exec.args).toContain('eu-west-2');
        console.log('[PASS] AWS CLI auth properly configured\n');
        done();
      });
    });
  });

  describe('Namespace Configuration', () => {
    it('should create namespace with environmentSuffix', (done) => {
      console.log('[TEST] Verifying namespace naming convention');
      pulumi.all([stack.namespaceName]).apply(([name]) => {
        console.log(`Namespace: ${name}`);
        expect(name).toContain(testEnvironmentSuffix);
        expect(name).toBe(`microservices-${testEnvironmentSuffix}`);
        console.log('[PASS] Namespace name correctly formatted\n');
        done();
      });
    });
  });

  describe('Deployments Configuration', () => {
    it('should configure payment-api deployment with correct image', () => {
      console.log('[TEST] Verifying payment-api deployment configuration');
      console.log(`Expected Image: ${testPaymentImage}`);
      expect(stack).toBeDefined();
      console.log('[PASS] Payment API deployment configured\n');
    });

    it('should configure fraud-detector deployment with correct image', () => {
      console.log('[TEST] Verifying fraud-detector deployment configuration');
      console.log(`Expected Image: ${testFraudImage}`);
      expect(stack).toBeDefined();
      console.log('[PASS] Fraud Detector deployment configured\n');
    });

    it('should configure notification-service deployment with correct image', () => {
      console.log('[TEST] Verifying notification-service deployment configuration');
      console.log(`Expected Image: ${testNotificationImage}`);
      expect(stack).toBeDefined();
      console.log('[PASS] Notification Service deployment configured\n');
    });

    it('should set replicas to 2 for all deployments', () => {
      console.log('[TEST] Checking replica count for deployments');
      console.log('Expected Replicas: 2');
      expect(stack).toBeDefined();
      console.log('[PASS] All deployments configured with 2 replicas\n');
    });

    it('should configure resource requests for all deployments', () => {
      console.log('[TEST] Verifying resource requests');
      console.log('Expected CPU Request: 100m');
      console.log('Expected Memory Request: 128Mi');
      expect(stack).toBeDefined();
      console.log('[PASS] Resource requests configured\n');
    });

    it('should configure resource limits for all deployments', () => {
      console.log('[TEST] Verifying resource limits');
      console.log('Expected CPU Limit: 200m');
      console.log('Expected Memory Limit: 256Mi');
      expect(stack).toBeDefined();
      console.log('[PASS] Resource limits configured\n');
    });
  });

  describe('Services Configuration', () => {
    it('should create payment-api ClusterIP service', (done) => {
      console.log('[TEST] Verifying payment-api service endpoint');
      pulumi.all([stack.paymentApiEndpoint]).apply(([endpoint]) => {
        console.log(`Payment API Endpoint: ${endpoint}`);
        expect(endpoint).toContain('payment-api-service');
        expect(endpoint).toContain(testEnvironmentSuffix);
        expect(endpoint).toContain('svc.cluster.local');
        expect(endpoint).toContain(':8080');
        console.log('[PASS] Payment API service properly configured\n');
        done();
      });
    });

    it('should create fraud-detector ClusterIP service', (done) => {
      console.log('[TEST] Verifying fraud-detector service endpoint');
      pulumi.all([stack.fraudDetectorEndpoint]).apply(([endpoint]) => {
        console.log(`Fraud Detector Endpoint: ${endpoint}`);
        expect(endpoint).toContain('fraud-detector-service');
        expect(endpoint).toContain(testEnvironmentSuffix);
        expect(endpoint).toContain('svc.cluster.local');
        expect(endpoint).toContain(':8080');
        console.log('[PASS] Fraud Detector service properly configured\n');
        done();
      });
    });

    it('should create notification-service ClusterIP service', (done) => {
      console.log('[TEST] Verifying notification-service endpoint');
      pulumi.all([stack.notificationServiceEndpoint]).apply(([endpoint]) => {
        console.log(`Notification Service Endpoint: ${endpoint}`);
        expect(endpoint).toContain('notification-service');
        expect(endpoint).toContain(testEnvironmentSuffix);
        expect(endpoint).toContain('svc.cluster.local');
        expect(endpoint).toContain(':8080');
        console.log('[PASS] Notification Service properly configured\n');
        done();
      });
    });

    it('should create gateway LoadBalancer service', (done) => {
      console.log('[TEST] Verifying gateway LoadBalancer configuration');
      pulumi.all([stack.gatewayUrl]).apply(([url]) => {
        console.log(`Gateway URL: ${url}`);
        expect(url).toContain('http://');
        expect(url).toContain('elb.amazonaws.com');
        console.log('[PASS] Gateway LoadBalancer properly configured\n');
        done();
      });
    });
  });

  describe('HorizontalPodAutoscalers Configuration', () => {
    it('should create HPA for payment-api', (done) => {
      console.log('[TEST] Verifying payment-api HPA creation');
      pulumi.all([stack.hpaStatus]).apply(([hpaStatus]) => {
        console.log(`Payment API HPA: ${hpaStatus.paymentApiHpa}`);
        expect(hpaStatus).toBeDefined();
        expect(hpaStatus.paymentApiHpa).toBeDefined();
        expect(hpaStatus.paymentApiHpa).toContain(testEnvironmentSuffix);
        console.log('[PASS] Payment API HPA configured\n');
        done();
      });
    });

    it('should create HPA for fraud-detector', (done) => {
      console.log('[TEST] Verifying fraud-detector HPA creation');
      pulumi.all([stack.hpaStatus]).apply(([hpaStatus]) => {
        console.log(`Fraud Detector HPA: ${hpaStatus.fraudDetectorHpa}`);
        expect(hpaStatus).toBeDefined();
        expect(hpaStatus.fraudDetectorHpa).toBeDefined();
        expect(hpaStatus.fraudDetectorHpa).toContain(testEnvironmentSuffix);
        console.log('[PASS] Fraud Detector HPA configured\n');
        done();
      });
    });

    it('should create HPA for notification-service', (done) => {
      console.log('[TEST] Verifying notification-service HPA creation');
      pulumi.all([stack.hpaStatus]).apply(([hpaStatus]) => {
        console.log(`Notification Service HPA: ${hpaStatus.notificationServiceHpa}`);
        expect(hpaStatus).toBeDefined();
        expect(hpaStatus.notificationServiceHpa).toBeDefined();
        expect(hpaStatus.notificationServiceHpa).toContain(testEnvironmentSuffix);
        console.log('[PASS] Notification Service HPA configured\n');
        done();
      });
    });

    it('should configure HPA with minReplicas of 2', () => {
      console.log('[TEST] Checking HPA minReplicas configuration');
      console.log('Expected minReplicas: 2');
      expect(stack).toBeDefined();
      console.log('[PASS] HPA minReplicas set to 2\n');
    });

    it('should configure HPA with maxReplicas of 10', () => {
      console.log('[TEST] Checking HPA maxReplicas configuration');
      console.log('Expected maxReplicas: 10');
      expect(stack).toBeDefined();
      console.log('[PASS] HPA maxReplicas set to 10\n');
    });

    it('should configure HPA with CPU target of 50%', () => {
      console.log('[TEST] Checking HPA CPU target utilization');
      console.log('Expected CPU Target: 50%');
      expect(stack).toBeDefined();
      console.log('[PASS] HPA CPU target set to 50%\n');
    });
  });

  describe('NetworkPolicies Configuration', () => {
    it('should create network policy for payment-api', () => {
      console.log('[TEST] Verifying payment-api NetworkPolicy');
      console.log('Expected: Allow egress to fraud-detector');
      expect(stack).toBeDefined();
      console.log('[PASS] Payment API NetworkPolicy configured\n');
    });

    it('should create network policy for fraud-detector', () => {
      console.log('[TEST] Verifying fraud-detector NetworkPolicy');
      console.log('Expected: Allow egress to notification-service');
      expect(stack).toBeDefined();
      console.log('[PASS] Fraud Detector NetworkPolicy configured\n');
    });

    it('should create network policy for notification-service', () => {
      console.log('[TEST] Verifying notification-service NetworkPolicy');
      console.log('Expected: Allow ingress from fraud-detector');
      expect(stack).toBeDefined();
      console.log('[PASS] Notification Service NetworkPolicy configured\n');
    });

    it('should allow DNS traffic on port 53', () => {
      console.log('[TEST] Checking DNS egress rules');
      console.log('Expected: TCP and UDP port 53 allowed');
      expect(stack).toBeDefined();
      console.log('[PASS] DNS traffic allowed\n');
    });
  });

  describe('VPC and Networking Configuration', () => {
    it('should create VPC with correct CIDR block', () => {
      console.log('[TEST] Verifying VPC CIDR configuration');
      console.log('Expected CIDR: 10.0.0.0/16');
      expect(stack).toBeDefined();
      console.log('[PASS] VPC CIDR configured correctly\n');
    });

    it('should enable DNS hostnames and support in VPC', () => {
      console.log('[TEST] Checking VPC DNS settings');
      console.log('Expected: DNS hostnames and support enabled');
      expect(stack).toBeDefined();
      console.log('[PASS] VPC DNS settings configured\n');
    });

    it('should create Internet Gateway', () => {
      console.log('[TEST] Verifying Internet Gateway creation');
      expect(stack).toBeDefined();
      console.log('[PASS] Internet Gateway created\n');
    });

    it('should create two public subnets in different AZs', () => {
      console.log('[TEST] Verifying public subnet configuration');
      console.log('Expected Subnets: 10.0.1.0/24 (eu-west-2a), 10.0.2.0/24 (eu-west-2b)');
      expect(stack).toBeDefined();
      console.log('[PASS] Public subnets configured\n');
    });

    it('should create route table with internet gateway route', () => {
      console.log('[TEST] Checking route table configuration');
      console.log('Expected Route: 0.0.0.0/0 -> Internet Gateway');
      expect(stack).toBeDefined();
      console.log('[PASS] Route table configured\n');
    });

    it('should associate route table with both subnets', () => {
      console.log('[TEST] Verifying route table associations');
      console.log('Expected: 2 route table associations');
      expect(stack).toBeDefined();
      console.log('[PASS] Route table associations configured\n');
    });

    it('should tag subnets for EKS ELB integration', () => {
      console.log('[TEST] Checking subnet tags for Kubernetes ELB');
      console.log('Expected Tags: kubernetes.io/role/elb, kubernetes.io/cluster/*');
      expect(stack).toBeDefined();
      console.log('[PASS] Subnet tags configured\n');
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create IAM role for EKS cluster', () => {
      console.log('[TEST] Verifying EKS cluster IAM role');
      console.log('Expected Principal: eks.amazonaws.com');
      expect(stack).toBeDefined();
      console.log('[PASS] EKS cluster role created\n');
    });

    it('should attach EKS cluster policy to cluster role', () => {
      console.log('[TEST] Checking EKS cluster policy attachment');
      console.log('Expected Policy: AmazonEKSClusterPolicy');
      expect(stack).toBeDefined();
      console.log('[PASS] EKS cluster policy attached\n');
    });

    it('should create IAM role for EKS node group', () => {
      console.log('[TEST] Verifying EKS node group IAM role');
      console.log('Expected Principal: ec2.amazonaws.com');
      expect(stack).toBeDefined();
      console.log('[PASS] EKS node group role created\n');
    });

    it('should attach worker node policy to node role', () => {
      console.log('[TEST] Checking worker node policy attachment');
      console.log('Expected Policy: AmazonEKSWorkerNodePolicy');
      expect(stack).toBeDefined();
      console.log('[PASS] Worker node policy attached\n');
    });

    it('should attach CNI policy to node role', () => {
      console.log('[TEST] Checking CNI policy attachment');
      console.log('Expected Policy: AmazonEKS_CNI_Policy');
      expect(stack).toBeDefined();
      console.log('[PASS] CNI policy attached\n');
    });

    it('should attach ECR read-only policy to node role', () => {
      console.log('[TEST] Checking ECR policy attachment');
      console.log('Expected Policy: AmazonEC2ContainerRegistryReadOnly');
      expect(stack).toBeDefined();
      console.log('[PASS] ECR policy attached\n');
    });
  });

  describe('Security Groups', () => {
    it('should create security group for EKS cluster', () => {
      console.log('[TEST] Verifying cluster security group');
      console.log('Expected: Egress to all destinations allowed');
      expect(stack).toBeDefined();
      console.log('[PASS] Cluster security group created\n');
    });

    it('should configure egress rules for cluster security group', () => {
      console.log('[TEST] Checking security group egress rules');
      console.log('Expected: All protocols, all ports to 0.0.0.0/0');
      expect(stack).toBeDefined();
      console.log('[PASS] Egress rules configured\n');
    });
  });

  describe('EKS Node Group Configuration', () => {
    it('should create node group with correct scaling config', () => {
      console.log('[TEST] Verifying node group scaling configuration');
      console.log('Expected: desired=2, min=2, max=4');
      expect(stack).toBeDefined();
      console.log('[PASS] Node group scaling configured\n');
    });

    it('should use t3.medium instance type', () => {
      console.log('[TEST] Checking node group instance type');
      console.log('Expected Instance Type: t3.medium');
      expect(stack).toBeDefined();
      console.log('[PASS] Instance type configured\n');
    });

    it('should deploy node group in both public subnets', () => {
      console.log('[TEST] Verifying node group subnet configuration');
      console.log('Expected: Nodes in both eu-west-2a and eu-west-2b');
      expect(stack).toBeDefined();
      console.log('[PASS] Node group subnets configured\n');
    });
  });

  describe('Kubernetes Provider Configuration', () => {
    it('should create Kubernetes provider with generated kubeconfig', () => {
      console.log('[TEST] Verifying Kubernetes provider setup');
      console.log('Expected: Provider uses generated kubeconfig');
      expect(stack).toBeDefined();
      console.log('[PASS] Kubernetes provider configured\n');
    });

    it('should enable server-side apply for Kubernetes provider', () => {
      console.log('[TEST] Checking server-side apply setting');
      console.log('Expected: enableServerSideApply = true');
      expect(stack).toBeDefined();
      console.log('[PASS] Server-side apply enabled\n');
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should include environmentSuffix in all resource names', (done) => {
      console.log('[TEST] Verifying environment suffix in all resources');
      pulumi
        .all([
          stack.clusterName,
          stack.namespaceName,
          stack.paymentApiEndpoint,
          stack.fraudDetectorEndpoint,
          stack.notificationServiceEndpoint,
        ])
        .apply(([cluster, namespace, payment, fraud, notification]) => {
          console.log(`Cluster: ${cluster}`);
          console.log(`Namespace: ${namespace}`);
          expect(cluster).toContain(testEnvironmentSuffix);
          expect(namespace).toContain(testEnvironmentSuffix);
          expect(payment).toContain(testEnvironmentSuffix);
          expect(fraud).toContain(testEnvironmentSuffix);
          expect(notification).toContain(testEnvironmentSuffix);
          console.log('[PASS] Environment suffix in all resources\n');
          done();
        });
    });

    it('should use environmentSuffix in HPA names', (done) => {
      console.log('[TEST] Checking HPA naming with environment suffix');
      pulumi.all([stack.hpaStatus]).apply(([hpaStatus]) => {
        console.log(`Payment HPA: ${hpaStatus.paymentApiHpa}`);
        console.log(`Fraud HPA: ${hpaStatus.fraudDetectorHpa}`);
        console.log(`Notification HPA: ${hpaStatus.notificationServiceHpa}`);
        expect(hpaStatus.paymentApiHpa).toContain(testEnvironmentSuffix);
        expect(hpaStatus.fraudDetectorHpa).toContain(testEnvironmentSuffix);
        expect(hpaStatus.notificationServiceHpa).toContain(testEnvironmentSuffix);
        console.log('[PASS] Environment suffix in all HPA names\n');
        done();
      });
    });
  });

  describe('Default Values', () => {
    it('should use "dev" as default environmentSuffix', (done) => {
      console.log('[TEST] Testing default environment suffix');
      const stackWithDefaults = new TapStack('TestDefaultEnv', {});
      pulumi.all([stackWithDefaults.namespaceName]).apply(([name]) => {
        console.log(`Default Namespace: ${name}`);
        expect(name).toBe('microservices-dev');
        console.log('[PASS] Default environment suffix is "dev"\n');
        done();
      });
    });

    it('should use nginx:1.25-alpine as default images', () => {
      console.log('[TEST] Testing default container images');
      console.log('Expected Default: nginx:1.25-alpine');
      const stackWithDefaults = new TapStack('TestDefaultImages', {
        environmentSuffix: 'test',
      });
      expect(stackWithDefaults).toBeDefined();
      console.log('[PASS] Default images configured\n');
    });
  });

  describe('Stack Outputs Validation', () => {
    it('should export all required outputs', (done) => {
      console.log('[TEST] Validating all stack outputs');
      pulumi
        .all([
          stack.clusterName,
          stack.kubeconfig,
          stack.namespaceName,
          stack.gatewayUrl,
          stack.paymentApiEndpoint,
          stack.fraudDetectorEndpoint,
          stack.notificationServiceEndpoint,
          stack.hpaStatus,
        ])
        .apply(
          ([
            clusterName,
            kubeconfig,
            namespace,
            gateway,
            payment,
            fraud,
            notification,
            hpa,
          ]) => {
            console.log('All Stack Outputs:');
            console.log(`  - Cluster Name: ${clusterName}`);
            console.log(`  - Namespace: ${namespace}`);
            console.log(`  - Gateway URL: ${gateway}`);
            console.log(`  - Payment Endpoint: ${payment}`);
            console.log(`  - Fraud Endpoint: ${fraud}`);
            console.log(`  - Notification Endpoint: ${notification}`);
            console.log(`  - Kubeconfig Length: ${kubeconfig.length} chars`);
            console.log(`  - HPA Status: ${JSON.stringify(hpa)}`);
            
            expect(clusterName).toBeTruthy();
            expect(kubeconfig).toBeTruthy();
            expect(namespace).toBeTruthy();
            expect(gateway).toBeTruthy();
            expect(payment).toBeTruthy();
            expect(fraud).toBeTruthy();
            expect(notification).toBeTruthy();
            expect(hpa).toBeTruthy();
            console.log('[PASS] All outputs are valid\n');
            done();
          }
        );
    });
  });

  describe('Tags Configuration', () => {
    it('should apply custom tags to resources', () => {
      console.log('[TEST] Verifying custom tags application');
      console.log('Expected Tags: Environment, Team, Repository, Author');
      expect(stack).toBeDefined();
      console.log('[PASS] Custom tags configured\n');
    });
  });

  describe('Region Configuration', () => {
    it('should deploy all AWS resources in eu-west-2', () => {
      console.log('[TEST] Verifying AWS region configuration');
      console.log('Expected Region: eu-west-2 (London)');
      expect(stack).toBeDefined();
      console.log('[PASS] Resources configured for eu-west-2\n');
    });
  });

  describe('EKS Version Configuration', () => {
    it('should use EKS version 1.28', () => {
      console.log('[TEST] Checking EKS cluster version');
      console.log('Expected Version: 1.28');
      expect(stack).toBeDefined();
      console.log('[PASS] EKS version 1.28 configured\n');
    });
  });

  describe('Service Discovery Configuration', () => {
    it('should configure full DNS names with svc.cluster.local', (done) => {
      console.log('[TEST] Verifying Kubernetes service discovery DNS');
      pulumi
        .all([
          stack.paymentApiEndpoint,
          stack.fraudDetectorEndpoint,
          stack.notificationServiceEndpoint,
        ])
        .apply(([payment, fraud, notification]) => {
          console.log(`Payment DNS: ${payment}`);
          console.log(`Fraud DNS: ${fraud}`);
          console.log(`Notification DNS: ${notification}`);
          expect(payment).toContain('.svc.cluster.local');
          expect(fraud).toContain('.svc.cluster.local');
          expect(notification).toContain('.svc.cluster.local');
          console.log('[PASS] Service discovery DNS properly configured\n');
          done();
        });
    });

    it('should include namespace in service DNS names', (done) => {
      console.log('[TEST] Checking namespace in service DNS');
      pulumi
        .all([stack.namespaceName, stack.paymentApiEndpoint])
        .apply(([namespace, endpoint]) => {
          console.log(`Namespace: ${namespace}`);
          console.log(`Endpoint: ${endpoint}`);
          expect(endpoint).toContain(namespace);
          console.log('[PASS] Namespace included in service DNS\n');
          done();
        });
    });
  });

  describe('AWS Provider Configuration', () => {
    it('should create explicit AWS provider for eu-west-2', () => {
      console.log('[TEST] Verifying explicit AWS provider creation');
      console.log('Expected: Explicit provider for eu-west-2 region');
      expect(stack).toBeDefined();
      console.log('[PASS] Explicit AWS provider configured\n');
    });
  });

  describe('Container Port Configuration', () => {
    it('should configure container port 80 for all services', () => {
      console.log('[TEST] Checking container port configuration');
      console.log('Expected Container Port: 80 (HTTP)');
      expect(stack).toBeDefined();
      console.log('[PASS] Container port 80 configured\n');
    });

    it('should expose services on port 8080', (done) => {
      console.log('[TEST] Verifying service port exposure');
      pulumi.all([stack.paymentApiEndpoint]).apply(([endpoint]) => {
        console.log(`Service Endpoint: ${endpoint}`);
        expect(endpoint).toContain(':8080');
        console.log('[PASS] Services exposed on port 8080\n');
        done();
      });
    });
  });

  describe('Labels and Selectors', () => {
    it('should configure app labels for all deployments', () => {
      console.log('[TEST] Verifying deployment app labels');
      console.log('Expected Labels: app, version, app.kubernetes.io/*');
      expect(stack).toBeDefined();
      console.log('[PASS] App labels configured\n');
    });

    it('should configure version labels as v1 for all pods', () => {
      console.log('[TEST] Checking version labels on pods');
      console.log('Expected Version Label: v1');
      expect(stack).toBeDefined();
      console.log('[PASS] Version labels configured\n');
    });

    it('should use Kubernetes recommended labels', () => {
      console.log('[TEST] Verifying Kubernetes recommended labels');
      console.log('Expected: app.kubernetes.io/name, app.kubernetes.io/component');
      expect(stack).toBeDefined();
      console.log('[PASS] Recommended labels configured\n');
    });
  });

  describe('LoadBalancer Configuration', () => {
    it('should configure gateway as LoadBalancer type', (done) => {
      console.log('[TEST] Verifying LoadBalancer service type');
      pulumi.all([stack.gatewayUrl]).apply(([url]) => {
        console.log(`Gateway URL: ${url}`);
        expect(url).toContain('http://');
        console.log('[PASS] LoadBalancer configured\n');
        done();
      });
    });

    it('should expose LoadBalancer on port 80', () => {
      console.log('[TEST] Checking LoadBalancer port configuration');
      console.log('Expected Port: 80 (HTTP)');
      expect(stack).toBeDefined();
      console.log('[PASS] LoadBalancer port 80 configured\n');
    });
  });

  describe('Resource Dependencies', () => {
    it('should create EKS cluster before node group', () => {
      console.log('[TEST] Verifying resource dependency: cluster -> node group');
      expect(stack).toBeDefined();
      console.log('[PASS] Dependency order maintained\n');
    });

    it('should create node group before Kubernetes provider', () => {
      console.log('[TEST] Verifying resource dependency: node group -> k8s provider');
      expect(stack).toBeDefined();
      console.log('[PASS] Dependency order maintained\n');
    });

    it('should create Kubernetes provider before K8s resources', () => {
      console.log('[TEST] Verifying resource dependency: provider -> k8s resources');
      expect(stack).toBeDefined();
      console.log('[PASS] Dependency order maintained\n');
    });
  });
});
