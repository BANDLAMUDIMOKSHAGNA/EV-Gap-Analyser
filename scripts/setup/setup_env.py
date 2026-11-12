"""Setup environment script."""
import subprocess
import sys

def main():
    print("[SETUP] Installing Python dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"], check=True)
    print("[SETUP] Complete.")

if __name__ == "__main__":
    main()
