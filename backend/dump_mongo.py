from config import get_mongo_db
import json

try:
    db = get_mongo_db()
    users = list(db["users"].find({}, {"client_code": 1, "NAME": 1}))
    with open("mongo_dump.json", "w") as f:
        json.dump(users, f, default=str)
    print(f"Dumped {len(users)} users")
except Exception as e:
    with open("mongo_dump.json", "w") as f:
        f.write(f"Error: {str(e)}")
