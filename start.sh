#!/bin/zsh
cd /Users/raphaeldixon/ai-hardware-synth-studio
echo "Starting AETHER-909 AI Autonomous Hardware & Virtual MIDI Studio..."
open http://localhost:8089
/usr/bin/python3 -u server.py
