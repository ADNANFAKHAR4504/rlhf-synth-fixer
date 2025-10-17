#!/usr/bin/env python3
import json
import logging
from logging.handlers import RotatingFileHandler
import os
import threading
import time
import uuid

import boto3
import pymysql
from botocore.exceptions import BotoCoreError, ClientError
from flask import Flask, jsonify, request

LOG_FORMAT = "%(asctime)s %(levelname)s  %(message)s"
DEFAULT_LOG_PATH = "/var/log/example-app/app.log"

root_logger = logging.getLogger()
for handler in list(root_logger.handlers):
    root_logger.removeHandler(handler)

log_handlers = [logging.StreamHandler()]
handler_init_error = None
log_file_path = os.environ.get("APP_LOG_PATH", DEFAULT_LOG_PATH)
if log_file_path:
    try:
        os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
        log_handlers.append(
            RotatingFileHandler(
                log_file_path,
                maxBytes=5 * 1024 * 1024,
                backupCount=5,
            )
        )
    except OSError as exc:
        handler_init_error = exc

logging.basicConfig(level=logging.INFO, format=LOG_FORMAT, handlers=log_handlers)

if handler_init_error:
    logging.getLogger(__name__).warning(
        "Failed to initialize rotating file handler (%s). Falling back to STDOUT only.",
        handler_init_error,
    )

app = Flask(__name__)

_failure_state = {"active": False, "expires_at": 0.0}
_failure_lock = threading.Lock()

_secret_cache = {"data": None, "expires_at": 0.0}
_secret_ttl_seconds = 300
_secrets_client = boto3.client(
    "secretsmanager",
    region_name=os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION"),
)


def failure_active() -> bool:
    with _failure_lock:
        if not _failure_state["active"]:
            return False
        if time.time() >= _failure_state["expires_at"]:
            _failure_state["active"] = False
            _failure_state["expires_at"] = 0.0
            return False
        return True


def activate_failure(duration_seconds: float) -> float:
    expires_at = time.time() + duration_seconds
    with _failure_lock:
        _failure_state["active"] = True
        _failure_state["expires_at"] = expires_at
    return expires_at


def _load_db_secret() -> dict:
    now = time.time()
    if _secret_cache["data"] and now < _secret_cache["expires_at"]:
        return _secret_cache["data"]

    secret_arn = os.environ["DB_SECRET_ARN"]
    try:
        response = _secrets_client.get_secret_value(SecretId=secret_arn)
    except (ClientError, BotoCoreError) as exc:
        logging.exception("Failed to load database secret: %s", exc)
        raise

    secret_string = response.get("SecretString")
    if not secret_string:
        raise RuntimeError("Database secret missing SecretString payload")

    secret_payload = json.loads(secret_string)
    _secret_cache["data"] = secret_payload
    _secret_cache["expires_at"] = now + _secret_ttl_seconds
    return secret_payload


def get_db_connection(writer: bool = False):
    secret = _load_db_secret()
    host = os.environ["DB_WRITE_HOST"] if writer else os.environ["DB_READ_HOST"]
    return pymysql.connect(
        host=host,
        user=secret["username"],
        password=secret["password"],
        database=secret.get("dbname", "trading_db"),
        port=int(secret.get("port", 3306)),
        connect_timeout=5,
        autocommit=True,
    )


def is_database_read_only(connection) -> bool:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT @@GLOBAL.read_only")
            row = cursor.fetchone()
    except Exception as exc:  # pylint: disable=broad-except
        logging.warning("Unable to determine database read-only status: %s", exc)
        return False

    if not row:
        return False

    value = row[0]
    if isinstance(value, (bytes, bytearray)):
        value = value.decode()

    if isinstance(value, str):
        normalized = value.strip().lower()
        return normalized in {"1", "true", "on", "yes"}

    return bool(value)


def ensure_table():
    delay_seconds = 6
    attempt = 1
    while True:
        connection = None
        try:
            connection = get_db_connection(writer=True)
            if is_database_read_only(connection):
                logging.info(
                    "Database is currently read-only; skipping ensure_table write check."
                )
                return True
            with connection.cursor() as cursor:
                cursor.execute(
                    "CREATE TABLE IF NOT EXISTS example_data (id VARCHAR(36) PRIMARY KEY, data VARCHAR(255))"
                )
            logging.info("Ensured example_data table exists.")
            return True
        except Exception as exc:  # pylint: disable=broad-except
            logging.warning(
                "Database initialization attempt %s failed: %s. Retrying in %s seconds.",
                attempt,
                exc,
                delay_seconds,
            )
            time.sleep(delay_seconds)
            attempt += 1
        finally:
            if connection:
                connection.close()


@app.before_request
def enforce_failure_mode():
    if request.endpoint in ("trigger_failure", "health"):
        return None
    if failure_active():
        return jsonify({"error": "Application failure mode active"}), 503
    return None


@app.route("/health", methods=["GET"])
def health():
    if failure_active():
        return jsonify({"status": "failure", "message": "Failure mode active"}), 503
    return jsonify({"status": "ok"}), 200


@app.route("/data", methods=["POST"])
def create_data():
    payload = request.get_json(silent=True) or {}
    data_value = payload.get("data")
    if not data_value:
        return jsonify({"error": "The 'data' field is required"}), 400

    record_id = str(uuid.uuid4())
    connection = None
    try:
        connection = get_db_connection(writer=True)
        if is_database_read_only(connection):
            logging.warning("Write operation attempted while database is read-only.")
            return jsonify({"error": "database is currently read-only"}), 503
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO example_data (id, data) VALUES (%s, %s)",
                (record_id, data_value),
            )
    except Exception as exc:  # pylint: disable=broad-except
        logging.exception("Failed to insert record: %s", exc)
        return jsonify({"error": "database insert failed"}), 500
    finally:
        if connection:
            connection.close()

    return jsonify({"id": record_id}), 201


@app.route("/data/<record_id>", methods=["GET"])
def read_data(record_id):
    connection = None
    try:
        connection = get_db_connection(writer=False)
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT data FROM example_data WHERE id = %s",
                (record_id,),
            )
            row = cursor.fetchone()
    except Exception as exc:  # pylint: disable=broad-except
        logging.exception("Failed to read record: %s", exc)
        return jsonify({"error": "database read failed"}), 500
    finally:
        if connection:
            connection.close()

    if not row:
        return jsonify({"error": "record not found"}), 404

    return jsonify({"id": record_id, "data": row[0]}), 200


@app.route("/trigger-failure", methods=["POST"])
def trigger_failure():
    payload = request.get_json(silent=True) or {}
    duration = payload.get("seconds")

    if duration is None:
        return jsonify({"error": "Request body must include 'seconds'"}), 400

    try:
        duration_value = float(duration)
    except (TypeError, ValueError):
        return jsonify({"error": "'seconds' must be a numeric value"}), 400

    if duration_value <= 0:
        return jsonify({"error": "'seconds' must be greater than zero"}), 400

    expires_at = activate_failure(duration_value)
    logging.warning("Failure mode activated for %.2f seconds.", duration_value)
    return (
        jsonify(
            {
                "status": "failure mode activated",
                "expires_at_epoch": expires_at,
                "duration_seconds": duration_value,
            }
        ),
        202,
    )


if __name__ == "__main__":
    logging.info("Ensuring database initialization completed before starting application.")
    ensure_table()
    port = int(os.environ.get("APP_PORT", "8080"))
    app.run(host="0.0.0.0", port=port)
