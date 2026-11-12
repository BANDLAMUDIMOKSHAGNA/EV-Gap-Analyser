"""Seed database script."""
from analytics.pipelines.ingestion.seed_city import seed_city
from analytics.pipelines.ingestion.ingest_chargers import ingest_chargers
from analytics.pipelines.ingestion.ingest_vahan import ingest_vahan
from analytics.pipelines.ingestion.ingest_datasets import ingest_datasets

def main():
    print("[SEED] Seeding Vizag datasets...")
    ingest_datasets()
    seed_city("vizag")
    ingest_chargers("vizag")
    ingest_vahan("vizag")
    print("[SEED] Seeding completed.")

if __name__ == "__main__":
    main()
