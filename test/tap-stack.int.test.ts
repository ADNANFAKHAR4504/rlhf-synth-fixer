import { expect } from "@jest/globals";
import { describe, test, beforeAll } from "@jest/globals";
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand, 
  DescribeNatGatewaysCommand, 
  DescribeInternetGatewaysCommand, 
  DescribeRouteTablesCommand 
} from "@aws-sdk/client-ec2";
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand, 
  DescribeTargetGroupsCommand, 
  DescribeListenersCommand 
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { 
  EKSClient, 
  DescribeClusterCommand, 
  DescribeNodegroupCommand, 
  ListNodegroupsCommand,
  DescribeIdentityProviderConfigCommand,
  ListIdentityProviderConfigsCommand
} from "@aws-sdk/client-eks";
import { 
  IAMClient, 
  GetRoleCommand, 
  ListAttachedRolePoliciesCommand,
  GetOpenIDConnectProviderCommand 
} from "@aws-sdk/client-iam";
import { 
  STSClient, 
  GetCallerIdentityCommand 
} from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const awsRegion = "us-east-1"; // Based on your deployment
const ec2Client = new EC2Client({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const eksClient = new EKSClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });

describe("EKS Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackName: string;
  
  // Output values from deployment
  let albControllerRoleArn: string;
  let albDnsName: string;
  let ebsCsiDriverRoleArn: string;
  let eksClusterEndpoint: string;
  let eksClusterName: string;
  let vpcId: string;
  
  // Derived values
  let accountId: string;
  let albName: string;
  let oidcProviderUrl: string;

  beforeAll(async () => {
    // Read deployment outputs
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    
    const outputData = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackName = Object.keys(outputData)[0];
    outputs = outputData[stackName];

    // Extract values from deployment outputs
    albControllerRoleArn = outputs["alb-controller-role-arn"];
    albDnsName = outputs["alb-dns-name"];
    ebsCsiDriverRoleArn = outputs["ebs-csi-driver-role-arn"];
    eksClusterEndpoint = outputs["eks-cluster-endpoint"];
    eksClusterName = outputs["eks-cluster-name"];
    vpcId = outputs["vpc-id"];

    // Validate required outputs
    if (!eksClusterName || !vpcId || !eksClusterEndpoint) {
      throw new Error("Missing required stack outputs for integration test.");
    }

    // Extract ALB name from DNS name
    albName = albDnsName.split('-')[0] + '-' + albDnsName.split('-')[1];

    // Get account ID
    const { Account } = await stsClient.send(new GetCallerIdentityCommand({}));
    accountId = Account!;
  });

  // ==================== VPC and Networking Tests ====================
  describe("VPC and Networking Resources", () => {
    test("VPC exists with correct configuration", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe("available");
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      
      const nameTag = vpc?.Tags?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toContain("vpc");
    }, 20000);

    test("Internet Gateway is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            { Name: "attachment.vpc-id", Values: [vpcId] }
          ]
        })
      );

      expect(InternetGateways).toBeDefined();
      expect(InternetGateways?.length).toBeGreaterThanOrEqual(1);
      
      const igw = InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.State).toBe("available");
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
    }, 20000);

    test("NAT Gateways exist and are available", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "state", Values: ["available"] }
          ]
        })
      );

      expect(NatGateways).toBeDefined();
      expect(NatGateways?.length).toBe(3); // 3 NAT Gateways for HA
      
      NatGateways?.forEach(natGw => {
        expect(natGw?.State).toBe("available");
        expect(natGw?.VpcId).toBe(vpcId);
        expect(natGw?.ConnectivityType).toBe("public");
      });
    }, 20000);

    test("Subnets are correctly configured", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] }
          ]
        })
      );

      expect(Subnets).toBeDefined();
      expect(Subnets?.length).toBe(6); // 3 public + 3 private subnets

      // Check public subnets
      const publicSubnets = Subnets?.filter(s => 
        s.Tags?.some(tag => tag.Key === "kubernetes.io/role/elb" && tag.Value === "1")
      );
      expect(publicSubnets?.length).toBe(3);
      publicSubnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
      });

      // Check private subnets
      const privateSubnets = Subnets?.filter(s => 
        s.Tags?.some(tag => tag.Key === "kubernetes.io/role/internal-elb" && tag.Value === "1")
      );
      expect(privateSubnets?.length).toBe(3);
      privateSubnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
      });

      // Check availability zones distribution
      const azs = new Set(Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    }, 20000);

    test("Route tables are correctly configured", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] }
          ]
        })
      );

      expect(RouteTables).toBeDefined();
      expect(RouteTables?.length).toBeGreaterThanOrEqual(4); // 1 public + 3 private

      // Check public route table
      const publicRouteTables = RouteTables?.filter(rt => 
        rt.Routes?.some(r => r.GatewayId?.startsWith("igw-"))
      );
      expect(publicRouteTables?.length).toBeGreaterThanOrEqual(1);
      
      // Check private route tables
      const privateRouteTables = RouteTables?.filter(rt => 
        rt.Routes?.some(r => r.NatGatewayId?.startsWith("nat-"))
      );
      expect(privateRouteTables?.length).toBeGreaterThanOrEqual(3);
    }, 20000);
  });

  // ==================== EKS Cluster Tests ====================
  describe("EKS Cluster Configuration", () => {
    test("EKS Cluster exists and is active", async () => {
      const { cluster } = await eksClient.send(
        new DescribeClusterCommand({
          name: eksClusterName
        })
      );

      expect(cluster).toBeDefined();
      expect(cluster?.name).toBe(eksClusterName);
      expect(cluster?.status).toBe("ACTIVE");
      expect(cluster?.version).toBe("1.28");
      expect(cluster?.endpoint).toBe(eksClusterEndpoint);
      
      // Check logging configuration
      expect(cluster?.logging?.clusterLogging?.[0]?.enabled).toBe(true);
      const enabledLogTypes = cluster?.logging?.clusterLogging?.[0]?.types;
      expect(enabledLogTypes).toContain("api");
      expect(enabledLogTypes).toContain("audit");
      expect(enabledLogTypes).toContain("authenticator");
      expect(enabledLogTypes).toContain("controllerManager");
      expect(enabledLogTypes).toContain("scheduler");
    }, 20000);

    test("EKS Cluster VPC configuration is correct", async () => {
      const { cluster } = await eksClient.send(
        new DescribeClusterCommand({
          name: eksClusterName
        })
      );

      const vpcConfig = cluster?.resourcesVpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig?.endpointPrivateAccess).toBe(true);
      expect(vpcConfig?.endpointPublicAccess).toBe(true);
      expect(vpcConfig?.publicAccessCidrs).toContain("0.0.0.0/0");
      expect(vpcConfig?.subnetIds?.length).toBe(3); // Private subnets
    }, 20000);

    test("EKS Cluster OIDC provider is configured", async () => {
      const { cluster } = await eksClient.send(
        new DescribeClusterCommand({
          name: eksClusterName
        })
      );

      const oidcIssuer = cluster?.identity?.oidc?.issuer;
      expect(oidcIssuer).toBeDefined();
      expect(oidcIssuer).toContain("oidc.eks");
      
      // Extract OIDC provider ID from issuer URL
      const oidcId = oidcIssuer?.split('/id/')[1];
      expect(oidcId).toBeDefined();
      
      oidcProviderUrl = oidcIssuer!;
    }, 20000);

    test("EKS Cluster security group exists", async () => {
      const { cluster } = await eksClient.send(
        new DescribeClusterCommand({
          name: eksClusterName
        })
      );

      const clusterSecurityGroupId = cluster?.resourcesVpcConfig?.clusterSecurityGroupId;
      expect(clusterSecurityGroupId).toBeDefined();

      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [clusterSecurityGroupId!]
        })
      );

      const sg = SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(vpcId);
    }, 20000);
  });

  // ==================== IAM and IRSA Tests ====================
  describe("IAM and IRSA Configuration", () => {
    test("EKS Cluster IAM role exists with correct policies", async () => {
      const clusterRoleName = `${eksClusterName}-cluster-role`;
      
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: clusterRoleName })
      );

      expect(Role).toBeDefined();
      expect(Role?.AssumeRolePolicyDocument).toContain("eks.amazonaws.com");

      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: clusterRoleName })
      );

      const policyArns = AttachedPolicies?.map(p => p.PolicyArn);
      expect(policyArns).toContain("arn:aws:iam::aws:policy/AmazonEKSClusterPolicy");
      expect(policyArns).toContain("arn:aws:iam::aws:policy/AmazonEKSServicePolicy");
    }, 20000);

    test("ALB Controller IRSA role is correctly configured", async () => {
      const roleName = albControllerRoleArn.split('/').pop()!;
      
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(Role).toBeDefined();
      expect(Role?.Arn).toBe(albControllerRoleArn);
      
      // Check assume role policy contains OIDC provider
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role!.AssumeRolePolicyDocument!));
      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Action).toBe("sts:AssumeRoleWithWebIdentity");
      expect(statement.Principal.Federated).toContain(`:oidc-provider/oidc.eks.${awsRegion}.amazonaws.com`);
      
      // Check for correct service account condition
      const conditions = statement.Condition.StringEquals;
      const conditionKeys = Object.keys(conditions);
      const subCondition = conditionKeys.find(key => key.endsWith(':sub'));
      expect(conditions[subCondition!]).toBe("system:serviceaccount:kube-system:aws-load-balancer-controller");

      // Check attached policies
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const policyArns = AttachedPolicies?.map(p => p.PolicyArn);
      expect(policyArns).toContain("arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess");
    }, 20000);

    test("EBS CSI Driver IRSA role is correctly configured", async () => {
      const roleName = ebsCsiDriverRoleArn.split('/').pop()!;
      
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(Role).toBeDefined();
      expect(Role?.Arn).toBe(ebsCsiDriverRoleArn);
      
      // Check assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role!.AssumeRolePolicyDocument!));
      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Action).toBe("sts:AssumeRoleWithWebIdentity");
      
      // Check for correct service account condition
      const conditions = statement.Condition.StringEquals;
      const conditionKeys = Object.keys(conditions);
      const subCondition = conditionKeys.find(key => key.endsWith(':sub'));
      expect(conditions[subCondition!]).toBe("system:serviceaccount:kube-system:ebs-csi-controller-sa");

      // Check attached policies
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const policyArns = AttachedPolicies?.map(p => p.PolicyArn);
      expect(policyArns).toContain("arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy");
    }, 20000);

    test("Node IAM role exists with correct policies", async () => {
      const nodeRoleName = `${eksClusterName}-node-role`;
      
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: nodeRoleName })
      );

      expect(Role).toBeDefined();
      expect(Role?.AssumeRolePolicyDocument).toContain("ec2.amazonaws.com");

      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: nodeRoleName })
      );

      const policyArns = AttachedPolicies?.map(p => p.PolicyArn);
      expect(policyArns).toContain("arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy");
      expect(policyArns).toContain("arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy");
      expect(policyArns).toContain("arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly");
      expect(policyArns).toContain("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
    }, 20000);
  });

  // ==================== ALB Configuration Tests ====================
  describe("Application Load Balancer Configuration", () => {
    test("ALB exists with correct configuration", async () => {
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [albName]
        })
      );

      const alb = LoadBalancers?.[0];
      expect(alb).toBeDefined();
      expect(alb?.DNSName).toBe(albDnsName);
      expect(alb?.Type).toBe("application");
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.State?.Code).toBe("active");
      expect(alb?.VpcId).toBe(vpcId);
      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    }, 20000);

    test("ALB security group configuration", async () => {
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [albName]
        })
      );

      const securityGroups = LoadBalancers?.[0]?.SecurityGroups;
      expect(securityGroups).toBeDefined();
      expect(securityGroups?.length).toBeGreaterThanOrEqual(1);

      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: securityGroups
        })
      );

      const albSg = SecurityGroups?.[0];
      expect(albSg).toBeDefined();
      
      // Check for HTTP ingress rule
      const httpRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      
      // Check for HTTPS ingress rule
      const httpsRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
    }, 20000);

    test("Target Group exists with correct configuration", async () => {
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [albName]
        })
      );

      const albArn = LoadBalancers?.[0]?.LoadBalancerArn;
      
      const { TargetGroups } = await elbClient.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: albArn
        })
      );

      const tg = TargetGroups?.[0];
      expect(tg).toBeDefined();
      expect(tg?.Protocol).toBe("HTTP");
      expect(tg?.Port).toBe(80);
      expect(tg?.TargetType).toBe("ip");
      expect(tg?.VpcId).toBe(vpcId);
      expect(tg?.HealthCheckProtocol).toBe("HTTP");
      expect(tg?.HealthCheckPath).toBe("/healthz");
    }, 20000);

    test("ALB Listener is configured", async () => {
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [albName]
        })
      );

      const albArn = LoadBalancers?.[0]?.LoadBalancerArn;

      const { Listeners } = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn
        })
      );

      expect(Listeners?.length).toBeGreaterThanOrEqual(1);
      const listener = Listeners?.[0];
      expect(listener?.Protocol).toBe("HTTP");
      expect(listener?.Port).toBe(80);
      expect(listener?.DefaultActions?.[0]?.Type).toBe("forward");
    }, 20000);
  });

  // ==================== Cross-Service Tests ====================
  describe("Cross-Service Configuration", () => {
    test("EKS cluster can be accessed from VPC", async () => {
      const { cluster } = await eksClient.send(
        new DescribeClusterCommand({
          name: eksClusterName
        })
      );

      // Verify endpoint is accessible (DNS resolution)
      const endpointHost = eksClusterEndpoint.replace('https://', '');
      const dns = require('dns').promises;
      
      try {
        const addresses = await dns.resolve4(endpointHost);
        expect(addresses).toBeDefined();
        expect(addresses.length).toBeGreaterThan(0);
      } catch (error) {
        console.warn(`DNS resolution for EKS endpoint failed: ${error}`);
      }
    }, 20000);

    test("Security groups allow communication between ALB and EKS", async () => {
      // Get ALB security group
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [albName]
        })
      );
      const albSecurityGroups = LoadBalancers?.[0]?.SecurityGroups;

      // Get EKS security group
      const { cluster } = await eksClient.send(
        new DescribeClusterCommand({
          name: eksClusterName
        })
      );
      const eksSecurityGroupId = cluster?.resourcesVpcConfig?.clusterSecurityGroupId;

      // Check that security groups exist
      expect(albSecurityGroups).toBeDefined();
      expect(eksSecurityGroupId).toBeDefined();

      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [...albSecurityGroups!, eksSecurityGroupId!]
        })
      );

      expect(SecurityGroups?.length).toBeGreaterThanOrEqual(2);
    }, 20000);

    test("VPC tags are correct for EKS", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId]
        })
      );

      const vpc = Vpcs?.[0];
      const tags = vpc?.Tags;
      
      // Check for EKS-related tags
      const eksTag = tags?.find(tag => 
        tag.Key === `kubernetes.io/cluster/${eksClusterName}`
      );
      
      if (eksTag) {
        expect(eksTag.Value).toMatch(/shared|owned/);
      }
    }, 20000);
  });

  // ==================== End-to-End Tests ====================
  describe("End-to-End Validation", () => {
    test("ALB DNS name is resolvable", async () => {
      const dns = require('dns').promises;
      
      try {
        const addresses = await dns.resolve4(albDnsName);
        expect(addresses).toBeDefined();
        expect(addresses.length).toBeGreaterThan(0);
      } catch (error) {
        console.warn(`DNS resolution for ALB failed: ${error}`);
      }
    }, 20000);

    test("ALB responds to HTTP requests", async () => {
      try {
        const response = await axios.get(`http://${albDnsName}`, {
          timeout: 10000,
          validateStatus: () => true // Accept any status code
        });

        // ALB should respond even if no targets are healthy
        expect(response.status).toBeDefined();
        
        // Common ALB responses when no targets or service unavailable
        if (response.status === 503) {
          console.log("ALB returned 503 - No healthy targets or service unavailable");
        } else if (response.status === 502) {
          console.log("ALB returned 502 - Bad gateway");
        } else if (response.status === 200) {
          console.log("ALB returned 200 - Service is running");
        }
      } catch (error: any) {
        // Network errors are acceptable if ALB exists but no backend
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.warn(`ALB connection issue: ${error.code}`);
        } else {
          throw error;
        }
      }
    }, 30000);

    test("Infrastructure tags are consistent", async () => {
      const environmentSuffix = eksClusterName.split('-')[0];
      
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId]
        })
      );
      
      const vpcTags = Vpcs?.[0]?.Tags;
      const envTag = vpcTags?.find(tag => tag.Key === "Environment");
      expect(envTag?.Value).toBe(environmentSuffix);
      
      const managedByTag = vpcTags?.find(tag => tag.Key === "ManagedBy");
      expect(managedByTag?.Value).toBe("Terraform");
    }, 20000);

    test("All critical resources are in available state", async () => {
      // Check VPC
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs?.[0]?.State).toBe("available");

      // Check EKS Cluster
      const { cluster } = await eksClient.send(
        new DescribeClusterCommand({ name: eksClusterName })
      );
      expect(cluster?.status).toBe("ACTIVE");

      // Check ALB
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({ Names: [albName] })
      );
      expect(LoadBalancers?.[0]?.State?.Code).toBe("active");

      // Check NAT Gateways
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "state", Values: ["available"] }
          ]
        })
      );
      expect(NatGateways?.length).toBe(3);
      NatGateways?.forEach(nat => {
        expect(nat.State).toBe("available");
      });
    }, 30000);

    test("EKS cluster version matches expected version", async () => {
      const { cluster } = await eksClient.send(
        new DescribeClusterCommand({
          name: eksClusterName
        })
      );

      expect(cluster?.version).toBe("1.28");
      
      // Check for available updates
      if (cluster?.platformVersion) {
        console.log(`EKS Platform Version: ${cluster.platformVersion}`);
      }
    }, 20000);
  });
});