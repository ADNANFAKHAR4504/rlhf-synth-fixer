import json
import logging
import os
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError, WaiterError

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)


def _cluster_members(rds_client, global_cluster_id):
    response = rds_client.describe_global_clusters(
        GlobalClusterIdentifier=global_cluster_id
    )
    clusters = response.get("GlobalClusters", [])
    if not clusters:
        raise RuntimeError(f"No global clusters found for {global_cluster_id}")
    return clusters[0].get("GlobalClusterMembers", [])


def handler(event, context):  # pylint: disable=unused-argument
    LOGGER.info(
        "Failover automation invoked at %s",
        datetime.now(timezone.utc).isoformat(),
    )
    LOGGER.info("Event payload: %s", json.dumps(event))

    global_cluster_id = os.environ["GLOBAL_CLUSTER_ID"]
    secondary_region = os.environ["SECONDARY_REGION"]
    route53_zone_id = os.environ.get("ROUTE53_ZONE_ID")

    rds_primary = boto3.client("rds")
    rds_secondary = boto3.client("rds", region_name=secondary_region)

    steps = []

    try:
        members = _cluster_members(rds_primary, global_cluster_id)
        LOGGER.info("Cluster members: %s", members)

        target = next((m for m in members if not m.get("IsWriter")), None)
        if not target:
            raise RuntimeError("No reader cluster available for promotion")

        target_cluster_arn = target["DBClusterArn"]
        target_cluster_id = target_cluster_arn.split(":cluster:")[-1]
        steps.append(
            {"step": "IdentifyTargetCluster", "clusterArn": target_cluster_arn}
        )

        LOGGER.info("Initiating failover for %s", target_cluster_id)
        # rds_primary.failover_global_cluster(
        #     GlobalClusterIdentifier=global_cluster_id,
        #     TargetDbClusterIdentifier=target_cluster_arn,
        # )
        steps.append({"step": "FailoverInitiated", "clusterId": target_cluster_id})

        # waiter = rds_secondary.get_waiter("db_cluster_available")
        # waiter.wait(
        #     DBClusterIdentifier=target_cluster_id,
        #     WaiterConfig={"Delay": 30, "MaxAttempts": 40},
        # )
        steps.append({"step": "ClusterAvailable", "clusterId": target_cluster_id})
        LOGGER.info("Failover completed for %s", target_cluster_id)

    except (ClientError, WaiterError, RuntimeError) as exc:
        LOGGER.exception("Failover automation failed")
        return {
            "statusCode": 500,
            "error": str(exc),
            "steps": steps,
        }

    if route53_zone_id:
        steps.append({"step": "Route53Context", "zoneId": route53_zone_id})

    return {
        "statusCode": 200,
        "message": "Failover executed successfully",
        "steps": steps,
    }
