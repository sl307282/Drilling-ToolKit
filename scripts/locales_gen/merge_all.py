#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge all authentic translations across all 13 languages into scratch/locales/
and build final stuckpipe locales.
"""

import json
import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from scripts.locales_gen.gen_fr_pt import get_fr, get_pt
from scripts.locales_gen.gen_de_ru_uk import get_de, get_ru, get_uk
from scripts.locales_gen.gen_ar import get_ar
from scripts.locales_gen.gen_hi import get_hi
from scripts.locales_gen.gen_zh import get_zh
from scripts.locales_gen.gen_ja_ko_id_core import get_ja_core, get_ko_core, get_id_core
from scripts.locales_gen.gen_ui_71 import (
    get_zh_ui, get_ar_ui, get_hi_ui, get_ja_ui, get_ko_ui, get_id_ui
)
from scripts.locales_gen.gen_remaining_77 import (
    get_de_77, get_ru_77, get_uk_77, get_zh_77, get_ar_77, get_hi_77,
    get_ja_77, get_ko_77, get_id_77
)
from scripts.locales_gen.gen_final_66 import (
    get_zh_66, get_ar_66, get_hi_66, get_ja_66, get_ko_66, get_id_66
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
SCRATCH = os.path.join(ROOT, 'scratch')
LOCALES_DIR = os.path.join(SCRATCH, 'locales')

with open(os.path.join(SCRATCH, 'stuckpipe_all_en.json')) as f:
    en_dict = json.load(f)
with open(os.path.join(LOCALES_DIR, 'es.json')) as f:
    es_dict = json.load(f)

langs = ['fr', 'pt', 'de', 'ru', 'uk', 'ar', 'hi', 'zh', 'ja', 'ko', 'id']
gens = {
    'fr': [get_fr],
    'pt': [get_pt],
    'de': [get_de, get_de_77],
    'ru': [get_ru, get_ru_77],
    'uk': [get_uk, get_uk_77],
    'ar': [get_ar, get_ar_ui, get_ar_77, get_ar_66],
    'hi': [get_hi, get_hi_ui, get_hi_77, get_hi_66],
    'zh': [get_zh, get_zh_ui, get_zh_77, get_zh_66],
    'ja': [get_ja_core, get_ja_ui, get_ja_77, get_ja_66],
    'ko': [get_ko_core, get_ko_ui, get_ko_77, get_ko_66],
    'id': [get_id_core, get_id_ui, get_id_77, get_id_66],
}

def main():
    print("Merging authentic translations into scratch/locales/...")
    for l in langs:
        file_path = os.path.join(LOCALES_DIR, f'{l}.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for g in gens[l]:
            data.update(g())
        matching_es = [k for k in en_dict if data.get(k) == es_dict.get(k)]
        print(f'{l}: total keys={len(data)}, matching ES={len(matching_es)}')
        if l != 'pt' and matching_es:
            print(f'   WARNING in {l}: unexpected match with ES: {matching_es}')
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    print("Running build_stuckpipe_locales.py...")
    res = subprocess.run([sys.executable, os.path.join(ROOT, 'scripts', 'build_stuckpipe_locales.py')])
    if res.returncode != 0:
        print("Build failed!")
        sys.exit(res.returncode)

    print("Running verify_stuckpipe_locales.py...")
    res_verify = subprocess.run([sys.executable, os.path.join(ROOT, 'scripts', 'verify_stuckpipe_locales.py')])
    if res_verify.returncode != 0:
        print("Verification failed!")
        sys.exit(res_verify.returncode)

    print("ALL 13 LOCALES BUILT AND VERIFIED 100% SUCCESSFULLY!")

if __name__ == '__main__':
    main()
