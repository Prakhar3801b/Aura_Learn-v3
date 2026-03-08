import os
import asyncio
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

async def check_db():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Missing Supabase config")
        return

    supabase = create_client(url, key)
    
    # Check materials
    mats = supabase.table("study_materials").select("id, title, status").limit(5).execute()
    print(f"Materials found: {len(mats.data)}")
    for m in mats.data:
        mid = m['id']
        print(f"Material: {m['title']} ({mid}) - Status: {m['status']}")
        
        # Check counts
        fcs = supabase.table("flashcards").select("id").eq("material_id", mid).execute()
        eps = supabase.table("exam_points").select("id").eq("material_id", mid).execute()
        nodes = supabase.table("mind_map_nodes").select("id").eq("material_id", mid).execute()
        
        print(f"  Flashcards: {len(fcs.data)}")
        print(f"  Exam Points: {len(eps.data)}")
        print(f"  Mind Map Nodes: {len(nodes.data)}")

if __name__ == "__main__":
    asyncio.run(check_db())
