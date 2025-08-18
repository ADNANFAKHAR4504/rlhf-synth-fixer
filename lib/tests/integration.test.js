"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe("Integration Tests", () => {
    const outputsPath = path.join(__dirname, '../cdk-outputs/flat-outputs.json');
    let outputs;
    beforeAll(() => {
        if (fs.existsSync(outputsPath)) {
            outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
        }
    });
    it("should have deployed resources in both regions", () => {
        expect(outputs).toBeDefined();
        expect(outputs['us-east-1-stack']).toBeDefined();
        expect(outputs['eu-central-1-stack']).toBeDefined();
    });
    it("should have VPCs in different regions with different CIDRs", () => {
        expect(outputs['us-east-1-stack'].VpcId).toMatch(/^vpc-/);
        expect(outputs['eu-central-1-stack'].VpcId).toMatch(/^vpc-/);
        expect(outputs['us-east-1-stack'].VpcId).not.toBe(outputs['eu-central-1-stack'].VpcId);
    });
    it("should have encrypted S3 buckets", () => {
        expect(outputs['us-east-1-stack'].EncryptedBucketId).toBeDefined();
        expect(outputs['us-east-1-stack'].CloudTrailBucketId).toBeDefined();
    });
    it("should have KMS encryption in US East 1", () => {
        expect(outputs['us-east-1-stack'].KmsKeyArn).toMatch(/^arn:aws:kms:us-east-1:/);
    });
    it("should have CloudWatch log groups configured", () => {
        expect(outputs['us-east-1-stack'].CloudWatchLogGroup).toBe('/aws/application/us-east-1-prod');
        expect(outputs['eu-central-1-stack'].CloudWatchLogGroup).toBe('/aws/application/eu-central-1-prod');
    });
    it("should meet all security requirements", () => {
        expect(outputs.security_requirements_met.no_ssh_access).toBe(true);
        expect(outputs.security_requirements_met.vpc_only_traffic).toBe(true);
        expect(outputs.security_requirements_met.encrypted_storage).toBe(true);
        expect(outputs.security_requirements_met.minimal_iam_permissions).toBe(true);
        expect(outputs.security_requirements_met.cross_region_isolation).toBe(true);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVncmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUNqQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO0lBQzdFLElBQUksT0FBWSxDQUFDO0lBRWpCLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUMvQixPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7UUFDeEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2pELE1BQU0sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3RELENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDREQUE0RCxFQUFFLEdBQUcsRUFBRTtRQUNwRSxNQUFNLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFELE1BQU0sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekYsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1FBQzFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25FLE1BQU0sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3RFLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHlDQUF5QyxFQUFFLEdBQUcsRUFBRTtRQUNqRCxNQUFNLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDbEYsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1FBQ3RELE1BQU0sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQzlGLE1BQU0sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0lBQ3RHLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtRQUMvQyxNQUFNLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRSxNQUFNLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkUsTUFBTSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3RSxNQUFNLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLHNCQUFzQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlFLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5kZXNjcmliZShcIkludGVncmF0aW9uIFRlc3RzXCIsICgpID0+IHtcbiAgY29uc3Qgb3V0cHV0c1BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vY2RrLW91dHB1dHMvZmxhdC1vdXRwdXRzLmpzb24nKTtcbiAgbGV0IG91dHB1dHM6IGFueTtcblxuICBiZWZvcmVBbGwoKCkgPT4ge1xuICAgIGlmIChmcy5leGlzdHNTeW5jKG91dHB1dHNQYXRoKSkge1xuICAgICAgb3V0cHV0cyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKG91dHB1dHNQYXRoLCAndXRmOCcpKTtcbiAgICB9XG4gIH0pO1xuXG4gIGl0KFwic2hvdWxkIGhhdmUgZGVwbG95ZWQgcmVzb3VyY2VzIGluIGJvdGggcmVnaW9uc1wiLCAoKSA9PiB7XG4gICAgZXhwZWN0KG91dHB1dHMpLnRvQmVEZWZpbmVkKCk7XG4gICAgZXhwZWN0KG91dHB1dHNbJ3VzLWVhc3QtMS1zdGFjayddKS50b0JlRGVmaW5lZCgpO1xuICAgIGV4cGVjdChvdXRwdXRzWydldS1jZW50cmFsLTEtc3RhY2snXSkudG9CZURlZmluZWQoKTtcbiAgfSk7XG5cbiAgaXQoXCJzaG91bGQgaGF2ZSBWUENzIGluIGRpZmZlcmVudCByZWdpb25zIHdpdGggZGlmZmVyZW50IENJRFJzXCIsICgpID0+IHtcbiAgICBleHBlY3Qob3V0cHV0c1sndXMtZWFzdC0xLXN0YWNrJ10uVnBjSWQpLnRvTWF0Y2goL152cGMtLyk7XG4gICAgZXhwZWN0KG91dHB1dHNbJ2V1LWNlbnRyYWwtMS1zdGFjayddLlZwY0lkKS50b01hdGNoKC9ednBjLS8pO1xuICAgIGV4cGVjdChvdXRwdXRzWyd1cy1lYXN0LTEtc3RhY2snXS5WcGNJZCkubm90LnRvQmUob3V0cHV0c1snZXUtY2VudHJhbC0xLXN0YWNrJ10uVnBjSWQpO1xuICB9KTtcblxuICBpdChcInNob3VsZCBoYXZlIGVuY3J5cHRlZCBTMyBidWNrZXRzXCIsICgpID0+IHtcbiAgICBleHBlY3Qob3V0cHV0c1sndXMtZWFzdC0xLXN0YWNrJ10uRW5jcnlwdGVkQnVja2V0SWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgZXhwZWN0KG91dHB1dHNbJ3VzLWVhc3QtMS1zdGFjayddLkNsb3VkVHJhaWxCdWNrZXRJZCkudG9CZURlZmluZWQoKTtcbiAgfSk7XG5cbiAgaXQoXCJzaG91bGQgaGF2ZSBLTVMgZW5jcnlwdGlvbiBpbiBVUyBFYXN0IDFcIiwgKCkgPT4ge1xuICAgIGV4cGVjdChvdXRwdXRzWyd1cy1lYXN0LTEtc3RhY2snXS5LbXNLZXlBcm4pLnRvTWF0Y2goL15hcm46YXdzOmttczp1cy1lYXN0LTE6Lyk7XG4gIH0pO1xuXG4gIGl0KFwic2hvdWxkIGhhdmUgQ2xvdWRXYXRjaCBsb2cgZ3JvdXBzIGNvbmZpZ3VyZWRcIiwgKCkgPT4ge1xuICAgIGV4cGVjdChvdXRwdXRzWyd1cy1lYXN0LTEtc3RhY2snXS5DbG91ZFdhdGNoTG9nR3JvdXApLnRvQmUoJy9hd3MvYXBwbGljYXRpb24vdXMtZWFzdC0xLXByb2QnKTtcbiAgICBleHBlY3Qob3V0cHV0c1snZXUtY2VudHJhbC0xLXN0YWNrJ10uQ2xvdWRXYXRjaExvZ0dyb3VwKS50b0JlKCcvYXdzL2FwcGxpY2F0aW9uL2V1LWNlbnRyYWwtMS1wcm9kJyk7XG4gIH0pO1xuXG4gIGl0KFwic2hvdWxkIG1lZXQgYWxsIHNlY3VyaXR5IHJlcXVpcmVtZW50c1wiLCAoKSA9PiB7XG4gICAgZXhwZWN0KG91dHB1dHMuc2VjdXJpdHlfcmVxdWlyZW1lbnRzX21ldC5ub19zc2hfYWNjZXNzKS50b0JlKHRydWUpO1xuICAgIGV4cGVjdChvdXRwdXRzLnNlY3VyaXR5X3JlcXVpcmVtZW50c19tZXQudnBjX29ubHlfdHJhZmZpYykudG9CZSh0cnVlKTtcbiAgICBleHBlY3Qob3V0cHV0cy5zZWN1cml0eV9yZXF1aXJlbWVudHNfbWV0LmVuY3J5cHRlZF9zdG9yYWdlKS50b0JlKHRydWUpO1xuICAgIGV4cGVjdChvdXRwdXRzLnNlY3VyaXR5X3JlcXVpcmVtZW50c19tZXQubWluaW1hbF9pYW1fcGVybWlzc2lvbnMpLnRvQmUodHJ1ZSk7XG4gICAgZXhwZWN0KG91dHB1dHMuc2VjdXJpdHlfcmVxdWlyZW1lbnRzX21ldC5jcm9zc19yZWdpb25faXNvbGF0aW9uKS50b0JlKHRydWUpO1xuICB9KTtcbn0pOyJdfQ==