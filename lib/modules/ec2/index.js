"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ec2Module = void 0;
const cdktf_1 = require("cdktf");
const instance_1 = require("@cdktf/provider-aws/lib/instance");
class Ec2Module extends cdktf_1.TerraformStack {
    constructor(scope, id, subnetsModule) {
        super(scope, id);
        // Create EC2 Instance
        new instance_1.Instance(this, "DevInstance", {
            ami: "ami-0c55b159cbfafe1f0",
            instanceType: "t2.micro",
            subnetId: subnetsModule.publicSubnets[0].id,
            associatePublicIpAddress: true,
            tags: {
                Environment: "Dev",
            },
        });
    }
}
exports.Ec2Module = Ec2Module;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBdUM7QUFDdkMsK0RBQXNGO0FBS3RGLE1BQWEsU0FBVSxTQUFRLHNCQUFjO0lBQzNDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsYUFBNEI7UUFDcEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixzQkFBc0I7UUFDdEIsSUFBSSxtQkFBUSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDaEMsR0FBRyxFQUFFLHVCQUF1QjtZQUM1QixZQUFZLEVBQUUsVUFBVTtZQUN4QixRQUFRLEVBQUUsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzNDLHdCQUF3QixFQUFFLElBQUk7WUFDOUIsSUFBSSxFQUFFO2dCQUNKLFdBQVcsRUFBRSxLQUFLO2FBQ25CO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBZkQsOEJBZUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXJyYWZvcm1TdGFjayB9IGZyb20gXCJjZGt0ZlwiO1xuaW1wb3J0IHsgSW5zdGFuY2UsIEluc3RhbmNlTmV0d29ya0ludGVyZmFjZSB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pbnN0YW5jZVwiO1xuaW1wb3J0IHsgU3VibmV0c01vZHVsZSB9IGZyb20gXCIuLi9zdWJuZXRzXCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuXG5cbmV4cG9ydCBjbGFzcyBFYzJNb2R1bGUgZXh0ZW5kcyBUZXJyYWZvcm1TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHN1Ym5ldHNNb2R1bGU6IFN1Ym5ldHNNb2R1bGUpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gQ3JlYXRlIEVDMiBJbnN0YW5jZVxuICAgIG5ldyBJbnN0YW5jZSh0aGlzLCBcIkRldkluc3RhbmNlXCIsIHtcbiAgICAgIGFtaTogXCJhbWktMGM1NWIxNTljYmZhZmUxZjBcIixcbiAgICAgIGluc3RhbmNlVHlwZTogXCJ0Mi5taWNyb1wiLFxuICAgICAgc3VibmV0SWQ6IHN1Ym5ldHNNb2R1bGUucHVibGljU3VibmV0c1swXS5pZCxcbiAgICAgIGFzc29jaWF0ZVB1YmxpY0lwQWRkcmVzczogdHJ1ZSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgRW52aXJvbm1lbnQ6IFwiRGV2XCIsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59Il19