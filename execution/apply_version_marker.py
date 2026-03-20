import os

def add_version_marker(directory, marker):
    for root, dirs, files in os.walk(directory):
        for file in files:
            filepath = os.path.join(root, file)
            # Skip binary and very large files
            if file.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.xlsx', '.csv', '.gz', '.pack', '.idx')):
                continue
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # If marker already exists, don't add it again
                if marker in content:
                    continue
                
                # Decide how to add marker based on file type
                if file.endswith('.py'):
                    header = f"# {marker}\n"
                elif file.endswith(('.sql', '.env')):
                    header = f"-- {marker}\n"
                elif file.endswith('.md'):
                    header = f"{marker}\n"
                elif file.endswith(('.json', '.js', '.ts', '.tsx')):
                    header = f"// {marker}\n"
                else:
                    header = f"/* {marker} */\n"
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(header + content)
                print(f"Updated {filepath}")
            except Exception as e:
                print(f"Failed to update {filepath}: {e}")

if __name__ == "__main__":
    marker = "PV_MOLDES V2.4"
    # Directories to update
    dirs_to_update = ["directives", "execution", "src"]
    
    for d in dirs_to_update:
        if os.path.exists(d):
            print(f"Updating files in {d}...")
            add_version_marker(d, marker)
        else:
            print(f"Directory {d} not found.")
