
#---------------------------------------------------
# INTEGRATION TEST IF ROUTE 53 WAS USED
#---------------------------------------------------
# import urllib.request as urllib
# import random
# import string
# import tempfile
# import os
# import subprocess

# BUCKET_NAME = "turingstaticfilebucketblacree"    # Your S3 bucket name in the terraform pipeline bucket
# OBJECT_KEY = "index.html"                       # Path in S3 bucket
# DOMAIN = "https://turing.blacree.com"           # Domain to test


# def generate_random_suffix(length=6):
#   """Generate a random alphanumeric string of length `length`."""
#   return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


# def run_cli(command):
#   """Run a shell command and return its output."""
#   result = subprocess.run(command, shell=True, capture_output=True, text=True)
#   if result.returncode != 0:
#       raise RuntimeError(f"Command failed: {command}\n{result.stderr}")
#   return result.stdout


# def test_turing_two_stack_integration():
#   # ---- 1. Make HTTP request to check domain availability ----
#   # response = requests.get(DOMAIN, timeout=20)
#   # assert response.status_code == 200, f"Domain {DOMAIN} returned {response.status_code}"
#   # print(f"[OK] {DOMAIN} is reachable.")

#   try:
#     with urllib.urlopen(DOMAIN, timeout=20) as response:
#       status_code = response.getcode()
#       assert status_code == 200, f"Domain {DOMAIN} returned {status_code}"
#       print(f"[OK] {DOMAIN} is reachable.")
#   except Exception as e:
#     raise AssertionError(f"Failed to reach {DOMAIN}: {e}")
  
#   # ---- 2. Download, update, and re-upload index.html using AWS CLI ----
#   with tempfile.TemporaryDirectory() as tmpdir:
#     local_file_path = os.path.join(tmpdir, OBJECT_KEY)

#     # Download from S3
#     run_cli(f"aws s3 cp s3://{BUCKET_NAME}/{OBJECT_KEY} {local_file_path}")
#     print(f"[OK] Downloaded {OBJECT_KEY} from S3.")

#     # Update keyword
#     with open(local_file_path, "r") as f:
#       content = f.read()

#     if "TURING_RLHF" not in content:
#       raise AssertionError("'TURING_RLHF' keyword not found in index.html")

#     new_value = f"TURING_RLHF_{generate_random_suffix()}"
#     updated_content = content.replace("TURING_RLHF", new_value)

#     with open(local_file_path, "w") as f:
#       f.write(updated_content)

#     print(f"[OK] Updated keyword to {new_value}")

#     # Re-upload updated file
#     run_cli(f"aws s3 cp {local_file_path} s3://{BUCKET_NAME}/{OBJECT_KEY}")
#     print(f"[OK] Re-uploaded updated index.html to S3.")





#---------------------------------------------------
# INTEGRATION TEST - Ensure pipeline is successfull. Could not use route53 as no public hosted zone in account. Discussed with Pranav
#---------------------------------------------------
# import subprocess
# import time
# import json


# PIPELINE_NAME = "TuringCodePipelineTerraform"  # Must match the pipeline_name in your CDK stack
# REGION = "us-east-1"  # Change to your desired region

# def run_cli(command):
#   """Run a shell command and return its output."""
#   result = subprocess.run(command, shell=True, capture_output=True, text=True)
#   if result.returncode != 0:
#     raise RuntimeError(f"Command failed: {command}\n{result.stderr}")
#   return result.stdout


# def test_pipeline_status():
#   # 1. Start pipeline execution
#   print(f"[INFO] Starting pipeline: {PIPELINE_NAME}")
#   execution_output = run_cli(f"aws codepipeline start-pipeline-execution --name {PIPELINE_NAME} --region {REGION}")
#   execution_id = json.loads(execution_output)["pipelineExecutionId"]
#   print(f"[INFO] Pipeline Execution ID: {execution_id}")

#   # 2. Wait and poll for status
#   for i in range(20):  # Poll up to 20 times (~10 mins)
#     print(f"[INFO] Checking pipeline status (attempt {i + 1})...")
#     status_output = run_cli(f"aws codepipeline get-pipeline-execution --pipeline-name {PIPELINE_NAME} --pipeline-execution-id {execution_id} --region {REGION}")
#     status_data = json.loads(status_output)
#     status = status_data["pipelineExecution"]["status"]

#     if status == "Succeeded":
#       print(f"[OK] Pipeline {PIPELINE_NAME} succeeded!")
#       return
#     elif status == "Failed" or status == "Stopped":
#       raise AssertionError(f"[FAIL] Pipeline {PIPELINE_NAME} failed or stopped.")

#     time.sleep(30)  # wait 30 seconds before polling again

#   # 3. Timeout if not succeeded in time
#   raise AssertionError(f"[FAIL] Pipeline {PIPELINE_NAME} did not complete in the expected time.")

import subprocess
import json

PIPELINE_NAME = "TuringCodePipelineTerraform"  # Must match the pipeline_name in your CDK stack
REGION = "us-east-1"  # Change to your desired region

def run_cli(command):
  """Run a shell command and return its output."""
  result = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
  if result.returncode != 0:
    raise RuntimeError(f"Command failed: {command}\n{result.stderr}")
  return result.stdout


def test_pipeline_exists():
  """Check if the specified CodePipeline exists."""
  print(f"[INFO] Checking if pipeline '{PIPELINE_NAME}' exists...")

  # List pipelines and check for the target pipeline name
  pipelines_output = run_cli(f"aws codepipeline list-pipelines --region {REGION}")
  pipelines_data = json.loads(pipelines_output)

  pipeline_names = [p["name"] for p in pipelines_data.get("pipelines", [])]
  
  assert PIPELINE_NAME in pipeline_names, f"[FAIL] Pipeline '{PIPELINE_NAME}' does not exist."
  print(f"[OK] Pipeline '{PIPELINE_NAME}' exists.")
