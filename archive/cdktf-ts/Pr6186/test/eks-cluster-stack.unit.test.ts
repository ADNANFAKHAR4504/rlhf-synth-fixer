import { App, Testing, TerraformStack } from 'cdktf';
import { EksClusterStack } from '../lib/eks-cluster-stack';

describe('EksClusterStack Unit Tests', () => {
  let app: App;
  let stack: TerraformStack;
  let eksStack: EksClusterStack;
  let synthesized: string;

  const testProps = {
    environmentSuffix: 'test',
    vpcId: 'vpc-12345678',
    privateSubnetIds: ['subnet-111', 'subnet-222', 'subnet-333'],
    region: 'us-east-2',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    stack = new TerraformStack(app, 'TestStack');
  });

  test('EksClusterStack creates EKS cluster with correct version', () => {
    eksStack = new EksClusterStack(stack, 'test-eks', testProps);
    synthesized = Testing.synth(stack);

    expect(eksStack.cluster).toBeDefined();
    expect(synthesized).toContain('"version": "1.28"');
    expect(synthesized).toContain('eks-cluster-test');
  });

  test('EksClusterStack creates CloudWatch log group', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-logs', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_cloudwatch_log_group');
    expect(synthesized).toContain('/aws/eks/eks-cluster-test/cluster');
    expect(synthesized).toContain('"retention_in_days": 7');
  });

  test('EksClusterStack creates IAM role for cluster', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-role', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('eks-cluster-role-test');
    expect(synthesized).toContain('eks.amazonaws.com');
    expect(synthesized).toContain('sts:AssumeRole');
  });

  test('EksClusterStack attaches required policies to cluster role', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-policies', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('AmazonEKSClusterPolicy');
    expect(synthesized).toContain('AmazonEKSVPCResourceController');
  });

  test('EksClusterStack creates cluster security group', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-sg', testProps);
    synthesized = Testing.synth(stack);

    expect(eksStack.clusterSecurityGroup).toBeDefined();
    expect(synthesized).toContain('eks-cluster-sg-test');
    expect(synthesized).toContain('Security group for EKS cluster control plane');
  });

  test('EksClusterStack creates node security group', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-node-sg', testProps);
    synthesized = Testing.synth(stack);

    expect(eksStack.nodeSecurityGroup).toBeDefined();
    expect(synthesized).toContain('eks-node-sg-test');
    expect(synthesized).toContain('Security group for EKS worker nodes');
    expect(synthesized).toContain('Allow all outbound traffic');
  });

  test('EksClusterStack creates security group rules', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-sg-rules', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_security_group_rule');
    expect(synthesized).toContain('Allow cluster to communicate with nodes on 443');
    expect(synthesized).toContain('Allow cluster to communicate with kubelet on nodes');
    expect(synthesized).toContain('Allow nodes to communicate with cluster API');
    expect(synthesized).toContain('Allow nodes to communicate with each other');
  });

  test('EksClusterStack configures VPC config correctly', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-vpc-config', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"endpoint_private_access": true');
    expect(synthesized).toContain('"endpoint_public_access": true');
  });

  test('EksClusterStack enables control plane logging', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-logging', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"enabled_cluster_log_types"');
    expect(synthesized).toContain('audit');
    expect(synthesized).toContain('authenticator');
    expect(synthesized).toContain('controllerManager');
  });

  test('EksClusterStack creates OIDC provider', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-oidc', testProps);
    synthesized = Testing.synth(stack);

    expect(eksStack.oidcProvider).toBeDefined();
    expect(synthesized).toContain('aws_iam_openid_connect_provider');
    expect(synthesized).toContain('"client_id_list"');
    expect(synthesized).toContain('sts.amazonaws.com');
    expect(synthesized).toContain('9e99a48a9960b14926bb7f3b02e22da2b0ab7280');
  });

  test('EksClusterStack creates node IAM role', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-node-role', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('eks-node-role-test');
    expect(synthesized).toContain('ec2.amazonaws.com');
  });

  test('EksClusterStack attaches required policies to node role', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-node-policies', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('AmazonEKSWorkerNodePolicy');
    expect(synthesized).toContain('AmazonEKS_CNI_Policy');
    expect(synthesized).toContain('AmazonEC2ContainerRegistryReadOnly');
  });

  test('EksClusterStack creates general node group', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-general-ng', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('general-node-group-test');
    expect(synthesized).toContain('"min_size": 2');
    expect(synthesized).toContain('"max_size": 10');
    expect(synthesized).toContain('"desired_size": 2');
    expect(synthesized).toContain('t3.medium');
    expect(synthesized).toContain('t3.large');
    expect(synthesized).toContain('"capacity_type": "ON_DEMAND"');
  });

  test('EksClusterStack creates GPU node group', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-gpu-ng', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('gpu-node-group-test');
    expect(synthesized).toContain('"min_size": 0');
    expect(synthesized).toContain('"max_size": 3');
    expect(synthesized).toContain('"desired_size": 0');
    expect(synthesized).toContain('g4dn.xlarge');
  });

  test('EksClusterStack creates VPC CNI addon', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-vpc-cni', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_eks_addon');
    expect(synthesized).toContain('"addon_name": "vpc-cni"');
    expect(synthesized).toContain('"addon_version": "v1.16.0-eksbuild.1"');
    expect(synthesized).toContain('"resolve_conflicts_on_create": "OVERWRITE"');
    expect(synthesized).toContain('"resolve_conflicts_on_update": "OVERWRITE"');
  });

  test('EksClusterStack creates kube-proxy addon', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-kube-proxy', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"addon_name": "kube-proxy"');
    expect(synthesized).toContain('"addon_version": "v1.28.2-eksbuild.2"');
  });

  test('EksClusterStack creates coredns addon', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-coredns', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"addon_name": "coredns"');
    expect(synthesized).toContain('"addon_version": "v1.10.1-eksbuild.6"');
  });

  test('EksClusterStack creates IRSA S3 access role', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-irsa', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('s3-access-irsa-role-test');
    expect(synthesized).toContain('sts:AssumeRoleWithWebIdentity');
    expect(synthesized).toContain('system:serviceaccount:default:s3-access-sa');
  });

  test('EksClusterStack creates S3 access policy', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-s3-policy', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('s3-access-policy-test');
    expect(synthesized).toContain('s3:GetObject');
    expect(synthesized).toContain('s3:ListBucket');
  });

  test('EksClusterStack exports cluster endpoint', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-endpoint', testProps);

    expect(eksStack.clusterEndpoint).toBeDefined();
  });

  test('EksClusterStack exports cluster certificate authority', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-ca', testProps);

    expect(eksStack.clusterCertificateAuthority).toBeDefined();
  });

  test('EksClusterStack exports OIDC provider URL', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-oidc-url', testProps);

    expect(eksStack.oidcProviderUrl).toBeDefined();
  });

  test('EksClusterStack tags all resources with environmentSuffix', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-tags', {
      ...testProps,
      environmentSuffix: 'custom',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('eks-cluster-custom');
    expect(synthesized).toContain('eks-cluster-role-custom');
    expect(synthesized).toContain('eks-cluster-sg-custom');
    expect(synthesized).toContain('eks-node-sg-custom');
    expect(synthesized).toContain('general-node-group-custom');
    expect(synthesized).toContain('gpu-node-group-custom');
  });

  test('EksClusterStack tags resources with standard tags', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-std-tags', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"Environment": "production"');
    expect(synthesized).toContain('"Team": "platform"');
    expect(synthesized).toContain('"CostCenter": "engineering"');
  });

  test('EksClusterStack tags node groups for cluster autoscaler', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-autoscaler', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"k8s.io/cluster-autoscaler/enabled": "true"');
    expect(synthesized).toContain('k8s.io/cluster-autoscaler/eks-cluster-test');
  });

  test('EksClusterStack uses AWS partition data source', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-partition', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('data.aws_partition');
  });

  test('EksClusterStack configures node group update config', () => {
    eksStack = new EksClusterStack(stack, 'test-eks-update-config', testProps);
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"update_config"');
    expect(synthesized).toContain('"max_unavailable": 1');
  });
});
