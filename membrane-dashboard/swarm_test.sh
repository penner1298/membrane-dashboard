API_KEY=" sk_live_5ea9547374239d33c44bc9c925babab351bd15359f7d8af2"

PROMPT="Design a simple system architecture for a scalable chat app"

echo "=== SWARM TEST START ==="

for i in {1..5}
do
  (
    curl -s -X POST https://membrane-wh1g.onrender.com/api/chat \
      -H "Content-Type: application/json" \
      -H "X-Gearbox-Key: $API_KEY" \
      -d "{\"prompt\":\"$PROMPT (agent $i)\",\"use_global_cache\":false}" \
      | python3 -m json.tool
  ) &
done

wait

echo "=== SWARM TEST DONE ==="

