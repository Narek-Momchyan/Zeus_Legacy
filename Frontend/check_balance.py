import sqlite3
import os

db_path = r'C:\Users\DM\Desktop\slot\db.sqlite3'

def check():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT u.username, w.balance FROM auth_user u JOIN api_userwallet w ON u.id = w.user_id")
        rows = cursor.fetchall()
        for row in rows:
            print(f"User: {row[0]} | Balance: {row[1]}")
    except Exception as e:
        print(f"Error: {e}")

    conn.close()

if __name__ == "__main__":
    check()
