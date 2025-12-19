### Reasoning Trace

---

The user wants a comprehensive Python script using Boto3 to audit API Gateway resources. Let me break down the requirements:

1. **Audit Scope**:
   - Only production and staging stages
   - Exclude APIs with tags `ExcludeFromAudit: true` or `Internal: true`

2. **Security and Performance Checks**:
   - Authorization gaps (CRITICAL)
   - Data integrity risk (HIGH)
   - Throttling vulnerability (HIGH)
   - Perimeter defense - WAF (CRITICAL)
   - CORS misconfiguration (HIGH)
   - Backend timeout risk (MEDIUM)
   - Performance blind spots - caching
   - Tracing deficit - X-Ray
   - Cost optimization (LOW) - REST APIs that could be HTTP APIs
   - Unused APIs (FINOPS)

3. **Output Requirements**:
   - Console report using tabulate
   - api_gateway_audit.json with grouped findings
   - api_gateway_resources.json with complete inventory

I need to:

- Use boto3 to interact with API Gateway, WAF, CloudWatch
- Handle errors gracefully (especially for WAF and CloudWatch)
- Check tags to exclude certain APIs
- Analyze each API, stage, resource, and method
- Generate three different outputs

Let me create a comprehensive script.

### Answer

---

I'll create a comprehensive Python script for auditing API Gateway resources with security and performance checks. Here's the complete solution:

```python
#!/usr/bin/env python3
"""
AWS API Gateway Security and Performance Audit Script
Performs comprehensive security and performance analysis of API Gateway resources
"""

import json
import boto3
import logging
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Tuple, Optional, Any
from tabulate import tabulate

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class APIGatewayAuditor:
    """Main class for auditing API Gateway resources"""

    SEVERITY_LEVELS = {
        'CRITICAL': 1,
        'HIGH': 2,
        'MEDIUM': 3,
        'LOW': 4,
        'FINOPS': 5
    }

    def __init__(self, region_name: str):
        self.region_name = region_name
        self.session = boto3.Session(region_name=region_name)
        self.apigateway = self.session.client('apigateway')
        self.apigatewayv2 = self.session.client('apigatewayv2')
        self.wafv2 = self.session.client('wafv2')
        self.cloudwatch = self.session.client('cloudwatch')
        self.findings = []
        self.resource_inventory = []

    def should_audit_api(self, api_id: str, api_type: str = 'REST') -> bool:
        """Check if API should be audited based on tags"""
        try:
            if api_type == 'REST':
                response = self.apigateway.get_tags(resourceArn=f"arn:aws:apigateway:{self.region_name}::/restapis/{api_id}")
            else:
                response = self.apigatewayv2.get_tags(ResourceArn=f"arn:aws:apigateway:{self.region_name}::/apis/{api_id}")

            tags = response.get('tags', {})
            exclude_audit = tags.get('ExcludeFromAudit', '').lower() == 'true'
            internal = tags.get('Internal', '').lower() == 'true'

            return not (exclude_audit or internal)
        except Exception as e:
            logger.warning(f"Could not get tags for API {api_id}: {str(e)}")
            return True  # Include if tags cannot be retrieved

    def get_rest_apis(self) -> List[Dict]:
        """Get all REST APIs"""
        apis = []
        try:
            paginator = self.apigateway.get_paginator('get_rest_apis')
            for page in paginator.paginate():
                apis.extend(page.get('items', []))
        except Exception as e:
            logger.error(f"Error getting REST APIs: {str(e)}")
        return apis

    def get_http_apis(self) -> List[Dict]:
        """Get all HTTP APIs"""
        apis = []
        try:
            paginator = self.apigatewayv2.get_paginator('get_apis')
            for page in paginator.paginate():
                for api in page.get('Items', []):
                    if api.get('ProtocolType') == 'HTTP':
                        apis.append(api)
        except Exception as e:
            logger.error(f"Error getting HTTP APIs: {str(e)}")
        return apis

    def get_api_stages(self, api_id: str, api_type: str = 'REST') -> List[Dict]:
        """Get production and staging stages for an API"""
        stages = []
        try:
            if api_type == 'REST':
                response = self.apigateway.get_stages(restApiId=api_id)
                all_stages = response.get('item', [])
            else:
                paginator = self.apigatewayv2.get_paginator('get_stages')
                all_stages = []
                for page in paginator.paginate(ApiId=api_id):
                    all_stages.extend(page.get('Items', []))

            # Filter for production and staging stages
            for stage in all_stages:
                stage_name = stage.get('stageName' if api_type == 'REST' else 'StageName', '').lower()
                if any(keyword in stage_name for keyword in ['prod', 'production', 'stag', 'staging']):
                    stages.append(stage)
        except Exception as e:
            logger.error(f"Error getting stages for API {api_id}: {str(e)}")
        return stages

    def get_api_resources(self, api_id: str) -> List[Dict]:
        """Get all resources for a REST API"""
        resources = []
        try:
            paginator = self.apigateway.get_paginator('get_resources')
            for page in paginator.paginate(restApiId=api_id):
                resources.extend(page.get('items', []))
        except Exception as e:
            logger.error(f"Error getting resources for API {api_id}: {str(e)}")
        return resources

    def get_http_api_routes(self, api_id: str) -> List[Dict]:
        """Get all routes for an HTTP API"""
        routes = []
        try:
            paginator = self.apigatewayv2.get_paginator('get_routes')
            for page in paginator.paginate(ApiId=api_id):
                routes.extend(page.get('Items', []))
        except Exception as e:
            logger.error(f"Error getting routes for HTTP API {api_id}: {str(e)}")
        return routes

    def check_waf_protection(self, api_id: str, stage_name: str) -> Tuple[bool, str]:
        """Check if API stage has WAF protection"""
        try:
            # Check for WAFv2 Web ACLs
            response = self.wafv2.list_web_acls(Scope='REGIONAL')

            for web_acl in response.get('WebACLs', []):
                # Get Web ACL details to check associated resources
                acl_details = self.wafv2.get_web_acl(
                    Name=web_acl['Name'],
                    Scope='REGIONAL',
                    Id=web_acl['Id']
                )

                # Check if this API stage is associated
                resource_arn = f"arn:aws:apigateway:{self.region_name}::/restapis/{api_id}/stages/{stage_name}"
                associated_resources = self.wafv2.list_resources_for_web_acl(
                    WebACLArn=acl_details['WebACL']['ARN']
                ).get('ResourceArns', [])

                if resource_arn in associated_resources:
                    return True, web_acl['Name']

            return False, 'None'
        except Exception as e:
            logger.warning(f"Could not check WAF protection: {str(e)}")
            return None, 'Check Failed'

    def get_usage_plans(self, api_id: str) -> List[Dict]:
        """Get usage plans for an API"""
        usage_plans = []
        try:
            paginator = self.apigateway.get_paginator('get_usage_plans')
            for page in paginator.paginate():
                for plan in page.get('items', []):
                    # Check if this plan includes the API
                    for api_stage in plan.get('apiStages', []):
                        if api_stage.get('apiId') == api_id:
                            usage_plans.append(plan)
                            break
        except Exception as e:
            logger.error(f"Error getting usage plans: {str(e)}")
        return usage_plans

    def check_request_validator(self, api_id: str, resource_id: str, method: str) -> str:
        """Check request validation status for a method"""
        try:
            method_info = self.apigateway.get_method(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=method
            )
            validator_id = method_info.get('requestValidatorId')

            if not validator_id:
                return 'NONE'

            # Get validator details
            validator = self.apigateway.get_request_validator(
                restApiId=api_id,
                requestValidatorId=validator_id
            )

            validate_body = validator.get('validateRequestBody', False)
            validate_params = validator.get('validateRequestParameters', False)

            if validate_body and validate_params:
                return 'FULL'
            elif validate_body:
                return 'BODY'
            elif validate_params:
                return 'PARAMETERS'
            else:
                return 'NONE'
        except Exception as e:
            logger.warning(f"Could not check request validator: {str(e)}")
            return 'UNKNOWN'

    def check_lambda_timeout(self, api_id: str, resource_id: str, method: str) -> Optional[int]:
        """Check Lambda integration timeout"""
        try:
            integration = self.apigateway.get_integration(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=method
            )

            if integration.get('type') in ['AWS', 'AWS_PROXY']:
                timeout = integration.get('timeoutInMillis', 29000)
                return timeout // 1000  # Convert to seconds
        except Exception as e:
            logger.warning(f"Could not check Lambda timeout: {str(e)}")
        return None

    def check_cors_configuration(self, api_id: str, resource_id: str, stage_name: str) -> Dict[str, Any]:
        """Check CORS configuration"""
        cors_config = {'enabled': False, 'allow_origin': None}
        try:
            # Check if OPTIONS method exists
            try:
                options_method = self.apigateway.get_method(
                    restApiId=api_id,
                    resourceId=resource_id,
                    httpMethod='OPTIONS'
                )

                if options_method:
                    # Get integration response
                    integration_response = self.apigateway.get_integration_response(
                        restApiId=api_id,
                        resourceId=resource_id,
                        httpMethod='OPTIONS',
                        statusCode='200'
                    )

                    response_params = integration_response.get('responseParameters', {})
                    allow_origin = response_params.get('method.response.header.Access-Control-Allow-Origin', '')

                    cors_config['enabled'] = True
                    cors_config['allow_origin'] = allow_origin.strip("'\"")
            except:
                pass

        except Exception as e:
            logger.warning(f"Could not check CORS configuration: {str(e)}")
        return cors_config

    def check_caching(self, api_id: str, resource_id: str, method: str, stage_name: str) -> bool:
        """Check if caching is enabled for a method"""
        try:
            # Get stage settings
            stage_info = self.apigateway.get_stage(
                restApiId=api_id,
                stageName=stage_name
            )

            # Check if caching is enabled at stage level
            if not stage_info.get('cacheClusterEnabled', False):
                return False

            # Check method settings
            method_settings = stage_info.get('methodSettings', {})
            method_key = f"{resource_id}/{method}"

            if method_key in method_settings:
                return method_settings[method_key].get('cachingEnabled', False)

            # Check wildcard settings
            wildcard_key = "*/*"
            if wildcard_key in method_settings:
                return method_settings[wildcard_key].get('cachingEnabled', False)

        except Exception as e:
            logger.warning(f"Could not check caching status: {str(e)}")
        return False

    def check_xray_tracing(self, api_id: str, stage_name: str) -> bool:
        """Check if X-Ray tracing is enabled"""
        try:
            stage_info = self.apigateway.get_stage(
                restApiId=api_id,
                stageName=stage_name
            )
            return stage_info.get('tracingEnabled', False)
        except Exception as e:
            logger.warning(f"Could not check X-Ray tracing: {str(e)}")
        return False

    def get_api_metrics(self, api_id: str, stage_name: str) -> Dict[str, float]:
        """Get CloudWatch metrics for API usage"""
        metrics = {'request_count': 0, 'error_rate': 0}
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=30)

            # Get request count
            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ApiGateway',
                MetricName='Count',
                Dimensions=[
                    {'Name': 'ApiName', 'Value': api_id},
                    {'Name': 'Stage', 'Value': stage_name}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=86400,  # Daily
                Statistics=['Sum']
            )

            total_requests = sum(dp['Sum'] for dp in response.get('Datapoints', []))
            metrics['request_count'] = total_requests

            # Get error rate
            error_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ApiGateway',
                MetricName='4XXError',
                Dimensions=[
                    {'Name': 'ApiName', 'Value': api_id},
                    {'Name': 'Stage', 'Value': stage_name}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=86400,
                Statistics=['Sum']
            )

            total_errors = sum(dp['Sum'] for dp in error_response.get('Datapoints', []))
            if total_requests > 0:
                metrics['error_rate'] = (total_errors / total_requests) * 100

        except Exception as e:
            logger.warning(f"Could not get API metrics: {str(e)}")
        return metrics

    def estimate_cost_savings(self, api_type: str, request_count: float) -> Dict[str, float]:
        """Estimate potential cost savings for migration"""
        # Simplified cost calculation (actual costs may vary by region and usage)
        rest_api_cost_per_million = 3.50  # USD per million requests
        http_api_cost_per_million = 1.00  # USD per million requests

        current_cost = (request_count / 1_000_000) * rest_api_cost_per_million
        potential_cost = (request_count / 1_000_000) * http_api_cost_per_million
        savings = current_cost - potential_cost

        return {
            'current_monthly_cost': round(current_cost, 2),
            'potential_monthly_cost': round(potential_cost, 2),
            'potential_savings': round(savings, 2),
            'savings_percentage': round((savings / current_cost * 100) if current_cost > 0 else 0, 2)
        }

    def add_finding(self, api_name: str, api_id: str, stage_name: str, resource_path: str,
                   http_method: str, issue_type: str, severity: str, details: Dict[str, Any] = None):
        """Add a finding to the results"""
        finding = {
            'api_name': api_name,
            'api_id': api_id,
            'stage': stage_name,
            'resource_path': resource_path,
            'http_method': http_method,
            'issue_type': issue_type,
            'severity': severity,
            'details': details or {}
        }
        self.findings.append(finding)

    def audit_rest_api_method(self, api: Dict, stage: Dict, resource: Dict, method: str):
        """Audit a specific REST API method"""
        api_id = api['id']
        api_name = api['name']
        stage_name = stage['stageName']
        resource_path = resource['path']
        resource_id = resource['id']

        # Get method details
        try:
            method_info = self.apigateway.get_method(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=method
            )
        except:
            return

        # Initialize resource inventory entry
        resource_entry = {
            'api_id': api_id,
            'api_name': api_name,
            'api_type': 'REST',
            'stage': stage_name,
            'resource_path': resource_path,
            'http_method': method,
            'issues': [],
            'severity': None
        }

        # 1. Check Authorization
        auth_type = method_info.get('authorizationType', 'NONE')
        resource_entry['authorization_type'] = auth_type

        if auth_type == 'NONE':
            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'Authorization Gap', 'CRITICAL',
                           {'authorization_type': auth_type})
            resource_entry['issues'].append('No Authorization')

        # 2. Check Request Validation
        validation_status = self.check_request_validator(api_id, resource_id, method)
        resource_entry['request_validator'] = validation_status

        if validation_status == 'NONE':
            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'Data Integrity Risk', 'HIGH',
                           {'validation_status': validation_status})
            resource_entry['issues'].append('No Request Validation')

        # 3. Check Throttling (Usage Plans)
        usage_plans = self.get_usage_plans(api_id)
        has_throttling = any(plan.get('throttle') for plan in usage_plans if stage_name in [s.get('stageName') for s in plan.get('apiStages', [])])
        resource_entry['throttling_status'] = 'Enabled' if has_throttling else 'Disabled'

        if not has_throttling:
            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'Throttling Vulnerability', 'HIGH',
                           {'has_throttling': False})
            resource_entry['issues'].append('No Throttling')

        # 4. Check WAF Protection
        waf_enabled, waf_name = self.check_waf_protection(api_id, stage_name)
        resource_entry['waf_status'] = f"Enabled ({waf_name})" if waf_enabled else "Disabled" if waf_enabled is False else "Unknown"

        if waf_enabled is False:
            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'Perimeter Defense Missing', 'CRITICAL',
                           {'waf_enabled': False})
            resource_entry['issues'].append('No WAF Protection')

        # 5. Check CORS Configuration
        cors_config = self.check_cors_configuration(api_id, resource_id, stage_name)
        resource_entry['cors_config'] = cors_config

        if cors_config.get('allow_origin') == '*' and 'prod' in stage_name.lower():
            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'CORS Misconfiguration', 'HIGH',
                           {'cors_config': cors_config})
            resource_entry['issues'].append('CORS Allow All Origins')

        # 6. Check Lambda Timeout
        lambda_timeout = self.check_lambda_timeout(api_id, resource_id, method)
        if lambda_timeout and lambda_timeout > 29:
            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'Backend Timeout Risk', 'MEDIUM',
                           {'timeout_seconds': lambda_timeout})
            resource_entry['issues'].append('High Lambda Timeout')

        # 7. Check Caching for GET methods
        caching_enabled = self.check_caching(api_id, resource_id, method, stage_name)
        resource_entry['caching_status'] = 'Enabled' if caching_enabled else 'Disabled'

        if method == 'GET' and not caching_enabled:
            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'Performance Blind Spot', 'LOW',
                           {'caching_enabled': False})
            resource_entry['issues'].append('No Caching for GET')

        # 8. Check X-Ray Tracing
        xray_enabled = self.check_xray_tracing(api_id, stage_name)
        resource_entry['xray_tracing'] = 'Enabled' if xray_enabled else 'Disabled'

        if not xray_enabled:
            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'Tracing Deficit', 'MEDIUM',
                           {'xray_enabled': False})
            resource_entry['issues'].append('No X-Ray Tracing')

        # 9. Check for simple proxy integrations (cost optimization)
        integration = method_info.get('methodIntegration', {})
        if integration.get('type') == 'HTTP_PROXY':
            metrics = self.get_api_metrics(api_name, stage_name)
            cost_savings = self.estimate_cost_savings('REST', metrics['request_count'])

            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'Cost Optimization Opportunity', 'LOW',
                           {'integration_type': 'HTTP_PROXY',
                            'recommendation': 'Migrate to HTTP API',
                            'cost_savings': cost_savings})
            resource_entry['issues'].append('Consider HTTP API Migration')

        # Get CloudWatch metrics
        metrics = self.get_api_metrics(api_name, stage_name)
        resource_entry['cloudwatch_metrics'] = metrics

        # 10. Check for unused APIs
        if metrics['request_count'] < 100:  # Less than 100 requests in 30 days
            self.add_finding(api_name, api_id, stage_name, resource_path, method,
                           'Unused API', 'FINOPS',
                           {'request_count_30d': metrics['request_count']})
            resource_entry['issues'].append('Low Usage')

        # Determine overall severity
        if resource_entry['issues']:
            severities = []
            for finding in self.findings:
                if (finding['api_id'] == api_id and
                    finding['stage'] == stage_name and
                    finding['resource_path'] == resource_path and
                    finding['http_method'] == method):
                    severities.append(self.SEVERITY_LEVELS.get(finding['severity'], 999))
            resource_entry['severity'] = min(severities) if severities else None

        self.resource_inventory.append(resource_entry)

    def audit_rest_api(self, api: Dict):
        """Audit a REST API"""
        api_id = api['id']
        api_name = api['name']

        logger.info(f"Auditing REST API: {api_name} ({api_id})")

        # Get stages
        stages = self.get_api_stages(api_id, 'REST')
        if not stages:
            logger.warning(f"No production/staging stages found for API: {api_name}")
            return

        # Get resources
        resources = self.get_api_resources(api_id)

        # Audit each stage
        for stage in stages:
            stage_name = stage['stageName']
            logger.info(f"  Auditing stage: {stage_name}")

            # Audit each resource and method
            for resource in resources:
                methods = resource.get('resourceMethods', {})
                for method in methods:
                    if method != 'OPTIONS':  # Skip OPTIONS methods
                        self.audit_rest_api_method(api, stage, resource, method)

    def run_audit(self):
        """Run the complete audit"""
        logger.info(f"Starting API Gateway audit for region: {self.region_name}")

        # Audit REST APIs
        rest_apis = self.get_rest_apis()
        for api in rest_apis:
            if self.should_audit_api(api['id'], 'REST'):
                self.audit_rest_api(api)
            else:
                logger.info(f"Skipping REST API {api['name']} due to tags")

        # Note: HTTP API auditing can be added similarly
        # Currently focusing on REST APIs as they have more security features

        logger.info("Audit completed")

    def generate_console_report(self):
        """Generate console report using tabulate"""
        if not self.findings:
            print("\nNo security or performance issues found!")
            return

        # Prepare data for tabulate
        table_data = []
        for finding in sorted(self.findings, key=lambda x: (self.SEVERITY_LEVELS.get(x['severity'], 999), x['api_name'])):
            table_data.append([
                finding['api_name'][:30],  # Truncate long names
                finding['stage'],
                finding['resource_path'][:40],  # Truncate long paths
                finding['http_method'],
                finding['issue_type'],
                finding['severity']
            ])

        headers = ['API Name', 'Stage', 'Resource Path', 'Method', 'Issue Type', 'Severity']

        print("\n" + "="*100)
        print("API GATEWAY SECURITY AND PERFORMANCE AUDIT REPORT")
        print("="*100)
        print(f"Region: {self.region_name}")
        print(f"Timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"Total Issues Found: {len(self.findings)}")
        print("\n")

        # Summary by severity
        severity_counts = defaultdict(int)
        for finding in self.findings:
            severity_counts[finding['severity']] += 1

        print("Summary by Severity:")
        for severity in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'FINOPS']:
            if severity in severity_counts:
                print(f"  {severity}: {severity_counts[severity]}")
        print("\n")

        # Detailed findings table
        print("Detailed Findings:")
        print(tabulate(table_data, headers=headers, tablefmt='grid'))

    def generate_audit_json(self):
        """Generate grouped audit findings JSON"""
        grouped_findings = defaultdict(lambda: defaultdict(list))

        for finding in self.findings:
            key = f"{finding['api_name']}_{finding['stage']}"
            grouped_findings[key]['api_name'] = finding['api_name']
            grouped_findings[key]['api_id'] = finding['api_id']
            grouped_findings[key]['stage'] = finding['stage']
            grouped_findings[key]['findings'].append({
                'resource_path': finding['resource_path'],
                'http_method': finding['http_method'],
                'issue_type': finding['issue_type'],
                'severity': finding['severity'],
                'details': finding['details'],
                'remediation': self.get_remediation_steps(finding['issue_type']),
                'security_impact': self.get_security_impact(finding['issue_type'])
            })

        # Calculate cost optimization details
        for key, data in grouped_findings.items():
            cost_findings = [f for f in data['findings'] if f['issue_type'] == 'Cost Optimization Opportunity']
            if cost_findings:
                total_savings = sum(f['details'].get('cost_savings', {}).get('potential_savings', 0) for f in cost_findings)
                data['cost_optimization'] = {
                    'total_potential_savings': round(total_savings, 2),
                    'recommendations': ['Consider migrating simple proxy integrations to HTTP API']
                }

        # Convert to list format
        output = list(grouped_findings.values())

        with open('api_gateway_audit.json', 'w') as f:
            json.dump(output, f, indent=2, default=str)

        logger.info("Generated api_gateway_audit.json")

    def generate_resources_json(self):
        """Generate complete resource inventory JSON"""
        # Sort by severity
        for resource in self.resource_inventory:
            if resource['severity']:
                resource['severity_rank'] = self.SEVERITY_LEVELS.get(
                    next(f['severity'] for f in self.findings
                         if f['api_id'] == resource['api_id'] and
                         f['resource_path'] == resource['resource_path'] and
                         f['http_method'] == resource['http_method']), 999)

        sorted_inventory = sorted(
            self.resource_inventory,
            key=lambda x: (x.get('severity_rank', 999), x['api_name'])
        )

        # Remove temporary severity_rank field
        for resource in sorted_inventory:
            resource.pop('severity_rank', None)

        with open('api_gateway_resources.json', 'w') as f:
            json.dump(sorted_inventory, f, indent=2, default=str)

        logger.info("Generated api_gateway_resources.json")

    def get_remediation_steps(self, issue_type: str) -> List[str]:
        """Get remediation steps for each issue type"""
        remediation_map = {
            'Authorization Gap': [
                'Implement API Key, IAM, Cognito, or Lambda authorizer',
                'Review and define authentication requirements',
                'Apply least privilege principle'
            ],
            'Data Integrity Risk': [
                'Enable request validation for body and parameters',
                'Define request models using JSON Schema',
                'Implement input sanitization'
            ],
            'Throttling Vulnerability': [
                'Create and attach usage plans with rate limits',
                'Configure burst and rate limits appropriately',
                'Monitor API usage patterns'
            ],
            'Perimeter Defense Missing': [
                'Attach AWS WAF Web ACL to API stage',
                'Configure WAF rules for common attacks',
                'Enable rate-based rules'
            ],
            'CORS Misconfiguration': [
                'Replace wildcard (*) with specific allowed origins',
                'Implement proper CORS headers',
                'Review cross-origin requirements'
            ],
            'Backend Timeout Risk': [
                'Reduce Lambda function timeout to under 29 seconds',
                'Optimize Lambda function performance',
                'Consider asynchronous processing for long operations'
            ],
            'Performance Blind Spot': [
                'Enable caching for GET methods',
                'Configure appropriate cache TTL',
                'Implement cache invalidation strategy'
            ],
            'Tracing Deficit': [
                'Enable AWS X-Ray tracing on API stage',
                'Instrument Lambda functions with X-Ray',
                'Set up performance monitoring dashboards'
            ],
            'Cost Optimization Opportunity': [
                'Evaluate migration to HTTP API for simple proxies',
                'Compare feature requirements',
                'Plan migration strategy'
            ],
            'Unused API': [
                'Review API usage and business requirements',
                'Consider decommissioning unused APIs',
                'Archive or document if needed for compliance'
            ]
        }
        return remediation_map.get(issue_type, ['Review and address the identified issue'])

    def get_security_impact(self, issue_type: str) -> str:
        """Get security impact description for each issue type"""
        impact_map = {
            'Authorization Gap': 'Unauthorized access to API resources, data breach risk',
            'Data Integrity Risk': 'Invalid data processing, potential injection attacks',
            'Throttling Vulnerability': 'DDoS vulnerability, resource exhaustion',
            'Perimeter Defense Missing': 'Exposure to common web attacks, no rate limiting',
            'CORS Misconfiguration': 'Cross-site scripting, data exposure to unauthorized origins',
            'Backend Timeout Risk': 'Service disruption, poor user experience',
            'Performance Blind Spot': 'Increased latency, higher costs',
            'Tracing Deficit': 'Limited visibility into performance issues and errors',
            'Cost Optimization Opportunity': 'Unnecessary AWS costs',
            'Unused API': 'Attack surface exposure, maintenance overhead'
        }
        return impact_map.get(issue_type, 'Potential security or operational impact')

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='AWS API Gateway Security and Performance Audit')
    parser.add_argument('--region', '-r', default='us-east-1',
                       help='AWS region to audit (default: us-east-1)')
    args = parser.parse_args()

    try:
        auditor = APIGatewayAuditor(args.region)
        auditor.run_audit()
        auditor.generate_console_report()
        auditor.generate_audit_json()
        auditor.generate_resources_json()

        print(f"\nAudit complete! Check api_gateway_audit.json and api_gateway_resources.json for detailed results.")

    except Exception as e:
        logger.error(f"Audit failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()
```

## Installation Requirements

Create a `requirements.txt` file:

```txt
boto3>=1.26.0
tabulate>=0.9.0
```

## Usage Instructions

1. **Install dependencies:**

```bash
pip install -r requirements.txt
```

2. **Configure AWS credentials** (if not already done):

```bash
aws configure
```

3. **Run the audit:**

```bash
python api_gateway_audit.py --region us-east-1
```

## Key Features

### Security Checks

- **Authorization Gaps**: Identifies methods without authentication
- **Data Integrity**: Checks for request validation
- **WAF Protection**: Verifies Web Application Firewall attachment
- **CORS Security**: Detects overly permissive CORS configurations
- **Throttling**: Ensures rate limiting is configured

### Performance Checks

- **Caching**: Identifies GET methods without caching
- **X-Ray Tracing**: Checks distributed tracing configuration
- **Lambda Timeouts**: Flags high timeout values
- **Usage Analysis**: Identifies low-traffic APIs

### Cost Optimization

- Identifies REST APIs with simple proxy integrations that could migrate to cheaper HTTP APIs
- Calculates potential cost savings
- Provides migration recommendations

### Output Files

1. **Console Report**: Clean tabulated view of all findings
2. **api_gateway_audit.json**: Grouped findings with remediation steps
3. **api_gateway_resources.json**: Complete inventory of all resources

### Error Handling

- Gracefully handles missing WAF or CloudWatch data
- Continues audit even if individual checks fail
- Logs warnings for non-critical failures

This script provides a comprehensive security and performance audit framework that can be extended based on your specific requirements.
