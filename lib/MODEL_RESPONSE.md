import { Construct } from "constructs";
import { AwsProvider, Vpc, Subnet, InternetGateway, RouteTable, RouteTableAssociation, NetworkAcl, NetworkAclRule, SecurityGroup, SecurityGroupRule } from "cdktf";

export class SecureVpcStack extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC
    const vpc = new Vpc(this, "main_vpc", {
      cidrBlock: "10.0.0.0/16",
    });

    // Get availability zones
    const availabilityZones = ["us-west-2a", "us-west-2b"];

    // Create public subnets
    const publicSubnets = availabilityZones.map((az, i) => 
      new Subnet(this, `public_subnet_${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
      })
    );

    // Create Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
    });

    // Create Route Table
    const publicRouteTable = new RouteTable(this, "public_route_table", {
      vpcId: vpc.id,
      route: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
      }],
    });

    // Associate Route Table with public subnets
    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public_rta_${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create Network ACL
    const networkAcl = new NetworkAcl(this, "public_nacl", {
      vpcId: vpc.id,
      subnetIds: publicSubnets.map(s => s.id),
    });

    // Allow inbound HTTP/HTTPS
    new NetworkAclRule(this, "allow_inbound_http", {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      egress: false,
      cidrBlock: "0.0.0.0/0",
      fromPort: 80,
      toPort: 80,
    });

    new NetworkAclRule(this, "allow_inbound_https", {
      networkAclId: networkAcl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      egress: false,
      cidrBlock: "0.0.0.0/0",
      fromPort: 443,
      toPort: 443,
    });

    // Deny all other inbound traffic
    new NetworkAclRule(this, "deny_all_inbound", {
      networkAclId: networkAcl.id,
      ruleNumber: 32767,
      protocol: "-1",
      ruleAction: "deny",
      egress: false,
      cidrBlock: "0.0.0.0/0",
    });

    // Create Security Group
    const securityGroup = new SecurityGroup(this, "web_sg", {
      vpcId: vpc.id,
      ingress: [
        { fromPort: 80, toPort: 80, protocol: "tcp", cidrBlocks: ["0.0.0.0/0"] },
        { fromPort: 443, toPort: 443, protocol: "tcp", cidrBlocks: ["0.0.0.0/0"] },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
    });
  }
}