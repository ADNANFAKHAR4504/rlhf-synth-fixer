**Flaw 1**
cdk.Construct has no exported member 'Construct'.
subnetType: SubnetType.PRIVATE - Property 'PRIVATE' does not exist on type 'typeof SubnetType'
Object literal may only specify known properties, and 'dbSubnetGroupName' does not exist in type 'DatabaseInstanceProps'

**Flaw 2**
1:02:22 AM | CREATE_FAILED        | AWS::RDS::DBInstance                        | RDSInstance9F6B765A
Resource handler returned message: "RDS does not support creating a DB instance with the following combination: DBInstanceClass=db.t2.micro, Engine=mysql, EngineVersion=8.0.41, Lic
enseModel=general-public-license. For supported combinations of instance class and database engine version, see the documentation. (Service: Rds, Status Code: 400, Request ID: 0572
38b0-749b-430d-bf36-1e9c1c5a3166) (SDK Attempt Count: 1)" (RequestToken: 857f38b1-3442-9872-92d4-394742770944, HandlerErrorCode: InvalidRequest)

**Flaw 3**
1:15:06 AM | CREATE_FAILED        | AWS::EC2::EIP                               | MyStack/TapStackdev/WebServerStack/EIP
Resource handler returned message: "Network vpc-07239a94f8f2b60ff is not attached to any internet gateway (Service: Ec2, Status Code: 400, Request ID: 2443240d-8477-4b92-9070-e2ec5
a1afeee) (SDK Attempt Count: 1)" (RequestToken: cc1eb021-9a41-9a90-7d5b-30829f3ba8fc, HandlerErrorCode: GeneralServiceException)

**Flaw 4**
Not link to Rds, it is using L1 cdk v1
// RDS Subnet Group
const rdsSubnetGroup = new cdk.aws_rds.CfnDBSubnetGroup(this, 'RDSSubnetGroup', {
    dbSubnetGroupDescription: 'Subnet group for RDS',
    subnetIds: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_ISOLATED }).subnetIds,
    dbSubnetGroupName: 'rds-subnet-group',
});

**Flaw 5**
console.warn
[WARNING] aws-cdk-lib.aws_ec2.SubnetType#PRIVATE_WITH_NAT is deprecated.
    use `PRIVATE_WITH_EGRESS`
    This API will be removed in the next major release.
