import os
import json
import psycopg2


def lambda_handler(event, context):
    # Database connection details
    database_endpoint = os.environ.get("DB_HOST").split(":")[0]
    port = os.environ.get("DB_PORT")
    database_username = os.environ.get("DB_USER")
    credentials = os.environ.get("DB_PASSWORD")
    target_database = os.environ.get("DB_NAME")

    conn = None
    cur = None

    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=database_endpoint,
            port=port,
            user=database_username,
            password=credentials,
            database=target_database
        )
        cur = conn.cursor()

        # 1. Create table if it doesn't exist
        create_table_query = """
        CREATE TABLE IF NOT EXISTS people (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            occupation TEXT NOT NULL,
            location TEXT NOT NULL
        );
        """
        cur.execute(create_table_query)
        conn.commit()

        # 2. Insert one row only if the table is empty
        cur.execute("SELECT COUNT(*) FROM people;")
        count = cur.fetchone()[0]
        if count == 0:
            insert_query = """
            INSERT INTO people (name, occupation, location)
            VALUES (%s, %s, %s);
            """
            cur.execute(insert_query, ("Jane Doe", "Software Engineer", "New York"))
            conn.commit()

        # 3. Select the row
        cur.execute("SELECT name, occupation, location FROM people LIMIT 1;")
        row = cur.fetchone()

        if row:
            result = {
                "name": row[0],
                "occupation": row[1],
                "location": row[2]
            }
            print("✅ Retrieved person:", result)
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Person retrieved successfully.',
                    'data': result
                })
            }
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({'message': 'No person found in the table.'})
            }

    except Exception as e:
        print("❌ Error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f"Database error: {str(e)}"})
        }

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
