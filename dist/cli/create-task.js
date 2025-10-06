#!/usr/bin/env node
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = require("@inquirer/prompts");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
async function generateMetadataFile(metadata) {
    const rootDir = path.join(__dirname, '..');
    const metadataPath = path.join(rootDir, 'metadata.json');
    try {
        await fs.writeJson(metadataPath, metadata, { spaces: 2 });
        console.log('✓ Generated metadata.json');
    }
    catch (err) {
        console.error('Error generating metadata.json:', err);
    }
}
async function copyTemplate(templateName) {
    const templatesDir = path.join(__dirname, '..', 'templates');
    const templatePath = path.join(templatesDir, templateName);
    const rootDir = path.join(__dirname, '..');
    try {
        if (!(await fs.pathExists(templatePath))) {
            console.error(`Template '${templateName}' not found`);
            return;
        }
        const items = await fs.readdir(templatePath);
        for (const item of items) {
            const sourcePath = path.join(templatePath, item);
            const destPath = path.join(rootDir, item);
            const stat = await fs.stat(sourcePath);
            if (stat.isDirectory()) {
                await fs.copy(sourcePath, destPath, { overwrite: true });
                console.log(`✓ Copied ${item}/ to root`);
            }
            else {
                await fs.copy(sourcePath, destPath, { overwrite: true });
                console.log(`✓ Copied ${item} to root`);
            }
        }
        console.log(`\n🎉 Template '${templateName}' has been successfully applied to your project!`);
    }
    catch (err) {
        console.error('Error copying template:', err);
    }
}
function getLanguageChoices(platform) {
    if (platform === 'cdk') {
        return [
            { name: 'TypeScript', value: 'ts' },
            { name: 'JavaScript', value: 'js' },
            { name: 'Python', value: 'py' },
            { name: 'Java', value: 'java' },
            { name: 'Go', value: 'go' },
        ];
    }
    if (platform === 'cdktf') {
        return [
            { name: 'TypeScript', value: 'ts' },
            { name: 'Python', value: 'py' },
            { name: 'Go', value: 'go' },
            { name: 'Java', value: 'java' },
        ];
    }
    if (platform === 'pulumi') {
        return [
            { name: 'TypeScript', value: 'ts' },
            { name: 'JavaScript', value: 'js' },
            { name: 'Python', value: 'py' },
            { name: 'Java', value: 'java' },
            { name: 'Go', value: 'go' },
        ];
    }
    if (platform === 'tf') {
        return [{ name: 'Terraform', value: 'hcl' }];
    }
    return [
        { name: 'YAML', value: 'yaml' },
        { name: 'JSON', value: 'json' },
    ];
}
const SUBTASK_CHOICES = [
    { name: 'Cloud Environment Setup', value: 'Cloud Environment Setup' },
    { name: 'Environment Migration', value: 'Environment Migration' },
    {
        name: 'Multi-Environment Consistency',
        value: 'Multi-Environment Consistency',
    },
    { name: 'Web Application Deployment', value: 'Web Application Deployment' },
    {
        name: 'Serverless Infrastructure (Functions as Code)',
        value: 'Serverless Infrastructure (Functions as Code)',
    },
    { name: 'CI/CD Pipeline', value: 'CI/CD Pipeline' },
    { name: 'Failure Recovery Automation', value: 'Failure Recovery Automation' },
    {
        name: 'Security Configuration as Code',
        value: 'Security Configuration as Code',
    },
    { name: 'IaC Diagnosis/Edits', value: 'IaC Diagnosis/Edits' },
    { name: 'IaC Optimization', value: 'IaC Optimization' },
    {
        name: 'Infrastructure Analysis/Monitoring',
        value: 'Infrastructure Analysis/Monitoring',
    },
    {
        name: 'General Infrastructure Tooling QA',
        value: 'General Infrastructure Tooling QA',
    },
];
const subjectLabelsBySubtask = {
    'Environment Migration': 'Provisioning of Infrastructure Environments',
    'Cloud Environment Setup': 'Provisioning of Infrastructure Environments',
    'Multi-Environment Consistency': 'Provisioning of Infrastructure Environments',
    'Web Application Deployment': 'Provisioning of Infrastructure Environments',
    'Serverless Infrastructure (Functions as Code)': 'Application Deployment',
    'CI/CD Pipeline': 'CI/CD Pipeline',
    'Failure Recovery Automation': 'Failure Recovery and High Availability',
    'Security Configuration as Code': 'Security, Compliance and Governance',
    'IaC Diagnosis/Edits': 'IaC Program Optimization',
    'IaC Optimization': 'IaC Program Optimization',
    'Infrastructure Analysis/Monitoring': 'IaC Program Optimization',
    'General Infrastructure Tooling QA': 'Infrastructure QA and Management',
};
const ANALYSIS_SUBTASKS = new Set([
    'Infrastructure Analysis/Monitoring',
    'General Infrastructure Tooling QA',
]);
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: npm run start <command>');
        console.error('Available commands: rlhf-task');
        process.exit(1);
    }
    const command = args[0];
    if (command === 'rlhf-task') {
        console.log('🔧 TAP Template Selector\n');
        const taskSubCategory = await (0, prompts_1.select)({
            message: 'Select the Subtask:',
            choices: SUBTASK_CHOICES,
        });
        const isAnalysis = ANALYSIS_SUBTASKS.has(taskSubCategory);
        let platform = '';
        let language = '';
        if (isAnalysis) {
            platform = 'analysis';
            const analysisChoice = await (0, prompts_1.select)({
                message: 'Select analysis template type:',
                choices: [
                    { name: 'Shell', value: 'shell' },
                    { name: 'Python', value: 'python' },
                ],
            });
            language = analysisChoice;
        }
        else {
            platform = await (0, prompts_1.select)({
                message: 'Select the platform:',
                choices: [
                    { name: 'CDK', value: 'cdk' },
                    { name: 'CDK Terraform', value: 'cdktf' },
                    { name: 'CloudFormation', value: 'cfn' },
                    { name: 'Terraform', value: 'tf' },
                    { name: 'Pulumi', value: 'pulumi' },
                ],
            });
            language = await (0, prompts_1.select)({
                message: 'Select the language:',
                choices: getLanguageChoices(platform),
            });
        }
        const complexity = await (0, prompts_1.select)({
            message: 'Select the complexity:',
            choices: [
                { name: 'Medium', value: 'medium' },
                { name: 'Hard', value: 'hard' },
                { name: 'Expert', value: 'expert' },
            ],
        });
        const turnType = await (0, prompts_1.select)({
            message: 'Select the turn type:',
            choices: [
                { name: 'Single', value: 'single' },
                { name: 'Multi', value: 'multi' },
            ],
        });
        const taskId = await (0, prompts_1.input)({
            message: 'Enter the task ID:',
            validate: value => {
                if (!value.trim()) {
                    return 'Task ID is required';
                }
                return true;
            },
        });
        const team = await (0, prompts_1.select)({
            message: 'Select the team:',
            choices: [
                { name: '1', value: '1' },
                { name: '2', value: '2' },
                { name: '3', value: '3' },
                { name: '4', value: '4' },
                { name: '5', value: '5' },
                { name: '6', value: '6' },
                { name: 'synth', value: 'synth' },
            ],
        });
        let resourcesText = undefined;
        if (!isAnalysis) {
            resourcesText = await (0, prompts_1.input)({
                message: 'Enter aws_services to provision (comma-separated). e.g., S3 Bucket, CloudFormation, Lambda, Fargate, VPC',
                default: 'S3 Bucket, CloudFormation, Lambda, EventBridge, CloudWatch LogGroup, VPC',
            });
        }
        const templateName = isAnalysis
            ? `analysis-${language}`
            : `${platform}-${language}`;
        if (!isAnalysis) {
            const templatesDir = path.join(__dirname, '..', 'templates');
            const templatePath = path.join(templatesDir, templateName);
            if (!(await fs.pathExists(templatePath))) {
                console.error(`Template '${templateName}' not found in templates directory`);
                process.exit(1);
            }
        }
        const label = subjectLabelsBySubtask[taskSubCategory];
        const metadata = {
            platform,
            language,
            complexity,
            turn_type: turnType,
            po_id: taskId,
            team,
            startedAt: new Date().toISOString(),
            subtask: taskSubCategory,
            ...(label ? { subject_labels: [label] } : {}),
            ...(resourcesText && resourcesText.trim().length > 0
                ? { aws_services: resourcesText.trim() }
                : {}),
        };
        console.log('\n📋 Task Summary:');
        console.log(`Subtask: ${taskSubCategory}`);
        console.log(`Subject Labels: ${label ? `[${label}]` : '[]'}`);
        console.log(`Platform: ${platform}`);
        console.log(`Language: ${language}`);
        console.log(`Complexity: ${complexity}`);
        console.log(`Turn Type: ${turnType}`);
        console.log(`Task ID: ${taskId}`);
        console.log(`Team: ${team}`);
        console.log(`Template: ${templateName}`);
        const confirmApply = await (0, prompts_1.confirm)({
            message: 'Create the RLHF task with these settings? This will overwrite existing files.',
            default: false,
        });
        if (confirmApply) {
            await copyTemplate(templateName);
            await generateMetadataFile(metadata);
            console.log('\n🎉 RLHF task created successfully!');
        }
        else {
            console.log('Operation cancelled');
        }
    }
    else {
        console.error(`Unknown command: ${command}`);
        console.error('Available commands: rlhf-task');
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLXRhc2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9jbGkvY3JlYXRlLXRhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsK0NBQTJEO0FBQzNELDZDQUErQjtBQUMvQiwyQ0FBNkI7QUFlN0IsS0FBSyxVQUFVLG9CQUFvQixDQUFDLFFBQXNCO0lBQ3hELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRXpELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFBQyxPQUFPLEdBQVksRUFBRSxDQUFDO1FBQ3RCLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDeEQsQ0FBQztBQUNILENBQUM7QUFFRCxLQUFLLFVBQVUsWUFBWSxDQUFDLFlBQW9CO0lBQzlDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM3RCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztJQUMzRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUUzQyxJQUFJLENBQUM7UUFDSCxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxV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QUFHLENBQUMsZUFBZSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBRXpDLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSxpQkFBTyxFQUFDO1lBQ2pDLE9BQU8sRUFDTCwrRUFBK0U7WUFDakYsT0FBTyxFQUFFLEtBQUs7U0FDZixDQUFDLENBQUM7UUFFSCxJQUFJLFlBQVksRUFBRSxDQUFDO1lBQ2pCLE1BQU0sWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1FBQ3RELENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7SUFDSCxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDN0MsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1FBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQztBQUNILENBQUM7QUFFRCxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG5pbXBvcnQgeyBjb25maXJtLCBpbnB1dCwgc2VsZWN0IH0gZnJvbSAnQGlucXVpcmVyL3Byb21wdHMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuaW50ZXJmYWNlIFRhc2tNZXRhZGF0YSB7XG4gIHBsYXRmb3JtOiBzdHJpbmc7XG4gIGxhbmd1YWdlOiBzdHJpbmc7XG4gIGNvbXBsZXhpdHk6IHN0cmluZztcbiAgdHVybl90eXBlOiBzdHJpbmc7XG4gIHBvX2lkOiBzdHJpbmc7XG4gIHRlYW06IHN0cmluZztcbiAgc3RhcnRlZEF0OiBzdHJpbmc7XG4gIHN1YnRhc2s6IHN0cmluZztcbiAgc3ViamVjdF9sYWJlbHM/OiBzdHJpbmdbXTtcbiAgYXdzX3NlcnZpY2VzPzogc3RyaW5nO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZU1ldGFkYXRhRmlsZShtZXRhZGF0YTogVGFza01ldGFkYXRhKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nKTtcbiAgY29uc3QgbWV0YWRhdGFQYXRoID0gcGF0aC5qb2luKHJvb3REaXIsICdtZXRhZGF0YS5qc29uJyk7XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy53cml0ZUpzb24obWV0YWRhdGFQYXRoLCBtZXRhZGF0YSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgY29uc29sZS5sb2coJ+KckyBHZW5lcmF0ZWQgbWV0YWRhdGEuanNvbicpO1xuICB9IGNhdGNoIChlcnI6IHVua25vd24pIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIG1ldGFkYXRhLmpzb246JywgZXJyKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjb3B5VGVtcGxhdGUodGVtcGxhdGVOYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdGVtcGxhdGVzRGlyID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ3RlbXBsYXRlcycpO1xuICBjb25zdCB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4odGVtcGxhdGVzRGlyLCB0ZW1wbGF0ZU5hbWUpO1xuICBjb25zdCByb290RGlyID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJyk7XG5cbiAgdHJ5IHtcbiAgICBpZiAoIShhd2FpdCBmcy5wYXRoRXhpc3RzKHRlbXBsYXRlUGF0aCkpKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUZW1wbGF0ZSAnJHt0ZW1wbGF0ZU5hbWV9JyBub3QgZm91bmRgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtcyA9IGF3YWl0IGZzLnJlYWRkaXIodGVtcGxhdGVQYXRoKTtcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgY29uc3Qgc291cmNlUGF0aCA9IHBhdGguam9pbih0ZW1wbGF0ZVBhdGgsIGl0ZW0pO1xuICAgICAgY29uc3QgZGVzdFBhdGggPSBwYXRoLmpvaW4ocm9vdERpciwgaXRlbSk7XG5cbiAgICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBmcy5zdGF0KHNvdXJjZVBhdGgpO1xuXG4gICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgIGF3YWl0IGZzLmNvcHkoc291cmNlUGF0aCwgZGVzdFBhdGgsIHsgb3ZlcndyaXRlOiB0cnVlIH0pO1xuICAgICAgICBjb25zb2xlLmxvZyhg4pyTIENvcGllZCAke2l0ZW19LyB0byByb290YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCBmcy5jb3B5KHNvdXJjZVBhdGgsIGRlc3RQYXRoLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTtcbiAgICAgICAgY29uc29sZS5sb2coYOKckyBDb3BpZWQgJHtpdGVtfSB0byByb290YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgXFxu8J+OiSBUZW1wbGF0ZSAnJHt0ZW1wbGF0ZU5hbWV9JyBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgYXBwbGllZCB0byB5b3VyIHByb2plY3QhYFxuICAgICk7XG4gIH0gY2F0Y2ggKGVycjogdW5rbm93bikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNvcHlpbmcgdGVtcGxhdGU6JywgZXJyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRMYW5ndWFnZUNob2ljZXMocGxhdGZvcm06IHN0cmluZykge1xuICBpZiAocGxhdGZvcm0gPT09ICdjZGsnKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHsgbmFtZTogJ1R5cGVTY3JpcHQnLCB2YWx1ZTogJ3RzJyB9LFxuICAgICAgeyBuYW1lOiAnSmF2YVNjcmlwdCcsIHZhbHVlOiAnanMnIH0sXG4gICAgICB7IG5hbWU6ICdQeXRob24nLCB2YWx1ZTogJ3B5JyB9LFxuICAgICAgeyBuYW1lOiAnSmF2YScsIHZhbHVlOiAnamF2YScgfSxcbiAgICAgIHsgbmFtZTogJ0dvJywgdmFsdWU6ICdnbycgfSxcbiAgICBdO1xuICB9XG5cbiAgaWYgKHBsYXRmb3JtID09PSAnY2RrdGYnKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHsgbmFtZTogJ1R5cGVTY3JpcHQnLCB2YWx1ZTogJ3RzJyB9LFxuICAgICAgeyBuYW1lOiAnUHl0aG9uJywgdmFsdWU6ICdweScgfSxcbiAgICAgIHsgbmFtZTogJ0dvJywgdmFsdWU6ICdnbycgfSxcbiAgICAgIHsgbmFtZTogJ0phdmEnLCB2YWx1ZTogJ2phdmEnIH0sXG4gICAgXTtcbiAgfVxuXG4gIGlmIChwbGF0Zm9ybSA9PT0gJ3B1bHVtaScpIHtcbiAgICByZXR1cm4gW1xuICAgICAgeyBuYW1lOiAnVHlwZVNjcmlwdCcsIHZhbHVlOiAndHMnIH0sXG4gICAgICB7IG5hbWU6ICdKYXZhU2NyaXB0JywgdmFsdWU6ICdqcycgfSxcbiAgICAgIHsgbmFtZTogJ1B5dGhvbicsIHZhbHVlOiAncHknIH0sXG4gICAgICB7IG5hbWU6ICdKYXZhJywgdmFsdWU6ICdqYXZhJyB9LFxuICAgICAgeyBuYW1lOiAnR28nLCB2YWx1ZTogJ2dvJyB9LFxuICAgIF07XG4gIH1cbiAgaWYgKHBsYXRmb3JtID09PSAndGYnKSB7XG4gICAgcmV0dXJuIFt7IG5hbWU6ICdUZXJyYWZvcm0nLCB2YWx1ZTogJ2hjbCcgfV07XG4gIH1cblxuICByZXR1cm4gW1xuICAgIHsgbmFtZTogJ1lBTUwnLCB2YWx1ZTogJ3lhbWwnIH0sXG4gICAgeyBuYW1lOiAnSlNPTicsIHZhbHVlOiAnanNvbicgfSxcbiAgXTtcbn1cblxuY29uc3QgU1VCVEFTS19DSE9JQ0VTID0gW1xuICB7IG5hbWU6ICdDbG91ZCBFbnZpcm9ubWVudCBTZXR1cCcsIHZhbHVlOiAnQ2xvdWQgRW52aXJvbm1lbnQgU2V0dXAnIH0sXG4gIHsgbmFtZTogJ0Vudmlyb25tZW50IE1pZ3JhdGlvbicsIHZhbHVlOiAnRW52aXJvbm1lbnQgTWlncmF0aW9uJyB9LFxuICB7XG4gICAgbmFtZTogJ011bHRpLUVudmlyb25tZW50IENvbnNpc3RlbmN5JyxcbiAgICB2YWx1ZTogJ011bHRpLUVudmlyb25tZW50IENvbnNpc3RlbmN5JyxcbiAgfSxcbiAgeyBuYW1lOiAnV2ViIEFwcGxpY2F0aW9uIERlcGxveW1lbnQnLCB2YWx1ZTogJ1dlYiBBcHBsaWNhdGlvbiBEZXBsb3ltZW50JyB9LFxuXG4gIHtcbiAgICBuYW1lOiAnU2VydmVybGVzcyBJbmZyYXN0cnVjdHVyZSAoRnVuY3Rpb25zIGFzIENvZGUpJyxcbiAgICB2YWx1ZTogJ1NlcnZlcmxlc3MgSW5mcmFzdHJ1Y3R1cmUgKEZ1bmN0aW9ucyBhcyBDb2RlKScsXG4gIH0sXG5cbiAgeyBuYW1lOiAnQ0kvQ0QgUGlwZWxpbmUnLCB2YWx1ZTogJ0NJL0NEIFBpcGVsaW5lJyB9LFxuXG4gIHsgbmFtZTogJ0ZhaWx1cmUgUmVjb3ZlcnkgQXV0b21hdGlvbicsIHZhbHVlOiAnRmFpbHVyZSBSZWNvdmVyeSBBdXRvbWF0aW9uJyB9LFxuXG4gIHtcbiAgICBuYW1lOiAnU2VjdXJpdHkgQ29uZmlndXJhdGlvbiBhcyBDb2RlJyxcbiAgICB2YWx1ZTogJ1NlY3VyaXR5IENvbmZpZ3VyYXRpb24gYXMgQ29kZScsXG4gIH0sXG5cbiAgeyBuYW1lOiAnSWFDIERpYWdub3Npcy9FZGl0cycsIHZhbHVlOiAnSWFDIERpYWdub3Npcy9FZGl0cycgfSxcbiAgeyBuYW1lOiAnSWFDIE9wdGltaXphdGlvbicsIHZhbHVlOiAnSWFDIE9wdGltaXphdGlvbicgfSxcblxuICB7XG4gICAgbmFtZTogJ0luZnJhc3RydWN0dXJlIEFuYWx5c2lzL01vbml0b3JpbmcnLFxuICAgIHZhbHVlOiAnSW5mcmFzdHJ1Y3R1cmUgQW5hbHlzaXMvTW9uaXRvcmluZycsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnR2VuZXJhbCBJbmZyYXN0cnVjdHVyZSBUb29saW5nIFFBJyxcbiAgICB2YWx1ZTogJ0dlbmVyYWwgSW5mcmFzdHJ1Y3R1cmUgVG9vbGluZyBRQScsXG4gIH0sXG5dIGFzIGNvbnN0O1xuXG5jb25zdCBzdWJqZWN0TGFiZWxzQnlTdWJ0YXNrOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAnRW52aXJvbm1lbnQgTWlncmF0aW9uJzogJ1Byb3Zpc2lvbmluZyBvZiBJbmZyYXN0cnVjdHVyZSBFbnZpcm9ubWVudHMnLFxuICAnQ2xvdWQgRW52aXJvbm1lbnQgU2V0dXAnOiAnUHJvdmlzaW9uaW5nIG9mIEluZnJhc3RydWN0dXJlIEVudmlyb25tZW50cycsXG4gICdNdWx0aS1FbnZpcm9ubWVudCBDb25zaXN0ZW5jeSc6XG4gICAgJ1Byb3Zpc2lvbmluZyBvZiBJbmZyYXN0cnVjdHVyZSBFbnZpcm9ubWVudHMnLFxuICAnV2ViIEFwcGxpY2F0aW9uIERlcGxveW1lbnQnOiAnUHJvdmlzaW9uaW5nIG9mIEluZnJhc3RydWN0dXJlIEVudmlyb25tZW50cycsXG5cbiAgJ1NlcnZlcmxlc3MgSW5mcmFzdHJ1Y3R1cmUgKEZ1bmN0aW9ucyBhcyBDb2RlKSc6ICdBcHBsaWNhdGlvbiBEZXBsb3ltZW50JyxcblxuICAnQ0kvQ0QgUGlwZWxpbmUnOiAnQ0kvQ0QgUGlwZWxpbmUnLFxuXG4gICdGYWlsdXJlIFJlY292ZXJ5IEF1dG9tYXRpb24nOiAnRmFpbHVyZSBSZWNvdmVyeSBhbmQgSGlnaCBBdmFpbGFiaWxpdHknLFxuXG4gICdTZWN1cml0eSBDb25maWd1cmF0aW9uIGFzIENvZGUnOiAnU2VjdXJpdHksIENvbXBsaWFuY2UgYW5kIEdvdmVybmFuY2UnLFxuXG4gICdJYUMgRGlhZ25vc2lzL0VkaXRzJzogJ0lhQyBQcm9ncmFtIE9wdGltaXphdGlvbicsXG4gICdJYUMgT3B0aW1pemF0aW9uJzogJ0lhQyBQcm9ncmFtIE9wdGltaXphdGlvbicsXG5cbiAgJ0luZnJhc3RydWN0dXJlIEFuYWx5c2lzL01vbml0b3JpbmcnOiAnSWFDIFByb2dyYW0gT3B0aW1pemF0aW9uJyxcbiAgJ0dlbmVyYWwgSW5mcmFzdHJ1Y3R1cmUgVG9vbGluZyBRQSc6ICdJbmZyYXN0cnVjdHVyZSBRQSBhbmQgTWFuYWdlbWVudCcsXG59O1xuXG5jb25zdCBBTkFMWVNJU19TVUJUQVNLUyA9IG5ldyBTZXQ8c3RyaW5nPihbXG4gICdJbmZyYXN0cnVjdHVyZSBBbmFseXNpcy9Nb25pdG9yaW5nJyxcbiAgJ0dlbmVyYWwgSW5mcmFzdHJ1Y3R1cmUgVG9vbGluZyBRQScsXG5dKTtcblxuYXN5bmMgZnVuY3Rpb24gbWFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYXJncyA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcblxuICBpZiAoYXJncy5sZW5ndGggPT09IDApIHtcbiAgICBjb25zb2xlLmVycm9yKCdVc2FnZTogbnBtIHJ1biBzdGFydCA8Y29tbWFuZD4nKTtcbiAgICBjb25zb2xlLmVycm9yKCdBdmFpbGFibGUgY29tbWFuZHM6IHJsaGYtdGFzaycpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxuXG4gIGNvbnN0IGNvbW1hbmQgPSBhcmdzWzBdO1xuXG4gIGlmIChjb21tYW5kID09PSAncmxoZi10YXNrJykge1xuICAgIGNvbnNvbGUubG9nKCfwn5SnIFRBUCBUZW1wbGF0ZSBTZWxlY3RvclxcbicpO1xuXG4gICAgY29uc3QgdGFza1N1YkNhdGVnb3J5ID0gYXdhaXQgc2VsZWN0KHtcbiAgICAgIG1lc3NhZ2U6ICdTZWxlY3QgdGhlIFN1YnRhc2s6JyxcbiAgICAgIGNob2ljZXM6IFNVQlRBU0tfQ0hPSUNFUyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGlzQW5hbHlzaXMgPSBBTkFMWVNJU19TVUJUQVNLUy5oYXModGFza1N1YkNhdGVnb3J5KTtcblxuICAgIGxldCBwbGF0Zm9ybSA9ICcnO1xuICAgIGxldCBsYW5ndWFnZSA9ICcnO1xuXG4gICAgaWYgKGlzQW5hbHlzaXMpIHtcbiAgICAgIHBsYXRmb3JtID0gJ2FuYWx5c2lzJztcbiAgICAgIGNvbnN0IGFuYWx5c2lzQ2hvaWNlID0gYXdhaXQgc2VsZWN0KHtcbiAgICAgICAgbWVzc2FnZTogJ1NlbGVjdCBhbmFseXNpcyB0ZW1wbGF0ZSB0eXBlOicsXG4gICAgICAgIGNob2ljZXM6IFtcbiAgICAgICAgICB7IG5hbWU6ICdTaGVsbCcsIHZhbHVlOiAnc2hlbGwnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnUHl0aG9uJywgdmFsdWU6ICdweXRob24nIH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICAgIGxhbmd1YWdlID0gYW5hbHlzaXNDaG9pY2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYXRmb3JtID0gYXdhaXQgc2VsZWN0KHtcbiAgICAgICAgbWVzc2FnZTogJ1NlbGVjdCB0aGUgcGxhdGZvcm06JyxcbiAgICAgICAgY2hvaWNlczogW1xuICAgICAgICAgIHsgbmFtZTogJ0NESycsIHZhbHVlOiAnY2RrJyB9LFxuICAgICAgICAgIHsgbmFtZTogJ0NESyBUZXJyYWZvcm0nLCB2YWx1ZTogJ2Nka3RmJyB9LFxuICAgICAgICAgIHsgbmFtZTogJ0Nsb3VkRm9ybWF0aW9uJywgdmFsdWU6ICdjZm4nIH0sXG4gICAgICAgICAgeyBuYW1lOiAnVGVycmFmb3JtJywgdmFsdWU6ICd0ZicgfSxcbiAgICAgICAgICB7IG5hbWU6ICdQdWx1bWknLCB2YWx1ZTogJ3B1bHVtaScgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuXG4gICAgICBsYW5ndWFnZSA9IGF3YWl0IHNlbGVjdCh7XG4gICAgICAgIG1lc3NhZ2U6ICdTZWxlY3QgdGhlIGxhbmd1YWdlOicsXG4gICAgICAgIGNob2ljZXM6IGdldExhbmd1YWdlQ2hvaWNlcyhwbGF0Zm9ybSksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wbGV4aXR5ID0gYXdhaXQgc2VsZWN0KHtcbiAgICAgIG1lc3NhZ2U6ICdTZWxlY3QgdGhlIGNvbXBsZXhpdHk6JyxcbiAgICAgIGNob2ljZXM6IFtcbiAgICAgICAgeyBuYW1lOiAnTWVkaXVtJywgdmFsdWU6ICdtZWRpdW0nIH0sXG4gICAgICAgIHsgbmFtZTogJ0hhcmQnLCB2YWx1ZTogJ2hhcmQnIH0sXG4gICAgICAgIHsgbmFtZTogJ0V4cGVydCcsIHZhbHVlOiAnZXhwZXJ0JyB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHR1cm5UeXBlID0gYXdhaXQgc2VsZWN0KHtcbiAgICAgIG1lc3NhZ2U6ICdTZWxlY3QgdGhlIHR1cm4gdHlwZTonLFxuICAgICAgY2hvaWNlczogW1xuICAgICAgICB7IG5hbWU6ICdTaW5nbGUnLCB2YWx1ZTogJ3NpbmdsZScgfSxcbiAgICAgICAgeyBuYW1lOiAnTXVsdGknLCB2YWx1ZTogJ211bHRpJyB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhc2tJZCA9IGF3YWl0IGlucHV0KHtcbiAgICAgIG1lc3NhZ2U6ICdFbnRlciB0aGUgdGFzayBJRDonLFxuICAgICAgdmFsaWRhdGU6IHZhbHVlID0+IHtcbiAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICByZXR1cm4gJ1Rhc2sgSUQgaXMgcmVxdWlyZWQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRlYW0gPSBhd2FpdCBzZWxlY3Qoe1xuICAgICAgbWVzc2FnZTogJ1NlbGVjdCB0aGUgdGVhbTonLFxuICAgICAgY2hvaWNlczogW1xuICAgICAgICB7IG5hbWU6ICcxJywgdmFsdWU6ICcxJyB9LFxuICAgICAgICB7IG5hbWU6ICcyJywgdmFsdWU6ICcyJyB9LFxuICAgICAgICB7IG5hbWU6ICczJywgdmFsdWU6ICczJyB9LFxuICAgICAgICB7IG5hbWU6ICc0JywgdmFsdWU6ICc0JyB9LFxuICAgICAgICB7IG5hbWU6ICc1JywgdmFsdWU6ICc1JyB9LFxuICAgICAgICB7IG5hbWU6ICc2JywgdmFsdWU6ICc2JyB9LFxuICAgICAgICB7IG5hbWU6ICdzeW50aCcsIHZhbHVlOiAnc3ludGgnIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgbGV0IHJlc291cmNlc1RleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoIWlzQW5hbHlzaXMpIHtcbiAgICAgIHJlc291cmNlc1RleHQgPSBhd2FpdCBpbnB1dCh7XG4gICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgJ0VudGVyIGF3c19zZXJ2aWNlcyB0byBwcm92aXNpb24gKGNvbW1hLXNlcGFyYXRlZCkuIGUuZy4sIFMzIEJ1Y2tldCwgQ2xvdWRGb3JtYXRpb24sIExhbWJkYSwgRmFyZ2F0ZSwgVlBDJyxcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAnUzMgQnVja2V0LCBDbG91ZEZvcm1hdGlvbiwgTGFtYmRhLCBFdmVudEJyaWRnZSwgQ2xvdWRXYXRjaCBMb2dHcm91cCwgVlBDJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHRlbXBsYXRlTmFtZSA9IGlzQW5hbHlzaXNcbiAgICAgID8gYGFuYWx5c2lzLSR7bGFuZ3VhZ2V9YFxuICAgICAgOiBgJHtwbGF0Zm9ybX0tJHtsYW5ndWFnZX1gO1xuXG4gICAgaWYgKCFpc0FuYWx5c2lzKSB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZXNEaXIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAndGVtcGxhdGVzJyk7XG4gICAgICBjb25zdCB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4odGVtcGxhdGVzRGlyLCB0ZW1wbGF0ZU5hbWUpO1xuICAgICAgaWYgKCEoYXdhaXQgZnMucGF0aEV4aXN0cyh0ZW1wbGF0ZVBhdGgpKSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBUZW1wbGF0ZSAnJHt0ZW1wbGF0ZU5hbWV9JyBub3QgZm91bmQgaW4gdGVtcGxhdGVzIGRpcmVjdG9yeWBcbiAgICAgICAgKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGxhYmVsID0gc3ViamVjdExhYmVsc0J5U3VidGFza1t0YXNrU3ViQ2F0ZWdvcnldO1xuICAgIGNvbnN0IG1ldGFkYXRhOiBUYXNrTWV0YWRhdGEgPSB7XG4gICAgICBwbGF0Zm9ybSxcbiAgICAgIGxhbmd1YWdlLFxuICAgICAgY29tcGxleGl0eSxcbiAgICAgIHR1cm5fdHlwZTogdHVyblR5cGUsXG4gICAgICBwb19pZDogdGFza0lkLFxuICAgICAgdGVhbSxcbiAgICAgIHN0YXJ0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgc3VidGFzazogdGFza1N1YkNhdGVnb3J5LFxuICAgICAgLi4uKGxhYmVsID8geyBzdWJqZWN0X2xhYmVsczogW2xhYmVsXSB9IDoge30pLFxuICAgICAgLi4uKHJlc291cmNlc1RleHQgJiYgcmVzb3VyY2VzVGV4dC50cmltKCkubGVuZ3RoID4gMFxuICAgICAgICA/IHsgYXdzX3NlcnZpY2VzOiByZXNvdXJjZXNUZXh0LnRyaW0oKSB9XG4gICAgICAgIDoge30pLFxuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZygnXFxu8J+TiyBUYXNrIFN1bW1hcnk6Jyk7XG4gICAgY29uc29sZS5sb2coYFN1YnRhc2s6ICR7dGFza1N1YkNhdGVnb3J5fWApO1xuICAgIGNvbnNvbGUubG9nKGBTdWJqZWN0IExhYmVsczogJHtsYWJlbCA/IGBbJHtsYWJlbH1dYCA6ICdbXSd9YCk7XG4gICAgY29uc29sZS5sb2coYFBsYXRmb3JtOiAke3BsYXRmb3JtfWApO1xuICAgIGNvbnNvbGUubG9nKGBMYW5ndWFnZTogJHtsYW5ndWFnZX1gKTtcbiAgICBjb25zb2xlLmxvZyhgQ29tcGxleGl0eTogJHtjb21wbGV4aXR5fWApO1xuICAgIGNvbnNvbGUubG9nKGBUdXJuIFR5cGU6ICR7dHVyblR5cGV9YCk7XG4gICAgY29uc29sZS5sb2coYFRhc2sgSUQ6ICR7dGFza0lkfWApO1xuICAgIGNvbnNvbGUubG9nKGBUZWFtOiAke3RlYW19YCk7XG4gICAgY29uc29sZS5sb2coYFRlbXBsYXRlOiAke3RlbXBsYXRlTmFtZX1gKTtcblxuICAgIGNvbnN0IGNvbmZpcm1BcHBseSA9IGF3YWl0IGNvbmZpcm0oe1xuICAgICAgbWVzc2FnZTpcbiAgICAgICAgJ0NyZWF0ZSB0aGUgUkxIRiB0YXNrIHdpdGggdGhlc2Ugc2V0dGluZ3M/IFRoaXMgd2lsbCBvdmVyd3JpdGUgZXhpc3RpbmcgZmlsZXMuJyxcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgaWYgKGNvbmZpcm1BcHBseSkge1xuICAgICAgYXdhaXQgY29weVRlbXBsYXRlKHRlbXBsYXRlTmFtZSk7XG4gICAgICBhd2FpdCBnZW5lcmF0ZU1ldGFkYXRhRmlsZShtZXRhZGF0YSk7XG4gICAgICBjb25zb2xlLmxvZygnXFxu8J+OiSBSTEhGIHRhc2sgY3JlYXRlZCBzdWNjZXNzZnVsbHkhJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdPcGVyYXRpb24gY2FuY2VsbGVkJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoYFVua25vd24gY29tbWFuZDogJHtjb21tYW5kfWApO1xuICAgIGNvbnNvbGUuZXJyb3IoJ0F2YWlsYWJsZSBjb21tYW5kczogcmxoZi10YXNrJyk7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbm1haW4oKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiJdfQ==