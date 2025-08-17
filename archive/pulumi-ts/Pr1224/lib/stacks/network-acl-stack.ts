/**
 * network-acl-stack.ts
 *
 * This module defines the NetworkAclStack component for creating
 * Network ACLs for additional network security layer.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface NetworkAclStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  publicSubnetIds: pulumi.Input<string>[];
}

export class NetworkAclStack extends pulumi.ComponentResource {
  public readonly publicNetworkAclId: pulumi.Output<string>;
  public readonly privateNetworkAclId: pulumi.Output<string>;

  constructor(name: string, args: NetworkAclStackArgs, opts?: ResourceOptions) {
    super('tap:network:NetworkAclStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Public Network ACL
    const publicNetworkAcl = new aws.ec2.NetworkAcl(
      `tap-public-nacl-${environmentSuffix}`,
      {
        vpcId: args.vpcId,
        tags: {
          Name: `tap-public-nacl-${environmentSuffix}`,
          Tier: 'public',
          ...tags,
        },
      },
      { parent: this }
    );

    // Public Network ACL Rules - Inbound
    new aws.ec2.NetworkAclRule(
      `tap-public-nacl-inbound-http-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 100,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 80,
        toPort: 80,
        cidrBlock: '0.0.0.0/0',
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `tap-public-nacl-inbound-https-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 110,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 443,
        toPort: 443,
        cidrBlock: '0.0.0.0/0',
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `tap-public-nacl-inbound-ephemeral-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 120,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 1024,
        toPort: 65535,
        cidrBlock: '0.0.0.0/0',
      },
      { parent: this }
    );

    // Public Network ACL Rules - Outbound
    new aws.ec2.NetworkAclRule(
      `tap-public-nacl-outbound-http-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 100,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 80,
        toPort: 80,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `tap-public-nacl-outbound-https-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 110,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 443,
        toPort: 443,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `tap-public-nacl-outbound-ephemeral-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 120,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 1024,
        toPort: 65535,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      { parent: this }
    );

    // Private Network ACL
    const privateNetworkAcl = new aws.ec2.NetworkAcl(
      `tap-private-nacl-${environmentSuffix}`,
      {
        vpcId: args.vpcId,
        tags: {
          Name: `tap-private-nacl-${environmentSuffix}`,
          Tier: 'private',
          ...tags,
        },
      },
      { parent: this }
    );

    // Private Network ACL Rules - Inbound (from VPC only)
    new aws.ec2.NetworkAclRule(
      `tap-private-nacl-inbound-vpc-${environmentSuffix}`,
      {
        networkAclId: privateNetworkAcl.id,
        ruleNumber: 100,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 0,
        toPort: 65535,
        cidrBlock: '10.0.0.0/16', // VPC CIDR
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `tap-private-nacl-inbound-ephemeral-${environmentSuffix}`,
      {
        networkAclId: privateNetworkAcl.id,
        ruleNumber: 110,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 1024,
        toPort: 65535,
        cidrBlock: '0.0.0.0/0',
      },
      { parent: this }
    );

    // Private Network ACL Rules - Outbound
    new aws.ec2.NetworkAclRule(
      `tap-private-nacl-outbound-https-${environmentSuffix}`,
      {
        networkAclId: privateNetworkAcl.id,
        ruleNumber: 100,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 443,
        toPort: 443,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `tap-private-nacl-outbound-vpc-${environmentSuffix}`,
      {
        networkAclId: privateNetworkAcl.id,
        ruleNumber: 110,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 0,
        toPort: 65535,
        cidrBlock: '10.0.0.0/16', // VPC CIDR
        egress: true,
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `tap-private-nacl-outbound-ephemeral-${environmentSuffix}`,
      {
        networkAclId: privateNetworkAcl.id,
        ruleNumber: 120,
        protocol: 'tcp',
        ruleAction: 'allow',
        fromPort: 1024,
        toPort: 65535,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      { parent: this }
    );

    // Associate Network ACLs with subnets
    pulumi.output(args.publicSubnetIds).apply(subnetIds => {
      subnetIds.forEach((subnetId, index) => {
        new aws.ec2.NetworkAclAssociation(
          `tap-public-nacl-assoc-${index}-${environmentSuffix}`,
          {
            networkAclId: publicNetworkAcl.id,
            subnetId: subnetId,
          },
          { parent: this }
        );
      });
    });

    pulumi.output(args.privateSubnetIds).apply(subnetIds => {
      subnetIds.forEach((subnetId, index) => {
        new aws.ec2.NetworkAclAssociation(
          `tap-private-nacl-assoc-${index}-${environmentSuffix}`,
          {
            networkAclId: privateNetworkAcl.id,
            subnetId: subnetId,
          },
          { parent: this }
        );
      });
    });

    this.publicNetworkAclId = publicNetworkAcl.id;
    this.privateNetworkAclId = privateNetworkAcl.id;

    this.registerOutputs({
      publicNetworkAclId: this.publicNetworkAclId,
      privateNetworkAclId: this.privateNetworkAclId,
    });
  }
}
