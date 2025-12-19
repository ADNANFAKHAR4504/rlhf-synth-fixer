"""This module defines a Lambda function that indexes documents into OpenSearch.

Raises:
    Exception: If the OpenSearch request fails or if any other error occurs.
    e: The exception raised during the execution of the Lambda function.

Returns:
    dict: A dictionary containing the status code, response body, headers, and document ID.
"""

import json
import os
import traceback

import boto3
import requests
from requests_aws4auth import AWS4Auth


def handler(event, context):
    """Lambda function handler to index documents into OpenSearch."""
    try:
        # Log the execution context for debugging
        print(f"Lambda execution role: {context.invoked_function_arn}")
        print(f"AWS region: {os.environ.get('AWS_REGION', 'Unknown')}")

        # Get endpoint and index from environment variables
        endpoint = os.environ["OPENSEARCH_ENDPOINT"]
        index = os.environ["OPENSEARCH_INDEX"]

        # Use the entire event as the document body
        body = event["document"]

        print(f"OpenSearch endpoint: {endpoint}")
        print(f"Index: {index}")
        print(f"Document body: {json.dumps(body, default=str)}")

        # Create the OpenSearch document URL (POST without doc_id for auto-generation)
        url = f"{endpoint}/{index}/_doc"
        print(f"Full URL: {url}")

        # Get AWS credentials
        session = boto3.Session()
        credentials = session.get_credentials()
        print(f"Using credentials for access key: {credentials.access_key[:8]}...")

        # Create AWS4Auth for request signing
        auth = AWS4Auth(
            credentials.access_key,
            credentials.secret_key,
            os.environ["AWS_REGION"],
            "es",  # OpenSearch Service (not Serverless)
            session_token=credentials.token,
        )

        # Set request headers
        headers = {"Content-Type": "application/json"}

        print(f"Request headers: {headers}")

        # Make the HTTP request with AWS4Auth (POST for auto doc_id generation)
        response = requests.post(url, json=body, auth=auth, headers=headers, timeout=30)

        # Check if the response status is successful
        if response.status_code not in [200, 201]:
            error_msg = f"OpenSearch request failed with status {response.status_code}: {response.text}"
            print(error_msg)
            raise requests.exceptions.HTTPError(error_msg)

        print(f"OpenSearch response: {response.text}")

        # Parse response to get the document ID created by OpenSearch
        response_data = response.json()
        doc_id = response_data.get("_id", "unknown")

        return {
            "statusCode": response.status_code,
            "body": response.text,
            "headers": dict(response.headers),
            "documentId": doc_id,
        }

    except Exception as e:
        print(f"Error: {str(e)}")

        traceback.print_exc()
        raise e
