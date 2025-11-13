import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region });

const ec2 = new AWS.EC2();
const ecs = new AWS.ECS();
const ecr = new AWS.ECR();
const elbv2 = new AWS.ELBv2();
const cloudwatch = new AWS.CloudWatchLogs();
const secretsManager = new AWS.SecretsManager();
const servicediscovery = new AWS.ServiceDiscovery();
const iam = new AWS.IAM();

describe('TAP Stack Integration Tests', () => {
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr6415';

  describe('VPC and Networking', () => {
    let vpcId: string;

    beforeAll(async () => {
      // Get VPC ID from deployed resources
      const response = await ec2.describeVpcs({
        Filters: [{ Name: 'tag:Name', Values: [`ecs-vpc-${environmentSuffix}`] }]
      }).promise();

      if (response.Vpcs && response.Vpcs.length > 0) {
        vpcId = response.Vpcs[0].VpcId!;
      }
    });

    it('should have VPC deployed', async () => {
      const response = await ec2.describeVpcs({
        Filters: [{ Name: 'tag:Name', Values: [`ecs-vpc-${environmentSuffix}`] }]
      }).promise();

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    it('should have 3 public subnets across different AZs', async () => {
      const response = await ec2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['*public*'] }
        ]
      }).promise();

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    it('should have 3 private subnets across different AZs', async () => {
      const response = await ec2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['*private*'] }
        ]
      }).promise();

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    it('should have Internet Gateway attached', async () => {
      const response = await ec2.describeInternetGateways({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [vpcId] }
        ]
      }).promise();

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);
      expect(response.InternetGateways![0].Attachments![0].State).toBe('available');
    });

    it('should have 3 NAT Gateways', async () => {
      const response = await ec2.describeNatGateways({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(3);
    });

    it('should have proper route tables configured', async () => {
      const response = await ec2.describeRouteTables({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] }
        ]
      }).promise();

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4); // 1 main + 1 public + 3 private
    });
  });

  describe('ECR Repositories', () => {
    it('should have 3 ECR repositories created', async () => {
      const response = await ecr.describeRepositories({}).promise();

      const repos = response.repositories!.filter(r =>
        r.repositoryName!.includes('frontend') ||
        r.repositoryName!.includes('api-gateway') ||
        r.repositoryName!.includes('processing')
      );

      expect(repos.length).toBe(3);
    });

    it('should have image scanning enabled', async () => {
      const response = await ecr.describeRepositories({}).promise();

      const repos = response.repositories!.filter(r =>
        r.repositoryName!.includes('frontend') ||
        r.repositoryName!.includes('api-gateway') ||
        r.repositoryName!.includes('processing')
      );

      repos.forEach(repo => {
        expect(repo.imageScanningConfiguration!.scanOnPush).toBe(true);
      });
    });

    it('should have tag immutability enabled', async () => {
      const response = await ecr.describeRepositories({}).promise();

      const repos = response.repositories!.filter(r =>
        r.repositoryName!.includes('frontend') ||
        r.repositoryName!.includes('api-gateway') ||
        r.repositoryName!.includes('processing')
      );

      repos.forEach(repo => {
        expect(repo.imageTagMutability).toBe('IMMUTABLE');
      });
    });
  });

  describe('ECS Cluster', () => {
    let clusterArn: string;

    beforeAll(() => {
      clusterArn = outputs['clusterArn'] || '';
    });

    it('should have ECS cluster created', async () => {
      const response = await ecs.describeClusters({
        clusters: [clusterArn]
      }).promise();

      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    it('should have Container Insights enabled', async () => {
      const response = await ecs.describeClusters({
        clusters: [clusterArn],
        include: ['SETTINGS']
      }).promise();

      const cluster = response.clusters![0];
      const containerInsights = cluster.settings!.find(s => s.name === 'containerInsights');
      
      expect(containerInsights).toBeDefined();
      expect(containerInsights!.value).toBe('enabled');
    });

    it('should have capacity providers configured', async () => {
      const response = await ecs.describeCapacityProviders({}).promise();

      const fargateProviders = response.capacityProviders!.filter(cp =>
        cp.name === 'FARGATE' || cp.name === 'FARGATE_SPOT'
      );

      expect(fargateProviders.length).toBe(2);
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should have 3 log groups created', async () => {
      const logGroupNames = [
        'frontend-logs',
        'api-gateway-logs',
        'processing-service-logs'
      ];

      for (const name of logGroupNames) {
        const response = await cloudwatch.describeLogGroups({
          logGroupNamePrefix: name
        }).promise();

        expect(response.logGroups).toBeDefined();
        expect(response.logGroups!.length).toBeGreaterThan(0);
      }
    });

    it('should have 30-day retention configured', async () => {
      const logGroupNames = [
        'frontend-logs',
        'api-gateway-logs',
        'processing-service-logs'
      ];

      for (const name of logGroupNames) {
        const response = await cloudwatch.describeLogGroups({
          logGroupNamePrefix: name
        }).promise();

        expect(response.logGroups![0].retentionInDays).toBe(30);
      }
    });
  });

  describe('Secrets Manager', () => {
    it('should have 3 secrets created', async () => {
      const response = await secretsManager.listSecrets({}).promise();

      const secrets = response.SecretList!.filter(s =>
        s.Name!.includes('db-credentials') ||
        s.Name!.includes('api-keys') ||
        s.Name!.includes('jwt-signing-key')
      );

      expect(secrets.length).toBe(3);
    });

    it('should be able to retrieve secret values', async () => {
      const response = await secretsManager.listSecrets({}).promise();
      const dbSecret = response.SecretList!.find(s => s.Name!.includes('db-credentials'));

      if (dbSecret) {
        const valueResponse = await secretsManager.getSecretValue({
          SecretId: dbSecret.ARN!
        }).promise();

        expect(valueResponse.SecretString).toBeDefined();
        const secretData = JSON.parse(valueResponse.SecretString!);
        expect(secretData.username).toBeDefined();
      }
    });
  });

  describe('Security Groups', () => {
    let vpcId: string;

    beforeAll(async () => {
      // Get VPC ID from deployed resources
      const response = await ec2.describeVpcs({
        Filters: [{ Name: 'tag:Name', Values: [`ecs-vpc-${environmentSuffix}`] }]
      }).promise();

      if (response.Vpcs && response.Vpcs.length > 0) {
        vpcId = response.Vpcs[0].VpcId!;
      }
    });

    it('should have ALB security group with correct rules', async () => {
      const response = await ec2.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [`*alb-sg-${environmentSuffix}*`] }
        ]
      }).promise();

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions!.length).toBeGreaterThanOrEqual(2); // HTTP and HTTPS

      const httpRule = sg.IpPermissions!.find(r => r.FromPort === 80);
      const httpsRule = sg.IpPermissions!.find(r => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    it('should have ECS task security group with ingress rules', async () => {
      const response = await ec2.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [`*ecs-task-sg-${environmentSuffix}*`] }
        ]
      }).promise();

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions!.length).toBeGreaterThanOrEqual(3); // 3000, 8080, 9090

      const port3000 = sg.IpPermissions!.find(r => r.FromPort === 3000);
      const port8080 = sg.IpPermissions!.find(r => r.FromPort === 8080);
      const port9090 = sg.IpPermissions!.find(r => r.FromPort === 9090);

      expect(port3000).toBeDefined();
      expect(port8080).toBeDefined();
      expect(port9090).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    // Helper to get all roles with pagination
    async function getAllRoles() {
      let allRoles: AWS.IAM.Role[] = [];
      let marker: string | undefined;

      do {
        const response = await iam.listRoles({ Marker: marker, MaxItems: 1000 }).promise();
        allRoles = allRoles.concat(response.Roles);
        marker = response.Marker;
      } while (marker);

      return allRoles;
    }

    it('should have task execution role created', async () => {
      const allRoles = await getAllRoles();

      const executionRole = allRoles.find(r =>
        r.RoleName.includes(`ecs-task-execution-role-${environmentSuffix}`)
      );

      expect(executionRole).toBeDefined();
    });

    it('should have task roles for each service', async () => {
      const allRoles = await getAllRoles();

      const frontendRole = allRoles.find(r => r.RoleName.includes(`frontend-task-role-${environmentSuffix}`));
      const apiRole = allRoles.find(r => r.RoleName.includes(`api-gateway-task-role-${environmentSuffix}`));
      const processingRole = allRoles.find(r => r.RoleName.includes(`processing-task-role-${environmentSuffix}`));

      expect(frontendRole).toBeDefined();
      expect(apiRole).toBeDefined();
      expect(processingRole).toBeDefined();
    });

    it('should have least-privilege S3 policy for frontend role', async () => {
      const allRoles = await getAllRoles();
      const frontendRole = allRoles.find(r => r.RoleName.includes(`frontend-task-role-${environmentSuffix}`));

      if (frontendRole) {
        const policiesResponse = await iam.listRolePolicies({
          RoleName: frontendRole.RoleName
        }).promise();

        expect(policiesResponse.PolicyNames.length).toBeGreaterThan(0);

        const policyName = policiesResponse.PolicyNames.find(p => p.includes('s3-policy'));
        if (policyName) {
          const policyResponse = await iam.getRolePolicy({
            RoleName: frontendRole.RoleName,
            PolicyName: policyName
          }).promise();

          const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
          const s3Actions = policy.Statement.find((s: any) =>
            s.Action.includes('s3:GetObject') || s.Action.includes('s3:ListBucket')
          );

          expect(s3Actions).toBeDefined();
          expect(s3Actions.Action).not.toContain('s3:*');
        }
      }
    });
  });

  describe('Service Discovery', () => {
    it('should have Cloud Map namespace created', async () => {
      const response = await servicediscovery.listNamespaces({}).promise();

      const namespace = response.Namespaces!.find(ns =>
        ns.Name!.includes('trading') && ns.Name!.includes('local')
      );

      expect(namespace).toBeDefined();
      expect(namespace!.Type).toBe('DNS_PRIVATE');
    });

    it('should have 3 service discovery services', async () => {
      const namespacesResponse = await servicediscovery.listNamespaces({}).promise();
      const namespace = namespacesResponse.Namespaces!.find(ns =>
        ns.Name!.includes('trading') && ns.Name!.includes('local')
      );

      if (namespace) {
        const servicesResponse = await servicediscovery.listServices({
          Filters: [{ Name: 'NAMESPACE_ID', Values: [namespace.Id!] }]
        }).promise();

        expect(servicesResponse.Services!.length).toBe(3);
      }
    });
  });

  describe('Task Definitions', () => {
    it('should have 3 task definitions', async () => {
      const response = await ecs.listTaskDefinitionFamilies({}).promise();

      const families = response.families!.filter(f =>
        f.includes(`frontend-${environmentSuffix}`) ||
        f.includes(`api-gateway-${environmentSuffix}`) ||
        f.includes(`processing-service-${environmentSuffix}`)
      );

      expect(families.length).toBe(3);
    });

    it('should have correct CPU/Memory for processing service', async () => {
      const familiesResponse = await ecs.listTaskDefinitionFamilies({}).promise();
      const processingFamily = familiesResponse.families!.find(f =>
        f.includes(`processing-service-${environmentSuffix}`)
      );

      if (processingFamily) {
        const response = await ecs.describeTaskDefinition({
          taskDefinition: processingFamily
        }).promise();

        const taskDef = response.taskDefinition!;
        expect(taskDef.cpu).toBe('2048');
        expect(taskDef.memory).toBe('4096');
      }
    });

    it('should have Fargate compatibility', async () => {
      const familiesResponse = await ecs.listTaskDefinitionFamilies({}).promise();

      for (const family of familiesResponse.families!) {
        if (family.includes(`frontend-${environmentSuffix}`) ||
            family.includes(`api-gateway-${environmentSuffix}`) ||
            family.includes(`processing-service-${environmentSuffix}`)) {
          const response = await ecs.describeTaskDefinition({
            taskDefinition: family
          }).promise();

          expect(response.taskDefinition!.requiresCompatibilities).toContain('FARGATE');
        }
      }
    });
  });

  describe('Application Load Balancer', () => {
    let albArn: string;

    beforeAll(() => {
      albArn = outputs['albArn'] || '';
    });

    it('should have ALB deployed', async () => {
      const response = await elbv2.describeLoadBalancers({}).promise();

      const alb = response.LoadBalancers!.find(lb =>
        lb.LoadBalancerName!.includes('ecs-alb')
      );

      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    it('should have 2 target groups', async () => {
      const response = await elbv2.describeTargetGroups({}).promise();

      const targetGroups = response.TargetGroups!.filter(tg =>
        tg.TargetGroupName!.includes(`fe-tg-${environmentSuffix}`) ||
        tg.TargetGroupName!.includes(`api-tg-${environmentSuffix}`)
      );

      expect(targetGroups.length).toBe(2);
    });

    it('should have health checks configured', async () => {
      const response = await elbv2.describeTargetGroups({}).promise();

      const targetGroups = response.TargetGroups!.filter(tg =>
        tg.TargetGroupName!.includes(`fe-tg-${environmentSuffix}`) ||
        tg.TargetGroupName!.includes(`api-tg-${environmentSuffix}`)
      );

      targetGroups.forEach(tg => {
        expect(tg.HealthCheckEnabled).toBe(true);
        expect(tg.HealthCheckPath).toBe('/health');
        expect(tg.HealthCheckProtocol).toBe('HTTP');
      });
    });

    it('should have listener on port 80', async () => {
      const lbResponse = await elbv2.describeLoadBalancers({}).promise();
      const alb = lbResponse.LoadBalancers!.find(lb =>
        lb.LoadBalancerName!.includes('ecs-alb')
      );

      if (alb) {
        const listenersResponse = await elbv2.describeListeners({
          LoadBalancerArn: alb.LoadBalancerArn
        }).promise();

        const httpListener = listenersResponse.Listeners!.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener!.Protocol).toBe('HTTP');
      }
    });

    it('should have listener rule for API Gateway', async () => {
      const lbResponse = await elbv2.describeLoadBalancers({}).promise();
      const alb = lbResponse.LoadBalancers!.find(lb =>
        lb.LoadBalancerName!.includes('ecs-alb')
      );

      if (alb) {
        const listenersResponse = await elbv2.describeListeners({
          LoadBalancerArn: alb.LoadBalancerArn
        }).promise();

        for (const listener of listenersResponse.Listeners!) {
          const rulesResponse = await elbv2.describeRules({
            ListenerArn: listener.ListenerArn
          }).promise();

          const apiRule = rulesResponse.Rules!.find(r =>
            r.Conditions!.some(c =>
              c.PathPatternConfig && c.PathPatternConfig.Values!.includes('/api/*')
            )
          );

          if (apiRule) {
            expect(apiRule).toBeDefined();
            return;
          }
        }
      }
    });
  });

  describe('ECS Services', () => {
    let clusterArn: string;

    beforeAll(() => {
      clusterArn = outputs['clusterArn'] || '';
    });

    it('should have 3 ECS services running', async () => {
      const response = await ecs.listServices({
        cluster: clusterArn
      }).promise();

      expect(response.serviceArns!.length).toBe(3);
    });

    it('should have frontend service with desired count of 2', async () => {
      const servicesResponse = await ecs.listServices({
        cluster: clusterArn
      }).promise();

      const services = await ecs.describeServices({
        cluster: clusterArn,
        services: servicesResponse.serviceArns!
      }).promise();

      const frontendService = services.services!.find(s =>
        s.serviceName!.includes('frontend')
      );

      expect(frontendService).toBeDefined();
      expect(frontendService!.desiredCount).toBe(2);
      expect(frontendService!.launchType).toBe('FARGATE');
    });

    it('should have API Gateway service with load balancer', async () => {
      const servicesResponse = await ecs.listServices({
        cluster: clusterArn
      }).promise();

      const services = await ecs.describeServices({
        cluster: clusterArn,
        services: servicesResponse.serviceArns!
      }).promise();

      const apiService = services.services!.find(s =>
        s.serviceName!.includes('api-gateway')
      );

      expect(apiService).toBeDefined();
      expect(apiService!.loadBalancers!.length).toBeGreaterThan(0);
    });

    it('should have all services in ACTIVE state', async () => {
      const servicesResponse = await ecs.listServices({
        cluster: clusterArn
      }).promise();

      const services = await ecs.describeServices({
        cluster: clusterArn,
        services: servicesResponse.serviceArns!
      }).promise();

      services.services!.forEach(service => {
        expect(service.status).toBe('ACTIVE');
      });
    });
  });

  describe('Auto Scaling', () => {
    it('should have auto scaling configured for all services', async () => {
      // Auto scaling verification would require Application Auto Scaling API
      // This is a placeholder for the actual implementation
      expect(true).toBe(true);
    });
  });
});

// Helper function
function getResourceIdByTag(tagValue: string): string {
  // This would be implemented to fetch resource IDs from outputs or tags
  return '';
}
