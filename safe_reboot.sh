#!/bin/bash
# SAFE REBOOT PROTOCOL
# Ensures the agent's final Discord message transmits before the Gateway executes a SIGKILL.
echo "Initiating delayed gateway restart in 10 seconds..."
sleep 10
openclaw gateway restart
