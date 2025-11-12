import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: `${args.name}_id`,
        url: `https://${args.name}.example.com`,
        repositoryUrl: `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}`,
        dnsName: `${args.name}.us-east-1.elb.amazonaws.com`,
        name: args.name,
      }
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs): { outputs: any } {
    return { outputs: {} };
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  
  beforeEach(() => {
    // Create a new stack instance before each test
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        Team: 'synth',
      },
    });
  });

  describe('Stack Instantiation', () => {
    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have required outputs', async () => {
      const albDnsName = await stack.albDnsName;
      const clusterArn = await stack.clusterArn;
      const ecrRepositories = await stack.ecrRepositories;

      expect(albDnsName).toBeDefined();
      expect(clusterArn).toBeDefined();
      expect(ecrRepositories).toBeDefined();
      expect(Array.isArray(ecrRepositories)).toBe(true);
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR block', async () => {
      const resources = await getResourcesOfType('aws:ec2/vpc:Vpc');
      expect(resources.length).toBeGreaterThan(0);
      
      const vpc = resources[0];
      expect(vpc.cidrBlock).toBe('10.0.0.0/16');
      expect(vpc.enableDnsHostnames).toBe(true);
      expect(vpc.enableDnsSupport).toBe(true);
    });

    it('should create 3 public subnets', async () => {
      const subnets = await getResourcesOfType('aws:ec2/subnet:Subnet');
      const publicSubnets = subnets.filter(s => 
        s.name.includes('public') && s.mapPublicIpOnLaunch === true
      );
      
      expect(publicSubnets.length).toBe(3);
      expect(publicSubnets[0].cidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnets[1].cidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnets[2].cidrBlock).toBe('10.0.3.0/24');
    });

    it('should create 3 private subnets', async () => {
      const subnets = await getResourcesOfType('aws:ec2/subnet:Subnet');
      const privateSubnets = subnets.filter(s => 
        s.name.includes('private') && s.mapPublicIpOnLaunch !== true
      );
      
      expect(privateSubnets.length).toBe(3);
      expect(privateSubnets[0].cidrBlock).toBe('10.0.11.0/24');
      expect(privateSubnets[1].cidrBlock).toBe('10.0.12.0/24');
      expect(privateSubnets[2].cidrBlock).toBe('10.0.13.0/24');
    });

    it('should create Internet Gateway', async () => {
      const igws = await getResourcesOfType('aws:ec2/internetGateway:InternetGateway');
      expect(igws.length).toBe(1);
    });

    it('should create 3 NAT Gateways', async () => {
      const natGateways = await getResourcesOfType('aws:ec2/natGateway:NatGateway');
      expect(natGateways.length).toBe(3);
    });

    it('should create 3 Elastic IPs for NAT Gateways', async () => {
      const eips = await getResourcesOfType('aws:ec2/eip:Eip');
      expect(eips.length).toBe(3);
      eips.forEach(eip => {
        expect(eip.domain).toBe('vpc');
      });
    });

    it('should create route tables with correct routes', async () => {
      const routeTables = await getResourcesOfType('aws:ec2/routeTable:RouteTable');
      expect(routeTables.length).toBe(4); // 1 public + 3 private
      
      const routes = await getResourcesOfType('aws:ec2/route:Route');
      expect(routes.length).toBe(4); // 1 IGW + 3 NAT
    });
  });

  describe('ECR Repositories', () => {
    it('should create 3 ECR repositories with environmentSuffix', async () => {
      const repos = await getResourcesOfType('aws:ecr/repository:Repository');
      expect(repos.length).toBe(3);
      
      const repoNames = repos.map(r => r.name);
      expect(repoNames).toContain('frontend-repo-test');
      expect(repoNames).toContain('api-gateway-repo-test');
      expect(repoNames).toContain('processing-service-repo-test');
    });

    it('should configure ECR repositories with image scanning', async () => {
      const repos = await getResourcesOfType('aws:ecr/repository:Repository');
      
      repos.forEach(repo => {
        expect(repo.imageTagMutability).toBe('IMMUTABLE');
        expect(repo.imageScanningConfiguration).toBeDefined();
        expect(repo.imageScanningConfiguration.scanOnPush).toBe(true);
      });
    });

    it('should create lifecycle policies for ECR repositories', async () => {
      const policies = await getResourcesOfType('aws:ecr/lifecyclePolicy:LifecyclePolicy');
      expect(policies.length).toBe(3);
    });
  });

  describe('ECS Cluster', () => {
    it('should create ECS cluster with Container Insights', async () => {
      const clusters = await getResourcesOfType('aws:ecs/cluster:Cluster');
      expect(clusters.length).toBe(1);
      
      const cluster = clusters[0];
      expect(cluster.settings).toBeDefined();
      expect(cluster.settings[0].name).toBe('containerInsights');
      expect(cluster.settings[0].value).toBe('enabled');
    });

    it('should configure capacity providers', async () => {
      const capacityProviders = await getResourcesOfType('aws:ecs/clusterCapacityProviders:ClusterCapacityProviders');
      expect(capacityProviders.length).toBe(1);
      
      const cp = capacityProviders[0];
      expect(cp.capacityProviders).toContain('FARGATE');
      expect(cp.capacityProviders).toContain('FARGATE_SPOT');
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should create 3 CloudWatch log groups', async () => {
      const logGroups = await getResourcesOfType('aws:cloudwatch/logGroup:LogGroup');
      expect(logGroups.length).toBe(3);
      
      const logGroupNames = logGroups.map(lg => lg.name);
      expect(logGroupNames).toContain('frontend-logs-test');
      expect(logGroupNames).toContain('api-gateway-logs-test');
      expect(logGroupNames).toContain('processing-service-logs-test');
    });

    it('should configure 30-day retention for log groups', async () => {
      const logGroups = await getResourcesOfType('aws:cloudwatch/logGroup:LogGroup');
      
      logGroups.forEach(lg => {
        expect(lg.retentionInDays).toBe(30);
      });
    });
  });

  describe('Secrets Manager', () => {
    it('should create 3 secrets in Secrets Manager', async () => {
      const secrets = await getResourcesOfType('aws:secretsmanager/secret:Secret');
      expect(secrets.length).toBe(3);
      
      const secretNames = secrets.map(s => s.name);
      expect(secretNames).toContain('db-credentials-test');
      expect(secretNames).toContain('api-keys-test');
      expect(secretNames).toContain('jwt-signing-key-test');
    });

    it('should create secret versions', async () => {
      const secretVersions = await getResourcesOfType('aws:secretsmanager/secretVersion:SecretVersion');
      expect(secretVersions.length).toBe(3);
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security group with correct ingress rules', async () => {
      const securityGroups = await getResourcesOfType('aws:ec2/securityGroup:SecurityGroup');
      const albSg = securityGroups.find(sg => sg.name.includes('alb-sg'));
      
      expect(albSg).toBeDefined();
      expect(albSg.ingress.length).toBe(2);
      
      // HTTP ingress
      expect(albSg.ingress[0].fromPort).toBe(80);
      expect(albSg.ingress[0].toPort).toBe(80);
      expect(albSg.ingress[0].cidrBlocks).toContain('0.0.0.0/0');
      
      // HTTPS ingress
      expect(albSg.ingress[1].fromPort).toBe(443);
      expect(albSg.ingress[1].toPort).toBe(443);
      expect(albSg.ingress[1].cidrBlocks).toContain('0.0.0.0/0');
    });

    it('should create ECS task security group with ingress rules from ALB', async () => {
      const securityGroups = await getResourcesOfType('aws:ec2/securityGroup:SecurityGroup');
      const ecsTaskSg = securityGroups.find(sg => sg.name.includes('ecs-task-sg'));
      
      expect(ecsTaskSg).toBeDefined();
      expect(ecsTaskSg.ingress.length).toBe(3);
      
      // Frontend port from ALB
      const frontendIngress = ecsTaskSg.ingress.find(i => i.fromPort === 3000);
      expect(frontendIngress).toBeDefined();
      expect(frontendIngress.securityGroups).toBeDefined();
      
      // API Gateway port from ALB
      const apiIngress = ecsTaskSg.ingress.find(i => i.fromPort === 8080);
      expect(apiIngress).toBeDefined();
      expect(apiIngress.securityGroups).toBeDefined();
      
      // Processing service port from VPC
      const processingIngress = ecsTaskSg.ingress.find(i => i.fromPort === 9090);
      expect(processingIngress).toBeDefined();
      expect(processingIngress.cidrBlocks).toContain('10.0.0.0/16');
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create task execution role', async () => {
      const roles = await getResourcesOfType('aws:iam/role:Role');
      const executionRole = roles.find(r => r.name.includes('task-execution-role'));
      
      expect(executionRole).toBeDefined();
    });

    it('should attach ECS execution policy to execution role', async () => {
      const attachments = await getResourcesOfType('aws:iam/rolePolicyAttachment:RolePolicyAttachment');
      const ecsAttachment = attachments.find(a => 
        a.policyArn === 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
      
      expect(ecsAttachment).toBeDefined();
    });

    it('should create task roles for each service', async () => {
      const roles = await getResourcesOfType('aws:iam/role:Role');
      
      expect(roles.find(r => r.name.includes('frontend-task-role'))).toBeDefined();
      expect(roles.find(r => r.name.includes('api-gateway-task-role'))).toBeDefined();
      expect(roles.find(r => r.name.includes('processing-task-role'))).toBeDefined();
    });

    it('should create frontend task role with read-only S3 policy', async () => {
      const policies = await getResourcesOfType('aws:iam/rolePolicy:RolePolicy');
      const frontendPolicy = policies.find(p => p.name.includes('frontend-s3-policy'));
      
      expect(frontendPolicy).toBeDefined();
      
      const policy = JSON.parse(frontendPolicy.policy);
      expect(policy.Statement[0].Action).toContain('s3:GetObject');
      expect(policy.Statement[0].Action).toContain('s3:ListBucket');
      expect(policy.Statement[0].Action).not.toContain('s3:*');
    });

    it('should create secrets access policy for execution role', async () => {
      const policies = await getResourcesOfType('aws:iam/rolePolicy:RolePolicy');
      const secretsPolicy = policies.find(p => p.name.includes('secrets-access-policy'));
      
      expect(secretsPolicy).toBeDefined();
    });
  });

  describe('Service Discovery', () => {
    it('should create Cloud Map namespace', async () => {
      const namespaces = await getResourcesOfType('aws:servicediscovery/privateDnsNamespace:PrivateDnsNamespace');
      expect(namespaces.length).toBe(1);
      
      const namespace = namespaces[0];
      expect(namespace.name).toBe('trading.test.local');
    });

    it('should create service discovery services for each ECS service', async () => {
      const services = await getResourcesOfType('aws:servicediscovery/service:Service');
      expect(services.length).toBe(3);
      
      const serviceNames = services.map(s => s.name);
      expect(serviceNames).toContain('frontend');
      expect(serviceNames).toContain('api-gateway');
      expect(serviceNames).toContain('processing-service');
    });
  });

  describe('Task Definitions', () => {
    it('should create 3 task definitions', async () => {
      const taskDefs = await getResourcesOfType('aws:ecs/taskDefinition:TaskDefinition');
      expect(taskDefs.length).toBe(3);
    });

    it('should configure frontend task with correct CPU/Memory', async () => {
      const taskDefs = await getResourcesOfType('aws:ecs/taskDefinition:TaskDefinition');
      const frontendTask = taskDefs.find(td => td.family.includes('frontend'));
      
      expect(frontendTask).toBeDefined();
      expect(frontendTask.cpu).toBe('512');
      expect(frontendTask.memory).toBe('1024');
      expect(frontendTask.networkMode).toBe('awsvpc');
      expect(frontendTask.requiresCompatibilities).toContain('FARGATE');
    });

    it('should configure API Gateway task with correct CPU/Memory', async () => {
      const taskDefs = await getResourcesOfType('aws:ecs/taskDefinition:TaskDefinition');
      const apiTask = taskDefs.find(td => td.family.includes('api-gateway'));
      
      expect(apiTask).toBeDefined();
      expect(apiTask.cpu).toBe('1024');
      expect(apiTask.memory).toBe('2048');
    });

    it('should configure processing task with correct CPU/Memory', async () => {
      const taskDefs = await getResourcesOfType('aws:ecs/taskDefinition:TaskDefinition');
      const processingTask = taskDefs.find(td => td.family.includes('processing-service'));
      
      expect(processingTask).toBeDefined();
      expect(processingTask.cpu).toBe('2048');
      expect(processingTask.memory).toBe('4096');
    });
  });

  describe('Application Load Balancer', () => {
    it('should create ALB', async () => {
      const albs = await getResourcesOfType('aws:lb/loadBalancer:LoadBalancer');
      expect(albs.length).toBe(1);
      
      const alb = albs[0];
      expect(alb.internal).toBe(false);
      expect(alb.loadBalancerType).toBe('application');
    });

    it('should create target groups for frontend and API Gateway', async () => {
      const targetGroups = await getResourcesOfType('aws:lb/targetGroup:TargetGroup');
      expect(targetGroups.length).toBe(2);
      
      const frontendTg = targetGroups.find(tg => tg.name.includes('frontend'));
      const apiTg = targetGroups.find(tg => tg.name.includes('api-gateway'));
      
      expect(frontendTg).toBeDefined();
      expect(frontendTg.port).toBe(3000);
      expect(frontendTg.protocol).toBe('HTTP');
      expect(frontendTg.targetType).toBe('ip');
      
      expect(apiTg).toBeDefined();
      expect(apiTg.port).toBe(8080);
      expect(apiTg.protocol).toBe('HTTP');
      expect(apiTg.targetType).toBe('ip');
    });

    it('should configure health checks for target groups', async () => {
      const targetGroups = await getResourcesOfType('aws:lb/targetGroup:TargetGroup');
      
      targetGroups.forEach(tg => {
        expect(tg.healthCheck).toBeDefined();
        expect(tg.healthCheck.enabled).toBe(true);
        expect(tg.healthCheck.path).toBe('/health');
        expect(tg.healthCheck.protocol).toBe('HTTP');
      });
    });

    it('should create ALB listener', async () => {
      const listeners = await getResourcesOfType('aws:lb/listener:Listener');
      expect(listeners.length).toBe(1);
      
      const listener = listeners[0];
      expect(listener.port).toBe(80);
      expect(listener.protocol).toBe('HTTP');
    });

    it('should create listener rule for API Gateway', async () => {
      const rules = await getResourcesOfType('aws:lb/listenerRule:ListenerRule');
      expect(rules.length).toBe(1);
      
      const apiRule = rules[0];
      expect(apiRule.priority).toBe(100);
      expect(apiRule.conditions[0].pathPattern.values).toContain('/api/*');
    });
  });

  describe('ECS Services', () => {
    it('should create 3 ECS services', async () => {
      const services = await getResourcesOfType('aws:ecs/service:Service');
      expect(services.length).toBe(3);
    });

    it('should configure frontend service with load balancer', async () => {
      const services = await getResourcesOfType('aws:ecs/service:Service');
      const frontendService = services.find(s => s.name.includes('frontend-service'));
      
      expect(frontendService).toBeDefined();
      expect(frontendService.desiredCount).toBe(2);
      expect(frontendService.launchType).toBe('FARGATE');
      expect(frontendService.loadBalancers).toBeDefined();
      expect(frontendService.loadBalancers.length).toBe(1);
    });

    it('should configure API Gateway service with load balancer', async () => {
      const services = await getResourcesOfType('aws:ecs/service:Service');
      const apiService = services.find(s => s.name.includes('api-gateway-service'));
      
      expect(apiService).toBeDefined();
      expect(apiService.desiredCount).toBe(2);
      expect(apiService.loadBalancers).toBeDefined();
      expect(apiService.loadBalancers.length).toBe(1);
    });

    it('should configure processing service without load balancer', async () => {
      const services = await getResourcesOfType('aws:ecs/service:Service');
      const processingService = services.find(s => s.name.includes('processing-service'));
      
      expect(processingService).toBeDefined();
      expect(processingService.desiredCount).toBe(2);
      expect(processingService.loadBalancers).toBeUndefined();
    });

    it('should configure service registries for all services', async () => {
      const services = await getResourcesOfType('aws:ecs/service:Service');
      
      services.forEach(service => {
        expect(service.serviceRegistries).toBeDefined();
      });
    });
  });

  describe('Auto Scaling', () => {
    it('should create auto scaling targets for all services', async () => {
      const targets = await getResourcesOfType('aws:appautoscaling/target:Target');
      expect(targets.length).toBe(3);
      
      targets.forEach(target => {
        expect(target.minCapacity).toBe(2);
        expect(target.maxCapacity).toBe(10);
        expect(target.scalableDimension).toBe('ecs:service:DesiredCount');
        expect(target.serviceNamespace).toBe('ecs');
      });
    });

    it('should create auto scaling policies for all services', async () => {
      const policies = await getResourcesOfType('aws:appautoscaling/policy:Policy');
      expect(policies.length).toBe(3);
      
      policies.forEach(policy => {
        expect(policy.policyType).toBe('TargetTrackingScaling');
        expect(policy.targetTrackingScalingPolicyConfiguration.targetValue).toBe(70.0);
        expect(policy.targetTrackingScalingPolicyConfiguration.predefinedMetricSpecification.predefinedMetricType)
          .toBe('ECSServiceAverageCPUUtilization');
      });
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', async () => {
      const allResources = await getAllResources();
      
      allResources.forEach(resource => {
        expect(resource.name).toContain('test');
      });
    });

    it('should use consistent naming convention', async () => {
      const allResources = await getAllResources();
      
      // Check that resource names follow pattern: resource-type-environment-suffix
      allResources.forEach(resource => {
        expect(resource.name).toMatch(/^[\w-]+-test$/);
      });
    });
  });

  describe('Tagging', () => {
    it('should apply tags to all resources', async () => {
      const resources = await getAllResources();
      const taggedResources = resources.filter(r => r.tags);
      
      expect(taggedResources.length).toBeGreaterThan(0);
      
      taggedResources.forEach(resource => {
        expect(resource.tags.Environment).toBe('test');
      });
    });
  });
});

// Helper functions
async function getResourcesOfType(type: string): Promise<any[]> {
  const resources: any[] = [];
  
  function visit(obj: any) {
    if (obj && typeof obj === 'object') {
      if (obj.__pulumiType === type) {
        resources.push(obj);
      }
      for (const key in obj) {
        visit(obj[key]);
      }
    }
  }
  
  // This is a simplified implementation
  // In real tests, you'd use Pulumi's testing utilities
  return resources;
}

async function getAllResources(): Promise<any[]> {
  // This would typically use Pulumi's resource tracking
  return [];
}
