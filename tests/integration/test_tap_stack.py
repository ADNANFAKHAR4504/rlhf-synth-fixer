import urllib.request as urllib
import random
import string
import tempfile
import os
import subprocess

BUCKET_NAME = "turingstaticfilebucketblacree"    # Your S3 bucket name in the terraform pipeline bucket
OBJECT_KEY = "index.html"                       # Path in S3 bucket
DOMAIN = "https://turing.blacree.com"           # Domain to test


def generate_random_suffix(length=6):
  """Generate a random alphanumeric string of length `length`."""
  return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


def run_cli(command):
  """Run a shell command and return its output."""
  result = subprocess.run(command, shell=True, capture_output=True, text=True)
  if result.returncode != 0:
      raise RuntimeError(f"Command failed: {command}\n{result.stderr}")
  return result.stdout


def test_turing_two_stack_integration():
  # ---- 1. Make HTTP request to check domain availability ----
  # response = requests.get(DOMAIN, timeout=20)
  # assert response.status_code == 200, f"Domain {DOMAIN} returned {response.status_code}"
  # print(f"[OK] {DOMAIN} is reachable.")

  try:
    with urllib.urlopen(DOMAIN, timeout=20) as response:
      status_code = response.getcode()
      assert status_code == 200, f"Domain {DOMAIN} returned {status_code}"
      print(f"[OK] {DOMAIN} is reachable.")
  except Exception as e:
    raise AssertionError(f"Failed to reach {DOMAIN}: {e}")
  
  # ---- 2. Download, update, and re-upload index.html using AWS CLI ----
  with tempfile.TemporaryDirectory() as tmpdir:
    local_file_path = os.path.join(tmpdir, OBJECT_KEY)

    # Download from S3
    run_cli(f"aws s3 cp s3://{BUCKET_NAME}/{OBJECT_KEY} {local_file_path}")
    print(f"[OK] Downloaded {OBJECT_KEY} from S3.")

    # Update keyword
    with open(local_file_path, "r") as f:
      content = f.read()

    if "TURING_RLHF" not in content:
      raise AssertionError("'TURING_RLHF' keyword not found in index.html")

    new_value = f"TURING_RLHF_{generate_random_suffix()}"
    updated_content = content.replace("TURING_RLHF", new_value)

    with open(local_file_path, "w") as f:
      f.write(updated_content)

    print(f"[OK] Updated keyword to {new_value}")

    # Re-upload updated file
    run_cli(f"aws s3 cp {local_file_path} s3://{BUCKET_NAME}/{OBJECT_KEY}")
    print(f"[OK] Re-uploaded updated index.html to S3.")
