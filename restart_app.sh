# !/bin/bash

echo "Stopping Flask app..."
pkill -f "python.*app.py"

echo "Waiting for process to stop..."
sleep 2

echo "Starting Flask app..."
python3 app.py

sleep 2

echo "Flask app restarted!"
echo "Check status with: ps aux | grep app.py"
echo "View logs with: tail -f app.log"
