#!/usr/bin/env python3
import re

with open('server/index.mjs', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all curly/smart quotes with straight ASCII quotes
content = content.replace('\u2019', "'")  # Right single quote -> straight quote
content = content.replace('\u2018', "'")  # Left single quote -> straight quote  
content = content.replace('\u201d', '"')  # Right double quote -> straight quote
content = content.replace('\u201c', '"')  # Left double quote -> straight quote

with open('server/index.mjs', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully converted all smart quotes to ASCII quotes')
