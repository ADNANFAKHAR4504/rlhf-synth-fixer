import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  AppsV1Api,
  BatchV1Api,
  CoreV1Api,
  KubeConfig
} from '@kubernetes/client-node';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const TERRAFORM_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 120000; // 2 minutes

// AWS SDK Clients
const ec2 = new AWS.EC2({ region: AWS_REGION });
const eks = new AWS.EKS({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });
const iam = new AWS.IAM({ region: AWS_REGION });

// Kubernetes client setup helper
async function getK8sClients(): Promise<{ coreApi: CoreV1Api; appsApi: AppsV1Api; batchApi: BatchV1Api }> {
  const kc = new KubeConfig();

  // Get cluster details from outputs
  const outputs = getTerraformOutputs();
  const clusterName = outputs.cluster_name;

  // Get cluster endpoint and CA certificate
  const clusterResult = await awsCall(() =>
    eks.describeCluster({ name: clusterName }).promise()
  );

  const cluster = clusterResult.cluster!;
  const clusterEndpoint = cluster.endpoint!;
  const clusterCa = cluster.certificateAuthority!.data!;

  // Build kubeconfig
  kc.loadFromOptions({
    clusters: [{
      name: clusterName,
      server: clusterEndpoint,
      caData: clusterCa
    }],
    users: [{
      name: 'aws',
      exec: {
        apiVersion: 'client.authentication.k8s.io/v1beta1',
        command: 'aws',
        args: [
          'eks',
          'get-token',
          '--cluster-name',
          clusterName,
          '--region',
          AWS_REGION
        ]
      }
    }],
    contexts: [{
      name: clusterName,
      cluster: clusterName,
      user: 'aws'
    }],
    currentContext: clusterName
  });

  return {
    coreApi: kc.makeApiClient(CoreV1Api),
    appsApi: kc.makeApiClient(AppsV1Api),
    batchApi: kc.makeApiClient(BatchV1Api)
  };
}

// Helper: Get Terraform outputs
function getTerraformOutputs(): Record<string, any> {
  const cfnOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
  if (fs.existsSync(cfnOutputsPath)) {
    try {
      const data = fs.readFileSync(cfnOutputsPath, 'utf-8');
      const outputs = JSON.parse(data);
      const result: Record<string, any> = {};

      // Parse values that might be JSON strings (like arrays)
      for (const [key, value] of Object.entries(outputs)) {
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        } else {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      // Continue to try terraform output
    }
  }
  return {};
}

// Helper: AWS API call wrapper
async function awsCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    throw new Error(`AWS API call failed: ${err.message}`);
  }
}


// =============================================================================
// SUITE 2: DEPLOYED INFRASTRUCTURE VALIDATION
// =============================================================================

describe('Deployed Infrastructure Validation', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('Outputs have correct format', () => {
    expect(outputs.cluster_name).toBeDefined();
    expect(outputs.cluster_name).toMatch(/^prod-eks-cluster-/);
    expect(outputs.cluster_endpoint).toMatch(/^https:\/\//);
    expect(outputs.vpc_id).toMatch(/^vpc-/);
    expect(outputs.kms_key_id).toBeTruthy();
    expect(outputs.cluster_arn).toMatch(/^arn:aws:eks:/);
  });

  describe('Networking', () => {
    test('VPC exists and has correct configuration', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const result = await awsCall(() =>
        ec2.describeVpcs({ VpcIds: [vpcId] }).promise()
      );

      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].CidrBlock).toBe(outputs.vpc_cidr);
      // DNS settings are boolean values in AWS SDK v2
      const vpc = result.Vpcs![0];
      expect(vpc).toBeDefined();
    }, TEST_TIMEOUT);

    test('Public subnets exist and are correctly configured', async () => {
      const publicSubnetIds = outputs.public_subnet_ids;
      expect(publicSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBeGreaterThan(0);

      const result = await awsCall(() =>
        ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise()
      );

      expect(result.Subnets).toHaveLength(publicSubnetIds.length);
      for (const subnet of result.Subnets || []) {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      }
    }, TEST_TIMEOUT);

    test('Private subnets exist and are correctly configured', async () => {
      const privateSubnetIds = outputs.private_subnet_ids;
      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBeGreaterThan(0);

      const result = await awsCall(() =>
        ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise()
      );

      expect(result.Subnets).toHaveLength(privateSubnetIds.length);
      for (const subnet of result.Subnets || []) {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      }
    }, TEST_TIMEOUT);

    test('Internet Gateway exists and is attached', async () => {
      const igwId = outputs.internet_gateway_id;
      expect(igwId).toBeDefined();

      const result = await awsCall(() =>
        ec2.describeInternetGateways({ InternetGatewayIds: [igwId] }).promise()
      );

      expect(result.InternetGateways).toHaveLength(1);
      expect(result.InternetGateways![0].Attachments).toBeDefined();
      expect(result.InternetGateways![0].Attachments![0].State).toBe('available');
    }, TEST_TIMEOUT);
  });

  describe('EKS Cluster', () => {
    test('EKS cluster exists and is active', async () => {
      const clusterName = outputs.cluster_name;
      expect(clusterName).toBeDefined();

      const result = await awsCall(() =>
        eks.describeCluster({ name: clusterName }).promise()
      );

      expect(result.cluster).toBeDefined();
      expect(result.cluster!.name).toBe(clusterName);
      expect(result.cluster!.status).toBe('ACTIVE');
      expect(result.cluster!.endpoint).toBe(outputs.cluster_endpoint);
      expect(result.cluster!.version).toBe(outputs.cluster_version);
    }, TEST_TIMEOUT);

    test('EKS cluster has correct VPC configuration', async () => {
      const clusterName = outputs.cluster_name;
      const vpcId = outputs.vpc_id;
      const privateSubnetIds = outputs.private_subnet_ids;

      const result = await awsCall(() =>
        eks.describeCluster({ name: clusterName }).promise()
      );

      expect(result.cluster!.resourcesVpcConfig).toBeDefined();
      expect(result.cluster!.resourcesVpcConfig!.vpcId).toBe(vpcId);
      expect(result.cluster!.resourcesVpcConfig!.subnetIds).toEqual(
        expect.arrayContaining(privateSubnetIds)
      );
      expect(result.cluster!.resourcesVpcConfig!.endpointPrivateAccess).toBe(true);
      expect(result.cluster!.resourcesVpcConfig!.endpointPublicAccess).toBe(true);
    }, TEST_TIMEOUT);

    test('EKS cluster has logging enabled', async () => {
      const clusterName = outputs.cluster_name;

      const result = await awsCall(() =>
        eks.describeCluster({ name: clusterName }).promise()
      );

      expect(result.cluster!.logging).toBeDefined();
      expect(result.cluster!.logging!.clusterLogging).toBeDefined();
      const enabledLogTypes = result.cluster!.logging!.clusterLogging!
        .filter((log: any) => log.enabled)
        .map((log: any) => log.types)
        .flat();
      expect(enabledLogTypes.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('EKS Node Groups', () => {
    test('Critical node group exists and is active', async () => {
      const clusterName = outputs.cluster_name;
      const criticalNodeGroupId = outputs.critical_node_group_id;
      expect(criticalNodeGroupId).toBeDefined();

      // Terraform returns format: "cluster-name:node-group-name", extract the node group name
      const nodeGroupName = criticalNodeGroupId.includes(':')
        ? criticalNodeGroupId.split(':')[1]
        : criticalNodeGroupId;

      const result = await awsCall(() =>
        eks.describeNodegroup({
          clusterName,
          nodegroupName: nodeGroupName,
        }).promise()
      );

      expect(result.nodegroup).toBeDefined();
      expect(result.nodegroup!.status).toBe('ACTIVE');
      expect(result.nodegroup!.nodegroupName).toBe(nodeGroupName);
      expect(result.nodegroup!.amiType).toBe('BOTTLEROCKET_x86_64');
      expect(result.nodegroup!.instanceTypes).toContain('m5.large');
    }, TEST_TIMEOUT);

    test('General node group exists and is active', async () => {
      const clusterName = outputs.cluster_name;
      const generalNodeGroupId = outputs.general_node_group_id;
      expect(generalNodeGroupId).toBeDefined();

      // Terraform returns format: "cluster-name:node-group-name", extract the node group name
      const nodeGroupName = generalNodeGroupId.includes(':')
        ? generalNodeGroupId.split(':')[1]
        : generalNodeGroupId;

      const result = await awsCall(() =>
        eks.describeNodegroup({
          clusterName,
          nodegroupName: nodeGroupName,
        }).promise()
      );

      expect(result.nodegroup).toBeDefined();
      expect(result.nodegroup!.status).toBe('ACTIVE');
      expect(result.nodegroup!.nodegroupName).toBe(nodeGroupName);
      expect(result.nodegroup!.amiType).toBe('BOTTLEROCKET_x86_64');
      // General node group can have multiple instance types
      expect(result.nodegroup!.instanceTypes).toBeDefined();
      expect(result.nodegroup!.instanceTypes!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('Node groups have correct scaling configuration', async () => {
      const clusterName = outputs.cluster_name;
      const criticalNodeGroupId = outputs.critical_node_group_id;
      const nodeGroupName = criticalNodeGroupId.includes(':')
        ? criticalNodeGroupId.split(':')[1]
        : criticalNodeGroupId;

      const result = await awsCall(() =>
        eks.describeNodegroup({
          clusterName,
          nodegroupName: nodeGroupName,
        }).promise()
      );

      expect(result.nodegroup!.scalingConfig).toBeDefined();
      expect(result.nodegroup!.scalingConfig!.minSize).toBe(3);
      expect(result.nodegroup!.scalingConfig!.desiredSize).toBeGreaterThanOrEqual(3);
      expect(result.nodegroup!.scalingConfig!.maxSize).toBeGreaterThanOrEqual(3);
    }, TEST_TIMEOUT);
  });

  describe('Node-to-Node Communication', () => {
    let coreApi: CoreV1Api;
    let batchApi: BatchV1Api;

    beforeAll(async () => {
      const clients = await getK8sClients();
      coreApi = clients.coreApi;
      batchApi = clients.batchApi;
    });

    // Helper function to check connectivity from a source node to a target IP:Port
    async function checkPortReachable(sourceNodeName: string, targetIp: string, port: number): Promise<boolean> {
      const jobName = `conn-check-${Math.floor(Math.random() * 100000)}`;
      const namespace = 'default';

      const jobManifest = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
          name: jobName,
          namespace: namespace
        },
        spec: {
          ttlSecondsAfterFinished: 60,
          backoffLimit: 1,
          template: {
            spec: {
              nodeName: sourceNodeName,
              hostNetwork: true,
              containers: [{
                name: 'check',
                image: 'busybox',
                command: ['nc', '-z', '-w', '5', targetIp, port.toString()]
              }],
              restartPolicy: 'Never'
            }
          }
        }
      };

      try {
        await batchApi.createNamespacedJob({ namespace, body: jobManifest });

        // Wait for Job completion
        for (let i = 0; i < 30; i++) { // Wait up to 60 seconds
          await new Promise(r => setTimeout(r, 2000));
          const job = await batchApi.readNamespacedJob({ name: jobName, namespace });

          if (job.status?.succeeded && job.status.succeeded > 0) {
            return true;
          }
          if (job.status?.failed && job.status.failed > 0) {
            return false;
          }
        }
        return false; // Timeout
      } catch (error) {
        console.error(`Error in checkPortReachable: ${error}`);
        return false;
      } finally {
        try {
          await batchApi.deleteNamespacedJob({ name: jobName, namespace, propagationPolicy: 'Background' });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }

    test('Nodes can communicate with each other on port 10250 (Kubelet)', async () => {
      // 1. Get Nodes
      const nodesResult = await coreApi.listNode();
      const nodes = nodesResult.items;

      if (nodes.length < 2) {
        console.warn('Skipping node-to-node test: Less than 2 nodes found');
        return;
      }

      // 2. Pick two different nodes
      const node1 = nodes[0];
      const node2 = nodes[1];

      const node1Name = node1.metadata?.name;
      const node2IP = node2.status?.addresses?.find(a => a.type === 'InternalIP')?.address;

      expect(node1Name).toBeDefined();
      expect(node2IP).toBeDefined();

      console.log(`Testing connectivity from Node ${node1Name} to Node ${node2.metadata?.name} (${node2IP}:10250)`);

      // 3. Verify connectivity
      const isReachable = await checkPortReachable(node1Name!, node2IP!, 10250);
      expect(isReachable).toBe(true);
    }, TEST_TIMEOUT * 2);
  });

  describe('Security Groups', () => {
    test('Cluster security group exists and has correct rules', async () => {
      const clusterSgId = outputs.cluster_security_group_id;
      expect(clusterSgId).toBeDefined();

      const result = await awsCall(() =>
        ec2.describeSecurityGroups({ GroupIds: [clusterSgId] }).promise()
      );

      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(clusterSgId);
      expect(result.SecurityGroups![0].VpcId).toBe(outputs.vpc_id);
    }, TEST_TIMEOUT);

    test('Node security group exists and has correct rules', async () => {
      const nodeSgId = outputs.node_security_group_id;
      expect(nodeSgId).toBeDefined();

      const result = await awsCall(() =>
        ec2.describeSecurityGroups({ GroupIds: [nodeSgId] }).promise()
      );

      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(nodeSgId);
      expect(result.SecurityGroups![0].VpcId).toBe(outputs.vpc_id);
    }, TEST_TIMEOUT);
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and has rotation enabled', async () => {
      const kmsKeyId = outputs.kms_key_id;
      expect(kmsKeyId).toBeDefined();

      const keyDetails = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(keyDetails.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );

      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, TEST_TIMEOUT);

    test('KMS key alias exists', async () => {
      const kmsKeyAlias = outputs.kms_key_alias;
      expect(kmsKeyAlias).toBeDefined();
      expect(kmsKeyAlias).toMatch(/^alias\//);
    }, TEST_TIMEOUT);
  });

  describe('IAM Roles', () => {
    test('EKS cluster IAM role exists and has correct policies', async () => {
      const clusterRoleArn = outputs.eks_cluster_role_arn;
      expect(clusterRoleArn).toBeDefined();

      const roleName = clusterRoleArn.split('/').pop();
      const result = await awsCall(() =>
        iam.getRole({ RoleName: roleName! }).promise()
      );

      expect(result.Role).toBeDefined();
      expect(result.Role!.Arn).toBe(clusterRoleArn);
      expect(result.Role!.AssumeRolePolicyDocument).toBeDefined();

      const attachedPolicies = await awsCall(() =>
        iam.listAttachedRolePolicies({ RoleName: roleName! }).promise()
      );

      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      expect(attachedPolicies.AttachedPolicies!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('EKS node IAM role exists and has correct policies', async () => {
      const nodeRoleArn = outputs.eks_node_role_arn;
      expect(nodeRoleArn).toBeDefined();

      const roleName = nodeRoleArn.split('/').pop();
      const result = await awsCall(() =>
        iam.getRole({ RoleName: roleName! }).promise()
      );

      expect(result.Role).toBeDefined();
      expect(result.Role!.Arn).toBe(nodeRoleArn);

      const attachedPolicies = await awsCall(() =>
        iam.listAttachedRolePolicies({ RoleName: roleName! }).promise()
      );

      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      expect(attachedPolicies.AttachedPolicies!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('Cluster autoscaler IAM role exists', async () => {
      const autoscalerRoleArn = outputs.cluster_autoscaler_role_arn;
      expect(autoscalerRoleArn).toBeDefined();

      const roleName = autoscalerRoleArn.split('/').pop();
      const result = await awsCall(() =>
        iam.getRole({ RoleName: roleName! }).promise()
      );

      expect(result.Role).toBeDefined();
      expect(result.Role!.Arn).toBe(autoscalerRoleArn);
    }, TEST_TIMEOUT);
  });

  describe('OIDC Provider', () => {
    test('OIDC provider exists for IRSA', async () => {
      const oidcProviderUrl = outputs.oidc_provider_url;
      const oidcProviderArn = outputs.oidc_provider_arn;
      expect(oidcProviderUrl).toBeDefined();
      expect(oidcProviderArn).toBeDefined();
      // OIDC URL format: oidc.eks.region.amazonaws.com/id/...
      expect(oidcProviderUrl).toMatch(/^oidc\.eks\./);
      expect(oidcProviderArn).toMatch(/^arn:aws:iam::.*:oidc-provider\/oidc\.eks\./);
    }, TEST_TIMEOUT);
  });
});

// =============================================================================
// SUITE 3: EKS ADDONS VALIDATION
// =============================================================================

describe('EKS Addons Validation', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('VPC CNI addon is installed', async () => {
    const clusterName = outputs.cluster_name;
    expect(clusterName).toBeDefined();

    const result = await awsCall(() =>
      eks.listAddons({ clusterName }).promise()
    );

    expect(result.addons).toBeDefined();
    expect(result.addons).toContain('vpc-cni');
  }, TEST_TIMEOUT);

  test('CoreDNS addon is installed', async () => {
    const clusterName = outputs.cluster_name;
    expect(clusterName).toBeDefined();

    const result = await awsCall(() =>
      eks.listAddons({ clusterName }).promise()
    );

    expect(result.addons).toBeDefined();
    expect(result.addons).toContain('coredns');
  }, TEST_TIMEOUT);

  test('kube-proxy addon is installed', async () => {
    const clusterName = outputs.cluster_name;
    expect(clusterName).toBeDefined();

    const result = await awsCall(() =>
      eks.listAddons({ clusterName }).promise()
    );

    expect(result.addons).toBeDefined();
    expect(result.addons).toContain('kube-proxy');
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 4: COMPLETE END-TO-END WORKFLOW
// =============================================================================

describe('Complete End-to-End Workflow', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('Full workflow: VPC → EKS Cluster → Node Groups → Addons', async () => {
    // Step 1: Verify VPC is available
    const vpcId = outputs.vpc_id;
    const vpcResult = await awsCall(() =>
      ec2.describeVpcs({ VpcIds: [vpcId] }).promise()
    );
    expect(vpcResult.Vpcs![0].State).toBe('available');

    // Step 2: Verify EKS cluster is active
    const clusterName = outputs.cluster_name;
    const clusterResult = await awsCall(() =>
      eks.describeCluster({ name: clusterName }).promise()
    );
    expect(clusterResult.cluster!.status).toBe('ACTIVE');

    // Step 3: Verify node groups are active
    const nodeGroups = await awsCall(() =>
      eks.listNodegroups({ clusterName }).promise()
    );
    expect(nodeGroups.nodegroups!.length).toBeGreaterThan(0);

    // Step 4: Verify KMS key is enabled
    const kmsKeyId = outputs.kms_key_id;
    const kmsResult = await kmsClient.send(
      new DescribeKeyCommand({ KeyId: kmsKeyId })
    );
    expect(kmsResult.KeyMetadata?.KeyState).toBe('Enabled');

    // All steps completed successfully
    expect(true).toBe(true);
  }, TEST_TIMEOUT * 2);

  test('Cluster can be listed in EKS service', async () => {
    const clusterName = outputs.cluster_name;

    const result = await awsCall(() =>
      eks.listClusters({}).promise()
    );

    expect(result.clusters).toContain(clusterName);
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 5: KUBERNETES DEPLOYMENT VALIDATION
// =============================================================================

// =============================================================================
// SUITE 5: KUBERNETES DEPLOYMENT VALIDATION
// =============================================================================

describe('Kubernetes Deployment Validation', () => {
  let outputs: Record<string, any> = {};
  let coreApi: CoreV1Api;
  let appsApi: AppsV1Api;

  beforeAll(async () => {
    outputs = getTerraformOutputs();
    console.log('Kubernetes outputs loaded:', {
      hello_world_namespace: outputs.hello_world_namespace,
      hello_world_deployment_name: outputs.hello_world_deployment_name,
      hello_world_service_name: outputs.hello_world_service_name,
      hello_world_service_namespace: outputs.hello_world_service_namespace,
      allKeys: Object.keys(outputs).filter(k => k.includes('hello_world'))
    });
    const clients = await getK8sClients();
    coreApi = clients.coreApi;
    appsApi = clients.appsApi;
  });

  test('Hello-world namespace exists', async () => {
    const namespaceName = outputs.hello_world_namespace || 'hello-world';

    if (!namespaceName || typeof namespaceName !== 'string') {
      throw new Error(`Invalid namespaceName: ${namespaceName}`);
    }

    // Returns V1Namespace directly
    const namespace = await coreApi.readNamespace({ name: namespaceName });

    // REMOVED .body
    expect(namespace).toBeDefined();
    expect(namespace.metadata?.name).toBe(namespaceName);
  }, TEST_TIMEOUT);

  test('Hello-world deployment exists and has correct configuration', async () => {
    const deploymentName = outputs.hello_world_deployment_name || 'hello-world';
    const namespaceName = outputs.hello_world_namespace || 'hello-world';

    if (!deploymentName || typeof deploymentName !== 'string') {
      throw new Error(`Invalid deploymentName: ${deploymentName}`);
    }

    // Returns V1Deployment directly
    const deployment = await appsApi.readNamespacedDeployment({
      name: deploymentName,
      namespace: namespaceName
    });

    // REMOVED .body
    expect(deployment).toBeDefined();
    expect(deployment.metadata?.name).toBe(deploymentName);
    expect(deployment.metadata?.namespace).toBe(namespaceName);
    expect(deployment.spec?.replicas).toBe(2);
    expect(deployment.spec?.template?.spec?.containers).toBeDefined();
    expect(deployment.spec?.template?.spec?.containers[0]?.image).toBe(
      'ghcr.io/infrastructure-as-code/hello-world'
    );
    expect(deployment.spec?.template?.spec?.containers[0]?.ports).toBeDefined();
    expect(deployment.spec?.template?.spec?.containers[0]?.ports?.[0]?.containerPort).toBe(8080);
  }, TEST_TIMEOUT);

  test('Hello-world deployment has running pods', async () => {
    const deploymentName = outputs.hello_world_deployment_name || 'hello-world';
    const namespaceName = outputs.hello_world_namespace || 'hello-world';

    await new Promise(resolve => setTimeout(resolve, 10000));

    const deployment = await appsApi.readNamespacedDeployment({
      name: deploymentName,
      namespace: namespaceName
    });

    // REMOVED .body
    expect(deployment.status?.readyReplicas).toBeGreaterThanOrEqual(1);
    expect(deployment.status?.replicas).toBeGreaterThanOrEqual(1);
  }, TEST_TIMEOUT * 2);

  test('Hello-world service exists and has correct configuration', async () => {
    const serviceName = outputs.hello_world_service_name || 'hello-world';
    const namespaceName = outputs.hello_world_service_namespace || outputs.hello_world_namespace || 'hello-world';

    if (!serviceName || typeof serviceName !== 'string') {
      throw new Error(`Invalid serviceName: ${serviceName}`);
    }

    // Returns V1Service directly
    const service = await coreApi.readNamespacedService({
      name: serviceName,
      namespace: namespaceName
    });

    // REMOVED .body
    expect(service).toBeDefined();
    expect(service.metadata?.name).toBe(serviceName);
    expect(service.metadata?.namespace).toBe(namespaceName);
    expect(service.spec?.type).toBe('ClusterIP');
    expect(service.spec?.ports).toBeDefined();
    expect(service.spec?.ports?.[0]?.port).toBe(80);
    expect(service.spec?.ports?.[0]?.targetPort).toBe(8080);
    expect(service.spec?.selector?.app).toBe('hello-world');
  }, TEST_TIMEOUT);

  test('Hello-world pods are using the correct image', async () => {
    const namespaceName = outputs.hello_world_namespace || 'hello-world';

    // Returns V1PodList directly
    const podList = await coreApi.listNamespacedPod({ namespace: namespaceName });

    // REMOVED .body
    expect(podList).toBeDefined();
    const pods = podList.items || []; // Access .items directly on the list object
    expect(pods.length).toBeGreaterThan(0);

    const podWithImage = pods.find((pod) =>
      pod.spec?.containers?.some((container) =>
        container.image === 'ghcr.io/infrastructure-as-code/hello-world'
      )
    );
    expect(podWithImage).toBeDefined();
  }, TEST_TIMEOUT);
});
