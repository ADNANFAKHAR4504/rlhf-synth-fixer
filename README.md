# TAP - Task Assignment Platform

A TypeScript CDK project for creating and managing RLHF (Reinforcement Learning from Human Feedback) tasks.

## CLI Usage

This project includes a CLI tool for creating RLHF tasks with predefined templates and metadata.

### Create an RLHF Task

```bash
npm start rlhf-task
```

This command will launch an interactive prompt that guides you through:

1. **Platform Selection**: Choose the target platform (e.g., AWS, Azure, GCP)
2. **Language Selection**: Select the programming language (e.g., TypeScript, Python, JavaScript)
3. **Complexity Level**: Set the task complexity (Beginner, Intermediate, Expert)
4. **Turn Type**: Choose between Single or Multi-turn interactions
5. **Task ID**: Enter a unique identifier for the task

The CLI will:
- Copy the appropriate template from `templates/{platform}-{language}/`
- Generate a `metadata.json` file with your task configuration
- Set up the project structure for your RLHF task

### Generated Files

After running the CLI, you'll have:
- **metadata.json**: Contains task metadata (platform, language, complexity, turn type, task ID)
- **Project files**: Copied from the selected template (bin/, lib/, test/, cdk.json)

## Development Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npm run test:unit`    perform only unit tests
* `npm run test:integration`    perform only integration tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Templates

Templates are stored in the `templates/` directory and organized by platform and language:
```
templates/
├── aws-ts/
├── aws-py/
└── ...
```

Each template contains a complete project structure that gets copied when creating a new RLHF task.
