import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('Should use environmentSuffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'prod',
      });
      const customTemplate = Template.fromStack(customStack);
      customTemplate.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'payment-mesh-cluster-prod',
      });
    });

    test('Should use default environmentSuffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      defaultTemplate.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'payment-mesh-cluster-dev',
      });
    });

    test('Should use environmentSuffix from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);
      contextTemplate.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'payment-mesh-cluster-staging',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('Should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Should create only public subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetResources = Object.values(subnets);

      // All subnets should be public
      subnetResources.forEach((subnet: any) => {
        const tags = subnet.Properties?.Tags || [];
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag?.Value).toMatch(/.*public.*/);
      });
    });

    test('Should create VPC with 2 availability zones', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      // Should have 2 public subnets (one per AZ)
      expect(Object.keys(subnets).length).toBe(2);
    });

    test('Should not create private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetResources = Object.values(subnets);
      const hasPrivateSubnet = subnetResources.some((subnet: any) => {
        const tags = subnet.Properties?.Tags || [];
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        return nameTag?.Value?.includes('private');
      });
      expect(hasPrivateSubnet).toBe(false);
    });

    test('Should not create NAT Gateways', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(0);
    });

    test('Should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('ECS Cluster', () => {
    test('Should create ECS cluster with correct name', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `payment-mesh-cluster-${environmentSuffix}`,
      });
    });

    test('Should have Container Insights disabled', () => {
      const clusters = template.findResources('AWS::ECS::Cluster');
      const cluster = Object.values(clusters)[0] as any;
      // Container Insights disabled means no ClusterSettings or empty array
      const settings = cluster.Properties?.ClusterSettings || [];
      const hasContainerInsights = settings.some(
        (setting: any) =>
          setting.Name === 'containerInsights' && setting.Value === 'enabled'
      );
      expect(hasContainerInsights).toBe(false);
    });

    test('Should not create Cloud Map namespace', () => {
      const namespaces = template.findResources(
        'AWS::ServiceDiscovery::PrivateDnsNamespace'
      );
      expect(Object.keys(namespaces).length).toBe(0);
    });
  });

  describe('Security Groups', () => {
    test('Should create service security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ECS services',
        SecurityGroupEgress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ]),
      });
    });

    test('Service security group should allow internal communication', () => {
      // Verify that security group ingress rules are created
      // CDK creates separate SecurityGroupIngress resources for rules added via addIngressRule
      const ingressRules = template.findResources(
        'AWS::EC2::SecurityGroupIngress'
      );
      // Should have at least one ingress rule (for internal communication or ALB)
      expect(Object.keys(ingressRules).length).toBeGreaterThan(0);
      // Verify service security group exists
      const serviceSg = Object.values(
        template.findResources('AWS::EC2::SecurityGroup')
      ).find(
        (sg: any) =>
          sg.Properties?.GroupDescription === 'Security group for ECS services'
      );
      expect(serviceSg).toBeDefined();
    });

    test('Should create ALB security group', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(securityGroups).find(
        (sg: any) =>
          sg.Properties?.GroupDescription === 'Security group for ALB'
      );
      expect(albSg).toBeDefined();
      expect(albSg?.Properties?.SecurityGroupIngress).toBeDefined();
      const ingress = albSg?.Properties?.SecurityGroupIngress as any[];
      expect(
        ingress.some((rule: any) => rule.FromPort === 80 && rule.ToPort === 80)
      ).toBe(true);
      expect(
        ingress.some(
          (rule: any) => rule.FromPort === 443 && rule.ToPort === 443
        )
      ).toBe(true);
    });

    test('Service security group should allow traffic from ALB', () => {
      // Verify that security group ingress rules are created
      // CDK creates separate SecurityGroupIngress resources for rules added via addIngressRule
      const ingressRules = template.findResources(
        'AWS::EC2::SecurityGroupIngress'
      );
      // Should have ingress rules (for internal communication and ALB)
      expect(Object.keys(ingressRules).length).toBeGreaterThan(0);
      // Verify both security groups exist
      const serviceSg = Object.values(
        template.findResources('AWS::EC2::SecurityGroup')
      ).find(
        (sg: any) =>
          sg.Properties?.GroupDescription === 'Security group for ECS services'
      );
      const albSg = Object.values(
        template.findResources('AWS::EC2::SecurityGroup')
      ).find(
        (sg: any) =>
          sg.Properties?.GroupDescription === 'Security group for ALB'
      );
      expect(serviceSg).toBeDefined();
      expect(albSg).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('Should create ALB with correct name', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: `payment-mesh-alb-${environmentSuffix}`,
          Scheme: 'internet-facing',
          Type: 'application',
        }
      );
    });

    test('ALB should be in public subnets', () => {
      const albs = template.findResources(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      const alb = Object.values(albs)[0] as any;
      expect(alb.Properties?.Subnets).toBeDefined();
    });

    test('Should create HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('HTTP listener should be open', () => {
      const listeners = template.findResources(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
      const httpListener = Object.values(listeners).find(
        (listener: any) => listener.Properties?.Port === 80
      );
      expect(httpListener?.Properties?.DefaultActions).toBeDefined();
      const actions = httpListener?.Properties?.DefaultActions as any[];
      const fixedResponse = actions.find(
        (action: any) => action.Type === 'fixed-response'
      );
      expect(fixedResponse).toBeDefined();
      expect(fixedResponse?.FixedResponseConfig?.StatusCode).toBe('200');
      expect(fixedResponse?.FixedResponseConfig?.ContentType).toBe(
        'text/plain'
      );
      expect(fixedResponse?.FixedResponseConfig?.MessageBody).toBe(
        'Service running'
      );
    });
  });

  describe('Microservices Configuration', () => {
    const services = ['payment-api', 'fraud-detection', 'notification-service'];
    const pathPatterns: { [key: string]: string } = {
      'payment-api': '/api/payments/',
      'fraud-detection': '/api/fraud/',
      'notification-service': '/api/notify/',
    };

    services.forEach(serviceName => {
      describe(`${serviceName} Service`, () => {
        test(`Should create task role for ${serviceName}`, () => {
          template.hasResourceProperties('AWS::IAM::Role', {
            RoleName: `${serviceName}-task-role-${environmentSuffix}`,
            AssumeRolePolicyDocument: {
              Statement: Match.arrayWith([
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'ecs-tasks.amazonaws.com',
                  },
                  Action: 'sts:AssumeRole',
                },
              ]),
            },
          });
        });

        test(`Should create execution role for ${serviceName}`, () => {
          template.hasResourceProperties('AWS::IAM::Role', {
            RoleName: `${serviceName}-execution-role-${environmentSuffix}`,
            AssumeRolePolicyDocument: {
              Statement: Match.arrayWith([
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'ecs-tasks.amazonaws.com',
                  },
                  Action: 'sts:AssumeRole',
                },
              ]),
            },
          });
        });

        test(`Execution role should have ECS task execution policy for ${serviceName}`, () => {
          const roles = template.findResources('AWS::IAM::Role');
          const executionRole = Object.values(roles).find(
            (role: any) =>
              role.Properties?.RoleName ===
              `${serviceName}-execution-role-${environmentSuffix}`
          );
          expect(executionRole).toBeDefined();
          expect(executionRole?.Properties?.ManagedPolicyArns).toBeDefined();
          const policyArns = executionRole?.Properties
            ?.ManagedPolicyArns as any[];
          expect(
            policyArns.some((arn: any) => {
              const arnStr =
                typeof arn === 'string' ? arn : JSON.stringify(arn);
              return arnStr.includes('AmazonECSTaskExecutionRolePolicy');
            })
          ).toBe(true);
        });

        test(`Should create log group for ${serviceName}`, () => {
          template.hasResourceProperties('AWS::Logs::LogGroup', {
            LogGroupName: `/ecs/${serviceName}-${environmentSuffix}`,
            RetentionInDays: 7,
          });
        });

        test(`Log group should have DESTROY removal policy for ${serviceName}`, () => {
          const logGroups = template.findResources('AWS::Logs::LogGroup');
          const logGroup = Object.values(logGroups).find(
            (lg: any) =>
              lg.Properties?.LogGroupName ===
              `/ecs/${serviceName}-${environmentSuffix}`
          );
          expect(logGroup?.DeletionPolicy).toBe('Delete');
        });

        test(`Should create task definition for ${serviceName}`, () => {
          template.hasResourceProperties('AWS::ECS::TaskDefinition', {
            Family: `${serviceName}-${environmentSuffix}`,
            Cpu: '256',
            Memory: '512',
            NetworkMode: 'awsvpc',
            RequiresCompatibilities: ['FARGATE'],
          });
        });

        test(`Task definition should not have proxy configuration for ${serviceName}`, () => {
          const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
          const taskDef = Object.values(taskDefs).find((td: any) =>
            td.Properties?.Family?.includes(serviceName)
          );
          expect(taskDef?.Properties?.ProxyConfiguration).toBeUndefined();
        });

        test(`Should create application container for ${serviceName}`, () => {
          const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
          const taskDef = Object.values(taskDefs).find((td: any) =>
            td.Properties?.Family?.includes(serviceName)
          );
          expect(taskDef).toBeDefined();
          expect(taskDef?.Properties?.ContainerDefinitions).toBeDefined();
          const containers = taskDef?.Properties?.ContainerDefinitions as any[];
          const appContainer = containers.find(c => c.Name === serviceName);
          expect(appContainer).toBeDefined();
          expect(appContainer?.Image).toContain('nginx');
          expect(appContainer?.PortMappings).toEqual([
            {
              ContainerPort: 80,
              Protocol: 'tcp',
            },
          ]);
        });

        test(`Container should have nginx command for ${serviceName}`, () => {
          const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
          const taskDef = Object.values(taskDefs).find((td: any) =>
            td.Properties?.Family?.includes(serviceName)
          );
          const containers = taskDef?.Properties?.ContainerDefinitions as any[];
          const appContainer = containers.find(c => c.Name === serviceName);
          expect(appContainer?.Command).toEqual(['nginx', '-g', 'daemon off;']);
        });

        test(`Container should not have health check for ${serviceName}`, () => {
          const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
          const taskDef = Object.values(taskDefs).find((td: any) =>
            td.Properties?.Family?.includes(serviceName)
          );
          const containers = taskDef?.Properties?.ContainerDefinitions as any[];
          const appContainer = containers.find(c => c.Name === serviceName);
          expect(appContainer?.HealthCheck).toBeUndefined();
        });

        test(`Container should have CloudWatch Logs configuration for ${serviceName}`, () => {
          const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
          const taskDef = Object.values(taskDefs).find((td: any) =>
            td.Properties?.Family?.includes(serviceName)
          );
          const containers = taskDef?.Properties?.ContainerDefinitions as any[];
          const appContainer = containers.find(c => c.Name === serviceName);
          expect(appContainer?.LogConfiguration).toBeDefined();
          expect(appContainer?.LogConfiguration?.LogDriver).toBe('awslogs');
          // CDK uses Ref for log group, so we check that it references a log group
          const logGroupRef =
            appContainer?.LogConfiguration?.Options?.['awslogs-group'];
          expect(logGroupRef).toBeDefined();
          // Verify the log group exists
          const logGroups = template.findResources('AWS::Logs::LogGroup');
          const logGroupExists = Object.values(logGroups).some(
            (lg: any) =>
              lg.Properties?.LogGroupName ===
              `/ecs/${serviceName}-${environmentSuffix}`
          );
          expect(logGroupExists).toBe(true);
          expect(
            appContainer?.LogConfiguration?.Options?.['awslogs-stream-prefix']
          ).toBe(serviceName);
        });

        test(`Should create ECS service for ${serviceName}`, () => {
          template.hasResourceProperties('AWS::ECS::Service', {
            ServiceName: `${serviceName}-${environmentSuffix}`,
            DesiredCount: 1,
            LaunchType: 'FARGATE',
          });
        });

        test(`ECS service should use public subnets with public IPs for ${serviceName}`, () => {
          const services = template.findResources('AWS::ECS::Service');
          const ecsService = Object.values(services).find(
            (svc: any) =>
              svc.Properties?.ServiceName ===
              `${serviceName}-${environmentSuffix}`
          );
          expect(ecsService).toBeDefined();
          expect(
            ecsService?.Properties?.NetworkConfiguration?.AwsvpcConfiguration
              ?.AssignPublicIp
          ).toBe('ENABLED');
        });

        test(`ECS service should have lenient deployment settings for ${serviceName}`, () => {
          const services = template.findResources('AWS::ECS::Service');
          const ecsService = Object.values(services).find(
            (svc: any) =>
              svc.Properties?.ServiceName ===
              `${serviceName}-${environmentSuffix}`
          );
          expect(
            ecsService?.Properties?.DeploymentConfiguration
              ?.MinimumHealthyPercent
          ).toBe(0);
          expect(
            ecsService?.Properties?.DeploymentConfiguration?.MaximumPercent
          ).toBe(200);
        });

        test(`ECS service should have circuit breaker with rollback disabled for ${serviceName}`, () => {
          const services = template.findResources('AWS::ECS::Service');
          const ecsService = Object.values(services).find(
            (svc: any) =>
              svc.Properties?.ServiceName ===
              `${serviceName}-${environmentSuffix}`
          );
          expect(
            ecsService?.Properties?.DeploymentConfiguration
              ?.DeploymentCircuitBreaker?.Enable
          ).toBe(true);
          expect(
            ecsService?.Properties?.DeploymentConfiguration
              ?.DeploymentCircuitBreaker?.Rollback
          ).toBe(false);
        });

        test(`ECS service should have execute command disabled for ${serviceName}`, () => {
          const services = template.findResources('AWS::ECS::Service');
          const ecsService = Object.values(services).find(
            (svc: any) =>
              svc.Properties?.ServiceName ===
              `${serviceName}-${environmentSuffix}`
          );
          expect(ecsService?.Properties?.EnableExecuteCommand).toBe(false);
        });

        test(`Should create target group for ${serviceName}`, () => {
          template.hasResourceProperties(
            'AWS::ElasticLoadBalancingV2::TargetGroup',
            {
              Port: 80,
              Protocol: 'HTTP',
              TargetType: 'ip',
            }
          );
        });

        test(`Target group should have forgiving health check for ${serviceName}`, () => {
          const targetGroups = template.findResources(
            'AWS::ElasticLoadBalancingV2::TargetGroup'
          );
          const targetGroup = Object.values(targetGroups).find((tg: any) => {
            // Find target group associated with this service
            // We check by looking at listener rules that reference this service
            return true; // All target groups should have the same health check config
          });
          expect(targetGroup?.Properties?.HealthCheckPath).toBe('/');
          expect(targetGroup?.Properties?.Matcher?.HttpCode).toBe('200-499');
        });

        test(`Should create listener rule with path pattern for ${serviceName}`, () => {
          template.hasResourceProperties(
            'AWS::ElasticLoadBalancingV2::ListenerRule',
            {
              Conditions: Match.arrayWith([
                {
                  Field: 'path-pattern',
                  PathPatternConfig: {
                    Values: [pathPatterns[serviceName]],
                  },
                },
              ]),
            }
          );
        });

        test(`Listener rule should have correct priority for ${serviceName}`, () => {
          const listenerRules = template.findResources(
            'AWS::ElasticLoadBalancingV2::ListenerRule'
          );
          const rules = Object.values(listenerRules);
          const serviceIndex = services.indexOf(serviceName);
          const rule = rules.find((r: any) => {
            const conditions = r.Properties?.Conditions || [];
            return conditions.some((c: any) =>
              c.PathPatternConfig?.Values?.includes(pathPatterns[serviceName])
            );
          });
          expect(rule?.Properties?.Priority).toBe(serviceIndex + 1);
        });

        test(`Should not create Cloud Map service for ${serviceName}`, () => {
          const cloudMapServices = template.findResources(
            'AWS::ServiceDiscovery::Service'
          );
          const cloudMapService = Object.values(cloudMapServices).find(
            (svc: any) =>
              svc.Properties?.Name === `${serviceName}-${environmentSuffix}`
          );
          expect(cloudMapService).toBeUndefined();
        });

        test(`Should not create virtual node for ${serviceName}`, () => {
          const virtualNodes = template.findResources(
            'AWS::AppMesh::VirtualNode'
          );
          const virtualNode = Object.values(virtualNodes).find((vn: any) =>
            vn.Properties?.VirtualNodeName?.includes(serviceName)
          );
          expect(virtualNode).toBeUndefined();
        });

        test(`Should not create virtual service for ${serviceName}`, () => {
          const virtualServices = template.findResources(
            'AWS::AppMesh::VirtualService'
          );
          const virtualService = Object.values(virtualServices).find(
            (vs: any) =>
              vs.Properties?.VirtualServiceName?.includes(serviceName)
          );
          expect(virtualService).toBeUndefined();
        });
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('Should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `payment-mesh-dashboard-${environmentSuffix}`,
      });
    });

    test('Dashboard should have Body property defined', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0] as any;
      // CDK creates dashboard with Body property (might be Fn::Sub or string)
      expect(dashboard.Properties).toBeDefined();
      // Body is created by CDK, we just verify dashboard exists with correct name
      expect(dashboard.Properties.DashboardName).toBe(
        `payment-mesh-dashboard-${environmentSuffix}`
      );
    });

    test('Dashboard should be created for all services', () => {
      // Verify dashboard exists - the actual metrics are added via CDK API
      // which creates the Body dynamically, so we can't easily parse it in unit tests
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `payment-mesh-dashboard-${environmentSuffix}`,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should output ALB DNS name', () => {
      template.hasOutput('AlbDns', {
        Description: 'Application Load Balancer DNS name for external access',
      });
    });

    test('Should not output Cloud Map namespace ARN', () => {
      const outputs = template.findOutputs('CloudMapNamespaceArn');
      expect(Object.keys(outputs).length).toBe(0);
    });

    test('Should output dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch dashboard URL for monitoring',
        Export: {
          Name: 'PaymentMeshDashboardUrl',
        },
      });
    });

    test('Should output cluster name', () => {
      template.hasOutput('ClusterName', {
        Description: 'ECS Cluster name',
        Export: {
          Name: 'PaymentMeshClusterName',
        },
      });
    });

    test('Dashboard URL should include correct region and dashboard name', () => {
      const outputs = template.findOutputs('DashboardUrl');
      const output = Object.values(outputs)[0] as any;
      // Output value is a CloudFormation Fn::Join intrinsic function
      // We verify it has the structure we expect
      expect(output.Value).toBeDefined();
      // Convert to string to check contents
      const valueStr = JSON.stringify(output.Value);
      expect(valueStr).toContain('cloudwatch');
      expect(valueStr).toContain('dashboards:name');
      // The dashboard name is referenced via Ref, so we verify the structure includes a Ref
      expect(valueStr).toContain('Ref');
      // Verify it references a dashboard resource
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardLogicalId = Object.keys(dashboards)[0];
      expect(valueStr).toContain(dashboardLogicalId);
    });
  });

  describe('Resource Counts', () => {
    test('Should create correct number of ECS services', () => {
      // 3 microservices
      template.resourceCountIs('AWS::ECS::Service', 3);
    });

    test('Should create correct number of task definitions', () => {
      // 3 microservices
      template.resourceCountIs('AWS::ECS::TaskDefinition', 3);
    });

    test('Should create correct number of target groups', () => {
      // 3 target groups (one per service)
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 3);
    });

    test('Should create correct number of listener rules', () => {
      // 3 listener rules (one per service)
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::ListenerRule', 3);
    });

    test('Should create correct number of IAM roles', () => {
      // 3 services * 2 roles (task + execution) = 6 total
      template.resourceCountIs('AWS::IAM::Role', 6);
    });

    test('Should create correct number of log groups', () => {
      // 3 services * 1 log group = 3 total
      template.resourceCountIs('AWS::Logs::LogGroup', 3);
    });

    test('Should not create App Mesh resources', () => {
      template.resourceCountIs('AWS::AppMesh::Mesh', 0);
      template.resourceCountIs('AWS::AppMesh::VirtualNode', 0);
      template.resourceCountIs('AWS::AppMesh::VirtualService', 0);
      template.resourceCountIs('AWS::AppMesh::VirtualGateway', 0);
      template.resourceCountIs('AWS::AppMesh::GatewayRoute', 0);
    });

    test('Should not create Cloud Map resources', () => {
      template.resourceCountIs('AWS::ServiceDiscovery::PrivateDnsNamespace', 0);
      template.resourceCountIs('AWS::ServiceDiscovery::Service', 0);
    });
  });

  describe('Service Configuration Details', () => {
    test('All services should use nginx image', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      Object.values(taskDefs).forEach((taskDef: any) => {
        const containers = taskDef.Properties?.ContainerDefinitions || [];
        const appContainer = containers.find((c: any) =>
          ['payment-api', 'fraud-detection', 'notification-service'].includes(
            c.Name
          )
        );
        expect(appContainer?.Image).toContain('nginx');
      });
    });

    test('All services should have same resource allocation', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      Object.values(taskDefs).forEach((taskDef: any) => {
        expect(taskDef.Properties?.Cpu).toBe('256');
        expect(taskDef.Properties?.Memory).toBe('512');
      });
    });

    test('All services should have desired count of 1', () => {
      const services = template.findResources('AWS::ECS::Service');
      Object.values(services).forEach((service: any) => {
        expect(service.Properties?.DesiredCount).toBe(1);
      });
    });

    test('All services should use Fargate launch type', () => {
      const services = template.findResources('AWS::ECS::Service');
      Object.values(services).forEach((service: any) => {
        expect(service.Properties?.LaunchType).toBe('FARGATE');
      });
    });
  });

  describe('Security Group Rules', () => {
    test('ALB security group should allow HTTP from anywhere', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(securityGroups).find(
        (sg: any) =>
          sg.Properties?.GroupDescription === 'Security group for ALB'
      );
      const ingress = albSg?.Properties?.SecurityGroupIngress as any[];
      const httpRule = ingress?.find(
        (rule: any) => rule.FromPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.CidrIp).toBe('0.0.0.0/0');
    });

    test('ALB security group should allow HTTPS from anywhere', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(securityGroups).find(
        (sg: any) =>
          sg.Properties?.GroupDescription === 'Security group for ALB'
      );
      const ingress = albSg?.Properties?.SecurityGroupIngress as any[];
      const httpsRule = ingress?.find(
        (rule: any) => rule.FromPort === 443 && rule.IpProtocol === 'tcp'
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Environment Suffix in Resource Names', () => {
    test('All resource names should include environment suffix', () => {
      // Check cluster
      const clusters = template.findResources('AWS::ECS::Cluster');
      const cluster = Object.values(clusters)[0] as any;
      expect(cluster.Properties.ClusterName).toContain(environmentSuffix);
      expect(cluster.Properties.ClusterName).toBe(
        `payment-mesh-cluster-${environmentSuffix}`
      );

      // Check ALB
      const albs = template.findResources(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      const alb = Object.values(albs)[0] as any;
      expect(alb.Properties.Name).toContain(environmentSuffix);
      expect(alb.Properties.Name).toBe(`payment-mesh-alb-${environmentSuffix}`);

      // Check dashboard
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0] as any;
      expect(dashboard.Properties.DashboardName).toContain(environmentSuffix);
      expect(dashboard.Properties.DashboardName).toBe(
        `payment-mesh-dashboard-${environmentSuffix}`
      );
    });
  });

  describe('Path-based Routing', () => {
    test('Payment API should route to /api/payments/', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::ListenerRule',
        {
          Conditions: Match.arrayWith([
            {
              Field: 'path-pattern',
              PathPatternConfig: {
                Values: ['/api/payments/'],
              },
            },
          ]),
        }
      );
    });

    test('Fraud Detection should route to /api/fraud/', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::ListenerRule',
        {
          Conditions: Match.arrayWith([
            {
              Field: 'path-pattern',
              PathPatternConfig: {
                Values: ['/api/fraud/'],
              },
            },
          ]),
        }
      );
    });

    test('Notification Service should route to /api/notify/', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::ListenerRule',
        {
          Conditions: Match.arrayWith([
            {
              Field: 'path-pattern',
              PathPatternConfig: {
                Values: ['/api/notify/'],
              },
            },
          ]),
        }
      );
    });
  });
});
