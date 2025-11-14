import re
from collections import Counter, defaultdict
path = r"c:\Users\Administrator\Desktop\gocartlovm-main - v1\supabase\migrations\20250114_populate_all_site_texts.sql"
text = open(path, encoding='utf-8').read()
# find INSERT blocks
insert_blocks = re.split(r"ON CONFLICT \(key, language_code\) DO UPDATE SET", text)
# The file should split into [before first insert, first insert block + rest, maybe more]
# We'll search for all tuples like ('key', 'lang', ...)
matches = re.findall(r"\('([^']+)',\s*'([a-z]{2})'", text)
counts = Counter(matches)
dups = {k:v for k,v in counts.items() if v>1}
print('Total distinct (key,lang) pairs found:', len(counts))
if not dups:
    print('No duplicates found across whole file.')
else:
    print('Duplicates across file:')
    for (k,lang),c in sorted(dups.items()):
        print(f"  {k} ({lang}): {c} occurrences")
# Also list duplicates per INSERT statement (between each INSERT and ON CONFLICT)
blocks = re.findall(r"INSERT INTO site_texts \(key, language_code, value, type, namespace, context\) VALUES\s*(.*?)ON CONFLICT", text, flags=re.S)
for i,blk in enumerate(blocks, start=1):
    m = re.findall(r"\('([^']+)',\s*'([a-z]{2})'", blk)
    c = Counter(m)
    d = {k:v for k,v in c.items() if v>1}
    print()
    print(f'Block {i} duplicates:')
    if not d:
        print('  None')
    else:
        for (k,lang),cnt in sorted(d.items()):
            print(f"  {k} ({lang}): {cnt} occurrences")
