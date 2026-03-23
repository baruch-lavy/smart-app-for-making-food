import os
import pathlib

base_path = r'c:\Users\baruc\OneDrive\Desktop\smart-app-for-making-food\server'
subdirs = ['middleware', 'models', 'routes', 'services', 'seeds']

# Create server directory if it doesn't exist
if not os.path.exists(base_path):
    os.makedirs(base_path, exist_ok=True)
    print(f'Created base directory: {base_path}')

# Create subdirectories and .gitkeep files
for subdir in subdirs:
    dir_path = os.path.join(base_path, subdir)
    
    # Create subdirectory
    if not os.path.exists(dir_path):
        os.makedirs(dir_path, exist_ok=True)
        print(f'Created subdirectory: {subdir}')
    
    # Create .gitkeep file
    gitkeep_path = os.path.join(dir_path, '.gitkeep')
    if not os.path.exists(gitkeep_path):
        pathlib.Path(gitkeep_path).touch()
        print(f'Created .gitkeep in: {subdir}')

print('\n--- Contents of server directory ---')
contents = os.listdir(base_path)
for item in sorted(contents):
    full_path = os.path.join(base_path, item)
    if os.path.isdir(full_path):
        print(f'[DIR] {item}')
    else:
        print(f'[FILE] {item}')
