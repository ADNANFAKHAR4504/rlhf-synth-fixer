# Infrastructure Changes Required

## VPC Configuration

### Change: Replace deprecated cidr property
- Line 454: Change `cidr: '10.0.0.0/16'` to `ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')`
- Reason: The cidr property is deprecated in favor of ipAddresses

### Change: Add NAT Gateway count specification
- Line 455: Add `natGateways: 1,` after maxAzs
- Reason: Explicitly control NAT Gateway deployment for cost management

## Flow Logs Configuration

### Change: Create LogGroup as separate resource with removal policy
- Lines 480-487: Extract LogGroup creation
```typescript
const flowLogGroup = new logs.LogGroup(this, 'FlowLogsGroup', {
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

new ec2.FlowLog(this, 'FlowLogs', {
  resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
  destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
});
```
- Reason: Proper resource lifecycle management

## VPC Gateway Attachment

### Change: Store VPCGatewayAttachment reference
- Line 511: Assign to variable `const vpcGatewayAttachment = new ec2.CfnVPCGatewayAttachment(...)`
- Reason: Required for dependency management in Transit Gateway attachment

## Transit Gateway VPC Attachment

### Change: Add dependencies to Transit Gateway attachment
- After line 541, add:
```typescript
tgwAttachment.addDependency(transitGateway);
tgwAttachment.addDependency(vpcGatewayAttachment);
```
- Reason: Ensure proper creation order

## Direct Connect Gateway

### Critical Change: Fix CloudFormation resource type
- Line 544: Change `type: 'AWS::DirectConnect::DirectConnectGateway'` to `type: 'AWS::DirectConnect::Gateway'`
- Reason: Correct CloudFormation resource type

### Critical Change: Fix property name
- Line 547: Change `directConnectGatewayName: 'HybridDXGW'` to `name: 'HybridDXGW'`
- Reason: Correct property name for the resource type

## Direct Connect Gateway Association

### Critical Change: Replace invalid resource type with Transit Gateway Attachment
- Lines 551-558: Replace entire CfnResource definition:
```typescript
const dxgwAssociation = new cdk.CfnResource(this, 'DXGWTransitGatewayAssociation', {
  type: 'AWS::EC2::TransitGatewayAttachment',
  properties: {
    TransitGatewayId: transitGateway.ref,
    ResourceType: 'direct-connect-gateway',
    ResourceId: directConnectGateway.ref,
    Tags: [
      {
        Key: 'Name',
        Value: 'DXGW-TGW-Attachment',
      },
    ],
  },
});
```
- Add dependencies after creation:
```typescript
dxgwAssociation.addDependency(directConnectGateway);
dxgwAssociation.addDependency(transitGateway);
dxgwAssociation.addDependency(tgwAttachment);
```
- Reason: AWS::DirectConnect::GatewayAssociation does not exist in CloudFormation

## VPN Connection

### Change: Add dependencies to VPN connection
- After line 571, add:
```typescript
vpnConnection.addDependency(transitGateway);
vpnConnection.addDependency(customerGateway);
```
- Reason: Ensure proper creation order

## CloudWatch Alarm

### Change: Remove placeholder tunnel IP dimension
- Lines 197-206: Remove TunnelIpAddress dimension from metric
- Use only VpnId dimension
- Reason: Placeholder value causes deployment failure

## Route 53 Resolver Security Groups

### Change: Consolidate security groups
- Lines 221-225 and 234-238: Use single security group for both resolver endpoints
- Store reference: `const resolverSecurityGroup = new ec2.SecurityGroup(...)`
- Add ingress rules for DNS traffic:
```typescript
resolverSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/8'), ec2.Port.tcp(53), 'Allow DNS TCP from on-premises');
resolverSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/8'), ec2.Port.udp(53), 'Allow DNS UDP from on-premises');
```
- Use same security group for both endpoints
- Reason: Proper security configuration and resource efficiency

## IAM Role Configuration

### Change: Store federated role reference and add role name
- Line 634: Assign to variable `const federatedUserRole = new iam.Role(...)`
- Add `roleName: 'FederatedUserRole',` property
- Reason: Required for output export

## Transit Gateway Routes

### Change: Add dependencies to route creation
- Lines 664-671: For each CfnRoute, add:
```typescript
const tgwRoute = new ec2.CfnRoute(this, `TGWRoute${index}`, {
  routeTableId: subnet.routeTable.routeTableId,
  destinationCidrBlock: '192.168.0.0/16',
  transitGatewayId: transitGateway.ref,
});
tgwRoute.addDependency(tgwAttachment);
tgwRoute.addDependency(vpcGatewayAttachment);
```
- Reason: Ensure Transit Gateway attachment exists before route creation

## Stack Outputs

### Change: Add missing outputs
- After line 695, add:
```typescript
new cdk.CfnOutput(this, 'SAMLProviderArn', {
  value: samlProvider.ref,
  description: 'SAML Provider ARN',
});

new cdk.CfnOutput(this, 'FederatedUserRoleArn', {
  value: federatedUserRole.roleArn,
  description: 'Federated User Role ARN',
});
```
- Reason: Required for complete infrastructure reference export

### Change: Add descriptions to all outputs
- Add description field to each CfnOutput for documentation
- Reason: Improved operational clarity