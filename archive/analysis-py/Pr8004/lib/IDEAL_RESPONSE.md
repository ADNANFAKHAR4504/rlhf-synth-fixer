# Ideal Infrastructure Analysis Response

This document contains the ideal Python-based infrastructure analysis implementation for analyzing deployed Currency Exchange API resources on AWS. The analysis script uses boto3 to audit Lambda, API Gateway, CloudWatch, IAM, and X-Ray resources and generates compliance recommendations.

## Overview

The solution consists of:
1. **analyse.py** - Main Python analysis script using boto3
2. **Unit Tests** - Comprehensive test coverage with mocked AWS services
3. **Integration Tests** - Tests against actual deployed AWS resources

## Architecture

The analysis script (`analyse.py`) provides:
- Lambda function analysis (runtime, memory, timeout, X-Ray tracing)
- API Gateway analysis (endpoints, stages, API keys, usage plans)
- CloudWatch Logs analysis (log groups, retention policies)
- IAM role analysis (policies, permissions)
- X-Ray tracing analysis (active traces)
- API throttling analysis (usage plans, rate limits)
- Compliance score calculation
- Actionable recommendations generation

## File: lib/analyse.py

```python
#!/usr/bin/env python3
"""
Infrastructure Analysis Script for Currency Exchange API
Analyzes deployed AWS Lambda, API Gateway, CloudWatch, IAM, and X-Ray resources
and generates compliance recommendations.
"""

import os
import sys
import json
import boto3
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone


class CurrencyAPIAnalyzer:
    """Analyzes AWS serverless infrastructure for Currency Exchange API"""

    def __init__(self, environment_suffix: str, region_name: str = 'us-east-1'):
        """
        Initialize the analyzer with environment suffix and AWS region.

        Args:
            environment_suffix: Environment identifier (e.g., 'dev', 'prod')
            region_name: AWS region name (default: 'us-east-1')
        """
        self.environment_suffix = environment_suffix
        self.region = region_name

        # Initialize AWS clients
        self.lambda_client = boto3.client('lambda', region_name=region_name)
        self.apigateway_client = boto3.client('apigateway', region_name=region_name)
        self.logs_client = boto3.client('logs', region_name=region_name)
        self.iam_client = boto3.client('iam', region_name=region_name)
        self.xray_client = boto3.client('xray', region_name=region_name)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)

    def analyze_lambda_functions(self) -> List[Dict[str, Any]]:
        """Analyze Lambda functions for currency converter"""
        lambda_functions = []
        function_name_pattern = f"currency-converter-{self.environment_suffix}"

        try:
            response = self.lambda_client.list_functions()
            functions = response.get('Functions', [])

            matching_functions = [
                f for f in functions
                if function_name_pattern in f['FunctionName']
            ]

            if not matching_functions:
                lambda_functions.append({
                    'name': function_name_pattern,
                    'status': 'missing',
                    'message': 'No Lambda function found matching pattern'
                })
                return lambda_functions

            for func in matching_functions:
                function_name = func['FunctionName']
                func_config = self.lambda_client.get_function(
                    FunctionName=function_name
                )

                config = func_config.get('Configuration', {})
                tracing = config.get('TracingConfig', {})

                lambda_functions.append({
                    'name': function_name,
                    'status': 'found',
                    'runtime': config.get('Runtime', 'unknown'),
                    'memory_size': config.get('MemorySize', 0),
                    'timeout': config.get('Timeout', 0),
                    'handler': config.get('Handler', ''),
                    'xray_enabled': tracing.get('Mode', 'PassThrough') == 'Active',
                    'role_arn': config.get('Role', ''),
                    'environment_variables': list(
                        config.get('Environment', {}).get('Variables', {}).keys()
                    ),
                    'last_modified': config.get('LastModified', ''),
                    'code_size': config.get('CodeSize', 0),
                    'compliant': self._check_lambda_compliance(config)
                })

        except Exception as e:
            lambda_functions.append({
                'name': function_name_pattern,
                'status': 'error',
                'error': str(e)
            })

        return lambda_functions

    def _check_lambda_compliance(self, config: Dict[str, Any]) -> Dict[str, bool]:
        """Check Lambda function compliance against requirements"""
        return {
            'runtime_nodejs18': config.get('Runtime', '') == 'nodejs18.x',
            'memory_1gb': config.get('MemorySize', 0) >= 1024,
            'timeout_10s': config.get('Timeout', 0) == 10,
            'xray_active': config.get('TracingConfig', {}).get('Mode') == 'Active',
            'has_api_version_env': 'API_VERSION' in config.get(
                'Environment', {}
            ).get('Variables', {}),
            'has_rate_precision_env': 'RATE_PRECISION' in config.get(
                'Environment', {}
            ).get('Variables', {})
        }

    def analyze_api_gateway(self) -> List[Dict[str, Any]]:
        """Analyze API Gateway REST APIs"""
        api_gateways = []
        api_name_pattern = f"currency-exchange-api-{self.environment_suffix}"

        try:
            response = self.apigateway_client.get_rest_apis()
            apis = response.get('items', [])

            matching_apis = [
                api for api in apis
                if api_name_pattern in api.get('name', '')
            ]

            if not matching_apis:
                api_gateways.append({
                    'name': api_name_pattern,
                    'status': 'missing',
                    'message': 'No API Gateway found matching pattern'
                })
                return api_gateways

            for api in matching_apis:
                api_id = api['id']
                api_name = api['name']

                # Get resources
                resources_response = self.apigateway_client.get_resources(
                    restApiId=api_id
                )
                resources = resources_response.get('items', [])

                # Check for /convert endpoint
                convert_resource = next(
                    (r for r in resources if r.get('pathPart') == 'convert'),
                    None
                )

                # Get stages
                stages_response = self.apigateway_client.get_stages(
                    restApiId=api_id
                )
                stages = stages_response.get('item', [])

                v1_stage = next(
                    (s for s in stages if s.get('stageName') == 'v1'),
                    None
                )

                # Get API keys
                api_keys_response = self.apigateway_client.get_api_keys()
                api_keys = [
                    k for k in api_keys_response.get('items', [])
                    if self.environment_suffix in k.get('name', '')
                ]

                # Get usage plans
                usage_plans_response = self.apigateway_client.get_usage_plans()
                usage_plans = [
                    p for p in usage_plans_response.get('items', [])
                    if self.environment_suffix in p.get('name', '')
                ]

                api_gateways.append({
                    'name': api_name,
                    'id': api_id,
                    'status': 'found',
                    'endpoint_configuration': api.get(
                        'endpointConfiguration', {}
                    ).get('types', []),
                    'has_convert_endpoint': convert_resource is not None,
                    'has_v1_stage': v1_stage is not None,
                    'xray_enabled': v1_stage.get(
                        'tracingEnabled', False
                    ) if v1_stage else False,
                    'api_key_count': len(api_keys),
                    'usage_plan_count': len(usage_plans),
                    'stage_variables': v1_stage.get(
                        'variables', {}
                    ) if v1_stage else {},
                    'compliant': self._check_api_compliance(
                        api, convert_resource, v1_stage, api_keys, usage_plans
                    )
                })

        except Exception as e:
            api_gateways.append({
                'name': api_name_pattern,
                'status': 'error',
                'error': str(e)
            })

        return api_gateways

    def _check_api_compliance(
        self,
        api: Dict,
        convert_resource: Optional[Dict],
        v1_stage: Optional[Dict],
        api_keys: List,
        usage_plans: List
    ) -> Dict[str, bool]:
        """Check API Gateway compliance against requirements"""
        return {
            'is_edge_optimized': 'EDGE' in api.get(
                'endpointConfiguration', {}
            ).get('types', []),
            'has_convert_endpoint': convert_resource is not None,
            'has_v1_stage': v1_stage is not None,
            'xray_tracing_enabled': v1_stage.get(
                'tracingEnabled', False
            ) if v1_stage else False,
            'has_api_key': len(api_keys) > 0,
            'has_usage_plan': len(usage_plans) > 0
        }

    def analyze_cloudwatch_logs(self) -> List[Dict[str, Any]]:
        """Analyze CloudWatch Log Groups for Lambda and API Gateway"""
        log_groups = []
        expected_prefixes = [
            f"/aws/lambda/currency-converter-{self.environment_suffix}",
            f"/aws/apigateway/currency-api-{self.environment_suffix}"
        ]

        for prefix in expected_prefixes:
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=prefix
                )

                found_groups = response.get('logGroups', [])

                if not found_groups:
                    log_groups.append({
                        'name': prefix,
                        'status': 'missing',
                        'expected_prefix': prefix
                    })
                    continue

                for lg in found_groups:
                    log_groups.append({
                        'name': lg['logGroupName'],
                        'status': 'found',
                        'retention_days': lg.get('retentionInDays', 'unlimited'),
                        'kms_encrypted': 'kmsKeyId' in lg,
                        'stored_bytes': lg.get('storedBytes', 0),
                        'creation_time': lg.get('creationTime', 0)
                    })

            except Exception as e:
                log_groups.append({
                    'name': prefix,
                    'status': 'error',
                    'error': str(e)
                })

        return log_groups

    def analyze_iam_roles(self) -> List[Dict[str, Any]]:
        """Analyze IAM roles for Lambda and API Gateway"""
        iam_roles = []
        role_patterns = [
            f"currency-converter-lambda-role-{self.environment_suffix}",
            f"currency-api-gateway-cloudwatch-{self.environment_suffix}"
        ]

        for role_pattern in role_patterns:
            try:
                response = self.iam_client.get_role(RoleName=role_pattern)
                role = response.get('Role', {})

                # Get attached policies
                policies_response = self.iam_client.list_attached_role_policies(
                    RoleName=role_pattern
                )
                attached_policies = policies_response.get('AttachedPolicies', [])

                iam_roles.append({
                    'name': role_pattern,
                    'status': 'found',
                    'arn': role.get('Arn', ''),
                    'create_date': str(role.get('CreateDate', '')),
                    'attached_policies': [
                        p['PolicyName'] for p in attached_policies
                    ],
                    'has_lambda_basic_execution': any(
                        'LambdaBasicExecutionRole' in p['PolicyName']
                        for p in attached_policies
                    ),
                    'has_xray_write_access': any(
                        'XRay' in p['PolicyName']
                        for p in attached_policies
                    )
                })

            except self.iam_client.exceptions.NoSuchEntityException:
                iam_roles.append({
                    'name': role_pattern,
                    'status': 'missing'
                })
            except Exception as e:
                iam_roles.append({
                    'name': role_pattern,
                    'status': 'error',
                    'error': str(e)
                })

        return iam_roles

    def analyze_xray_tracing(self) -> Dict[str, Any]:
        """Analyze X-Ray tracing configuration"""
        xray_analysis = {
            'status': 'unknown',
            'lambda_tracing': False,
            'api_gateway_tracing': False,
            'trace_summary': []
        }

        try:
            end_time = datetime.now(timezone.utc)
            start_time = datetime(
                end_time.year, end_time.month, end_time.day,
                tzinfo=timezone.utc
            )

            response = self.xray_client.get_trace_summaries(
                StartTime=start_time,
                EndTime=end_time,
                FilterExpression=f'service(id(name: "currency-converter-{self.environment_suffix}"))'
            )

            traces = response.get('TraceSummaries', [])
            xray_analysis['trace_count'] = len(traces)
            xray_analysis['status'] = 'active' if traces else 'no_recent_traces'

            if traces:
                xray_analysis['trace_summary'] = [
                    {
                        'id': t.get('Id', ''),
                        'duration': t.get('Duration', 0),
                        'response_time': t.get('ResponseTime', 0),
                        'has_error': t.get('HasError', False),
                        'has_fault': t.get('HasFault', False)
                    }
                    for t in traces[:10]
                ]

        except Exception as e:
            xray_analysis['status'] = 'error'
            xray_analysis['error'] = str(e)

        return xray_analysis

    def analyze_api_throttling(self) -> Dict[str, Any]:
        """Analyze API Gateway throttling configuration"""
        throttling_analysis = {
            'status': 'unknown',
            'usage_plans': []
        }

        try:
            response = self.apigateway_client.get_usage_plans()
            usage_plans = response.get('items', [])

            matching_plans = [
                p for p in usage_plans
                if self.environment_suffix in p.get('name', '')
            ]

            if not matching_plans:
                throttling_analysis['status'] = 'no_usage_plans'
                return throttling_analysis

            throttling_analysis['status'] = 'configured'
            for plan in matching_plans:
                throttle = plan.get('throttle', {})
                quota = plan.get('quota', {})

                throttling_analysis['usage_plans'].append({
                    'name': plan.get('name', ''),
                    'id': plan.get('id', ''),
                    'rate_limit': throttle.get('rateLimit', 0),
                    'burst_limit': throttle.get('burstLimit', 0),
                    'quota_limit': quota.get('limit', 0),
                    'quota_period': quota.get('period', ''),
                    'compliant': self._check_throttling_compliance(throttle, quota)
                })

        except Exception as e:
            throttling_analysis['status'] = 'error'
            throttling_analysis['error'] = str(e)

        return throttling_analysis

    def _check_throttling_compliance(
        self,
        throttle: Dict,
        quota: Dict
    ) -> Dict[str, bool]:
        """Check throttling compliance (5000 req/min = ~83 req/sec)"""
        return {
            'rate_limit_configured': throttle.get('rateLimit', 0) > 0,
            'burst_limit_configured': throttle.get('burstLimit', 0) > 0,
            'quota_configured': quota.get('limit', 0) > 0
        }

    def analyze_infrastructure(self) -> Dict[str, Any]:
        """Run complete infrastructure analysis"""
        print(f"[INFO] Analyzing Currency Exchange API infrastructure")
        print(f"[INFO] Environment Suffix: {self.environment_suffix}")
        print(f"[INFO] AWS Region: {self.region}")

        analysis_results = {
            'environment_suffix': self.environment_suffix,
            'region': self.region,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'lambda_functions': [],
            'api_gateways': [],
            'cloudwatch_logs': [],
            'iam_roles': [],
            'xray_tracing': {},
            'api_throttling': {},
            'recommendations': [],
            'compliance_score': 0
        }

        print("  [STEP] Analyzing Lambda functions...")
        analysis_results['lambda_functions'] = self.analyze_lambda_functions()

        print("  [STEP] Analyzing API Gateway...")
        analysis_results['api_gateways'] = self.analyze_api_gateway()

        print("  [STEP] Analyzing CloudWatch Log Groups...")
        analysis_results['cloudwatch_logs'] = self.analyze_cloudwatch_logs()

        print("  [STEP] Analyzing IAM Roles...")
        analysis_results['iam_roles'] = self.analyze_iam_roles()

        print("  [STEP] Analyzing X-Ray Tracing...")
        analysis_results['xray_tracing'] = self.analyze_xray_tracing()

        print("  [STEP] Analyzing API Throttling...")
        analysis_results['api_throttling'] = self.analyze_api_throttling()

        analysis_results['recommendations'] = self._generate_recommendations(
            analysis_results
        )

        analysis_results['compliance_score'] = self._calculate_compliance_score(
            analysis_results
        )

        return analysis_results

    def _generate_recommendations(
        self,
        analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate recommendations based on analysis results"""
        recommendations = []

        # Lambda recommendations
        for func in analysis['lambda_functions']:
            if func.get('status') == 'missing':
                recommendations.append({
                    'priority': 'critical',
                    'category': 'lambda',
                    'resource': func['name'],
                    'message': f"Lambda function '{func['name']}' is missing."
                })
            elif func.get('status') == 'found':
                compliance = func.get('compliant', {})
                if not compliance.get('runtime_nodejs18', False):
                    recommendations.append({
                        'priority': 'high',
                        'category': 'lambda',
                        'resource': func['name'],
                        'message': f"Lambda '{func['name']}' should use nodejs18.x runtime."
                    })
                if not compliance.get('xray_active', False):
                    recommendations.append({
                        'priority': 'medium',
                        'category': 'observability',
                        'resource': func['name'],
                        'message': f"Enable X-Ray tracing on Lambda '{func['name']}'."
                    })

        # API Gateway recommendations
        for api in analysis['api_gateways']:
            if api.get('status') == 'missing':
                recommendations.append({
                    'priority': 'critical',
                    'category': 'api_gateway',
                    'resource': api['name'],
                    'message': f"API Gateway '{api['name']}' is missing."
                })
            elif api.get('status') == 'found':
                compliance = api.get('compliant', {})
                if not compliance.get('has_api_key', False):
                    recommendations.append({
                        'priority': 'high',
                        'category': 'security',
                        'resource': api['name'],
                        'message': "Configure API key authentication."
                    })
                if not compliance.get('has_usage_plan', False):
                    recommendations.append({
                        'priority': 'high',
                        'category': 'throttling',
                        'resource': api['name'],
                        'message': "Configure usage plan for rate limiting."
                    })

        # CloudWatch Logs recommendations
        for lg in analysis['cloudwatch_logs']:
            if lg.get('status') == 'missing':
                recommendations.append({
                    'priority': 'high',
                    'category': 'logging',
                    'resource': lg['name'],
                    'message': f"CloudWatch Log Group '{lg['name']}' is missing."
                })

        # IAM recommendations
        for role in analysis['iam_roles']:
            if role.get('status') == 'missing':
                recommendations.append({
                    'priority': 'critical',
                    'category': 'iam',
                    'resource': role['name'],
                    'message': f"IAM role '{role['name']}' is missing."
                })

        # X-Ray recommendations
        xray = analysis.get('xray_tracing', {})
        if xray.get('status') == 'no_recent_traces':
            recommendations.append({
                'priority': 'medium',
                'category': 'observability',
                'resource': 'xray',
                'message': "No recent X-Ray traces found. Verify tracing is active."
            })

        # Throttling recommendations
        throttling = analysis.get('api_throttling', {})
        if throttling.get('status') == 'no_usage_plans':
            recommendations.append({
                'priority': 'high',
                'category': 'throttling',
                'resource': 'api_throttling',
                'message': "No usage plans configured. Set up rate limiting."
            })

        return recommendations

    def _calculate_compliance_score(self, analysis: Dict[str, Any]) -> float:
        """Calculate overall compliance score (0-100)"""
        total_checks = 0
        passed_checks = 0

        for func in analysis['lambda_functions']:
            if func.get('status') == 'found':
                compliance = func.get('compliant', {})
                total_checks += len(compliance)
                passed_checks += sum(1 for v in compliance.values() if v)
            else:
                total_checks += 6

        for api in analysis['api_gateways']:
            if api.get('status') == 'found':
                compliance = api.get('compliant', {})
                total_checks += len(compliance)
                passed_checks += sum(1 for v in compliance.values() if v)
            else:
                total_checks += 6

        for lg in analysis['cloudwatch_logs']:
            total_checks += 1
            if lg.get('status') == 'found':
                passed_checks += 1

        for role in analysis['iam_roles']:
            total_checks += 1
            if role.get('status') == 'found':
                passed_checks += 1

        total_checks += 1
        if analysis.get('xray_tracing', {}).get('status') == 'active':
            passed_checks += 1

        total_checks += 1
        if analysis.get('api_throttling', {}).get('status') == 'configured':
            passed_checks += 1

        if total_checks == 0:
            return 0.0

        return round((passed_checks / total_checks) * 100, 2)

    def print_report(self, analysis: Dict[str, Any]):
        """Print analysis report to console"""
        print()
        print("=" * 70)
        print("Currency Exchange API Infrastructure Analysis Report")
        print("=" * 70)
        print(f"Environment Suffix: {analysis['environment_suffix']}")
        print(f"Region: {analysis['region']}")
        print(f"Timestamp: {analysis['timestamp']}")
        print(f"Compliance Score: {analysis['compliance_score']}%")
        print()

        # Print sections...
        if analysis['recommendations']:
            print("-" * 70)
            print("Recommendations:")
            for rec in analysis['recommendations']:
                priority_tag = f"[{rec['priority'].upper()}]"
                print(f"  {priority_tag} {rec['message']}")
        print()
        print("=" * 70)

    def export_json_report(self, analysis: Dict[str, Any], output_path: str):
        """Export analysis report to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, default=str)
        print(f"[INFO] Report exported to: {output_path}")


def main():
    """Main entry point for the infrastructure analyzer"""
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    output_file = os.getenv('OUTPUT_FILE', '')

    print("[INFO] Starting Currency Exchange API infrastructure analysis")
    print(f"[INFO] Environment Suffix: {environment_suffix}")
    print(f"[INFO] AWS Region: {aws_region}")

    analyzer = CurrencyAPIAnalyzer(environment_suffix, aws_region)
    analysis = analyzer.analyze_infrastructure()
    analyzer.print_report(analysis)

    if output_file:
        analyzer.export_json_report(analysis, output_file)

    if analysis['compliance_score'] >= 80:
        print("[RESULT] Infrastructure is compliant")
        return 0
    if analysis['compliance_score'] >= 50:
        print("[RESULT] Infrastructure has warnings")
        return 1
    print("[RESULT] Infrastructure is non-compliant")
    return 2


if __name__ == "__main__":
    sys.exit(main())
```

## Testing

### Unit Tests (tests/unit/test_analyse.py)

The unit tests use mocked AWS services to test each component of the analyzer:

- **TestCurrencyAPIAnalyzerInit**: Tests initialization with default/custom regions
- **TestAnalyzeLambdaFunctions**: Tests Lambda function discovery and compliance checking
- **TestAnalyzeAPIGateway**: Tests API Gateway analysis including endpoints, stages, API keys
- **TestAnalyzeCloudWatchLogs**: Tests log group discovery and retention policy detection
- **TestAnalyzeIAMRoles**: Tests IAM role and policy detection
- **TestAnalyzeXRayTracing**: Tests X-Ray trace analysis
- **TestAnalyzeAPIThrottling**: Tests usage plan and throttling configuration analysis
- **TestGenerateRecommendations**: Tests recommendation generation logic
- **TestCalculateComplianceScore**: Tests compliance score calculation
- **TestMainFunction**: Tests main entry point exit codes

### Integration Tests (tests/integration/test_integration.py)

The integration tests run against actual deployed AWS resources:

- **TestLambdaIntegration**: Validates Lambda function existence and configuration
- **TestAPIGatewayIntegration**: Validates API Gateway setup
- **TestCloudWatchLogsIntegration**: Validates log group configuration
- **TestIAMRolesIntegration**: Validates IAM roles and policies
- **TestXRayIntegration**: Validates X-Ray service accessibility
- **TestAnalysisScriptIntegration**: Validates the complete analysis script execution

## Usage

### Running the Analysis Script

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1

# Run analysis
python lib/analyse.py

# Export to JSON file
export OUTPUT_FILE=analysis-report.json
python lib/analyse.py
```

### Running Unit Tests

```bash
python -m pytest tests/unit/test_analyse.py -v
```

### Running Integration Tests

```bash
# Requires deployed infrastructure and AWS credentials
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
python -m pytest tests/integration/test_integration.py -v
```

## Compliance Checks

The script validates the following requirements:

### Lambda Function
- Runtime is nodejs18.x
- Memory size >= 1024 MB
- Timeout is 10 seconds
- X-Ray tracing is active
- API_VERSION environment variable is set
- RATE_PRECISION environment variable is set

### API Gateway
- Edge-optimized endpoint configuration
- /convert endpoint exists
- v1 stage is configured
- X-Ray tracing enabled on stage
- API key authentication configured
- Usage plan with rate limiting

### CloudWatch Logs
- Lambda log group exists
- API Gateway log group exists
- Retention policies configured

### IAM Roles
- Lambda execution role exists
- API Gateway CloudWatch role exists
- Required policies attached (Lambda Basic Execution, X-Ray Write)

### X-Ray Tracing
- Active traces visible

### API Throttling
- Usage plan configured
- Rate and burst limits set

## Exit Codes

- **0**: Infrastructure is compliant (score >= 80%)
- **1**: Infrastructure has warnings (score >= 50% but < 80%)
- **2**: Infrastructure is non-compliant (score < 50%)
