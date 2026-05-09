import os

root = '2_codebase/backend/zg_storage_sdk'

def fix_file(path):
    print(f"Fixing {path}...")
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    repls = {
        'from core.': 'from zg_storage_sdk.core.',
        'from core ': 'from zg_storage_sdk.core ',
        'from utils.': 'from zg_storage_sdk.utils.',
        'from utils ': 'from zg_storage_sdk.utils ',
        'from models.': 'from zg_storage_sdk.models.',
        'from models ': 'from zg_storage_sdk.models ',
        'from contracts.': 'from zg_storage_sdk.contracts.',
        'from contracts ': 'from zg_storage_sdk.contracts ',
        'from config': 'from zg_storage_sdk.config',
        'from ..core': 'from zg_storage_sdk.core',
        'from ..utils': 'from zg_storage_sdk.utils',
        'from ..models': 'from zg_storage_sdk.models',
        'from ..contracts': 'from zg_storage_sdk.contracts',
        'from ..config': 'from zg_storage_sdk.config',
        'from .merkle': 'from zg_storage_sdk.core.merkle',
        'from .storage_node': 'from zg_storage_sdk.core.storage_node',
        'from .node_selector': 'from zg_storage_sdk.core.node_selector',
        'from .downloader': 'from zg_storage_sdk.core.downloader',
        'from .uploader': 'from zg_storage_sdk.core.uploader',
        'from .builder': 'from zg_storage_sdk.core.kv.builder',
    }
    
    new_content = content
    for old, new in repls.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  Modified {path}")

for dirpath, dirnames, filenames in os.walk(root):
    for filename in filenames:
        if filename.endswith('.py'):
            filepath = os.path.join(dirpath, filename)
            fix_file(filepath)
