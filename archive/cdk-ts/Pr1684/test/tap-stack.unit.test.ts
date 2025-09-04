import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { EnvironmentConfig, TapStack } from "../lib/tap-stack";

const testConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    vpcCidr: "10.0.0.0/16",
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    dbInstanceClass: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
    dbAllocatedStorage: 20,
    bucketVersioning: false,
  },
  staging: {
    vpcCidr: "10.1.0.0/16",
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
    dbInstanceClass: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
    dbAllocatedStorage: 50,
    bucketVersioning: true,
  },
  production: {
    vpcCidr: "10.2.0.0/16",
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    dbInstanceClass: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    dbAllocatedStorage: 100,
    customAmiId: "ami-0abcdef1234567890",
    bucketVersioning: true,
  },
};

describe("TapStack Tests", () => {
  const environments = ["dev", "staging", "production"];

  environments.forEach((env) => {
    describe(`${env} environment`, () => {
      let app: cdk.App;
      let stack: TapStack;
      let template: Template;

      beforeEach(() => {
        app = new cdk.App();
        stack = new TapStack(app, `TestTapStack-${env}`, {
          environmentSuffix: env,
          config: testConfigs[env],
        });
        template = Template.fromStack(stack);
      });

      // -------------------------
      // VPC TESTS
      // -------------------------
      test("creates VPC with correct CIDR", () => {
        template.hasResourceProperties("AWS::EC2::VPC", {
          CidrBlock: testConfigs[env].vpcCidr,
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        });
      });

      test("creates 3 subnet types", () => {
        const subnets = template.findResources("AWS::EC2::Subnet");
        expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(6);
      });

      test("creates NAT gateways", () => {
        const natGateways = template.findResources("AWS::EC2::NatGateway");
        expect(Object.keys(natGateways).length).toBeGreaterThanOrEqual(2);
      });

      // -------------------------
      // SECURITY GROUPS
      // -------------------------
      test("web security group has correct ingress rules", () => {
        template.hasResourceProperties("AWS::EC2::SecurityGroup", {
          GroupDescription: Match.stringLikeRegexp("web servers"),
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({ FromPort: 80, ToPort: 80 }),
            Match.objectLike({ FromPort: 443, ToPort: 443 }),
            Match.objectLike({ FromPort: 22, ToPort: 22 }),
          ]),
        });
      });

      test("database security group allows MySQL from web SG", () => {
        const ingress = template.findResources("AWS::EC2::SecurityGroupIngress");
        const dbRule = Object.values(ingress).find(
          (r: any) => r.Properties?.FromPort === 3306
        );
        expect(dbRule).toBeDefined();
      });

      // -------------------------
      // COMPUTE (Launch Template + ASG)
      // -------------------------
      test("creates launch template with correct instance type", () => {
        template.hasResourceProperties("AWS::EC2::LaunchTemplate", {
          LaunchTemplateData: Match.objectLike({
            InstanceType: testConfigs[env].instanceType.toString(),
          }),
        });
      });

      // -------------------------
      // LOAD BALANCER
      // -------------------------
      test("creates ALB with listener", () => {
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
          Scheme: "internet-facing",
        });
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", {
          Port: 80,
        });
      });

      // -------------------------
      // DATABASE
      // -------------------------
      test("creates RDS instance with correct config", () => {
        template.hasResourceProperties("AWS::RDS::DBInstance", {
          DBInstanceClass: `db.${testConfigs[env].dbInstanceClass.toString()}`,
          AllocatedStorage: `${testConfigs[env].dbAllocatedStorage}`,
          Engine: "mysql",
        });
      });

      // -------------------------
      // S3 BUCKETS
      // -------------------------
      test("creates assets S3 bucket", () => {
        const buckets = template.findResources("AWS::S3::Bucket");

        // Find the assets bucket by matching the logical ID name
        const assetsBucket = Object.values(buckets).find((b: any) =>
          JSON.stringify(b.Properties.BucketName).includes("assets")
        );

        expect(assetsBucket).toBeDefined();
        expect(JSON.stringify(assetsBucket?.Properties.BucketName)).toContain(`tap-${env}-assets`);
      });

      test("creates logs S3 bucket", () => {
        const buckets = template.findResources("AWS::S3::Bucket");

        // Find the logs bucket by matching the logical ID name
        const logsBucket = Object.values(buckets).find((b: any) =>
          JSON.stringify(b.Properties.BucketName).includes("logs")
        );

        expect(logsBucket).toBeDefined();
        expect(JSON.stringify(logsBucket?.Properties.BucketName)).toContain(`tap-${env}-logs`);
      });

      // -------------------------
      // MONITORING
      // -------------------------
      test("creates CloudWatch log group", () => {
        template.hasResourceProperties("AWS::Logs::LogGroup", {
          LogGroupName: `/aws/webapp/${env}`,
        });
      });

      // -------------------------
      // OUTPUTS
      // -------------------------
      test("creates required outputs", () => {
        const outputs = template.findOutputs("*");
        expect(Object.keys(outputs)).toEqual(
          expect.arrayContaining([
            "LoadBalancerDNS",
            "DatabaseEndpoint",
            "AssetsBucketName",
            "LogsBucketName",
            "VPCId",
            "KeyPairName",
            "LogGroupName",
          ])
        );
      });
    });
  });
});
