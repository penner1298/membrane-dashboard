import sys, re, os

def format_doc(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Convert literal \n to actual newlines (just in case they got encoded by the UI)
    content = content.replace('\\n', '\n')

    # 1. Try to find the real video from Related Media added by the UI
    real_vid_match = re.search(r'\*\*Related Media:\*\*\n- \[Watch/Read More\]\((https://www\.youtube\.com/[^\)]+)\)', content)
    vid_url = real_vid_match.group(1).strip() if real_vid_match else ""
    
    if not vid_url:
        vid_match = re.search(r'\*\*Intended Video:\*\*\s*(https://www\.youtube\.com/[^\n]+)', content)
        vid_url = vid_match.group(1).strip() if vid_match else ""

    # 2. Try to find hero image
    img_match = re.search(r'\[SUGGESTED IMAGE PLACEMENT:\s*(.*?)\]', content)
    if img_match:
        hero_img = f"/images/leg_photos/{img_match.group(1).strip()}"
    else:
        existing_img = re.search(r'\*\*Intended Hero Image:\*\*\s*(/[^\n]+)', content)
        hero_img = existing_img.group(1).strip() if existing_img else "/images/leg_photos/joshua_penner_seated_talking_in_charge_looking.jpg"

    # 3. Try to find pull quote
    quote_match = re.search(r'\[SUGGESTED PULL QUOTE:\s*"(.*?)"\]', content)
    if quote_match:
        quote = quote_match.group(1).strip()
    else:
        existing_quote = re.search(r'\*\*Anchor Quote:\*\*\s*>\s*(.*?)$', content, flags=re.MULTILINE)
        quote = existing_quote.group(1).strip() if existing_quote else ""

    # Clean the body
    body = content
    body = re.sub(r'^\*\*Intended Video:\*\*.*?\n', '', body, flags=re.MULTILINE)
    body = re.sub(r'^\*\*Intended Hero Image:\*\*.*?\n', '', body, flags=re.MULTILINE)
    body = re.sub(r'^\*\*Inline Image:\*\*.*?\n', '', body, flags=re.MULTILINE)
    body = re.sub(r'^\*\*Anchor Quote:\*\*.*?\n', '', body, flags=re.MULTILINE)
    body = re.sub(r'^\*\*Matrix Pillar:\*\*.*?\n', '', body, flags=re.MULTILINE)
    body = re.sub(r'^\*\*Timeline:\*\*.*?\n', '', body, flags=re.MULTILINE)
    body = re.sub(r'^---\s*\n', '', body)
    
    # Remove Related Media block
    body = re.sub(r'\n---\n\*\*Related Media:\*\*\n- \[Watch/Read More\]\(.*?\)', '', body)
    
    # Process SUGGESTED tags
    body = re.sub(r'\[SUGGESTED PULL QUOTE:\s*"(.*?)"\]', r'> \1', body)
    if img_match:
        body = re.sub(r'\[SUGGESTED IMAGE PLACEMENT:\s*(.*?)\]', f"![Inline Image](/images/leg_photos/{img_match.group(1).strip()})", body)

    body = body.strip()
    # clean multiple dashes
    body = re.sub(r'^---\n', '', body)

    # Rebuild frontmatter
    frontmatter = ""
    if vid_url:
        frontmatter += f"**Intended Video:** {vid_url}\n"
    frontmatter += f"**Intended Hero Image:** {hero_img}\n"
    if hero_img:
        frontmatter += f"**Inline Image:** {hero_img}\n"
    if quote:
        frontmatter += f"**Anchor Quote:** > {quote}\n"
    
    final_content = frontmatter + "---\n\n" + body

    with open(filepath, 'w') as f:
        f.write(final_content)
    print(f"Post-processed: {filepath}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python format_document.py <filepath>")
        sys.exit(1)
    format_doc(sys.argv[1])
