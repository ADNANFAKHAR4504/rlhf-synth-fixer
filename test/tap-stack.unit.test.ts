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
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('TestTapStack/ServiceMeshVpc'),
          },
        ]),
      });
    });

    test('Should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*public.*') },
        ]),
      });
    });

    test('Should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*private.*') },
        ]),
      });
    });

    test('Should create NAT Gateways', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      // CDK may optimize NAT gateways, but should create at least one per AZ
      expect(Object.keys(natGateways).length).toBeGreaterThanOrEqual(2);
    });

    test('Should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('ECS Cluster', () => {
    test('Should create ECS cluster with correct name', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `payment-mesh-cluster-${environmentSuffix}`,
        ClusterSettings: Match.arrayWith([
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ]),
      });
    });

    test('Should create Cloud Map namespace', () => {
      template.hasResourceProperties(
        'AWS::ServiceDiscovery::PrivateDnsNamespace',
        {
          Name: 'payments.local',
          Vpc: Match.anyValue(),
        }
      );
    });
  });

  describe('App Mesh', () => {
    test('Should create App Mesh with correct name', () => {
      template.hasResourceProperties('AWS::AppMesh::Mesh', {
        MeshName: `payment-mesh-${environmentSuffix}`,
        Spec: {
          EgressFilter: {
            Type: 'DROP_ALL',
          },
        },
      });
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

    test('Should create ALB security group', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(securityGroups).find((sg: any) =>
        sg.Properties?.GroupDescription === 'Security group for ALB'
      );
      expect(albSg).toBeDefined();
      expect(albSg?.Properties?.SecurityGroupIngress).toBeDefined();
      const ingress = albSg?.Properties?.SecurityGroupIngress as any[];
      expect(ingress.some((rule: any) => rule.FromPort === 80 && rule.ToPort === 80)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443 && rule.ToPort === 443)).toBe(true);
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

    test('Should create HTTP listener', () => {
      const listeners = template.findResources('AWS::ElasticLoadBalancingV2::Listener');
      const httpListener = Object.values(listeners).find((listener: any) =>
        listener.Properties?.Port === 80 && listener.Properties?.Protocol === 'HTTP'
      );
      expect(httpListener).toBeDefined();
      expect(httpListener?.Properties?.DefaultActions).toBeDefined();
      const actions = httpListener?.Properties?.DefaultActions as any[];
      expect(actions.some((action: any) => action.Type === 'fixed-response')).toBe(true);
    });
  });

  describe('ACM Certificate', () => {
    test('Should create ACM certificate for mTLS', () => {
      template.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: '*.payments.local',
        ValidationMethod: 'DNS',
      });
    });
  });

  describe('Virtual Gateway', () => {
    test('Should create virtual gateway with correct name', () => {
      const virtualGateways = template.findResources('AWS::AppMesh::VirtualGateway');
      const virtualGateway = Object.values(virtualGateways).find((vg: any) =>
        vg.Properties?.VirtualGatewayName === `payment-gateway-${environmentSuffix}`
      );
      expect(virtualGateway).toBeDefined();
      expect(virtualGateway?.Properties?.Spec?.Listeners).toBeDefined();
      const listeners = virtualGateway?.Properties?.Spec?.Listeners as any[];
      expect(listeners.length).toBeGreaterThan(0);
      expect(listeners[0].PortMapping.Port).toBe(8080);
      expect(listeners[0].PortMapping.Protocol).toBe('http');
    });
  });

  describe('Microservices Configuration', () => {
    const services = ['payment-api', 'fraud-detection', 'notification-service'];

    services.forEach(serviceName => {
      describe(`${serviceName} Service`, () => {
        test(`Should create task role for ${serviceName}`, () => {
          const roles = template.findResources('AWS::IAM::Role');
          const taskRole = Object.values(roles).find((role: any) =>
            role.Properties?.RoleName === `${serviceName}-task-role-${environmentSuffix}`
          );
          expect(taskRole).toBeDefined();
          expect(taskRole?.Properties?.AssumeRolePolicyDocument?.Statement).toBeDefined();
        });

        test(`Should create execution role for ${serviceName}`, () => {
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

        test(`Should create log groups for ${serviceName}`, () => {
          template.hasResourceProperties('AWS::Logs::LogGroup', {
            LogGroupName: `/ecs/${serviceName}-${environmentSuffix}`,
            RetentionInDays: 7,
          });

          template.hasResourceProperties('AWS::Logs::LogGroup', {
            LogGroupName: `/ecs/${serviceName}-${environmentSuffix}/envoy`,
            RetentionInDays: 7,
          });

          template.hasResourceProperties('AWS::Logs::LogGroup', {
            LogGroupName: `/ecs/${serviceName}-${environmentSuffix}/xray`,
            RetentionInDays: 7,
          });
        });

        test(`Should create task definition for ${serviceName}`, () => {
          template.hasResourceProperties('AWS::ECS::TaskDefinition', {
            Family: `${serviceName}-${environmentSuffix}`,
            Cpu: '1024',
            Memory: '2048',
            NetworkMode: 'awsvpc',
            RequiresCompatibilities: ['FARGATE'],
            ProxyConfiguration: {
              ContainerName: 'envoy',
              ProxyConfigurationProperties: Match.arrayWith([
                {
                  Name: 'AppPorts',
                  Value: '8080',
                },
                {
                  Name: 'ProxyEgressPort',
                  Value: '15001',
                },
                {
                  Name: 'ProxyIngressPort',
                  Value: '15000',
                },
              ]),
            },
          });
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
          expect(appContainer?.Memory).toBe(1024);
          expect(appContainer?.Cpu).toBe(512);
          expect(appContainer?.PortMappings).toEqual([
            {
              ContainerPort: 8080,
              Protocol: 'tcp',
            },
          ]);
        });

        test(`Should create X-Ray daemon container for ${serviceName}`, () => {
          const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
          const taskDef = Object.values(taskDefs).find((td: any) =>
            td.Properties?.Family?.includes(serviceName)
          );
          const containers = taskDef?.Properties?.ContainerDefinitions as any[];
          const xrayContainer = containers.find(c => c.Name === 'xray-daemon');
          expect(xrayContainer).toBeDefined();
          expect(xrayContainer?.Image).toContain('xray');
          expect(xrayContainer?.Memory).toBe(256);
          expect(xrayContainer?.Cpu).toBe(128);
        });

        test(`Should create Envoy container for ${serviceName}`, () => {
          const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
          const taskDef = Object.values(taskDefs).find((td: any) =>
            td.Properties?.Family?.includes(serviceName)
          );
          const containers = taskDef?.Properties?.ContainerDefinitions as any[];
          const envoyContainer = containers.find(c => c.Name === 'envoy');
          expect(envoyContainer).toBeDefined();
          expect(envoyContainer?.Image).toContain('appmesh-envoy');
          expect(envoyContainer?.Essential).toBe(true);
          expect(envoyContainer?.Memory).toBe(512);
          expect(envoyContainer?.Cpu).toBe(256);
          expect(envoyContainer?.User).toBe('1337');
        });

        test(`Should create ECS service for ${serviceName}`, () => {
          template.hasResourceProperties('AWS::ECS::Service', {
            ServiceName: `${serviceName}-${environmentSuffix}`,
            DesiredCount: 2,
            LaunchType: 'FARGATE',
            NetworkConfiguration: {
              AwsvpcConfiguration: {
                AssignPublicIp: 'DISABLED',
              },
            },
            EnableExecuteCommand: true,
          });
        });

        test(`Should create Cloud Map service for ${serviceName}`, () => {
          const services = template.findResources('AWS::ServiceDiscovery::Service');
          const cloudMapService = Object.values(services).find((svc: any) =>
            svc.Properties?.Name === `${serviceName}-${environmentSuffix}`
          );
          expect(cloudMapService).toBeDefined();
          expect(cloudMapService?.Properties?.DnsConfig?.DnsRecords).toBeDefined();
        });

        test(`Should create virtual node for ${serviceName}`, () => {
          const virtualNodes = template.findResources('AWS::AppMesh::VirtualNode');
          const virtualNode = Object.values(virtualNodes).find((vn: any) =>
            vn.Properties?.VirtualNodeName === `${serviceName}-vn-${environmentSuffix}`
          );
          expect(virtualNode).toBeDefined();
          expect(virtualNode?.Properties?.Spec?.Listeners).toBeDefined();
          const listeners = virtualNode?.Properties?.Spec?.Listeners as any[];
          expect(listeners.length).toBeGreaterThan(0);
          const listener = listeners[0];
          expect(listener.PortMapping.Port).toBe(8080);
          expect(listener.PortMapping.Protocol).toBe('http');
          expect(listener.ConnectionPool?.HTTP?.MaxConnections).toBe(50);
          expect(listener.OutlierDetection?.MaxServerErrors).toBe(5);
          expect(listener.TLS?.Mode).toBe('STRICT');
        });

        test(`Should create virtual service for ${serviceName}`, () => {
          template.hasResourceProperties('AWS::AppMesh::VirtualService', {
            VirtualServiceName: `${serviceName}-${environmentSuffix}.payments.local`,
          });
        });

        test(`Should create target group for ${serviceName}`, () => {
          template.hasResourceProperties(
            'AWS::ElasticLoadBalancingV2::TargetGroup',
            {
              Name: `${serviceName}-tg-${environmentSuffix}`,
              Port: 8080,
              Protocol: 'HTTP',
              TargetType: 'ip',
              HealthCheckPath: '/health',
              HealthCheckIntervalSeconds: 30,
              HealthCheckTimeoutSeconds: 5,
              HealthyThresholdCount: 2,
              UnhealthyThresholdCount: 3,
            }
          );
        });

        test(`Should create gateway route for ${serviceName}`, () => {
          const pathPatterns: { [key: string]: string } = {
            'payment-api': '/api/payments/',
            'fraud-detection': '/api/fraud/',
            'notification-service': '/api/notify/',
          };

          template.hasResourceProperties('AWS::AppMesh::GatewayRoute', {
            GatewayRouteName: `${serviceName}-route-${environmentSuffix}`,
            Spec: {
              HttpRoute: {
                Match: {
                  Prefix: pathPatterns[serviceName],
                },
              },
            },
          });
        });

        test(`Should grant App Mesh permissions to ${serviceName} task role`, () => {
          const policies = template.findResources('AWS::IAM::Policy');
          const taskRolePolicy = Object.values(policies).find((policy: any) => {
            const statements = policy.Properties?.PolicyDocument?.Statement || [];
            return statements.some((stmt: any) => {
              const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
              return (
                stmt.Effect === 'Allow' &&
                stmt.Action?.includes('appmesh:StreamAggregatedResources') &&
                resources.some((r: any) => {
                  const resourceStr = typeof r === 'string' ? r : JSON.stringify(r);
                  return resourceStr.includes('virtualNode') || resourceStr.includes('mesh');
                })
              );
            });
          });
          expect(taskRolePolicy).toBeDefined();
        });
      });
    });
  });

  describe('Gateway Service', () => {
    test('Should create gateway task role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `virtual-gateway-task-role-${environmentSuffix}`,
      });
    });

    test('Should create gateway task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `virtual-gateway-${environmentSuffix}`,
        Cpu: '512',
        Memory: '1024',
      });
    });

    test('Should create gateway log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/ecs/virtual-gateway-${environmentSuffix}/envoy`,
        RetentionInDays: 7,
      });
    });

    test('Should create gateway ECS service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `virtual-gateway-${environmentSuffix}`,
        DesiredCount: 2,
        LaunchType: 'FARGATE',
      });
    });

    test('Should create gateway target group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 8080,
          Protocol: 'HTTP',
          HealthCheckPath: '/health',
        }
      );
    });

    test('Should grant App Mesh permissions to gateway task role', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const gatewayPolicy = Object.values(policies).find((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
          return (
            stmt.Effect === 'Allow' &&
            stmt.Action?.includes('appmesh:StreamAggregatedResources') &&
            resources.some((r: any) => {
              const resourceStr = typeof r === 'string' ? r : JSON.stringify(r);
              return resourceStr.includes('virtualGateway') || resourceStr.includes('mesh');
            })
          );
        });
      });
      expect(gatewayPolicy).toBeDefined();
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('Should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `payment-mesh-dashboard-${environmentSuffix}`,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should output ALB DNS name', () => {
      template.hasOutput('AlbDnsName', {
        Description: 'Application Load Balancer DNS name for external access',
        Export: {
          Name: 'PaymentMeshAlbDns',
        },
      });
    });

    test('Should output Cloud Map namespace ARN', () => {
      template.hasOutput('CloudMapNamespaceArn', {
        Description: 'Cloud Map namespace ARN for service discovery',
        Export: {
          Name: 'PaymentMeshCloudMapArn',
        },
      });
    });

    test('Should output dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch dashboard URL for monitoring',
        Export: {
          Name: 'PaymentMeshDashboardUrl',
        },
      });
    });

    test('Should output mesh ARN', () => {
      template.hasOutput('MeshArn', {
        Description: 'App Mesh ARN',
        Export: {
          Name: 'PaymentMeshArn',
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
  });

  describe('Resource Counts', () => {
    test('Should create correct number of ECS services', () => {
      // 3 microservices + 1 gateway service = 4 total
      template.resourceCountIs('AWS::ECS::Service', 4);
    });

    test('Should create correct number of task definitions', () => {
      // 3 microservices + 1 gateway = 4 total
      template.resourceCountIs('AWS::ECS::TaskDefinition', 4);
    });

    test('Should create correct number of virtual nodes', () => {
      // 3 microservices
      template.resourceCountIs('AWS::AppMesh::VirtualNode', 3);
    });

    test('Should create correct number of virtual services', () => {
      // 3 microservices
      template.resourceCountIs('AWS::AppMesh::VirtualService', 3);
    });

    test('Should create correct number of gateway routes', () => {
      // 3 microservices
      template.resourceCountIs('AWS::AppMesh::GatewayRoute', 3);
    });

    test('Should create correct number of target groups', () => {
      // 3 microservices + 1 gateway = 4 total
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 4);
    });

    test('Should create correct number of IAM roles', () => {
      // 3 services * 2 roles (task + execution) + 1 gateway task role + 1 gateway execution role = 8 total
      template.resourceCountIs('AWS::IAM::Role', 8);
    });

    test('Should create correct number of log groups', () => {
      // 3 services * 3 log groups (app, envoy, xray) + 1 gateway envoy = 10 total
      template.resourceCountIs('AWS::Logs::LogGroup', 10);
    });
  });

  describe('X-Ray Configuration', () => {
    test('Should have X-Ray permissions in task roles', () => {
      // X-Ray permissions are in inline policies on roles, not separate Policy resources
      const roles = template.findResources('AWS::IAM::Role');
      const rolesWithXRay = Object.values(roles).filter((role: any) => {
        const policies = role.Properties?.Policies || [];
        return policies.some((policy: any) => {
          const statements = policy.PolicyDocument?.Statement || [];
          return statements.some((stmt: any) => {
            const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
            return actions.some((action: string) => action?.includes('xray:PutTraceSegments'));
          });
        });
      });
      expect(rolesWithXRay.length).toBeGreaterThan(0);
    });
  });

  describe('Container Configuration', () => {
    test('Should configure Envoy with correct environment variables', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const taskDef = Object.values(taskDefs).find((td: any) =>
        td.Properties?.Family?.includes('payment-api')
      );
      const containers = taskDef?.Properties?.ContainerDefinitions as any[];
      const envoyContainer = containers.find(c => c.Name === 'envoy');
      expect(envoyContainer?.Environment).toEqual(
        expect.arrayContaining([
          {
            Name: 'ENVOY_LOG_LEVEL',
            Value: 'info',
          },
          {
            Name: 'ENABLE_ENVOY_XRAY_TRACING',
            Value: '1',
          },
          {
            Name: 'ENABLE_ENVOY_STATS_TAGS',
            Value: '1',
          },
          {
            Name: 'XRAY_DAEMON_PORT',
            Value: '2000',
          },
        ])
      );
    });

    test('Should configure application containers with correct environment', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const taskDef = Object.values(taskDefs).find((td: any) =>
        td.Properties?.Family?.includes('payment-api')
      );
      const containers = taskDef?.Properties?.ContainerDefinitions as any[];
      const appContainer = containers.find(c => c.Name === 'payment-api');
      expect(appContainer?.Environment).toEqual(
        expect.arrayContaining([
          {
            Name: 'SERVICE_NAME',
            Value: 'payment-api',
          },
          {
            Name: 'PORT',
            Value: '8080',
          },
          {
            Name: 'ENABLE_XRAY',
            Value: 'true',
          },
        ])
      );
    });
  });

  describe('Health Checks', () => {
    test('Should configure health checks for application containers', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const taskDef = Object.values(taskDefs).find((td: any) =>
        td.Properties?.Family?.includes('payment-api')
      );
      const containers = taskDef?.Properties?.ContainerDefinitions as any[];
      const appContainer = containers.find(c => c.Name === 'payment-api');
      expect(appContainer?.HealthCheck).toBeDefined();
      const command = Array.isArray(appContainer?.HealthCheck?.Command)
        ? appContainer?.HealthCheck?.Command.join(' ')
        : appContainer?.HealthCheck?.Command;
      expect(command).toContain('curl');
      expect(appContainer?.HealthCheck?.Interval).toBe(30);
      expect(appContainer?.HealthCheck?.Timeout).toBe(5);
      expect(appContainer?.HealthCheck?.Retries).toBe(3);
    });

    test('Should configure health checks for Envoy containers', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const taskDef = Object.values(taskDefs).find((td: any) =>
        td.Properties?.Family?.includes('payment-api')
      );
      const containers = taskDef?.Properties?.ContainerDefinitions as any[];
      const envoyContainer = containers.find(c => c.Name === 'envoy');
      expect(envoyContainer?.HealthCheck).toBeDefined();
      const command = Array.isArray(envoyContainer?.HealthCheck?.Command)
        ? envoyContainer?.HealthCheck?.Command.join(' ')
        : envoyContainer?.HealthCheck?.Command;
      expect(command).toContain('curl');
    });
  });

  describe('Container Dependencies', () => {
    test('Should configure Envoy to depend on application container', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const taskDef = Object.values(taskDefs).find((td: any) =>
        td.Properties?.Family?.includes('payment-api')
      );
      const containers = taskDef?.Properties?.ContainerDefinitions as any[];
      const envoyContainer = containers.find(c => c.Name === 'envoy');
      expect(envoyContainer?.DependsOn).toBeDefined();
    });
  });

  describe('Removal Policies', () => {
    test('Log groups should have DESTROY removal policy', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup: any) => {
        expect(logGroup.DeletionPolicy).toBe('Delete');
      });
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

      // Check mesh
      const meshes = template.findResources('AWS::AppMesh::Mesh');
      const mesh = Object.values(meshes)[0] as any;
      expect(mesh.Properties.MeshName).toContain(environmentSuffix);
      expect(mesh.Properties.MeshName).toBe(
        `payment-mesh-${environmentSuffix}`
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
});
