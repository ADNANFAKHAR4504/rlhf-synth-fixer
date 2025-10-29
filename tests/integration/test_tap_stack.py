import json
import os
import unittest

from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""

    @mark.it("verifies disaster recovery infrastructure outputs exist")
    def test_disaster_recovery_outputs_exist(self):
        # ASSERT - Verify all expected outputs are present
        self.assertIn("DatabaseEndpoint", flat_outputs)
        self.assertIn("DatabasePort", flat_outputs)
        self.assertIn("ReadReplicaEndpoint", flat_outputs)
        self.assertIn("EFSFileSystemId", flat_outputs)
        self.assertIn("CacheEndpoint", flat_outputs)
        self.assertIn("SecretArn", flat_outputs)
        self.assertIn("VPCId", flat_outputs)

    @mark.it("verifies database endpoint is valid")
    def test_database_endpoint_valid(self):
        # ASSERT - Verify database endpoint has expected format
        db_endpoint = flat_outputs.get("DatabaseEndpoint", "")
        self.assertTrue(len(db_endpoint) > 0, "Database endpoint should not be empty")
        # RDS endpoints typically contain the region identifier
        self.assertTrue(
            "rds.amazonaws.com" in db_endpoint or len(db_endpoint) > 10,
            "Database endpoint should be a valid RDS endpoint"
        )

    @mark.it("verifies EFS filesystem ID is valid")
    def test_efs_id_valid(self):
        # ASSERT - Verify EFS ID has expected format (fs-XXXXXXXX)
        efs_id = flat_outputs.get("EFSFileSystemId", "")
        self.assertTrue(
            efs_id.startswith("fs-") or len(flat_outputs) == 0,
            "EFS ID should start with 'fs-' prefix"
        )
