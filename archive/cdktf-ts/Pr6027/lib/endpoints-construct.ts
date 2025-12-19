import { Construct } from 'constructs';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { VpcEndpointRouteTableAssociation } from '@cdktf/provider-aws/lib/vpc-endpoint-route-table-association';

interface EndpointsConstructProps {
  environmentSuffix: string;
  vpcId: string;
  routeTableIds: string[];
}

export class EndpointsConstruct extends Construct {
  public readonly s3EndpointId: string;
  public readonly dynamodbEndpointId: string;

  constructor(scope: Construct, id: string, props: EndpointsConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpcId, routeTableIds } = props;

    // Create S3 VPC Endpoint (Gateway endpoint)
    const s3Endpoint = new VpcEndpoint(this, 'S3Endpoint', {
      vpcId: vpcId,
      serviceName: 'com.amazonaws.us-east-1.s3',
      vpcEndpointType: 'Gateway',
      tags: {
        Name: `payment-s3-endpoint-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.s3EndpointId = s3Endpoint.id;

    // Associate S3 endpoint with private route tables
    routeTableIds.forEach((routeTableId, index) => {
      new VpcEndpointRouteTableAssociation(
        this,
        `S3EndpointRTAssoc${index + 1}`,
        {
          routeTableId: routeTableId,
          vpcEndpointId: s3Endpoint.id,
        }
      );
    });

    // Create DynamoDB VPC Endpoint (Gateway endpoint)
    const dynamodbEndpoint = new VpcEndpoint(this, 'DynamoDBEndpoint', {
      vpcId: vpcId,
      serviceName: 'com.amazonaws.us-east-1.dynamodb',
      vpcEndpointType: 'Gateway',
      tags: {
        Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.dynamodbEndpointId = dynamodbEndpoint.id;

    // Associate DynamoDB endpoint with private route tables
    routeTableIds.forEach((routeTableId, index) => {
      new VpcEndpointRouteTableAssociation(
        this,
        `DynamoDBEndpointRTAssoc${index + 1}`,
        {
          routeTableId: routeTableId,
          vpcEndpointId: dynamodbEndpoint.id,
        }
      );
    });
  }
}
