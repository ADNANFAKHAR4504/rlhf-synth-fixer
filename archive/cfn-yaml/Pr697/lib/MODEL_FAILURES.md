Possible pitfalls / expected “failures”

Silent success in wrong region – If all your other resources are also conditioned on IsUsWest2 or you have no dependencies on RegionCheck, CloudFormation may just create an empty stack instead of outright failing.

Not a hard stop – Using WaitConditionHandle alone doesn’t cause an error; it’s just a placeholder resource. To force failure, you’d need something like a Custom:: resource or a WaitCondition with a timeout.

Lint warning – cfn-lint might complain about unused conditions if you don’t apply IsUsWest2 to other resources.

Test failures – If your unit tests expect a “region validation” that produces a clear error, this approach might fail the test because it doesn’t explicitly throw one.

Conditions:
  IsUsWest2: !Equals [ !Ref "AWS::Region", "us-west-2" ]

Resources:
  RegionEnforcement:
    Type: "AWS::CloudFormation::CustomResource"
    Condition: !Not [ IsUsWest2 ]
    Properties:
      ServiceToken: "invalid" # Forces failure if deployed outside us-west-2

