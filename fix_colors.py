import os
import re

files_to_update = [
    ('src/main/resources/static/js/vault.js', [
        (r'const color = isCursed \? \'#9ca3af\' : \'#c084fc\';', r'const color = isCursed ? \'#7f1d1d\' : \'#c084fc\';')
    ]),
    ('src/main/resources/static/js/shop.js', [
        (r'MAUDIT: \'#9ca3af\'', r'MAUDIT: \'#7f1d1d\''),
        (r'const color = isCursed \? \'#9ca3af\' : \'#c084fc\';', r'const color = isCursed ? \'#7f1d1d\' : \'#c084fc\';'),
        (r'else if \(rarityColor === \'#9ca3af\'\) \{ r = 156; g = 163; b = 175; \}', r'else if (rarityColor === \'#7f1d1d\') { r = 127; g = 29; b = 29; }'),
        (r'else if \(color === \'#9ca3af\'\) \{ r = 156; g = 163; b = 175; \}', r'else if (color === \'#7f1d1d\') { r = 127; g = 29; b = 29; }')
    ]),
    ('src/main/resources/static/js/shop-admin.js', [
        (r'const color = isCursed \? \'#9ca3af\' : \'#c084fc\';', r'const color = isCursed ? \'#7f1d1d\' : \'#c084fc\';')
    ]),
    ('src/main/resources/static/js/pve-admin.js', [
        (r'MAUDIT: \'#9ca3af\'', r'MAUDIT: \'#7f1d1d\'')
    ]),
    ('src/main/resources/static/js/dungeons.js', [
        (r'\'MAUDIT\': \'#9ca3af\'', r'\'MAUDIT\': \'#7f1d1d\'')
    ]),
    ('src/main/resources/static/js/combat.js', [
        (r'MAUDIT: \'#9ca3af\'', r'MAUDIT: \'#7f1d1d\''),
        (r'const color = isCursed \? \'#9ca3af\' : \'#c084fc\';', r'const color = isCursed ? \'#7f1d1d\' : \'#c084fc\';'),
        (r'\'MAUDIT\': \'#9ca3af\'', r'\'MAUDIT\': \'#7f1d1d\'')
    ]),
    ('src/main/resources/static/js/armory.js', [
        (r'const color = isCursed \? \'#9ca3af\' : \'#c084fc\';', r'const color = isCursed ? \'#7f1d1d\' : \'#c084fc\';')
    ]),
    ('src/main/resources/static/alchemy.html', [
        (r'\'MAUDIT\': \'#9ca3af\'', r'\'MAUDIT\': \'#7f1d1d\'')
    ]),
    ('src/main/resources/static/vault.html', [
        (r'style=\"color: #555555;\"\>skull', r'style=\"color: #7f1d1d;\">skull'),
        (r'data-color=\"#555555\"', r'data-color=\"#7f1d1d\"'),
        (r'style=\"color: #555555; font-weight: bold;\"\>M', r'style=\"color: #7f1d1d; font-weight: bold;\">M')
    ]),
    ('src/main/resources/static/shop.html', [
        (r'border-top: 3px solid #555555;', r'border-top: 3px solid #7f1d1d;'),
        (r'color: #555555; border-color: rgba\(85, 85, 85, 0\.3\);', r'color: #7f1d1d; border-color: rgba(127, 29, 29, 0.3);')
    ]),
    ('src/main/resources/static/shop-admin.html', [
        (r'data-color=\"#555555\"', r'data-color=\"#7f1d1d\"'),
        (r'style=\"color: #555555; font-weight: bold;\"\>M', r'style=\"color: #7f1d1d; font-weight: bold;\">M')
    ]),
]

for file_path, replacements in files_to_update:
    full_path = os.path.join(r"c:\Users\doria\Desktop\Project\grimoire", file_path)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
            
        if content != original:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Updated {file_path}')
        else:
            print(f'No changes needed in {file_path}')
    else:
        print(f'File not found: {file_path}')
