"""Run spatial analysis CLI."""
from analytics.pipelines.analysis.run import run_pipeline

if __name__ == "__main__":
    run_pipeline(city_id="vizag", travel_minutes=10, h3_res=8)
