import {
    LocalWorkspace,
    Stack,
    StackAlreadyExistsError,
    LocalProgramArgs
} from "@pulumi/pulumi/automation";
import * as path from "path";

// Jest's "describe" block
describe('Pulumi Tap Stack Integration Test', () => {
    let stack: Stack;
    let outputs: any;

    beforeAll(async () => {
        const projectName = "my-tap-stack";
        const stackName = "dev";
        const workDir = path.join(__dirname, "..");
        
        // Use the correct ProgramArgs type for the function call
        const programArgs: LocalProgramArgs = {
            stackName,
            workDir
        };

        try {
            stack = await LocalWorkspace.createOrSelectStack(programArgs);
        } catch (e) {
            if (e instanceof StackAlreadyExistsError) {
                stack = await LocalWorkspace.selectStack(programArgs);
            } else {
                throw e;
            }
        }

        console.log("Starting a Pulumi update...");
        await stack.up({ onOutput: console.info });

        console.log("Getting stack outputs...");
        outputs = await stack.outputs();
    }, 60000);

    test('the stack outputs should not be empty', async () => {
        expect(outputs).toBeDefined();
        expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('the environment output should be a string and defined', async () => {
        const environmentOutput = outputs.environment.value;
        expect(environmentOutput).toBeDefined();
        expect(typeof environmentOutput).toBe('string');
    });

    test('the primary VPC ID output should be defined', async () => {
        const primaryVpcIdOutput = outputs.primaryVpcId.value;
        expect(primaryVpcIdOutput).toBeDefined();
    });

    test('the allRegionsData output should be an object with multiple keys', async () => {
        const allRegionsDataOutput = outputs.allRegionsData.value;
        expect(allRegionsDataOutput).toBeDefined();
        expect(typeof allRegionsDataOutput).toBe('object');
        // Assuming your default regions are 'us-east-1' and 'us-west-2'
        expect(Object.keys(allRegionsDataOutput).length).toBe(2);
    });

    test('each region in allRegionsData should have the required properties', async () => {
        const allRegionsDataOutput = outputs.allRegionsData.value;
        expect(allRegionsDataOutput['us-east-1']).toBeDefined();
        expect(allRegionsDataOutput['us-west-2']).toBeDefined();
        
        const primaryRegionData = allRegionsDataOutput['us-east-1'];
        expect(primaryRegionData.vpcId).toBeDefined();
        expect(primaryRegionData.instanceIds).toBeDefined();
        expect(primaryRegionData.securityGroupId).toBeDefined();
        expect(primaryRegionData.dashboardName).toBeDefined();
    });
});
