import psycopg2
import json

# Replace these variables with your actual database connection details
database_endpoint = 'database-2.ci597dfzxi6f.us-east-1.rds.amazonaws.com'
port = 5432  # default port for PostgreSQL
database_username = 'postgres'
credentials = 'postgres'
target_database = 'postgresdb'
table_name = 'jsontable'
id_to_query = 1

def lambda_handler(event, context):
    try:
        # Connect to the database using the credentials
        conn = psycopg2.connect(
            host=database_endpoint,
            port=port,
            user=database_username,
            password=credentials,
            database=target_database
        )

        # Create a cursor object using the connection
        cur = conn.cursor()

        # Define the SELECT query
        # query = "SELECT json_data FROM " + table_name + " WHERE id = %s;"
        query = "SELECT json_data FROM " + table_name + " WHERE id = " +  str(id_to_query) + ";"

        # Execute the SELECT query with parameter substitution
        # cur.execute(query, (id_to_query,))
        cur.execute(query)

        # Fetch the result
        result = cur.fetchone()

        # Check if result is not None (i.e., if a record with id=1 was found)
        if result:
            json_data = result[0]  # assuming json_data is the first column selected
            print("JSON Data:", json_data)
        else:
            print("No record found with id =", id_to_query)

    except Exception as e:
        print("Error:", e)

    finally:
        # Close the cursor and database connection
        if cur:
            cur.close()
        if conn:
            conn.close()

    return {
        'statusCode': 200,
        'body': json.dumps(result[0])
    }
    
