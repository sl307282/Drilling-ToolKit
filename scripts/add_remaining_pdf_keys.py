import re

extra_keys = {
    "CONDUCTOR CASING": {
        "en": "CONDUCTOR CASING",
        "es": "CASING CONDUCTOR",
        "hi": "कंडक्टर केसिंग",
        "ar": "مواسير التوجيه (CONDUCTOR)",
        "zh": "导管套管",
        "fr": "TUBE CONDUCTEUR",
        "pt": "REVESTIMENTO CONDUTOR",
        "de": "LEITROHR-CASING",
        "ja": "コンダクターケーシング",
        "ru": "НАПРАВЛЯЮЩАЯ КОЛОННА",
        "id": "CASING KONDUKTOR",
        "ko": "도체 케이싱",
        "uk": "НАПРЯМНА КОЛОНА"
    },
    "SURFACE WELLHEAD": {
        "en": "SURFACE WELLHEAD",
        "es": "CABEZAL DE POZO EN SUPERFICIE",
        "hi": "सतह वेलहेड",
        "ar": "رأس البئر السطحي",
        "zh": "表层井口",
        "fr": "TÊTE DE PUITS DE SURFACE",
        "pt": "CABEÇA DE POÇO DE SUPERFÍCIE",
        "de": "OBERFLÄCHEN-BOHRLOCHKOPF",
        "ja": "地上坑口",
        "ru": "НАЗЕМНОЕ УСТЬЕ",
        "id": "WELLHEAD PERMUKAAN",
        "ko": "지상 웰헤드",
        "uk": "НАЗЕМНЕ ГИРЛО"
    },
    "CUSTOM SECTION": {
        "en": "CUSTOM SECTION",
        "es": "SECCIÓN PERSONALIZADA",
        "hi": "कस्टम सेक्शन",
        "ar": "قسم مخصص",
        "zh": "自定义井段",
        "fr": "SECTION PERSONNALISÉE",
        "pt": "SEÇÃO PERSONALIZADA",
        "de": "BENUTZERDEFINIERTER ABSCHNITT",
        "ja": "カスタムセクション",
        "ru": "ПОЛЬЗОВАТЕЛЬСКАЯ СЕКЦИЯ",
        "id": "BAGIAN KUSTOM",
        "ko": "사용자 정의 섹션",
        "uk": "СПЕЦІАЛЬНА СЕКЦІЯ"
    },
    "RISERLESS CASING": {
        "en": "RISERLESS CASING",
        "es": "CASING SIN RISER",
        "hi": "राइज़रलेस केसिंग",
        "ar": "مواسير بدون صاعد (RISERLESS)",
        "zh": "无隔水管套管",
        "fr": "CASING SANS RISER",
        "pt": "REVESTIMENTO SEM RISER",
        "de": "RISERLOSES CASING",
        "ja": "ライザーレスケーシング",
        "ru": "БЕЗРАЙЗЕРНАЯ КОЛОННА",
        "id": "CASING TANPA RISER",
        "ko": "라이저리스 케이싱",
        "uk": "БЕЗРАЙЗЕРНА КОЛОНА"
    },
    "SUBSEA WELLHEAD": {
        "en": "SUBSEA WELLHEAD",
        "es": "CABEZAL SUBMARINO",
        "hi": "सबसी वेलहेड",
        "ar": "رأس البئر تحت سطح البحر",
        "zh": "水下井口",
        "fr": "TÊTE DE PUITS SOUS-MARINE",
        "pt": "CABEÇA DE POÇO SUBMARINA",
        "de": "UNTERWASSER-BOHRLOCHKOPF",
        "ja": "海底坑口",
        "ru": "ПОДВОДНОЕ УСТЬЕ",
        "id": "WELLHEAD BAWAH LAUT",
        "ko": "해저 웰헤드",
        "uk": "ПІДВОДНЕ ГИРЛО"
    },
    "N/A (Conductor)": {
        "en": "N/A (Conductor)",
        "es": "N/A (Conductor)",
        "hi": "लागू नहीं (कंडक्टर)",
        "ar": "غير متاح (مواسير التوجيه)",
        "zh": "不适用 (导管)",
        "fr": "N/A (Conducteur)",
        "pt": "N/A (Condutor)",
        "de": "N/A (Leitrohr)",
        "ja": "該当なし (コンダクター)",
        "ru": "Н/Д (Направление)",
        "id": "N/A (Konduktor)",
        "ko": "해당 없음 (도체)",
        "uk": "Н/Д (Напрямок)"
    },
    "N/A": {
        "en": "N/A",
        "es": "N/A",
        "hi": "लागू नहीं",
        "ar": "غير متاح",
        "zh": "不适用",
        "fr": "N/A",
        "pt": "N/A",
        "de": "N/A",
        "ja": "該当なし",
        "ru": "Н/Д",
        "id": "N/A",
        "ko": "해당 없음",
        "uk": "Н/Д"
    },
    "Shoe": {
        "en": "Shoe",
        "es": "Zapata",
        "hi": "शू",
        "ar": "حذاء",
        "zh": "套管鞋",
        "fr": "Sabot",
        "pt": "Sapata",
        "de": "Schuh",
        "ja": "シュー",
        "ru": "Башмак",
        "id": "Sepatu",
        "ko": "슈",
        "uk": "Башмак"
    },
    "TD": {
        "en": "TD",
        "es": "TD",
        "hi": "TD (कुल गहराई)",
        "ar": "العمق الإجمالي (TD)",
        "zh": "总井深 (TD)",
        "fr": "TD",
        "pt": "TD",
        "de": "Endtiefe (TD)",
        "ja": "総深度 (TD)",
        "ru": "Забой (TD)",
        "id": "Kedalaman Total (TD)",
        "ko": "총 심도 (TD)",
        "uk": "Вибій (TD)"
    },
    "tonnes": {
        "en": "tonnes",
        "es": "toneladas",
        "hi": "टन",
        "ar": "طن",
        "zh": "吨",
        "fr": "tonnes",
        "pt": "toneladas",
        "de": "Tonnen",
        "ja": "トン",
        "ru": "тонн",
        "id": "ton",
        "ko": "톤",
        "uk": "тонн"
    },
    "Circ": {
        "en": "Circ",
        "es": "Circ",
        "hi": "परिसंचरण (Circ)",
        "ar": "دورة (Circ)",
        "zh": "循环 (Circ)",
        "fr": "Circ",
        "pt": "Circ",
        "de": "Zirk.",
        "ja": "循環",
        "ru": "Цирк.",
        "id": "Sirk",
        "ko": "순환 (Circ)",
        "uk": "Цирк."
    }
}

locales = ['en', 'es', 'hi', 'ar', 'zh', 'fr', 'pt', 'de', 'ja', 'ru', 'id', 'ko', 'uk']

with open('translations.js', 'r', encoding='utf-8') as f:
    content = f.read()

for loc in locales:
    loc_marker = f"  {loc}: {{"
    pos = content.find(loc_marker)
    if pos == -1:
        print(f"Error: could not find {loc_marker}")
        continue
    
    insert_pos = pos + len(loc_marker) + 1
    
    lines_to_insert = []
    for key, trans_dict in extra_keys.items():
        val = trans_dict[loc]
        escaped_key = key.replace('"', '\\"')
        escaped_val = val.replace('"', '\\"')
        lines_to_insert.append(f'    "{escaped_key}": "{escaped_val}",\n')
    
    insertion_text = "".join(lines_to_insert)
    content = content[:insert_pos] + insertion_text + content[insert_pos:]

with open('translations.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully added {len(extra_keys)} keys to all 13 locales!")
