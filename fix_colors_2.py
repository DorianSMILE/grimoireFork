import os

files_to_update = [
    'src/main/resources/static/js/vault.js',
    'src/main/resources/static/js/shop.js',
    'src/main/resources/static/js/shop-admin.js',
    'src/main/resources/static/js/pve-admin.js',
    'src/main/resources/static/js/dungeons.js',
    'src/main/resources/static/js/combat.js',
    'src/main/resources/static/js/armory.js',
    'src/main/resources/static/alchemy.html'
]

for file_path in files_to_update:
    full_path = os.path.join(r"c:\Users\doria\Desktop\Project\grimoire", file_path)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # We need to replace "\'#7f1d1d\'" with "'#7f1d1d'"
        content = content.replace("\\'#7f1d1d\\'", "'#7f1d1d'")
        content = content.replace("\\'#c084fc\\'", "'#c084fc'")
        content = content.replace("\\'MAUDIT\\': \\'#7f1d1d\\'", "'MAUDIT': '#7f1d1d'")
        
        if content != original:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file_path}")
        else:
            print(f"No changes needed in {file_path}")
