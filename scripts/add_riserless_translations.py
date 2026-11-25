#!/usr/bin/env python3
"""
Adds riserless and risered section translations across all 13 supported languages:
en, es, hi, ar, zh, fr, pt, de, ja, ru, id, ko, uk.
"""

import os
import re
import sys
import json

TRANSLATIONS_FILE = os.path.join(os.path.dirname(__file__), '..', 'translations.js')

with open(TRANSLATIONS_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

translations_data = {
    "RISERLESS SECTION (returns to seabed, no riser)": {
        "en": "RISERLESS SECTION (returns to seabed, no riser)",
        "es": "SECCIÓN SIN RISER (retorno al lecho marino, sin riser)",
        "hi": "राइज़रलेस सेक्शन (समुद्र तल पर वापसी, कोई राइज़र नहीं)",
        "ar": "مقطع بدون رايزر (العائد إلى قاع البحر، بدون رايزر)",
        "zh": "无隔水管井段（返出至海底，无隔水管）",
        "fr": "SECTION SANS RISER (retours au fond marin, sans riser)",
        "pt": "SEÇÃO SEM RISER (retorno ao leito marinho, sem riser)",
        "de": "RISERLOSER ABSCHNITT (Rückfluss zum Meeresboden, kein Riser)",
        "ja": "ライザーレスセクション（海底への循環、ライザーなし）",
        "ru": "БЕЗРАЙЗЕРНАЯ СЕКЦИЯ (выход на морское дно, без райзера)",
        "id": "SEKSI TANPA RISER (kembali ke dasar laut, tanpa riser)",
        "ko": "라이저리스 구간 (해저면 순환, 라이저 없음)",
        "uk": "БЕЗРАЙЗЕРНА СЕКЦІЯ (вихід на морське дно, без райзера)"
    },
    "RISER SECTION": {
        "en": "RISER SECTION",
        "es": "SECCIÓN CON RISER",
        "hi": "राइज़र सेक्शन",
        "ar": "مقطع الرايزر",
        "zh": "隔水管井段",
        "fr": "SECTION AVEC RISER",
        "pt": "SEÇÃO COM RISER",
        "de": "RISER-ABSCHNITT",
        "ja": "ライザーセクション",
        "ru": "РАЙЗЕРНАЯ СЕКЦИЯ",
        "id": "SEKSI RISER",
        "ko": "라이저 구간",
        "uk": "РАЙЗЕРНА СЕКЦІЯ"
    },
    "Custom Hole (Riserless)": {
        "en": "Custom Hole (Riserless)",
        "es": "Pozo personalizado (sin riser)",
        "hi": "कस्टम होल (राइज़रलेस)",
        "ar": "تجويف مخصص (بدون رايزر)",
        "zh": "自定义井眼（无隔水管）",
        "fr": "Trou personnalisé (sans riser)",
        "pt": "Poço personalizado (sem riser)",
        "de": "Benutzerdefiniertes Bohrloch (riserlos)",
        "ja": "カスタム坑井（ライザーレス）",
        "ru": "Пользовательский ствол (без райзера)",
        "id": "Lubang Kustom (Tanpa Riser)",
        "ko": "사용자 지정 시추공 (라이저리스)",
        "uk": "Спеціальний стовбур (без райзера)"
    },
    "Custom Hole (Riser)": {
        "en": "Custom Hole (Riser)",
        "es": "Pozo personalizado (con riser)",
        "hi": "कस्टम होल (राइज़र)",
        "ar": "تجويف مخصص (مع رايزر)",
        "zh": "自定义井眼（有隔水管）",
        "fr": "Trou personnalisé (avec riser)",
        "pt": "Poço personalizado (com riser)",
        "de": "Benutzerdefiniertes Bohrloch (mit Riser)",
        "ja": "カスタム坑井（ライザー）",
        "ru": "Пользовательский ствол (с райзером)",
        "id": "Lubang Kustom (Riser)",
        "ko": "사용자 지정 시추공 (라이저)",
        "uk": "Спеціальний стовбур (з райзером)"
    },
    "Custom Hole (Riserless) Input": {
        "en": "Custom Hole (Riserless) Input",
        "es": "Datos de pozo personalizado (sin riser)",
        "hi": "कस्टम होल (राइज़रलेस) इनपुट",
        "ar": "مدخلات التجويف المخصص (بدون رايزر)",
        "zh": "自定义井眼（无隔水管）输入",
        "fr": "Données trou personnalisé (sans riser)",
        "pt": "Entrada de poço personalizado (sem riser)",
        "de": "Eingabe benutzerdefiniertes Bohrloch (riserlos)",
        "ja": "カスタム坑井（ライザーレス）入力",
        "ru": "Ввод параметров ствола (без райзера)",
        "id": "Input Lubang Kustom (Tanpa Riser)",
        "ko": "사용자 지정 시추공 (라이저리스) 입력",
        "uk": "Введення параметрів стовбура (без райзера)"
    },
    "Hole OD (in)": {
        "en": "Hole OD (in)",
        "es": "OD del pozo (in)",
        "hi": "होल OD (in)",
        "ar": "القطر الخارجي للتجويف (بوصة)",
        "zh": "井眼外径 (in)",
        "fr": "OD du trou (in)",
        "pt": "OD do poço (in)",
        "de": "Bohrloch-Außendurchmesser (in)",
        "ja": "坑井外径 (in)",
        "ru": "Внешний диаметр ствола (in)",
        "id": "OD Lubang (in)",
        "ko": "시추공 외경 (in)",
        "uk": "Зовнішній діаметр стовбура (in)"
    },
    "Conductor / Casing OD (in)": {
        "en": "Conductor / Casing OD (in)",
        "es": "OD de conductor / casing (in)",
        "hi": "कंडक्टर / केसिंग OD (in)",
        "ar": "القطر الخارجي للأنبوب الدليلي / البطانة (بوصة)",
        "zh": "导管/套管外径 (in)",
        "fr": "OD tube conducteur / tubage (in)",
        "pt": "OD de condutor / revestimento (in)",
        "de": "Standrohr- / Casing-AD (in)",
        "ja": "コンダクター / ケーシング外径 (in)",
        "ru": "Наружный диаметр направления / обсадной колонны (in)",
        "id": "OD Konduktor / Casing (in)",
        "ko": "도관 / 케이싱 외경 (in)",
        "uk": "Зовнішній діаметр напрямної / колони (in)"
    },
    "Conductor / Casing ID (in)": {
        "en": "Conductor / Casing ID (in)",
        "es": "ID de conductor / casing (in)",
        "hi": "कंडक्टर / केसिंग ID (in)",
        "ar": "القطر الداخلي للأنبوب الدليلي / البطانة (بوصة)",
        "zh": "导管/套管内径 (in)",
        "fr": "ID tube conducteur / tubage (in)",
        "pt": "ID de condutor / revestimento (in)",
        "de": "Standrohr- / Casing-ID (in)",
        "ja": "コンダクター / ケーシング内径 (in)",
        "ru": "Внутренний диаметр направления / обсадной колонны (in)",
        "id": "ID Konduktor / Casing (in)",
        "ko": "도관 / 케이싱 내경 (in)",
        "uk": "Внутрішній діаметр напрямної / колони (in)"
    },
    "Riserless": {
        "en": "Riserless",
        "es": "Sin riser",
        "hi": "राइज़रलेस",
        "ar": "بدون رايزر",
        "zh": "无隔水管",
        "fr": "Sans riser",
        "pt": "Sem riser",
        "de": "Riserlos",
        "ja": "ライザーレス",
        "ru": "Без райзера",
        "id": "Tanpa Riser",
        "ko": "라이저리스",
        "uk": "Без райзера"
    },
    "Riser": {
        "en": "Riser",
        "es": "Con riser",
        "hi": "राइज़र",
        "ar": "مع رايزر",
        "zh": "有隔水管",
        "fr": "Avec riser",
        "pt": "Com riser",
        "de": "Mit Riser",
        "ja": "ライザー",
        "ru": "С райзером",
        "id": "Riser",
        "ko": "라이저",
        "uk": "З райзером"
    },
    "With Riser": {
        "en": "With Riser",
        "es": "Con riser",
        "hi": "राइज़र के साथ",
        "ar": "مع رايزر",
        "zh": "带隔水管",
        "fr": "Avec riser",
        "pt": "Com riser",
        "de": "Mit Riser",
        "ja": "ライザー付き",
        "ru": "С райзером",
        "id": "Dengan Riser",
        "ko": "라이저 포함",
        "uk": "З райзером"
    },
    "Kill Data Sheet is not available in riserless mode.": {
        "en": "Kill Data Sheet is not available in riserless mode.",
        "es": "La hoja de control de pozo no está disponible en modo sin riser.",
        "hi": "किल डेटा शीट राइज़रलेस मोड में उपलब्ध नहीं है।",
        "ar": "صحيفة بيانات القتل غير متاحة في وضع بدون رايزر.",
        "zh": "压井数据表在无隔水管模式下不可用。",
        "fr": "La feuille de neutralisation n'est pas disponible en mode sans riser.",
        "pt": "A planilha de amortecimento não está disponível no modo sem riser.",
        "de": "Das Kill-Datenblatt ist im riserlosen Modus nicht verfügbar.",
        "ja": "キルデータシートはライザーレスモードでは利用できません。",
        "ru": "Лист глушения скважины недоступен в безрайзерном режиме.",
        "id": "Lembar data kill tidak tersedia dalam mode tanpa riser.",
        "ko": "라이저리스 모드에서는 킬 데이터 시트를 사용할 수 없습니다.",
        "uk": "Таблиця глушіння свердловини недоступна в безрайзерному режимі."
    },
    "Casing ID must be larger than Drill Collar OD": {
        "en": "Casing ID must be larger than Drill Collar OD",
        "es": "El ID del casing debe ser mayor que el OD de los portamechas",
        "hi": "केसिंग ID ड्रिल कॉलर OD से बड़ा होना चाहिए",
        "ar": "يجب أن يكون القطر الداخلي للبطانة أكبر من القطر الخارجي لأطواق الحفر",
        "zh": "套管内径必须大于钻铤外径",
        "fr": "Le diamètre intérieur du tubage doit être supérieur au diamètre extérieur des masses-tiges",
        "pt": "O ID do revestimento deve ser maior que o OD dos comandos",
        "de": "Casing-ID muss größer als Schwerstangen-AD sein",
        "ja": "ケーシング内径はドリルカラー外径より大きくなければなりません",
        "ru": "Внутренний диаметр колонны должен быть больше внешнего диаметра УБТ",
        "id": "ID Casing harus lebih besar dari OD Drill Collar",
        "ko": "케이싱 내경은 드릴 칼라 외경보다 커야 합니다",
        "uk": "Внутрішній діаметр колони має бути більшим за зовнішній діаметр ОБТ"
    },
    "Casing ID must be smaller than Hole OD": {
        "en": "Casing ID must be smaller than Hole OD",
        "es": "El ID del casing debe ser menor que el OD del pozo",
        "hi": "केसिंग ID होल OD से छोटा होना चाहिए",
        "ar": "يجب أن يكون القطر الداخلي للبطانة أصغر من قطر التجويف",
        "zh": "套管内径必须小于井眼外径",
        "fr": "Le diamètre intérieur du tubage doit être inférieur au diamètre du trou",
        "pt": "O ID do revestimento deve ser menor que o OD do poço",
        "de": "Casing-ID muss kleiner als Bohrloch-AD sein",
        "ja": "ケーシング内径は坑井外径より小さくなければなりません",
        "ru": "Внутренний диаметр колонны должен быть меньше диаметра ствола",
        "id": "ID Casing harus lebih kecil dari OD Lubang",
        "ko": "케이싱 내경은 시추공 외경보다 작아야 합니다",
        "uk": "Внутрішній діаметр колони має бути меншим за діаметр стовбура"
    },
    "Casing ID must be smaller than Casing OD": {
        "en": "Casing ID must be smaller than Casing OD",
        "es": "El ID del casing debe ser menor que su OD",
        "hi": "केसिंग ID केसिंग OD से छोटा होना चाहिए",
        "ar": "يجب أن يكون القطر الداخلي للبطانة أصغر من قطرها الخارجي",
        "zh": "套管内径必须小于套管外径",
        "fr": "Le diamètre intérieur du tubage doit être inférieur à son diamètre extérieur",
        "pt": "O ID do revestimento deve ser menor que seu OD",
        "de": "Casing-ID muss kleiner als Casing-AD sein",
        "ja": "ケーシング内径はケーシング外径より小さくなければなりません",
        "ru": "Внутренний диаметр колонны должен быть меньше ее наружного диаметра",
        "id": "ID Casing harus lebih kecil dari OD Casing",
        "ko": "케이싱 내경은 케이싱 외경보다 작아야 합니다",
        "uk": "Внутрішній діаметр колони має бути меншим за її зовнішній діаметр"
    }
}

languages = ['en', 'es', 'hi', 'ar', 'zh', 'fr', 'pt', 'de', 'ja', 'ru', 'id', 'ko', 'uk']

def update_translations_file():
    global content
    for lang in languages:
        m = re.search(rf'\b{lang}\s*:\s*\{{', content)
        if not m:
            print(f"Error: Language '{lang}' not found!")
            continue
        start = m.end() - 1
        depth = 0
        end = -1
        for idx in range(start, len(content)):
            char = content[idx]
            if char == '{': depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    end = idx
                    break
        block = content[start:end]
        
        new_entries = []
        for key, lang_map in translations_data.items():
            val = lang_map.get(lang, lang_map.get('en', key))
            key_pattern = rf'"{re.escape(key)}"\s*:'
            if not re.search(key_pattern, block):
                safe_val = json.dumps(val, ensure_ascii=False)
                safe_key = json.dumps(key, ensure_ascii=False)
                new_entries.append(f'    {safe_key}: {safe_val},')
        
        if new_entries:
            injection = '\n' + '\n'.join(new_entries) + '\n  '
            content = content[:end] + injection + content[end:]
            print(f"Added {len(new_entries)} keys to language '{lang}'")

    with open(TRANSLATIONS_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print("translations.js updated successfully!")

if __name__ == '__main__':
    update_translations_file()
