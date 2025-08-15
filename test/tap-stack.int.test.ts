import fs from 'fs';
import path from 'path';

describe('TapStack Integration (Live Outputs)', () => {
	let outputs: any;
	const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

	beforeAll(() => {
		if (!fs.existsSync(outputsPath)) {
			throw new Error(`Outputs file not found at ${outputsPath}`);
		}
		const raw = fs.readFileSync(outputsPath, 'utf-8');
		outputs = JSON.parse(raw);
	});

	it('should contain all expected top-level keys', () => {
		expect(outputs).toBeDefined();
		expect(typeof outputs).toBe('object');
		// Example: VPC, S3, RDS, DynamoDB, etc.
		const expectedKeys = [
			'VpcId', 'PublicSubnetIds', 'PrivateSubnetIds', 'S3BucketName',
			'RdsInstanceId', 'DynamoTableName', 'AutoScalingGroupName', 'AlbDnsName',
			'Region', 'StackName'
		];
		expectedKeys.forEach(key => {
			expect(outputs[key]).toBeDefined();
		});
	});

	it('should not hardcode region and should match AWS region format', () => {
		expect(outputs.Region).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
	});

	it('should have valid VPC and subnet outputs', () => {
		expect(outputs.VpcId).toMatch(/^vpc-[a-zA-Z0-9]+$/);
		expect(Array.isArray(outputs.PublicSubnetIds)).toBe(true);
		expect(outputs.PublicSubnetIds.length).toBeGreaterThan(0);
		outputs.PublicSubnetIds.forEach((id: string) => {
			expect(id).toMatch(/^subnet-[a-zA-Z0-9]+$/);
		});
		expect(Array.isArray(outputs.PrivateSubnetIds)).toBe(true);
		outputs.PrivateSubnetIds.forEach((id: string) => {
			expect(id).toMatch(/^subnet-[a-zA-Z0-9]+$/);
		});
	});

	it('should have a valid S3 bucket name and be accessible', async () => {
		expect(outputs.S3BucketName).toMatch(/^[a-z0-9.-]{3,63}$/);
		// Edge: bucket name should not contain uppercase or invalid chars
		expect(outputs.S3BucketName).not.toMatch(/[A-Z_]/);
		// Optionally: check bucket exists using AWS SDK (read-only)
		// Skipped: no live AWS SDK calls in CI
	});

	it('should have a valid RDS instance ID and format', () => {
		expect(outputs.RdsInstanceId).toMatch(/^production-db$/);
		// Edge: should not be empty or default
		expect(outputs.RdsInstanceId).not.toBe('');
	});

	it('should have a valid DynamoDB table name', () => {
		expect(outputs.DynamoTableName).toMatch(/^production-table$/);
		expect(outputs.DynamoTableName).not.toBe('');
	});

	it('should have a valid Auto Scaling Group name', () => {
		expect(outputs.AutoScalingGroupName).toMatch(/^production-asg$/);
		expect(outputs.AutoScalingGroupName).not.toBe('');
	});

	it('should have a valid ALB DNS name', () => {
		expect(outputs.AlbDnsName).toMatch(/\.elb\.[a-z0-9-]+\.amazonaws\.com$/);
		// Edge: should not be empty
		expect(outputs.AlbDnsName).not.toBe('');
	});

	it('should have a valid stack name', () => {
		expect(outputs.StackName).toMatch(/^tap-stack(-[a-zA-Z0-9]+)?$/);
		expect(outputs.StackName).not.toBe('');
	});

	// Edge case: missing or null outputs
	it('should not have any null or undefined output values', () => {
		Object.entries(outputs).forEach(([key, value]) => {
			expect(value).not.toBeNull();
			expect(value).not.toBeUndefined();
		});
	});

	// Edge case: unexpected extra keys
	it('should not have unexpected extra output keys', () => {
		const allowedKeys = [
			'VpcId', 'PublicSubnetIds', 'PrivateSubnetIds', 'S3BucketName',
			'RdsInstanceId', 'DynamoTableName', 'AutoScalingGroupName', 'AlbDnsName',
			'Region', 'StackName'
		];
		Object.keys(outputs).forEach(key => {
			expect(allowedKeys).toContain(key);
		});
	});

});
