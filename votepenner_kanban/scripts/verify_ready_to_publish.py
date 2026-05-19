import os, re, sys

def verify_file(filepath):
    errors = []
    filename = os.path.basename(filepath)
    
    if 'draft' in filename.lower() or '+' in filename or '_' in filename:
        errors.append(f"Filename '{filename}' is not a clean slug. (No 'draft', '+', or '_')")
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    if not re.search(r'\*\*Intended Hero Image:\*\*\s*(/[^\n]+)', content):
        errors.append("Missing or invalid 'Intended Hero Image' frontmatter.")
        
    if not re.search(r'^#\s+.+', content, flags=re.MULTILINE):
        errors.append("Missing H1 Title (# Title).")
        
    if '**USER FEEDBACK:**' in content:
        errors.append("Contains unresolved USER FEEDBACK blocks.")
        
    return errors

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_ready_to_publish.py <directory_path>")
        sys.exit(1)
        
    target_dir = sys.argv[1]
    all_good = True
    for file in os.listdir(target_dir):
        if not file.endswith('.md'): continue
        errs = verify_file(os.path.join(target_dir, file))
        if errs:
            print(f"❌ {file} failed validation:")
            for e in errs: print(f"   - {e}")
            all_good = False
        else:
            print(f"✅ {file} is clean and ready.")
            
    if not all_good:
        sys.exit(1)
