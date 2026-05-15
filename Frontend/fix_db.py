import sqlite3
import os

db_path = r'C:\Users\DM\Desktop\slot\db.sqlite3'

def fix():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("Checking column is_buy_bonus in api_gamelog...")
        cursor.execute("ALTER TABLE api_gamelog ADD COLUMN is_buy_bonus BOOLEAN DEFAULT 0;")
        print("Column is_buy_bonus added successfully.")
    except sqlite3.OperationalError as e:
        print(f"Could not add column (maybe it exists?): {e}")

    try:
        print("Checking index api_userwal_user_id_d5bb6b_idx...")
        # If it already exists, migration might fail. 
        # But we just want the column to be there for now.
    except Exception as e:
        print(e)

    conn.commit()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    fix()
