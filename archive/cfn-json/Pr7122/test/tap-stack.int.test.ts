import { execSync } from 'child_process';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const stackName = `TapStack${environmentSuffix}`;

// Helper function to execute AWS CLI commands
function awsCli(command: string): any {
  try {
    const result = execSync(`aws ${command} --region ${region} --output json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(result);
  } catch (error: any) {
    console.error(`AWS CLI Error: ${error.message}`);
    throw error;
  }
}

// Function to get stack outputs dynamically
function getStackOutputs(): any {
  try {
    console.log(`Fetching outputs for stack: ${stackName}`);
    const response = awsCli(`cloudformation describe-stacks --stack-name ${stackName}`);

    if (!response.Stacks || response.Stacks.length === 0) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const outputs = response.Stacks[0].Outputs;
    const flatOutputs: any = {};

    outputs.forEach((output: any) => {
      flatOutputs[output.OutputKey] = output.OutputValue;
    });

    return flatOutputs;
  } catch (error: any) {
    console.error(`Failed to fetch stack outputs: ${error.message}`);
    throw error;
  }
}

// Get outputs dynamically from CloudFormation stack
const outputs = getStackOutputs();

describe('EKS Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const response = awsCli(`ec2 describe-vpcs --vpc-ids ${vpcId}`);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs.length).toBe(1);
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs[0].State).toBe('available');
    });

    test('VPC should have DNS support enabled', async () => {
      const vpcId = outputs.VpcId;

      const dnsSupportResponse = awsCli(`ec2 describe-vpc-attribute --vpc-id ${vpcId} --attribute enableDnsSupport`);
      const dnsHostnamesResponse = awsCli(`ec2 describe-vpc-attribute --vpc-id ${vpcId} --attribute enableDnsHostnames`);

      expect(dnsSupportResponse.EnableDnsSupport.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames.Value).toBe(true);
    });
  });

  describe('Subnets', () => {
    test('should have 3 private subnets', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',');
      expect(privateSubnetIds.length).toBe(3);
      privateSubnetIds.forEach((id: string) => expect(id).toBeDefined());
    });

    test('private subnets should have correct CIDR blocks', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',').join(' ');

      const response = awsCli(`ec2 describe-subnets --subnet-ids ${privateSubnetIds}`);

      const cidrs = response.Subnets.map((s: any) => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('private subnets should not have MapPublicIpOnLaunch', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',').join(' ');

      const response = awsCli(`ec2 describe-subnets --subnet-ids ${privateSubnetIds}`);

      response.Subnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('private subnets should have correct tags', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',').join(' ');

      const response = awsCli(`ec2 describe-subnets --subnet-ids ${privateSubnetIds}`);

      response.Subnets.forEach((subnet: any) => {
        const tags = subnet.Tags || [];
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        const costTag = tags.find((t: any) => t.Key === 'CostCenter');
        const k8sTag = tags.find((t: any) => t.Key === 'kubernetes.io/role/internal-elb');

        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe(environmentSuffix);
        expect(costTag).toBeDefined();
        expect(costTag.Value).toBe('Engineering');
        expect(k8sTag).toBeDefined();
        expect(k8sTag.Value).toBe('1');
      });
    });
  });

  describe('EKS Cluster', () => {
    test('EKS cluster should exist and be active', async () => {
      const clusterName = outputs.ClusterName;
      expect(clusterName).toBeDefined();

      const response = awsCli(`eks describe-cluster --name ${clusterName}`);

      expect(response.cluster).toBeDefined();
      expect(response.cluster.status).toBe('ACTIVE');
      expect(response.cluster.version).toBe('1.28');
    });

    test('EKS cluster should have correct VPC configuration', async () => {
      const clusterName = outputs.ClusterName;
      const vpcId = outputs.VpcId;

      const response = awsCli(`eks describe-cluster --name ${clusterName}`);

      const resourcesVpcConfig = response.cluster.resourcesVpcConfig;
      expect(resourcesVpcConfig.vpcId).toBe(vpcId);
      expect(resourcesVpcConfig.endpointPrivateAccess).toBe(true);
      expect(resourcesVpcConfig.endpointPublicAccess).toBe(false);
    });

    test('EKS cluster should have encryption enabled', async () => {
      const clusterName = outputs.ClusterName;

      const response = awsCli(`eks describe-cluster --name ${clusterName}`);

      const encryptionConfig = response.cluster.encryptionConfig;
      expect(encryptionConfig).toBeDefined();
      expect(encryptionConfig.length).toBeGreaterThan(0);
      expect(encryptionConfig[0].resources).toContain('secrets');
    });

  });

  describe('Security Groups', () => {

    test('Security groups should have correct tags', async () => {
      const sgId = outputs.NodeSecurityGroupId;

      const response = awsCli(`ec2 describe-security-groups --group-ids ${sgId}`);

      const tags = response.SecurityGroups[0].Tags || [];
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const costTag = tags.find((t: any) => t.Key === 'CostCenter');

      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
      expect(costTag).toBeDefined();
      expect(costTag.Value).toBe('Engineering');
    });
  });

  describe('KMS Key', () => {
    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const response = awsCli(`kms describe-key --key-id ${keyId}`);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      expect(response.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key should have key rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;

      const response = awsCli(`kms get-key-rotation-status --key-id ${keyId}`);

      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('IAM Roles', () => {
    test('EKS cluster role should exist', async () => {
      const roleName = `eks-cluster-role-${environmentSuffix}`;

      const response = awsCli(`iam get-role --role-name ${roleName}`);

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);
    });

    test('EKS node role should exist', async () => {
      const roleName = `eks-node-role-${environmentSuffix}`;

      const response = awsCli(`iam get-role --role-name ${roleName}`);

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);
    });
  });


  describe('OIDC Provider', () => {
    test('OIDC provider should exist for IRSA', async () => {
      const oidcArn = outputs.OIDCProviderArn;
      expect(oidcArn).toBeDefined();

      const response = awsCli(`iam list-open-id-connect-providers`);

      const provider = response.OpenIDConnectProviderList.find((p: any) => p.Arn === oidcArn);
      expect(provider).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('CloudWatch log group should exist for EKS cluster', async () => {
      const logGroupName = `/aws/eks/cluster-${environmentSuffix}/logs`;

      const response = awsCli(`logs describe-log-groups --log-group-name-prefix ${logGroupName}`);

      expect(response.logGroups.length).toBeGreaterThan(0);
      expect(response.logGroups[0].logGroupName).toBe(logGroupName);
      expect(response.logGroups[0].retentionInDays).toBe(7);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have correct tags', async () => {
      const vpcId = outputs.VpcId;
      const response = awsCli(`ec2 describe-vpcs --vpc-ids ${vpcId}`);

      const tags = response.Vpcs[0].Tags || [];
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const costTag = tags.find((t: any) => t.Key === 'CostCenter');
      const nameTag = tags.find((t: any) => t.Key === 'Name');

      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
      expect(costTag).toBeDefined();
      expect(costTag.Value).toBe('Engineering');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toContain(`eks-vpc-${environmentSuffix}`);
    });

    test('EKS cluster should have correct tags', async () => {
      const clusterName = outputs.ClusterName;
      const response = awsCli(`eks describe-cluster --name ${clusterName}`);

      const tags = response.cluster.tags || {};
      expect(tags.Environment).toBe(environmentSuffix);
      expect(tags.CostCenter).toBe('Engineering');
      expect(tags.Name).toContain(`eks-cluster-${environmentSuffix}`);
    });
  });

  describe('High Availability', () => {
    test('resources should be distributed across 3 availability zones', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',').join(' ');

      const response = awsCli(`ec2 describe-subnets --subnet-ids ${privateSubnetIds}`);

      const azs = response.Subnets.map((s: any) => s.AvailabilityZone).sort();
      expect(azs.length).toBe(3);
      expect(new Set(azs).size).toBe(3); // All unique AZs
    });

    test('EKS cluster should use subnets from 3 availability zones', async () => {
      const clusterName = outputs.ClusterName;

      const response = awsCli(`eks describe-cluster --name ${clusterName}`);

      const subnetIds = response.cluster.resourcesVpcConfig.subnetIds;
      expect(subnetIds.length).toBe(3);

      const subnetResponse = awsCli(`ec2 describe-subnets --subnet-ids ${subnetIds.join(' ')}`);
      const azs = subnetResponse.Subnets.map((s: any) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(3);
    });
  });
});
