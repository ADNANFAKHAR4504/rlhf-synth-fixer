import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider} from "@cdktf/provider-aws/lib/provider";
import { VpcModule, S3Module, IamModule, AutoScalingModule } from "./modules";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";
import { Fn } from "cdktf";
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            Project: "ScalableWebApp",
            ManagedBy: "CDKTF",
            Environment: "production"
          }
        }
      ]
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available"
    });

    // Define the availability zones to use (first 3 available)
    const availabilityZones = [
      Fn.element(azs.names, 0),
      Fn.element(azs.names, 1),
      Fn.element(azs.names, 2),
    ];

    // Create VPC with public and private subnets
    const vpc = new VpcModule(this, "main-vpc", {
      cidrBlock: "10.0.0.0/16",
      availabilityZones,
      publicSubnetCidrs: [
        "10.0.1.0/24",
        "10.0.2.0/24",
        "10.0.3.0/24"
      ],
      privateSubnetCidrs: [
        "10.0.11.0/24",
        "10.0.12.0/24",
        "10.0.13.0/24"
      ]
    });

    // Create S3 bucket for static website hosting
    const s3 = new S3Module(this, "static-assets", {
      bucketName: `scalable-web-app-assets-${Date.now()}`
    });

    // Create IAM roles and policies
    const iam = new IamModule(this, "web-app-iam", {
      roleName: "WebAppInstanceRole"
    });

    // Create Auto Scaling Group with Load Balancer
    const autoScaling = new AutoScalingModule(this, "web-app-asg", {
      vpcId: vpc.vpc.id,
      privateSubnetIds: vpc.privateSubnets.map(subnet => subnet.id),
      publicSubnetIds: vpc.publicSubnets.map(subnet => subnet.id),
      instanceProfile: iam.instanceProfile,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 3
    });

    // Outputs
    new TerraformOutput(this, "vpc-id", {
      value: vpc.vpc.id,
      description: "ID of the VPC"
    });

    new TerraformOutput(this, "s3-bucket-name", {
      value: s3.bucket.id,
      description: "Name of the S3 bucket for static assets"
    });

    new TerraformOutput(this, "s3-website-endpoint", {
      value: s3.bucket.websiteEndpoint,
      description: "S3 static website endpoint"
    });

    new TerraformOutput(this, "load-balancer-dns", {
      value: autoScaling.loadBalancer.dnsName,
      description: "DNS name of the Application Load Balancer"
    });

    new TerraformOutput(this, "load-balancer-url", {
      value: `http://${autoScaling.loadBalancer.dnsName}`,
      description: "URL of the web application"
    });

    new TerraformOutput(this, "auto-scaling-group-arn", {
      value: autoScaling.autoScalingGroup.arn,
      description: "ARN of the Auto Scaling Group"
    });
  }
}