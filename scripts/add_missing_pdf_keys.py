import re

new_keys = {
    "Evaluation": {
        "en": "Evaluation",
        "es": "Evaluación",
        "hi": "मूल्यांकन",
        "ar": "التقييم",
        "zh": "评估",
        "fr": "Évaluation",
        "pt": "Avaliação",
        "de": "Bewertung",
        "ja": "評価",
        "ru": "Оценка",
        "id": "Evaluasi",
        "ko": "평가",
        "uk": "Оцінка"
    },
    "Input Value": {
        "en": "Input Value",
        "es": "Valor de entrada",
        "hi": "इनपुट मान",
        "ar": "قيمة الإدخال",
        "zh": "输入值",
        "fr": "Valeur saisie",
        "pt": "Valor de entrada",
        "de": "Eingabewert",
        "ja": "入力値",
        "ru": "Входное значение",
        "id": "Nilai Input",
        "ko": "입력값",
        "uk": "Вхідне значення"
    },
    "Not recorded": {
        "en": "Not recorded",
        "es": "No registrado",
        "hi": "दर्ज नहीं",
        "ar": "غير مسجل",
        "zh": "未记录",
        "fr": "Non enregistré",
        "pt": "Não registrado",
        "de": "Nicht erfasst",
        "ja": "記録なし",
        "ru": "Не записано",
        "id": "Tidak tercatat",
        "ko": "기록되지 않음",
        "uk": "Не записано"
    },
    "PDF export engine is loading. Please try again.": {
        "en": "PDF export engine is loading. Please try again.",
        "es": "El motor de exportación de PDF se está cargando. Inténtelo de nuevo.",
        "hi": "PDF निर्यात इंजन लोड हो रहा है। कृपया पुनः प्रयास करें।",
        "ar": "محرك تصدير PDF قيد التحميل. يرجى المحاولة مرة أخرى.",
        "zh": "PDF导出引擎正在加载，请重试。",
        "fr": "Le moteur d'exportation PDF est en cours de chargement. Veuillez réessayer.",
        "pt": "O mecanismo de exportação de PDF está carregando. Tente novamente.",
        "de": "Die PDF-Export-Engine wird geladen. Bitte versuchen Sie es erneut.",
        "ja": "PDFエクスポートエンジンを読み込み中です。もう一度お試しください。",
        "ru": "Модуль экспорта PDF загружается. Пожалуйста, повторите попытку.",
        "id": "Mesin ekspor PDF sedang memuat. Silakan coba lagi.",
        "ko": "PDF 내보내기 엔진을 로드하는 중입니다. 다시 시도하십시오.",
        "uk": "Модуль експорту PDF завантажується. Будь ласка, спробуйте ще раз."
    },
    "Parameter": {
        "en": "Parameter",
        "es": "Parámetro",
        "hi": "पैरामीटर",
        "ar": "المعلمة",
        "zh": "参数",
        "fr": "Paramètre",
        "pt": "Parâmetro",
        "de": "Parameter",
        "ja": "パラメータ",
        "ru": "Параметр",
        "id": "Parameter",
        "ko": "매개변수",
        "uk": "Параметр"
    },
    "RISER MARGIN EQUIVALENT": {
        "en": "RISER MARGIN EQUIVALENT",
        "es": "EQUIVALENTE DE MARGEN DE RISER",
        "hi": "राइज़र मार्जिन समतुल्य (RISER MARGIN EQUIVALENT)",
        "ar": "مكافئ هامش الصاعد (RISER MARGIN)",
        "zh": "隔水管安全裕度当量 (RISER MARGIN)",
        "fr": "ÉQUIVALENT DE MARGE DE RISER",
        "pt": "EQUIVALENTE DA MARGEM DE RISER",
        "de": "ÄQUIVALENTE RISER-MARGE",
        "ja": "ライザーマージン等価値",
        "ru": "ЭКВИВАЛЕНТ ЗАПАСА РАЙЗЕРА",
        "id": "EKUIVALEN MARGIN RISER",
        "ko": "라이저 마진 등가치",
        "uk": "ЕКВІВАЛЕНТ ЗАПАСУ РАЙЗЕРА"
    },
    "SAFE": {
        "en": "SAFE",
        "es": "SEGURO",
        "hi": "सुरक्षित (SAFE)",
        "ar": "آمن (SAFE)",
        "zh": "安全 (SAFE)",
        "fr": "SÉCURISÉ",
        "pt": "SEGURO",
        "de": "SICHER",
        "ja": "安全 (SAFE)",
        "ru": "БЕЗОПАСНО",
        "id": "AMAN",
        "ko": "안전 (SAFE)",
        "uk": "БЕЗПЕЧНО"
    },
    "Step": {
        "en": "Step",
        "es": "Paso",
        "hi": "चरण",
        "ar": "الخطوة",
        "zh": "步骤",
        "fr": "Étape",
        "pt": "Passo",
        "de": "Schritt",
        "ja": "ステップ",
        "ru": "Шаг",
        "id": "Langkah",
        "ko": "단계",
        "uk": "Крок"
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
    for key, trans_dict in new_keys.items():
        val = trans_dict[loc]
        escaped_key = key.replace('"', '\\"')
        escaped_val = val.replace('"', '\\"')
        lines_to_insert.append(f'    "{escaped_key}": "{escaped_val}",\n')
    
    insertion_text = "".join(lines_to_insert)
    content = content[:insert_pos] + insertion_text + content[insert_pos:]

with open('translations.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully added {len(new_keys)} keys to all 13 locales!")
