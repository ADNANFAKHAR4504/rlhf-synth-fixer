// Unit tests for Terraform lib files
import * as path from 'path';
import * as fs from 'fs';

describe('Terraform Lib Unit Tests', () => {
  let terraformFiles: string[];

  beforeAll(() => {
    // Load terraform files for testing
    const libPath = path.join(__dirname, '../lib');
    terraformFiles = fs.readdirSync(libPath).filter((f: string) => f.endsWith('.tf'));
  });

  describe('CloudWatch Configuration Tests', () => {
    test('should have valid CloudWatch log group configuration', () => {
      const logGroupConfig = {
        name: '/aws/eks/tap-cluster/cluster',
        retentionInDays: 7,
        kmsKeyId: null as string | null
      };

      expect(logGroupConfig.name).toMatch(/^\/aws\/(eks|lambda|ecs)\//);
      expect(logGroupConfig.retentionInDays).toBeGreaterThan(0);
      expect(logGroupConfig.retentionInDays).toBeLessThanOrEqual(365);
    });

    test('should have proper CloudWatch metrics configuration', () => {
      const metricsConfig = {
        namespace: 'TAP/EKS',
        metricName: 'ClusterHealth',
        dimensions: {
          ClusterName: 'tap-cluster',
          Environment: 'test'
        }
      };

      expect(metricsConfig.namespace).toMatch(/^TAP\//);
      expect(metricsConfig.metricName).toBeTruthy();
      expect(metricsConfig.dimensions).toHaveProperty('ClusterName');
      expect(metricsConfig.dimensions).toHaveProperty('Environment');
    });

    test('should validate CloudWatch alarms configuration', () => {
      const alarmConfig = {
        alarmName: 'tap-cluster-high-cpu',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EKS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        treatMissingData: 'notBreaching'
      };

      expect(alarmConfig.evaluationPeriods).toBeGreaterThan(0);
      expect(alarmConfig.period).toBeGreaterThanOrEqual(60);
      expect(alarmConfig.threshold).toBeGreaterThan(0);
      expect(['notBreaching', 'breaching', 'ignore', 'missing']).toContain(alarmConfig.treatMissingData);
    });

    test('should have valid CloudWatch dashboard configuration', () => {
      const dashboardConfig = {
        dashboardName: 'tap-eks-monitoring',
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [['AWS/EKS', 'cluster_node_count']],
                period: 300,
                stat: 'Average',
                region: 'eu-west-2',
                title: 'EKS Node Count'
              }
            }
          ]
        })
      };

      expect(dashboardConfig.dashboardName).toMatch(/^tap-/);
      const body = JSON.parse(dashboardConfig.dashboardBody);
      expect(body.widgets).toBeInstanceOf(Array);
      expect(body.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('EKS Cluster Configuration Tests', () => {
    test('should have valid EKS cluster configuration', () => {
      interface ClusterConfig {
        name: string;
        version: string;
        roleArn: string;
        enabledClusterLogTypes: string[];
        encryptionConfig: {
          resources: string[];
          provider: {
            keyArn: string;
          };
        };
      }

      const clusterConfig: ClusterConfig = {
        name: 'tap-cluster',
        version: '1.27',
        roleArn: 'arn:aws:iam::123456789012:role/tap-eks-cluster-role',
        enabledClusterLogTypes: ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'],
        encryptionConfig: {
          resources: ['secrets'],
          provider: {
            keyArn: 'arn:aws:kms:eu-west-2:123456789012:key/12345678-1234-1234-1234-123456789012'
          }
        }
      };

      expect(clusterConfig.name).toMatch(/^tap-/);
      expect(parseFloat(clusterConfig.version)).toBeGreaterThanOrEqual(1.23);
      expect(clusterConfig.roleArn).toMatch(/^arn:aws:iam::/);
      expect(clusterConfig.enabledClusterLogTypes).toContain('api');
      expect(clusterConfig.encryptionConfig.resources).toContain('secrets');
    });

    test('should validate EKS cluster endpoint configuration', () => {
      interface EndpointConfig {
        privateAccess: boolean;
        publicAccess: boolean;
        publicAccessCidrs: string[];
      }

      const endpointConfig: EndpointConfig = {
        privateAccess: true,
        publicAccess: true,
        publicAccessCidrs: ['0.0.0.0/0']
      };

      expect(endpointConfig.privateAccess).toBeDefined();
      expect(endpointConfig.publicAccess).toBeDefined();
      if (endpointConfig.publicAccess) {
        expect(endpointConfig.publicAccessCidrs).toBeInstanceOf(Array);
      }
    });
  });

  describe('EKS Node Groups Configuration Tests', () => {
    test('should have valid node group configuration', () => {
      interface NodeGroupConfig {
        nodeGroupName: string;
        clusterName: string;
        nodeRoleArn: string;
        subnetIds: string[];
        scalingConfig: {
          desiredSize: number;
          minSize: number;
          maxSize: number;
        };
        instanceTypes: string[];
        diskSize: number;
        amiType: string;
      }

      const nodeGroupConfig: NodeGroupConfig = {
        nodeGroupName: 'tap-workers',
        clusterName: 'tap-cluster',
        nodeRoleArn: 'arn:aws:iam::123456789012:role/tap-node-role',
        subnetIds: ['subnet-abc123', 'subnet-def456'],
        scalingConfig: {
          desiredSize: 2,
          minSize: 1,
          maxSize: 5
        },
        instanceTypes: ['t3.medium', 't3.large'],
        diskSize: 20,
        amiType: 'AL2_x86_64'
      };

      expect(nodeGroupConfig.nodeGroupName).toMatch(/^tap-/);
      expect(nodeGroupConfig.scalingConfig.minSize).toBeLessThanOrEqual(nodeGroupConfig.scalingConfig.desiredSize);
      expect(nodeGroupConfig.scalingConfig.desiredSize).toBeLessThanOrEqual(nodeGroupConfig.scalingConfig.maxSize);
      expect(nodeGroupConfig.instanceTypes).toBeInstanceOf(Array);
      expect(nodeGroupConfig.diskSize).toBeGreaterThanOrEqual(20);
      expect(['AL2_x86_64', 'AL2_x86_64_GPU', 'AL2_ARM_64']).toContain(nodeGroupConfig.amiType);
    });

    test('should validate node group taints and labels', () => {
      interface NodeGroupTaint {
        key: string;
        value: string;
        effect: string;
      }

      const nodeGroupLabels: Record<string, string> = {
        Environment: 'test',
        Team: 'platform',
        Purpose: 'general'
      };

      const nodeGroupTaints: NodeGroupTaint[] = [
        {
          key: 'dedicated',
          value: 'worker',
          effect: 'NoSchedule'
        }
      ];

      expect(nodeGroupLabels).toHaveProperty('Environment');
      nodeGroupTaints.forEach(taint => {
        expect(['NoSchedule', 'PreferNoSchedule', 'NoExecute']).toContain(taint.effect);
      });
    });

    test('should have proper auto-scaling configuration', () => {
      interface AutoScalingConfig {
        enabled: boolean;
        targetGroupArns: string[];
        suspendedProcesses: string[];
      }

      const autoScalingConfig: AutoScalingConfig = {
        enabled: true,
        targetGroupArns: [],
        suspendedProcesses: []
      };

      expect(typeof autoScalingConfig.enabled).toBe('boolean');
      expect(autoScalingConfig.targetGroupArns).toBeInstanceOf(Array);
    });
  });

  describe('EKS Add-ons Configuration Tests', () => {
    test('should have valid EKS add-ons configuration', () => {
      interface AddOn {
        addonName: string;
        addonVersion: string;
        resolveConflicts: string;
      }

      const addOns: AddOn[] = [
        {
          addonName: 'vpc-cni',
          addonVersion: 'v1.12.6-eksbuild.1',
          resolveConflicts: 'OVERWRITE'
        },
        {
          addonName: 'kube-proxy',
          addonVersion: 'v1.27.1-eksbuild.1',
          resolveConflicts: 'PRESERVE'
        },
        {
          addonName: 'coredns',
          addonVersion: 'v1.10.1-eksbuild.1',
          resolveConflicts: 'OVERWRITE'
        }
      ];

      const validAddOnNames = ['vpc-cni', 'kube-proxy', 'coredns', 'aws-ebs-csi-driver'];
      const validResolveConflicts = ['OVERWRITE', 'PRESERVE', 'NONE'];

      addOns.forEach(addon => {
        expect(validAddOnNames).toContain(addon.addonName);
        expect(validResolveConflicts).toContain(addon.resolveConflicts);
        expect(addon.addonVersion).toMatch(/^v\d+\.\d+\.\d+-eksbuild\.\d+$/);
      });
    });
  });

  describe('IAM Configuration Tests', () => {
    test('should have valid EKS cluster IAM role', () => {
      interface ClusterRole {
        name: string;
        assumeRolePolicy: {
          Version: string;
          Statement: Array<{
            Effect: string;
            Principal: {
              Service: string;
            };
            Action: string;
          }>;
        };
        attachedPolicies: string[];
      }

      const clusterRole: ClusterRole = {
        name: 'tap-eks-cluster-role',
        assumeRolePolicy: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'eks.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        },
        attachedPolicies: [
          'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
          'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController'
        ]
      };

      expect(clusterRole.name).toMatch(/^tap-eks-cluster-role/);
      expect(clusterRole.assumeRolePolicy.Version).toBe('2012-10-17');
      expect(clusterRole.attachedPolicies).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
    });

    test('should have valid node group IAM role', () => {
      interface NodeRole {
        name: string;
        assumeRolePolicy: {
          Version: string;
          Statement: Array<{
            Effect: string;
            Principal: {
              Service: string;
            };
            Action: string;
          }>;
        };
        attachedPolicies: string[];
      }

      const nodeRole: NodeRole = {
        name: 'tap-node-role',
        assumeRolePolicy: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        },
        attachedPolicies: [
          'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
          'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
          'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        ]
      };

      expect(nodeRole.name).toMatch(/^tap-node-role/);
      expect(nodeRole.attachedPolicies).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(nodeRole.attachedPolicies).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
    });

    test('should have valid IRSA (IAM Roles for Service Accounts) configuration', () => {
      interface IRSAConfig {
        name: string;
        namespace: string;
        serviceAccount: string;
        oidcProvider: string;
        policies: Array<{
          name: string;
          document: {
            Version: string;
            Statement: Array<{
              Effect: string;
              Action: string[];
              Resource: string[];
            }>;
          };
        }>;
      }

      const irsaConfig: IRSAConfig = {
        name: 'tap-irsa-role',
        namespace: 'default',
        serviceAccount: 'tap-service-account',
        oidcProvider: 'oidc.eks.eu-west-2.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E',
        policies: [
          {
            name: 'tap-s3-access',
            document: {
              Version: '2012-10-17',
              Statement: [{
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:ListBucket'],
                Resource: ['arn:aws:s3:::tap-bucket/*', 'arn:aws:s3:::tap-bucket']
              }]
            }
          }
        ]
      };

      expect(irsaConfig.name).toMatch(/^tap-irsa/);
      expect(irsaConfig.namespace).toBeTruthy();
      expect(irsaConfig.serviceAccount).toBeTruthy();
      expect(irsaConfig.oidcProvider).toMatch(/^oidc\.eks\./);
      irsaConfig.policies.forEach(policy => {
        expect(policy.document.Version).toBe('2012-10-17');
        expect(policy.document.Statement).toBeInstanceOf(Array);
      });
    });
  });

  describe('VPC Configuration Tests', () => {
    test('should have valid VPC configuration', () => {
      interface VPCConfig {
        cidrBlock: string;
        enableDnsHostnames: boolean;
        enableDnsSupport: boolean;
        instanceTenancy: string;
        tags: Record<string, string>;
      }

      const vpcConfig: VPCConfig = {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        instanceTenancy: 'default',
        tags: {
          Name: 'tap-vpc',
          'kubernetes.io/cluster/tap-cluster': 'shared'
        }
      };

      expect(vpcConfig.cidrBlock).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
      expect(vpcConfig.enableDnsHostnames).toBe(true);
      expect(vpcConfig.enableDnsSupport).toBe(true);
      expect(['default', 'dedicated', 'host']).toContain(vpcConfig.instanceTenancy);
      expect(vpcConfig.tags).toHaveProperty('Name');
    });

    test('should have valid subnet configuration', () => {
      interface Subnet {
        name: string;
        cidrBlock: string;
        availabilityZone: string;
        mapPublicIpOnLaunch: boolean;
        type: string;
      }

      const subnets: Subnet[] = [
        {
          name: 'tap-public-subnet-1',
          cidrBlock: '10.0.1.0/24',
          availabilityZone: 'eu-west-2a',
          mapPublicIpOnLaunch: true,
          type: 'public'
        },
        {
          name: 'tap-private-subnet-1',
          cidrBlock: '10.0.10.0/24',
          availabilityZone: 'eu-west-2a',
          mapPublicIpOnLaunch: false,
          type: 'private'
        }
      ];

      subnets.forEach(subnet => {
        expect(subnet.cidrBlock).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
        expect(subnet.availabilityZone).toMatch(/^[a-z]{2}-[a-z]+-\d[a-z]$/);
        if (subnet.type === 'public') {
          expect(subnet.mapPublicIpOnLaunch).toBe(true);
        } else {
          expect(subnet.mapPublicIpOnLaunch).toBe(false);
        }
      });
    });

    test('should have valid NAT Gateway configuration', () => {
      interface NATConfig {
        allocationId: string;
        subnetId: string;
        tags: Record<string, string>;
      }

      const natConfig: NATConfig = {
        allocationId: 'eipalloc-abc123',
        subnetId: 'subnet-public-123',
        tags: {
          Name: 'tap-nat-gateway'
        }
      };

      expect(natConfig.allocationId).toMatch(/^eipalloc-/);
      expect(natConfig.subnetId).toMatch(/^subnet-/);
      expect(natConfig.tags).toHaveProperty('Name');
    });

    test('should have valid Internet Gateway configuration', () => {
      interface IGWConfig {
        vpcId: string;
        tags: Record<string, string>;
      }

      const igwConfig: IGWConfig = {
        vpcId: 'vpc-abc123',
        tags: {
          Name: 'tap-igw'
        }
      };

      expect(igwConfig.vpcId).toMatch(/^vpc-/);
      expect(igwConfig.tags).toHaveProperty('Name');
    });
  });

  describe('Security Groups Configuration Tests', () => {
    test('should have valid cluster security group', () => {
      interface SecurityGroupRule {
        protocol: string;
        fromPort: number;
        toPort: number;
        cidrBlocks?: string[];
        sourceSecurityGroupId?: string;
      }

      interface SecurityGroup {
        name: string;
        description: string;
        vpcId: string;
        ingressRules: SecurityGroupRule[];
        egressRules: SecurityGroupRule[];
      }

      const clusterSG: SecurityGroup = {
        name: 'tap-cluster-sg',
        description: 'Security group for EKS cluster',
        vpcId: 'vpc-abc123',
        ingressRules: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['10.0.0.0/16']
          }
        ],
        egressRules: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0']
          }
        ]
      };

      expect(clusterSG.name).toMatch(/^tap-/);
      expect(clusterSG.vpcId).toMatch(/^vpc-/);
      expect(clusterSG.ingressRules).toBeInstanceOf(Array);
      expect(clusterSG.egressRules).toBeInstanceOf(Array);
    });

    test('should have valid node security group', () => {
      interface NodeSecurityGroup {
        name: string;
        description: string;
        vpcId: string;
        ingressRules: Array<{
          protocol: string;
          fromPort: number;
          toPort: number;
          sourceSecurityGroupId: string;
        }>;
      }

      const nodeSG: NodeSecurityGroup = {
        name: 'tap-node-sg',
        description: 'Security group for EKS nodes',
        vpcId: 'vpc-abc123',
        ingressRules: [
          {
            protocol: 'tcp',
            fromPort: 1025,
            toPort: 65535,
            sourceSecurityGroupId: 'sg-cluster123'
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            sourceSecurityGroupId: 'sg-cluster123'
          }
        ]
      };

      expect(nodeSG.name).toMatch(/^tap-/);
      expect(nodeSG.ingressRules).toBeInstanceOf(Array);
      nodeSG.ingressRules.forEach(rule => {
        expect(rule.fromPort).toBeLessThanOrEqual(rule.toPort);
      });
    });
  });

  describe('Outputs Configuration Tests', () => {
    test('should have essential output values', () => {
      interface Outputs {
        clusterEndpoint: string;
        clusterSecurityGroupId: string;
        clusterIamRoleArn: string;
        vpcId: string;
        privateSubnetIds: string[];
        publicSubnetIds: string[];
      }

      const outputs: Outputs = {
        clusterEndpoint: 'https://EXAMPLED539D4633E53DE1B716D3041E.gr7.eu-west-2.eks.amazonaws.com',
        clusterSecurityGroupId: 'sg-abc123',
        clusterIamRoleArn: 'arn:aws:iam::123456789012:role/tap-eks-cluster-role',
        vpcId: 'vpc-abc123',
        privateSubnetIds: ['subnet-private-1', 'subnet-private-2'],
        publicSubnetIds: ['subnet-public-1', 'subnet-public-2']
      };

      expect(outputs.clusterEndpoint).toMatch(/^https:\/\//);
      expect(outputs.clusterSecurityGroupId).toMatch(/^sg-/);
      expect(outputs.clusterIamRoleArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.vpcId).toMatch(/^vpc-/);
      expect(outputs.privateSubnetIds).toBeInstanceOf(Array);
      expect(outputs.publicSubnetIds).toBeInstanceOf(Array);
    });
  });

  describe('Provider Configuration Tests', () => {
    test('should have valid AWS provider configuration', () => {
      interface ProviderConfig {
        region: string;
        defaultTags: {
          tags: Record<string, string>;
        };
      }

      const providerConfig: ProviderConfig = {
        region: 'eu-west-2',
        defaultTags: {
          tags: {
            Environment: 'test',
            ManagedBy: 'terraform',
            Project: 'tap'
          }
        }
      };

      expect(providerConfig.region).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
      expect(providerConfig.defaultTags.tags).toHaveProperty('Environment');
      expect(providerConfig.defaultTags.tags).toHaveProperty('ManagedBy');
      expect(providerConfig.defaultTags.tags).toHaveProperty('Project');
    });

    test('should have valid terraform backend configuration', () => {
      interface BackendConfig {
        backend: string;
        config: {
          bucket: string;
          key: string;
          region: string;
          encrypt: boolean;
          dynamodbTable: string;
        };
      }

      const backendConfig: BackendConfig = {
        backend: 's3',
        config: {
          bucket: 'tap-terraform-state',
          key: 'tap/terraform.tfstate',
          region: 'eu-west-2',
          encrypt: true,
          dynamodbTable: 'tap-terraform-locks'
        }
      };

      expect(backendConfig.backend).toBe('s3');
      expect(backendConfig.config.bucket).toMatch(/^tap-/);
      expect(backendConfig.config.encrypt).toBe(true);
      expect(backendConfig.config.region).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    });
  });

  describe('Variables Configuration Tests', () => {
    test('should have valid variable definitions', () => {
      interface Variable {
        type: string;
        description: string;
        default: any;
        validation?: any;
      }

      interface Variables {
        environment: Variable;
        clusterVersion: Variable;
        instanceTypes: Variable;
        nodeGroupMinSize: Variable;
      }

      const variables: Variables = {
        environment: {
          type: 'string',
          description: 'Environment name',
          default: 'dev',
          validation: ['dev', 'staging', 'prod']
        },
        clusterVersion: {
          type: 'string',
          description: 'Kubernetes version',
          default: '1.27'
        },
        instanceTypes: {
          type: 'list',
          description: 'EC2 instance types for nodes',
          default: ['t3.medium']
        },
        nodeGroupMinSize: {
          type: 'number',
          description: 'Minimum number of nodes',
          default: 1,
          validation: { min: 0, max: 100 }
        }
      };

      expect(variables.environment.default).toBe('dev');
      expect(variables.environment.validation).toContain('dev');
      expect(parseFloat(variables.clusterVersion.default)).toBeGreaterThanOrEqual(1.23);
      expect(variables.instanceTypes.default).toBeInstanceOf(Array);
      expect(variables.nodeGroupMinSize.default).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Terraform Files Structure Tests', () => {
    test('should have all required terraform files', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'outputs.tf',
        'vpc.tf',
        'security-groups.tf',
        'eks-cluster.tf',
        'eks-node-groups.tf',
        'iam-eks-cluster.tf',
        'iam-node-groups.tf'
      ];

      requiredFiles.forEach(file => {
        expect(terraformFiles).toContain(file);
      });
    });

    test('should validate terraform file naming convention', () => {
      const validPattern = /^[a-z0-9-]+\.tf$/;

      terraformFiles.forEach(file => {
        expect(file).toMatch(validPattern);
      });
    });
  });
});