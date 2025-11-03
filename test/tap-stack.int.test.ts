import fs from 'fs';
import path from 'path';
import { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand, DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Load stack outputs produced by deployment. This file should be created by the
// pipeline/CI after CloudFormation deployment. We try a couple common locations.
function loadOutputs() {
    const candidates = [
        path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json'),
        path.resolve(process.cwd(), 'cfn-outputs.json'),
        path.resolve(process.cwd(), 'cfn-outputs/outputs.json'),
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf8');
            try {
                return JSON.parse(raw);
            } catch (err) {
                // ignore parse error and continue
            }
        }
    }

    throw new Error('Stack outputs file not found. Please generate cfn-outputs/flat-outputs.json');
}

const outputs = loadOutputs();
const region = process.env.AWS_REGION || 'us-east-1';
const tableName = outputs.TurnAroundPromptTableName || outputs.TurnAroundPromptTable || outputs.TurnAroundPromptTableNameOutput;

if (!tableName) {
    throw new Error('Expected TurnAroundPromptTableName in stack outputs. Found keys: ' + Object.keys(outputs).join(', '));
}

const client = new DynamoDBClient({ region });

describe('TapStack integration tests (DynamoDB focused)', () => {
    // Non-interactive resource validation
    test('DynamoDB table should exist and have expected configuration', async () => {
        const resp = await client.send(new DescribeTableCommand({ TableName: tableName }));
        const table = resp.Table!;
        expect(table.TableStatus).toBeDefined();
        expect(table.TableStatus).toMatch(/ACTIVE|active/i);

        // Billing mode should be PAY_PER_REQUEST (on-demand)
        expect(table.BillingModeSummary).toBeDefined();
        expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

        // The table should include an 'id' attribute of type S
        const attrs = table.AttributeDefinitions || [];
        const idAttr = attrs.find(a => a.AttributeName === 'id');
        expect(idAttr).toBeDefined();
        expect(idAttr!.AttributeType).toBe('S');
    }, 30000);

    // Service-level interactive tests: Put / Get / Delete
    test('should be able to put, get and delete an item (service-level)', async () => {
        const pk = `int-test-${Date.now()}`;
        const item = { id: pk, createdAt: new Date().toISOString(), payload: 'integration-test' };

        // Put
        await client.send(new PutItemCommand({ TableName: tableName, Item: marshall(item) }));

        // Get
        const getResp = await client.send(new GetItemCommand({ TableName: tableName, Key: marshall({ id: pk }) }));
        expect(getResp.Item).toBeDefined();
        const got = unmarshall(getResp.Item!);
        expect(got.id).toBe(pk);
        expect(got.payload).toBe('integration-test');

        // Delete
        await client.send(new DeleteItemCommand({ TableName: tableName, Key: marshall({ id: pk }) }));

        // Confirm deletion
        const after = await client.send(new GetItemCommand({ TableName: tableName, Key: marshall({ id: pk }) }));
        expect(after.Item).toBeUndefined();
    }, 30000);

    // E2E-style test: create multiple items, scan, and cleanup
    test('E2E flow: create multiple items, scan results and cleanup', async () => {
        const base = `e2e-${Date.now()}`;
        const items = [
            { id: `${base}-1`, payload: 'a' },
            { id: `${base}-2`, payload: 'b' },
            { id: `${base}-3`, payload: 'c' },
        ];

        // Create items
        for (const it of items) {
            await client.send(new PutItemCommand({ TableName: tableName, Item: marshall({ ...it, createdAt: new Date().toISOString() }) }));
        }

        // Scan for items with prefix
        const scanResp = await client.send(new ScanCommand({ TableName: tableName, Limit: 50 }));
        const scanned = (scanResp.Items || []).map(i => unmarshall(i));

        // At least the items we inserted should be present when scanning
        const found = scanned.filter(s => s.id && String(s.id).startsWith(base));
        expect(found.length).toBeGreaterThanOrEqual(items.length);

        // Cleanup (delete the created items)
        for (const it of items) {
            await client.send(new DeleteItemCommand({ TableName: tableName, Key: marshall({ id: it.id }) }));
        }
    }, 60000);
});
