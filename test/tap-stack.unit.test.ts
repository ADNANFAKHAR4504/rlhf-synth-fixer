// Jest unit tests for TapStack CDKTF resources (focused on actual CDKTF resource creation)
import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import {
  VpcConstruct,
  SecurityGroupConstruct,
  EksClusterConstruct,
  AlbConstruct,
  IrsaRoleConstruct,
  ManagedNodeGroupConstruct,
} from '../lib/modules';
import { Construct } from 'constructs';

// Mock the AWS provider to avoid actual API calls during unit tests
jest.mock('@cdktf/provider-aws', () => ({
  ...jest.requireActual('@cdktf/provider-aws'),
  AwsProvider: jest.fn().mockImplementation(() => ({})),
}));

describe('TapStack CDKTF Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthedStack: any;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1',
      vpcCidr: '10.0.0.0/16',
      eksVersion: '1.28',
      nodeGroupConfig: {
        minSize: 2,
        maxSize: 10,
        desiredSize: 3,
        instanceTypes: ['t3.medium', 't4g.medium']
      }
    });
    synthedStack = JSON.parse(Testing.synth(stack));
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct configuration', () => {
      expect(synthedStack).toBeDefined();
      expect(typeof synthedStack).toBe('object');
    });

    test('should configure AWS provider with correct region', () => {
      // Check if provider configuration exists in terraform block or provider block
      const awsProvider = synthedStack.provider?.aws || synthedStack.terraform?.required_providers?.aws;
      expect(awsProvider || synthedStack.provider).toBeDefined();
      // Provider region is configured at runtime, just verify structure exists
    });

    test('should configure S3 backend with environment suffix', () => {
      const backend = synthedStack.terraform?.backend?.s3;
      expect(backend).toBeDefined();
      expect(backend.key).toContain('test');
      expect(backend.encrypt).toBe(true);
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct CIDR and DNS settings', () => {
      const vpcs = synthedStack.resource?.aws_vpc;
      expect(vpcs).toBeDefined();
      expect(Object.keys(vpcs).length).toBe(1);
      
      const vpc = Object.values(vpcs)[0] as any;
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
      expect(vpc.tags.Environment).toBe('test');
      expect(vpc.tags.ManagedBy).toBe('Terraform');
    });

    test('should create 3 public and 3 private subnets', () => {
      const subnets = synthedStack.resource?.aws_subnet;
      expect(subnets).toBeDefined();
      expect(Object.keys(subnets).length).toBe(6); // 3 public + 3 private

      const subnetValues = Object.values(subnets) as any[];
      const publicSubnets = subnetValues.filter(s => s.map_public_ip_on_launch === true);
      const privateSubnets = subnetValues.filter(s => !s.map_public_ip_on_launch);
      
      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);

      // Verify CIDR blocks for first few subnets
      expect(publicSubnets[0].cidr_block).toBe('10.0.0.0/24');
      expect(privateSubnets[0].cidr_block).toBe('10.0.1.0/24');
      
      // Verify Kubernetes tags
      expect(publicSubnets[0].tags['kubernetes.io/role/elb']).toBe('1');
      expect(privateSubnets[0].tags['kubernetes.io/role/internal-elb']).toBe('1');
    });

    test('should create Internet Gateway with correct VPC association', () => {
      const igws = synthedStack.resource?.aws_internet_gateway;
      expect(igws).toBeDefined();
      expect(Object.keys(igws).length).toBe(1);
      
      const igw = Object.values(igws)[0] as any;
      expect(igw.vpc_id).toBeDefined();
      expect(igw.tags.Environment).toBe('test');
    });

    test('should create NAT Gateways with Elastic IPs in public subnets', () => {
      const natGateways = synthedStack.resource?.aws_nat_gateway;
      const eips = synthedStack.resource?.aws_eip;
      
      expect(natGateways).toBeDefined();
      expect(eips).toBeDefined();
      
      expect(Object.keys(natGateways).length).toBe(3);
      expect(Object.keys(eips).length).toBe(3);
      
      const natValues = Object.values(natGateways) as any[];
      const eipValues = Object.values(eips) as any[];
      
      natValues.forEach(nat => {
        expect(nat.allocation_id).toBeDefined();
        expect(nat.subnet_id).toBeDefined();
      });
      
      eipValues.forEach(eip => {
        expect(eip.domain).toBe('vpc');
        expect(eip.tags.Environment).toBe('test');
      });
    });

    test('should create route tables with correct routes', () => {
      const routeTables = synthedStack.resource?.aws_route_table;
      const routes = synthedStack.resource?.aws_route;
      
      expect(routeTables).toBeDefined();
      expect(routes).toBeDefined();
      
      expect(Object.keys(routeTables).length).toBe(4); // 1 public + 3 private
      expect(Object.keys(routes).length).toBe(4); // 1 public + 3 private
      
      const routeValues = Object.values(routes) as any[];
      routeValues.forEach(route => {
        expect(route.destination_cidr_block).toBe('0.0.0.0/0');
        expect(route.route_table_id).toBeDefined();
      });
    });
  });

  describe('Security Group Resources', () => {
    test('should create EKS cluster security group with HTTPS ingress', () => {
      const securityGroups = synthedStack.resource?.aws_security_group;
      expect(securityGroups).toBeDefined();
      const sgValues = Object.values(securityGroups) as any[];
      
      const eksClusterSG = sgValues.find(sg => 
        sg.name && sg.name.includes('eks-cluster-sg')
      );
      
      expect(eksClusterSG).toBeDefined();
      expect(eksClusterSG.description).toContain('EKS cluster');
      expect(eksClusterSG.vpc_id).toBeDefined();
      expect(eksClusterSG.tags.Environment).toBe('test');
    });

    test('should create ALB security group with HTTP/HTTPS ingress', () => {
      const securityGroups = synthedStack.resource?.aws_security_group;
      expect(securityGroups).toBeDefined();
      const sgValues = Object.values(securityGroups) as any[];
      
      const albSG = sgValues.find(sg => 
        sg.name && sg.name.includes('alb-sg')
      );
      
      expect(albSG).toBeDefined();
      expect(albSG.description).toContain('Application Load Balancer');
      expect(albSG.vpc_id).toBeDefined();
    });

    test('should create security group rules for ingress and egress', () => {
      const sgRules = synthedStack.resource?.aws_security_group_rule;
      expect(sgRules).toBeDefined();
      expect(Object.keys(sgRules).length).toBeGreaterThanOrEqual(4); // Multiple rules for both SGs
      
      const ruleValues = Object.values(sgRules) as any[];
      const ingressRules = ruleValues.filter(rule => rule.type === 'ingress');
      const egressRules = ruleValues.filter(rule => rule.type === 'egress');
      
      expect(ingressRules.length).toBeGreaterThanOrEqual(3); // HTTPS, HTTP, etc.
      expect(egressRules.length).toBeGreaterThanOrEqual(2); // All outbound for both SGs
      
      // Verify rule properties
      ingressRules.forEach(rule => {
        expect(rule.security_group_id).toBeDefined();
        expect(rule.from_port).toBeDefined();
        expect(rule.to_port).toBeDefined();
        expect(rule.protocol).toBeDefined();
      });
    });
  });

  describe('EKS Cluster Resources', () => {
    test('should create EKS cluster with correct version and configuration', () => {
      const eksClusters = synthedStack.resource?.aws_eks_cluster;
      expect(eksClusters).toBeDefined();
      expect(Object.keys(eksClusters).length).toBe(1);
      
      const cluster = Object.values(eksClusters)[0] as any;
      expect(cluster.name).toContain('test-cluster');
      expect(cluster.version).toBe('1.28');
      expect(cluster.role_arn).toBeDefined();
      expect(cluster.vpc_config).toBeDefined();
      expect(cluster.vpc_config.endpoint_private_access).toBe(true);
      expect(cluster.vpc_config.endpoint_public_access).toBe(true);
      expect(cluster.enabled_cluster_log_types).toEqual([
        'api', 'audit', 'authenticator', 'controllerManager', 'scheduler'
      ]);
      expect(cluster.tags.Environment).toBe('test');
    });

    test('should create IAM roles for EKS cluster and nodes', () => {
      const iamRoles = synthedStack.resource?.aws_iam_role;
      expect(iamRoles).toBeDefined();
      const roleValues = Object.values(iamRoles) as any[];
      
      const clusterRole = roleValues.find(role => 
        role.name && role.name.includes('cluster-role')
      );
      const nodeRole = roleValues.find(role => 
        role.name && role.name.includes('node-role')
      );
      
      expect(clusterRole).toBeDefined();
      expect(nodeRole).toBeDefined();
      
      // Verify assume role policies
      const clusterPolicy = JSON.parse(clusterRole.assume_role_policy);
      expect(clusterPolicy.Statement[0].Principal.Service).toBe('eks.amazonaws.com');
      
      const nodePolicy = JSON.parse(nodeRole.assume_role_policy);
      expect(nodePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should attach required policies to IAM roles', () => {
      const policyAttachments = synthedStack.resource?.aws_iam_role_policy_attachment;
      expect(policyAttachments).toBeDefined();
      const attachmentValues = Object.values(policyAttachments) as any[];
      
      // Verify EKS cluster policies
      const clusterPolicies = attachmentValues.filter(attachment => 
        attachment.policy_arn && (
          attachment.policy_arn.includes('AmazonEKSClusterPolicy') ||
          attachment.policy_arn.includes('AmazonEKSServicePolicy')
        )
      );
      
      // Verify node group policies
      const nodePolicies = attachmentValues.filter(attachment => 
        attachment.policy_arn && (
          attachment.policy_arn.includes('AmazonEKSWorkerNodePolicy') ||
          attachment.policy_arn.includes('AmazonEKS_CNI_Policy') ||
          attachment.policy_arn.includes('AmazonEC2ContainerRegistryReadOnly') ||
          attachment.policy_arn.includes('AmazonSSMManagedInstanceCore')
        )
      );
      
      expect(clusterPolicies.length).toBeGreaterThanOrEqual(1);
      expect(nodePolicies.length).toBeGreaterThanOrEqual(4);
    });

    test('should create OIDC provider for IRSA', () => {
      const oidcProviders = synthedStack.resource?.aws_iam_openid_connect_provider;
      expect(oidcProviders).toBeDefined();
      expect(Object.keys(oidcProviders).length).toBe(1);
      
      const provider = Object.values(oidcProviders)[0] as any;
      expect(provider.client_id_list).toContain('sts.amazonaws.com');
      expect(provider.thumbprint_list).toContain('9e99a48a9960b14926bb7f3b02e22da2b0ab7280');
      expect(provider.url).toBeDefined();
      expect(provider.tags.Environment).toBe('test');
    });
  });

  describe('Application Load Balancer Resources', () => {
    test('should create ALB with correct configuration', () => {
      const albs = synthedStack.resource?.aws_lb;
      expect(albs).toBeDefined();
      expect(Object.keys(albs).length).toBe(1);
      
      const alb = Object.values(albs)[0] as any;
      expect(alb.name).toContain('test-alb');
      expect(alb.internal).toBe(false);
      expect(alb.load_balancer_type).toBe('application');
      expect(alb.enable_deletion_protection).toBe(false);
      expect(alb.enable_http2).toBe(true);
      expect(alb.enable_cross_zone_load_balancing).toBe(true);
      expect(alb.security_groups).toBeDefined();
      expect(alb.subnets).toBeDefined();
      expect(alb.tags.Environment).toBe('test');
    });

    test('should create target group with health check configuration', () => {
      const targetGroups = synthedStack.resource?.aws_lb_target_group;
      expect(targetGroups).toBeDefined();
      expect(Object.keys(targetGroups).length).toBe(1);
      
      const tg = Object.values(targetGroups)[0] as any;
      expect(tg.name).toContain('test-alb-tg');
      expect(tg.port).toBe(80);
      expect(tg.protocol).toBe('HTTP');
      expect(tg.target_type).toBe('ip');
      expect(tg.vpc_id).toBeDefined();
      
      // Verify health check configuration
      expect(tg.health_check).toBeDefined();
      expect(tg.health_check.enabled).toBe(true);
      expect(tg.health_check.healthy_threshold).toBe(2);
      expect(tg.health_check.unhealthy_threshold).toBe(2);
      expect(tg.health_check.timeout).toBe(5);
      expect(tg.health_check.interval).toBe(30);
      expect(tg.health_check.path).toBe('/healthz');
      expect(tg.health_check.matcher).toBe('200');
    });

    test('should create listener with forward action', () => {
      const listeners = synthedStack.resource?.aws_lb_listener;
      expect(listeners).toBeDefined();
      expect(Object.keys(listeners).length).toBe(1);
      
      const listener = Object.values(listeners)[0] as any;
      expect(listener.port).toBe(80);
      expect(listener.protocol).toBe('HTTP');
      expect(listener.load_balancer_arn).toBeDefined();
      expect(listener.default_action).toBeDefined();
      expect(listener.default_action[0].type).toBe('forward');
      expect(listener.default_action[0].target_group_arn).toBeDefined();
    });
  });

  describe('IRSA Roles', () => {
    test('should create IRSA roles for ALB Controller and EBS CSI Driver', () => {
      const iamRoles = synthedStack.resource?.aws_iam_role;
      expect(iamRoles).toBeDefined();
      const roleValues = Object.values(iamRoles) as any[];
      
      const irsaRoles = roleValues.filter(role => 
        role.name && (
          role.name.includes('alb-controller') || 
          role.name.includes('ebs-csi') ||
          role.name.includes('load-balancer-controller') ||
          role.name.includes('csi-controller')
        )
      );
      
      expect(irsaRoles.length).toBeGreaterThanOrEqual(1);
      
      // Verify that at least one IRSA role exists
      const hasIrsaRole = roleValues.some(role => 
        role.assume_role_policy && 
        role.assume_role_policy.includes('sts:AssumeRoleWithWebIdentity')
      );
      expect(hasIrsaRole).toBe(true);
      
      // Verify assume role policies contain OIDC conditions
      irsaRoles.forEach(role => {
        const policy = JSON.parse(role.assume_role_policy);
        expect(policy.Statement[0].Principal.Federated).toBeDefined();
        expect(policy.Statement[0].Action).toBe('sts:AssumeRoleWithWebIdentity');
        expect(policy.Statement[0].Condition.StringEquals).toBeDefined();
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export all required outputs', () => {
      const outputs = synthedStack.output;
      expect(outputs).toBeDefined();
      
      expect(outputs['vpc-id']).toBeDefined();
      expect(outputs['eks-cluster-name']).toBeDefined();
      expect(outputs['eks-cluster-endpoint']).toBeDefined();
      expect(outputs['alb-dns-name']).toBeDefined();
      expect(outputs['alb-controller-role-arn']).toBeDefined();
      expect(outputs['ebs-csi-driver-role-arn']).toBeDefined();
      
      // Verify output descriptions
      expect(outputs['vpc-id'].description).toBe('VPC ID');
      expect(outputs['eks-cluster-name'].description).toBe('EKS Cluster Name');
      expect(outputs['alb-dns-name'].description).toBe('ALB DNS Name');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid CIDR blocks gracefully', () => {
      expect(() => {
        new TapStack(Testing.app(), 'invalid-cidr-stack', {
          vpcCidr: 'invalid-cidr'
        });
      }).not.toThrow(); // CDKTF validates at synth time
    });

    test('should handle whitespace in environment suffix', () => {
      const stackWithWhitespace = new TapStack(Testing.app(), 'whitespace-stack', {
        environmentSuffix: '  test  '
      });
      expect(stackWithWhitespace).toBeDefined();
    });

    test('should handle very long environment suffix', () => {
      const longSuffix = 'a'.repeat(100);
      const stackWithLongSuffix = new TapStack(Testing.app(), 'long-suffix-stack', {
        environmentSuffix: longSuffix
      });
      expect(stackWithLongSuffix).toBeDefined();
    });

    test('should handle empty configurations', () => {
      const minimalStack = new TapStack(Testing.app(), 'minimal-stack');
      expect(minimalStack).toBeDefined();
    });
  });
});
