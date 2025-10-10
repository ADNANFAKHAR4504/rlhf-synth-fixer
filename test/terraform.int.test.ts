// Foundational Infrastructure - Live Traffic Integration Tests
// Tests real application deployment and usage patterns

/// <reference types="jest" />
/// <reference types="node" />

import {
  DescribeInstancesCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import {
  S3Client
} from "@aws-sdk/client-s3";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import {
  GetCommandInvocationCommand,
  SendCommandCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";
import * as fs from "fs";

interface DeploymentOutputs {
  ec2_instance_id: string;
  ec2_instance_public_ip: string;
  public_subnet_id: string;
  rds_endpoint: string;
  s3_bucket_name: string;
  vpc_id: string;
}

const outputsPath = "terraform-outputs.json";
const alternateOutputPaths = [
  "flat-outputs.json",
  "cfn-outputs/flat-outputs.json",
  "terraform-flat-outputs.json",
  "terraform-outputs-flat.json",
  "terraform-outputs.json",
];
const LONG_TIMEOUT = 300000;

let outputs: DeploymentOutputs;
let region: string;
let ec2Client: EC2Client;
let rdsClient: RDSClient;
let ssmClient: SSMClient;
let s3Client: S3Client;
let secretsClient: SecretsManagerClient | undefined;
let rdsUser = "";
let rdsPassword = "";
let rdsDbName = "testdb";
let rdsHost = "";
let appServerPort = "3000";

describe("Foundational Infrastructure - Live Traffic Tests", () => {
  beforeAll(async () => {
    // Flexible outputs loading:
    // - Accept JSON via env var INTEGRATION_OUTPUTS (JSON string)
    // - Accept a file path via env var INTEGRATION_OUTPUTS_PATH
    // - Accept Terraform "output -json" shape where each key maps to { value: ... }
    // - Accept a flat JSON file containing the keys directly (ec2_instance_id, rds_endpoint, etc.)
    let loaded: any | undefined;

    // 1) Env JSON string
    if (process.env.INTEGRATION_OUTPUTS) {
      try {
        loaded = JSON.parse(process.env.INTEGRATION_OUTPUTS);
        console.log('Loaded outputs from INTEGRATION_OUTPUTS env var');
      } catch (err) {
        console.warn('Failed to parse INTEGRATION_OUTPUTS env var:', err);
      }
    }

    // 2) Env path
    if (!loaded && process.env.INTEGRATION_OUTPUTS_PATH) {
      const p = process.env.INTEGRATION_OUTPUTS_PATH;
      if (fs.existsSync(p)) {
        try {
          loaded = JSON.parse(fs.readFileSync(p, 'utf8'));
          console.log(`Loaded outputs from INTEGRATION_OUTPUTS_PATH: ${p}`);
        } catch (err) {
          console.warn(`Failed to parse JSON from INTEGRATION_OUTPUTS_PATH ${p}: ${err}`);
        }
      }
    }

    // 3) Files in repo
    if (!loaded) {
      for (const p of alternateOutputPaths) {
        if (fs.existsSync(p)) {
          try {
            loaded = JSON.parse(fs.readFileSync(p, 'utf8'));
            console.log(`Loaded outputs from ${p}`);
            break;
          } catch (err) {
            // continue to next candidate
            console.warn(`Failed to parse JSON from ${p}: ${err}`);
          }
        }
      }
    }

    if (!loaded) {
      throw new Error(
        "No outputs file found. Please run 'terraform output -json > terraform-outputs.json' or provide a flat outputs file named flat-outputs.json"
      );
    }

    // If Terraform's output -json format was used, convert to flat shape
    const hasTerraformShape = Object.values(loaded).some(
      (v: any) => v && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, "value")
    );

    if (hasTerraformShape) {
      // Map keys -> value
      const flat: any = {};
      for (const [k, v] of Object.entries(loaded)) {
        flat[k] = (v as any).value;
      }
      outputs = flat as DeploymentOutputs;
    } else {
      // Assume already flat
      outputs = loaded as DeploymentOutputs;
    }
    region = process.env.AWS_REGION || "us-east-1";

    ec2Client = new EC2Client({ region });
    rdsClient = new RDSClient({ region });
    ssmClient = new SSMClient({ region });
    s3Client = new S3Client({ region });
    // Initialize Secrets Manager client (used to fetch RDS credentials)
    secretsClient = new SecretsManagerClient({ region });

    // Resolve DB host and credentials
    rdsHost = (outputs as any).rds_endpoint ? (outputs as any).rds_endpoint.split(":")[0] : "";

    const secretArn = (outputs as any).rds_password_secret_arn || (outputs as any).rds_secret_arn || (outputs as any).rds_password_secret;
    if (secretArn) {
      try {
        const secretResp = await secretsClient.send(
          new GetSecretValueCommand({ SecretId: secretArn })
        );
        if (secretResp.SecretString) {
          const secretObj = JSON.parse(secretResp.SecretString);
          rdsUser = secretObj.username || secretObj.user || rdsUser;
          rdsPassword = secretObj.password || secretObj.pass || rdsPassword;
        }
      } catch (err) {
        console.warn("Failed to fetch RDS secret from Secrets Manager:", err);
      }
    }

    // Allow db name to come from outputs when available
    rdsDbName = (outputs as any).db_name || (outputs as any).rds_db_name || rdsDbName;

    console.log("Testing infrastructure:", {
      ec2: outputs.ec2_instance_id,
      rds: outputs.rds_endpoint,
      s3: outputs.s3_bucket_name,
      vpc: outputs.vpc_id,
    });

    // Basic validation with a clearer error message when keys are missing
    const requiredKeys = [
      "ec2_instance_id",
      "ec2_instance_public_ip",
      "rds_endpoint",
      "s3_bucket_name",
      "vpc_id",
      "public_subnet_id",
    ];
    const missing = requiredKeys.filter((k) => !(outputs as any)[k]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required output keys: ${missing.join(", ")}. Please provide a flat outputs JSON with these keys (see README or example).`);
    }
  }, LONG_TIMEOUT);

  test("Should load deployment outputs correctly", () => {
    expect(outputs.ec2_instance_id).toBeDefined();
    expect(outputs.ec2_instance_public_ip).toBeDefined();
    expect(outputs.rds_endpoint).toBeDefined();
    expect(outputs.s3_bucket_name).toBeDefined();
    expect(outputs.vpc_id).toBeDefined();
    expect(outputs.public_subnet_id).toBeDefined();
  });

  describe("Infrastructure Health and Connectivity", () => {
    test("EC2 instance should be running and accessible via SSM", async () => {
      const describeResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.ec2_instance_id],
        })
      );

      const instance = describeResponse.Reservations?.[0]?.Instances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe("running");
      expect(instance?.PublicIpAddress).toBe(outputs.ec2_instance_public_ip);

      const commandResult = await ssmClient.send(
        new SendCommandCommand({
          InstanceIds: [outputs.ec2_instance_id],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: ["echo 'SSM connectivity test successful'"],
          },
          TimeoutSeconds: 30,
        })
      );

      expect(commandResult.Command?.CommandId).toBeDefined();
      await new Promise(resolve => setTimeout(resolve, 5000));

      const invocationResult = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: commandResult.Command!.CommandId!,
          InstanceId: outputs.ec2_instance_id,
        })
      );

      expect(invocationResult.Status).toBe("Success");
      expect(invocationResult.StandardOutputContent).toContain("SSM connectivity test successful");
    }, LONG_TIMEOUT);

    test("RDS MySQL instance should be available", async () => {
      // Find DB instance by matching its endpoint address to avoid brittle identifier parsing
      const host = (outputs as any).rds_endpoint.split(":")[0];

      const describeResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbInstance = describeResponse.DBInstances?.find(
        (di) => di.Endpoint?.Address === host
      );

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe("available");
      expect(dbInstance?.Engine).toBe("mysql");
      expect(dbInstance?.EngineVersion).toContain("8.0");
      expect(dbInstance?.Endpoint?.Address).toBe(host);
    }, LONG_TIMEOUT);
  });

  describe("Live Application Deployment and Traffic Simulation", () => {
    let deploymentCommandId: string;

    test("Should deploy Node.js application with database connectivity", async () => {
      const secretArnForInstance = (outputs as any).rds_password_secret_arn || (outputs as any).rds_secret_arn || (outputs as any).rds_password_secret || "";

      const deployScript = `
#!/bin/bash

# Install Node.js and dependencies
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs mysql git awscli python3

# Create application directory
mkdir -p /opt/test-app
cd /opt/test-app

# Create package.json for test application
cat > package.json << 'EOF'
{
  "name": "infrastructure-test-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0"
  }
}
EOF

# Create test application server
cat > server.js << 'EOF'
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = process.env.PORT || ${appServerPort};

app.use(express.json());

// Database connection configuration - read from environment variables
const dbConfig = {
  host: process.env.RDS_HOST || '${(outputs as any).rds_endpoint.split(':')[0]}',
  port: parseInt(process.env.RDS_PORT || '3306', 10),
  user: process.env.RDS_USER || process.env.DB_USER || 'admin',
  password: process.env.RDS_PASSWORD || process.env.DB_PASSWORD || 'password123',
  database: process.env.RDS_DB || process.env.DB_NAME || 'testdb'
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'infrastructure-test-app'
  });
});

// Database connectivity test
app.get('/db-test', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1 as test');
    await connection.end();
    res.json({ 
      database: 'connected', 
      endpoint: '${outputs.rds_endpoint}',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      database: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CRUD operations endpoint
app.post('/data', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Create table if not exists
    await connection.execute(\`
      CREATE TABLE IF NOT EXISTS test_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \`);
    
    // Insert test data
    const [result] = await connection.execute(
      'INSERT INTO test_data (message) VALUES (?)',
      [req.body.message || 'Test message']
    );
    
    await connection.end();
    res.json({ 
      success: true, 
      id: result.insertId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get data endpoint
app.get('/data', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM test_data ORDER BY created_at DESC LIMIT 10');
    await connection.end();
    res.json({ 
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Server metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString(),
    version: process.version
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(\`Test application server running on port \${port}\`);
});
EOF

# Install dependencies and start application
npm install
# If a Secrets Manager secret ARN is provided via environment, fetch it and export variables
if [ ! -z "$RDS_SECRET_ARN" ]; then
  secret_json=$(aws secretsmanager get-secret-value --secret-id "$RDS_SECRET_ARN" --query SecretString --output text || echo "")
  if [ ! -z "$secret_json" ]; then
    RDS_USER=$(echo "$secret_json" | python3 -c "import sys, json; print(json.load(sys.stdin).get('username',''))")
    RDS_PASSWORD=$(echo "$secret_json" | python3 -c "import sys, json; print(json.load(sys.stdin).get('password',''))")
    export RDS_USER
    export RDS_PASSWORD
  fi
fi

nohup npm start > app.log 2>&1 &

# Wait for app to start
sleep 10

# Test if application is running
curl -f http://localhost:${appServerPort}/health || exit 1

echo "Application deployment successful"
      `;

      const deployCommand = await ssmClient.send(
        new SendCommandCommand({
          InstanceIds: [outputs.ec2_instance_id],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            // Pass the secret ARN as its own command so the instance receives it explicitly
            commands: [
              `export RDS_SECRET_ARN='${secretArnForInstance}'`,
              deployScript,
            ],
          },
          TimeoutSeconds: 300,
        })
      );

      deploymentCommandId = deployCommand.Command!.CommandId!;
      expect(deploymentCommandId).toBeDefined();

      // Wait for deployment to complete
      await new Promise(resolve => setTimeout(resolve, 30000));

      const deploymentResult = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: deploymentCommandId,
          InstanceId: outputs.ec2_instance_id,
        })
      );

      expect(deploymentResult.Status).toBe("Success");
      expect(deploymentResult.StandardOutputContent).toContain("Application deployment successful");
    }, LONG_TIMEOUT);

    test("Should generate live traffic to test application endpoints", async () => {
      const trafficScript = `
#!/bin/bash
cd /opt/test-app

echo "=== Testing Application Health ==="
health_response=$(curl -s http://localhost:${appServerPort}/health)
echo "Health check: $health_response"

echo "=== Testing Database Connectivity ==="
db_response=$(curl -s http://localhost:${appServerPort}/db-test)
echo "Database test: $db_response"

echo "=== Testing CRUD Operations ==="
# Create test data
for i in {1..5}; do
  create_response=$(curl -s -X POST http://localhost:${appServerPort}/data \\
    -H "Content-Type: application/json" \\
    -d "{\"message\": \"Live traffic test message $i\"}")
  echo "Create $i: $create_response"
done

# Read test data
read_response=$(curl -s http://localhost:${appServerPort}/data)
echo "Read data: $read_response"

echo "=== Testing Server Metrics ==="
metrics_response=$(curl -s http://localhost:${appServerPort}/metrics)
echo "Metrics: $metrics_response"

echo "=== Load Testing (100 requests) ==="
for i in {1..100}; do
  curl -s http://localhost:${appServerPort}/health > /dev/null &
  if [ $((i % 20)) -eq 0 ]; then
    echo "Completed $i requests"
  fi
done
wait

echo "Live traffic simulation completed successfully"
      `;

      const trafficCommand = await ssmClient.send(
        new SendCommandCommand({
          InstanceIds: [outputs.ec2_instance_id],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [trafficScript],
          },
          TimeoutSeconds: 180,
        })
      );

      expect(trafficCommand.Command?.CommandId).toBeDefined();

      // Wait for traffic test to complete
      await new Promise(resolve => setTimeout(resolve, 45000));

      const trafficResult = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: trafficCommand.Command!.CommandId!,
          InstanceId: outputs.ec2_instance_id,
        })
      );

      expect(trafficResult.Status).toBe("Success");
      expect(trafficResult.StandardOutputContent).toContain("Live traffic simulation completed successfully");
      expect(trafficResult.StandardOutputContent).toContain("Health check:");
      expect(trafficResult.StandardOutputContent).toContain("Database test:");
      expect(trafficResult.StandardOutputContent).toContain("Create 1:");
      expect(trafficResult.StandardOutputContent).toContain("Read data:");
      expect(trafficResult.StandardOutputContent).toContain("Completed 100 requests");
    }, LONG_TIMEOUT);

    test("Should verify database operations and data persistence", async () => {
      const verificationScript = `
#!/bin/bash
cd /opt/test-app

echo "=== Database Verification ==="
# Test data retrieval
data_response=$(curl -s http://localhost:${appServerPort}/data)
echo "Database verification: $data_response"

# Test additional data creation
create_response=$(curl -s -X POST http://localhost:${appServerPort}/data \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Final verification test"}')
echo "Final create test: $create_response"

# Verify data count increased
final_data=$(curl -s http://localhost:${appServerPort}/data)
echo "Final data verification: $final_data"

echo "Database operations verification completed"
      `;

      const verificationCommand = await ssmClient.send(
        new SendCommandCommand({
          InstanceIds: [outputs.ec2_instance_id],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [verificationScript],
          },
          TimeoutSeconds: 60,
        })
      );

      expect(verificationCommand.Command?.CommandId).toBeDefined();

      // Wait for verification to complete
      await new Promise(resolve => setTimeout(resolve, 15000));

      const verificationResult = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: verificationCommand.Command!.CommandId!,
          InstanceId: outputs.ec2_instance_id,
        })
      );

      expect(verificationResult.Status).toBe("Success");
      expect(verificationResult.StandardOutputContent).toContain("Database operations verification completed");
      expect(verificationResult.StandardOutputContent).toContain("Final verification test");
    }, LONG_TIMEOUT);
  });

  describe("S3 Storage Operations and Application Logs", () => {
    test("Should store and retrieve application logs in S3", async () => {
      const s3LogsScript = `
#!/bin/bash
cd /opt/test-app

echo "=== S3 Storage Operations Test ==="

# Create test log file
echo "Application logs from $(date)" > test-app-logs.txt
echo "Server uptime: $(uptime)" >> test-app-logs.txt
echo "Application status: $(curl -s http://localhost:${appServerPort}/health)" >> test-app-logs.txt

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
  sudo yum install -y awscli
fi

# Upload logs to S3
aws s3 cp test-app-logs.txt s3://${outputs.s3_bucket_name}/application-logs/\$(date +%Y-%m-%d)/test-app-logs-\$(date +%H-%M-%S).txt

if [ $? -eq 0 ]; then
  echo "S3 upload successful"
else
  echo "S3 upload failed"
  exit 1
fi

# List S3 objects to verify upload
aws s3 ls s3://${outputs.s3_bucket_name}/application-logs/ --recursive

echo "S3 operations completed successfully"
      `;

      const s3Command = await ssmClient.send(
        new SendCommandCommand({
          InstanceIds: [outputs.ec2_instance_id],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [s3LogsScript],
          },
          TimeoutSeconds: 120,
        })
      );

      expect(s3Command.Command?.CommandId).toBeDefined();

      // Wait for S3 operations to complete
      await new Promise(resolve => setTimeout(resolve, 30000));

      const s3Result = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: s3Command.Command!.CommandId!,
          InstanceId: outputs.ec2_instance_id,
        })
      );

      expect(s3Result.Status).toBe("Success");
      expect(s3Result.StandardOutputContent).toContain("S3 upload successful");
      expect(s3Result.StandardOutputContent).toContain("S3 operations completed successfully");
    }, LONG_TIMEOUT);
  });

  describe("End-to-End Infrastructure Validation", () => {
    test("Should validate complete infrastructure workflow", async () => {
      const workflowScript = `
#!/bin/bash
cd /opt/test-app

echo "=== End-to-End Infrastructure Validation ==="

# 1. EC2 Compute validation
echo "1. EC2 Instance Validation:"
echo "Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)"
echo "Instance Type: $(curl -s http://169.254.169.254/latest/meta-data/instance-type)"
echo "Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)"

# 2. Application performance validation
echo "2. Application Performance Validation:"
start_time=$(date +%s%N)
health_response=$(curl -s http://localhost:${appServerPort}/health)
end_time=$(date +%s%N)
response_time=$(((end_time - start_time) / 1000000))
echo "Health check response time: \${response_time}ms"
echo "Health response: $health_response"

# 3. Database performance validation
echo "3. Database Performance Validation:"
start_time=$(date +%s%N)
db_response=$(curl -s http://localhost:${appServerPort}/db-test)
end_time=$(date +%s%N)
db_response_time=$(((end_time - start_time) / 1000000))
echo "Database response time: \${db_response_time}ms"
echo "Database response: $db_response"

# 4. Storage validation
echo "4. Storage Validation:"
disk_usage=$(df -h /opt/test-app | tail -1)
echo "Application disk usage: $disk_usage"

# 5. Network validation
echo "5. Network Validation:"
echo "VPC ID: ${outputs.vpc_id}"
echo "Subnet ID: ${outputs.public_subnet_id}"
echo "Public IP: ${outputs.ec2_instance_public_ip}"

# 6. Final application state
echo "6. Final Application State:"
metrics_response=$(curl -s http://localhost:${appServerPort}/metrics)
echo "Application metrics: $metrics_response"

echo "End-to-end infrastructure validation completed successfully"
      `;

      const workflowCommand = await ssmClient.send(
        new SendCommandCommand({
          InstanceIds: [outputs.ec2_instance_id],
          DocumentName: "AWS-RunShellScript",
          Parameters: {
            commands: [workflowScript],
          },
          TimeoutSeconds: 120,
        })
      );

      expect(workflowCommand.Command?.CommandId).toBeDefined();

      // Wait for workflow validation to complete
      await new Promise(resolve => setTimeout(resolve, 30000));

      const workflowResult = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: workflowCommand.Command!.CommandId!,
          InstanceId: outputs.ec2_instance_id,
        })
      );

      expect(workflowResult.Status).toBe("Success");
      expect(workflowResult.StandardOutputContent).toContain("End-to-end infrastructure validation completed successfully");
      expect(workflowResult.StandardOutputContent).toContain("Instance ID:");
      expect(workflowResult.StandardOutputContent).toContain("Health check response time:");
      expect(workflowResult.StandardOutputContent).toContain("Database response time:");
      expect(workflowResult.StandardOutputContent).toContain("VPC ID: " + outputs.vpc_id);
      expect(workflowResult.StandardOutputContent).toContain("Public IP: " + outputs.ec2_instance_public_ip);
    }, LONG_TIMEOUT);
  });
});
