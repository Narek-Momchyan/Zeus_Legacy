import sqlite3
import os

db_path = r'C:\Users\DM\Desktop\slot\db.sqlite3'

def reset():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE api_userwallet SET balance = 1000.00")
        print("All balances reset to 1000.00")
    except Exception as e:
        print(f"Error: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    reset()
