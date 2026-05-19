import os
import json
import re

approved_dir = '/Users/thejoshuapenner/.openclaw/workspace/votepenner_kanban/5_Approved'
published_dir = '/Users/thejoshuapenner/.openclaw/workspace/votepenner_kanban/6_Published'
source_dir = published_dir 

issues_json_path = '/Users/thejoshuapenner/.openclaw/workspace/votepenner.com/public/data/issues.json'

issues = []

for filename in os.listdir(source_dir):
    if not filename.endswith('.md'): continue
    filepath = os.path.join(source_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Remove USER FEEDBACK lines if any
    content = re.sub(r'\*\*USER FEEDBACK:\*\*.*?\n\n', '', content, flags=re.DOTALL)
    
    # Parse metadata
    vid_match = re.search(r'\*\*Intended Video:\*\*\s*(https://www\.youtube\.com/watch\?v=([a-zA-Z0-9_-]+))', content)
    img_match = re.search(r'\*\*Intended Hero Image:\*\*\s*(/[^\n]+)', content)
    inline_img_match = re.search(r'\*\*Inline Image:\*\*\s*(/[^\n]+)', content)
    quote_match = re.search(r'\*\*Anchor Quote:\*\*\s*>\s*(.*?)$', content, flags=re.MULTILINE)
    title_match = re.search(r'^#\s+(.*?)$', content, flags=re.MULTILINE)
    
    vid_url = vid_match.group(1).strip() if vid_match else ""
    vid_id = vid_match.group(2).strip() if vid_match else ""
    img_path = img_match.group(1).strip() if img_match else ""
    inline_img_path = inline_img_match.group(1).strip() if inline_img_match else ""
    quote = quote_match.group(1).strip() if quote_match else ""
    title = title_match.group(1).strip() if title_match else filename.replace('.md', '').replace('-', ' ').title()
    slug = filename.replace('.md', '')
    
    # Extract body (everything after the frontmatter and the title)
    body_raw = re.sub(r'^\*\*.*?\n', '', content, flags=re.MULTILINE)
    body_raw = re.sub(r'^---\s*\n', '', body_raw, flags=re.MULTILINE)
    body_raw = re.sub(r'^#\s+.*?\n', '', body_raw, flags=re.MULTILINE)
    body_raw = re.sub(r'!\[.*?\]\(.*?\)\n', '', body_raw)
    
    clean_body = re.sub(r'#+\s+', '', body_raw)
    clean_body = re.sub(r'\n+', ' ', clean_body)
    summary_text = clean_body.strip()[:150] + "..."
    
    issue = {
        "id": slug,
        "title": title,
        "slug": slug,
        "heroImage": img_path,
        "inline_image_url": inline_img_path,
        "youtubeId": vid_id,
        "youtubeUrl": vid_url,
        "anchorQuote": quote,
        "content": body_raw.strip(),
        "summary": summary_text
    }
    issues.append(issue)

# Write to issues.json
with open(issues_json_path, 'w') as f:
    json.dump(issues, f, indent=2)

print(f"Compiled {len(issues)} issues into {issues_json_path}")
