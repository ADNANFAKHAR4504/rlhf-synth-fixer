#!/usr/bin/env python3
import logging
import os
import threading
import time
import uuid

import pymysql
from flask import Flask, jsonify, request

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = Flask(__name__)

_failure_state = {"active": False, "expires_at": 0.0}
_failure_lock = threading.Lock()


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


def get_db_connection(writer: bool = False):
    host_key = "DB_WRITE_HOST" if writer else "DB_READ_HOST"
    return pymysql.connect(
        host=os.environ[host_key],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
        port=int(os.environ.get("DB_PORT", "3306")),
        connect_timeout=5,
        autocommit=True,
    )


<<<<<<< Updated upstream
def ensure_table():
    attempts = 10
    delay_seconds = 6
    for attempt in range(1, attempts + 1):
        connection = None
        try:
            connection = get_db_connection(writer=True)
=======
def is_database_read_only(connection) -> bool:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT @@GLOBAL.read_only")
            row = cursor.fetchone()
    except Exception as exc:
        logging.warning("Unable to determine database read-only status: %s", exc)
        return False

    if row is None:
        return False

    value = row[0]
    if isinstance(value, (bytes, bytearray)):
        value = value.decode()

    if isinstance(value, str):
        normalized = value.strip().lower()
        return normalized in {"1", "true", "on", "yes"}

    return bool(value)


def ensure_table() -> bool:
    delay_seconds = 6
    attempt = 1
    while True:
        connection = None
        try:
            connection = get_db_connection(writer=True)
            if is_database_read_only(connection):
                logging.info("Database is in read-only mode; skipping ensure_table write check.")
                return True
>>>>>>> Stashed changes
            with connection.cursor() as cursor:
                cursor.execute(
                    "CREATE TABLE IF NOT EXISTS example_data (id VARCHAR(36) PRIMARY KEY, data VARCHAR(255))"
                )
            logging.info("Ensured example_data table exists.")
<<<<<<< Updated upstream
            return
        except Exception as exc:
            logging.warning("Database initialization attempt %s failed: %s", attempt, exc)
            time.sleep(delay_seconds)
        finally:
            if connection:
                connection.close()
    logging.error("Unable to initialize database after %s attempts.", attempts)


ensure_table()
=======
            return True
        except Exception as exc:
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
>>>>>>> Stashed changes


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
<<<<<<< Updated upstream
=======
        if is_database_read_only(connection):
            logging.warning("Write operation attempted while database is read-only.")
            return jsonify({"error": "database is currently read-only"}), 503
>>>>>>> Stashed changes
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO example_data (id, data) VALUES (%s, %s)",
                (record_id, data_value),
            )
    except Exception as exc:
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
    except Exception as exc:
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
<<<<<<< Updated upstream
=======
    logging.info("Ensuring database initialization completed before starting application.")
    ensure_table()
>>>>>>> Stashed changes
    app.run(host="0.0.0.0", port=8080)
