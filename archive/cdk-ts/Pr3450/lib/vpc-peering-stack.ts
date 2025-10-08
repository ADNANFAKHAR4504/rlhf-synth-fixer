import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';

interface VpcPeeringStackProps extends cdk.StackProps {
  primaryVpc: ec2.Vpc;
  standbyVpc: ec2.Vpc;
  primaryRegion: string;
  standbyRegion: string;
}

export class VpcPeeringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpcPeeringStackProps) {
    super(scope, id, props);

    // Create a role that can be used for cross-region actions
    const crossRegionRole = new iam.Role(this, 'CrossRegionPeeringRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        VpcPeeringPermissions: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'ec2:CreateVpcPeeringConnection',
                'ec2:AcceptVpcPeeringConnection',
                'ec2:DescribeVpcPeeringConnections',
                'ec2:DeleteVpcPeeringConnection',
                'ec2:CreateRoute',
                'ec2:DeleteRoute',
                'ec2:DescribeRouteTables',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create VPC peering connection using a custom resource
    const peeringConnection = new cr.AwsCustomResource(
      this,
      'CreateVpcPeering',
      {
        onCreate: {
          service: 'EC2',
          action: 'createVpcPeeringConnection',
          parameters: {
            VpcId: props.primaryVpc.vpcId,
            PeerVpcId: props.standbyVpc.vpcId,
            PeerRegion: props.standbyRegion,
          },
          region: props.primaryRegion,
          physicalResourceId: cr.PhysicalResourceId.fromResponse(
            'VpcPeeringConnection.VpcPeeringConnectionId'
          ),
        },
        onDelete: {
          service: 'EC2',
          action: 'deleteVpcPeeringConnection',
          parameters: {
            VpcPeeringConnectionId: new cr.PhysicalResourceIdReference(),
          },
          region: props.primaryRegion,
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        role: crossRegionRole,
      }
    );

    const peeringConnectionId = peeringConnection.getResponseField(
      'VpcPeeringConnection.VpcPeeringConnectionId'
    );

    // Accept the peering connection in the standby region
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const acceptPeering = new cr.AwsCustomResource(this, 'AcceptVpcPeering', {
      onCreate: {
        service: 'EC2',
        action: 'acceptVpcPeeringConnection',
        parameters: {
          VpcPeeringConnectionId: peeringConnectionId,
        },
        region: props.standbyRegion,
        physicalResourceId: cr.PhysicalResourceId.of(
          `${peeringConnectionId}-accepted`
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      role: crossRegionRole,
    });

    // Wait for the peering connection to be active
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const describePeering = new cr.AwsCustomResource(
      this,
      'DescribeVpcPeering',
      {
        onCreate: {
          service: 'EC2',
          action: 'describeVpcPeeringConnections',
          parameters: {
            VpcPeeringConnectionIds: [peeringConnectionId],
          },
          region: props.primaryRegion,
          physicalResourceId: cr.PhysicalResourceId.of(
            `${peeringConnectionId}-describe`
          ),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        role: crossRegionRole,
      }
    );

    // Add routes between VPCs
    // Primary to standby
    props.primaryVpc.publicSubnets.forEach((subnet, i) => {
      const routeTable = subnet.routeTable;
      new ec2.CfnRoute(this, `PrimaryToStandbyRoute-Public${i}`, {
        routeTableId: routeTable.routeTableId,
        destinationCidrBlock: props.standbyVpc.vpcCidrBlock,
        vpcPeeringConnectionId: peeringConnectionId,
      });
    });

    props.primaryVpc.privateSubnets.forEach((subnet, i) => {
      const routeTable = subnet.routeTable;
      new ec2.CfnRoute(this, `PrimaryToStandbyRoute-Private${i}`, {
        routeTableId: routeTable.routeTableId,
        destinationCidrBlock: props.standbyVpc.vpcCidrBlock,
        vpcPeeringConnectionId: peeringConnectionId,
      });
    });

    // Standby to primary routes (must be created in standby region using custom resource)
    props.standbyVpc.publicSubnets.forEach((subnet, i) => {
      const routeTable = subnet.routeTable;
      new cr.AwsCustomResource(this, `StandbyToPrimaryRoutePublic${i}`, {
        onCreate: {
          service: 'EC2',
          action: 'createRoute',
          parameters: {
            RouteTableId: routeTable.routeTableId,
            DestinationCidrBlock: props.primaryVpc.vpcCidrBlock,
            VpcPeeringConnectionId: peeringConnectionId,
          },
          region: props.standbyRegion,
          physicalResourceId: cr.PhysicalResourceId.of(
            `standby-public-route-${i}`
          ),
        },
        onDelete: {
          service: 'EC2',
          action: 'deleteRoute',
          parameters: {
            RouteTableId: routeTable.routeTableId,
            DestinationCidrBlock: props.primaryVpc.vpcCidrBlock,
          },
          region: props.standbyRegion,
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        role: crossRegionRole,
      });
    });

    props.standbyVpc.privateSubnets.forEach((subnet, i) => {
      const routeTable = subnet.routeTable;
      new cr.AwsCustomResource(this, `StandbyToPrimaryRoutePrivate${i}`, {
        onCreate: {
          service: 'EC2',
          action: 'createRoute',
          parameters: {
            RouteTableId: routeTable.routeTableId,
            DestinationCidrBlock: props.primaryVpc.vpcCidrBlock,
            VpcPeeringConnectionId: peeringConnectionId,
          },
          region: props.standbyRegion,
          physicalResourceId: cr.PhysicalResourceId.of(
            `standby-private-route-${i}`
          ),
        },
        onDelete: {
          service: 'EC2',
          action: 'deleteRoute',
          parameters: {
            RouteTableId: routeTable.routeTableId,
            DestinationCidrBlock: props.primaryVpc.vpcCidrBlock,
          },
          region: props.standbyRegion,
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        role: crossRegionRole,
      });
    });

    // Output the peering connection ID
    new cdk.CfnOutput(this, 'VpcPeeringConnectionId', {
      value: peeringConnectionId,
      description: 'The ID of the VPC peering connection',
    });
  }
}
