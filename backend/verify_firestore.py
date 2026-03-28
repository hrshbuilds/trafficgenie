"""Quick Firestore verification."""
from services.firebase_service import firebase_service

print("\n🔍 Checking Firestore violations collection...\n")

if firebase_service._db:
    try:
        violations_ref = firebase_service._db.collection("violations")
        docs = violations_ref.limit(100).stream()
        
        violations_list = list(docs)
        count = len(violations_list)
        
        print(f"✅ Total violations in Firestore: {count}\n")
        
        for i, doc in enumerate(violations_list[:5], 1):
            data = doc.to_dict()
            print(f"{i}. {doc.id}")
            print(f"   Type: {data.get('type')}")
            print(f"   Plate: {data.get('plate')}\n")
        
        if count > 5:
            print(f"... and {count - 5} more violations")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
else:
    print("❌ Firebase not initialized")
