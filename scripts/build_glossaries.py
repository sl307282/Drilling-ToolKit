#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates technical oil & gas drilling terminology glossaries for all 11 languages:
glossary-ru.md, glossary-hi.md, glossary-ar.md, glossary-zh.md, glossary-es.md,
glossary-fr.md, glossary-pt.md, glossary-de.md, glossary-ja.md, glossary-id.md, glossary-ko.md
following the gold standard format of glossary-uk.md.
"""

import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

TERMS = [
    # Section 1: General Drilling & Well Equipment
    ("General Drilling & Well Equipment", [
        ("Drilling Toolkit", {
            "ru": "Буровой инструментарий",
            "hi": "ड्रिलिंग टूलकिट",
            "ar": "مجموعة أدوات الحفر",
            "zh": "钻井工具箱",
            "es": "Kit de Herramientas de Perforación",
            "fr": "Boîte à outils de forage",
            "pt": "Kit de Ferramentas de Perfuração",
            "de": "Bohr-Toolkit",
            "ja": "掘削ツールキット",
            "id": "Perangkat Pengeboran (Drilling Toolkit)",
            "ko": "시추 툴킷"
        }, "App name / Professional brand name"),
        ("Drilling", {
            "ru": "Бурение",
            "hi": "ड्रिलिंग (वेधन)",
            "ar": "الحفر",
            "zh": "钻井",
            "es": "Perforación",
            "fr": "Forage",
            "pt": "Perfuração",
            "de": "Bohren / Bohrung",
            "ja": "掘削",
            "id": "Pengeboran",
            "ko": "시추"
        }, "Core drilling process"),
        ("Wellbore", {
            "ru": "Ствол скважины",
            "hi": "वेलबोर (कूप-छिद्र)",
            "ar": "جوف البئر",
            "zh": "井眼 / 井筒",
            "es": "Pozo / Agujero",
            "fr": "Puits / Trou de forage",
            "pt": "Poço / Furo",
            "de": "Bohrloch / Bohrlochpfad",
            "ja": "坑井 / ボアホール",
            "id": "Lubang Sumur",
            "ko": "시추공 (웰보어)"
        }, "The drilled borehole path"),
        ("Wellhead", {
            "ru": "Устье скважины",
            "hi": "वेलहेड (कूप-मुख)",
            "ar": "رأس البئر",
            "zh": "井口",
            "es": "Cabezal de pozo",
            "fr": "Tête de puits",
            "pt": "Cabeça de poço",
            "de": "Bohrlochkopf",
            "ja": "坑口 (ウェルヘッド)",
            "id": "Kepala Sumur (Wellhead)",
            "ko": "웰헤드 (시추공두)"
        }, "Surface / subsea well termination"),
        ("Subsea Wellhead", {
            "ru": "Подводное устье скважины",
            "hi": "सबसी वेलहेड",
            "ar": "رأس البئر تحت سطح البحر",
            "zh": "水下井口",
            "es": "Cabezal submarino",
            "fr": "Tête de puits sous-marine",
            "pt": "Cabeça de poço submarina",
            "de": "Unterwasser-Bohrlochkopf (Subsea)",
            "ja": "サブシー坑口",
            "id": "Wellhead Bawah Laut",
            "ko": "해저 웰헤드"
        }, "Offshore seabed wellhead system"),
        ("Surface Wellhead", {
            "ru": "Наземное устье скважины",
            "hi": "सतह वेलहेड",
            "ar": "رأس البئر السطحي",
            "zh": "地面井口",
            "es": "Cabezal de superficie",
            "fr": "Tête de puits de surface",
            "pt": "Cabeça de poço de superfície",
            "de": "Tages-Bohrlochkopf",
            "ja": "地上坑口",
            "id": "Wellhead Permukaan",
            "ko": "지상 웰헤드"
        }, "Land or platform wellhead"),
        ("Drilling Rig", {
            "ru": "Буровая установка",
            "hi": "ड्रिलिंग रिग",
            "ar": "منصة الحفر / برج الحفر",
            "zh": "钻机 / 钻井平台",
            "es": "Equipo de perforación (Rig)",
            "fr": "Appareil de forage (Rig)",
            "pt": "Sonda de perfuração",
            "de": "Bohranlage / Bohrturm",
            "ja": "掘削リグ",
            "id": "Rig Pengeboran",
            "ko": "시추 리그"
        }, "Complete drilling rig package"),
        ("Land Rig", {
            "ru": "Наземная буровая установка",
            "hi": "लैंड रिग (स्थलीय रिग)",
            "ar": "منصة حفر برية",
            "zh": "陆地钻机",
            "es": "Equipo de perforación terrestre",
            "fr": "Appareil de forage terrestre",
            "pt": "Sonda terrestre",
            "de": "Land-Bohranlage",
            "ja": "陸上リグ",
            "id": "Rig Darat",
            "ko": "육상 리그"
        }, "Onshore rig"),
        ("Jack-up Rig", {
            "ru": "Самоподъемная буровая установка (СПБУ)",
            "hi": "जैक-अप रिग",
            "ar": "منصة ذاتية الرفع (جاك اب)",
            "zh": "自升式钻井平台",
            "es": "Plataforma auto-elevable (Jack-up)",
            "fr": "Plateforme auto-élévatrice (Jack-up)",
            "pt": "Plataforma auto-elevatória (Jack-up)",
            "de": "Hubinsel-Bohranlage (Jack-up)",
            "ja": "ジャッキアップリグ",
            "id": "Rig Jack-up",
            "ko": "잭업 리그"
        }, "Shallow water bottom-supported rig"),
        ("Floater / Semi-submersible", {
            "ru": "Плавучая буровая установка (ППБУ / буровое судно)",
            "hi": "फ्लोटर / सेमी-सबमर्सिबल",
            "ar": "منصة عائمة / شبه غاطسة",
            "zh": "半潜式钻井平台 / 浮式钻井船",
            "es": "Equipo flotante / Semi-sumergible",
            "fr": "Appareil flottant / Semi-submersible",
            "pt": "Sonda flutuante / Semi-submersível",
            "de": "Halbtaucher / Bohrschiff (Floater)",
            "ja": "セミサブ型 / フローターリグ",
            "id": "Rig Apung / Semi-submersible",
            "ko": "반잠수식 시추선 (플로터)"
        }, "Deepwater floating drilling vessel"),
        ("BOP (Blowout Preventer)", {
            "ru": "ПВО (превенторный блок)",
            "hi": "बीओपी (ब्लोआउट प्रिवेंटर)",
            "ar": "مانع الانفجار (BOP)",
            "zh": "防喷器 (BOP)",
            "es": "Preventor de reventones (BOP)",
            "fr": "Bloc obturateur de puits (BOP)",
            "pt": "Preventor de erupção (BOP)",
            "de": "Blowout-Preventer (BOP)",
            "ja": "噴出防止装置 (BOP)",
            "id": "Pencegah Semburan Liar (BOP)",
            "ko": "폭발 방지 장치 (BOP)"
        }, "Well control pressure barrier"),
        ("Surface Stack", {
            "ru": "Наземное превенторное компонование",
            "hi": "सरफेस स्टैक",
            "ar": "مجموعة موانع الانفجار السطحية",
            "zh": "地面防喷器组",
            "es": "Conjunto de superficie (Surface Stack)",
            "fr": "Ensemble d'obturateurs de surface",
            "pt": "Stack de superfície",
            "de": "Oberflächen-BOP-Stack",
            "ja": "サーフェススタック",
            "id": "Susunan BOP Permukaan",
            "ko": "지상 BOP 스택"
        }, "Surface BOP arrangement"),
        ("Subsea Stack", {
            "ru": "Подводное превенторное компонование",
            "hi": "सबसी स्टैक",
            "ar": "مجموعة موانع الانفجار تحت سطح البحر",
            "zh": "水下防喷器组",
            "es": "Conjunto submarino (Subsea Stack)",
            "fr": "Ensemble d'obturateurs sous-marins",
            "pt": "Stack submarino",
            "de": "Unterwasser-BOP-Stack",
            "ja": "サブシースタック",
            "id": "Susunan BOP Bawah Laut",
            "ko": "해저 BOP 스택"
        }, "Seabed BOP arrangement"),
        ("Choke Line", {
            "ru": "Дроссельная линия",
            "hi": "चोक लाइन",
            "ar": "خط الخنق",
            "zh": "节流管线",
            "es": "Línea de estrangulación (Choke Line)",
            "fr": "Ligne de duse (Choke line)",
            "pt": "Linha de choke",
            "de": "Drosselleitung (Chokeline)",
            "ja": "チョークライン",
            "id": "Jalur Choke",
            "ko": "초크 라인"
        }, "High pressure well control choke conduit"),
        ("Choke Line Friction (CLF)", {
            "ru": "Гидравлическое сопротивление дроссельной линии (CLF)",
            "hi": "चोक लाइन घर्षण (CLF)",
            "ar": "احتكاك خط الخنق (CLF)",
            "zh": "节流管线摩擦压降 (CLF)",
            "es": "Fricción de la línea de estrangulación (CLF)",
            "fr": "Pertes de charge de la ligne de duse (CLF)",
            "pt": "Perda de carga na linha de choke (CLF)",
            "de": "Chokeline-Reibungsdruckverlust (CLF)",
            "ja": "チョークライン流動摩擦圧損 (CLF)",
            "id": "Gesekan Saluran Choke (CLF)",
            "ko": "초크 라인 마찰 압력 손실 (CLF)"
        }, "Subsea well control hydraulic pressure loss"),
        ("Kill Line", {
            "ru": "Линия глушения",
            "hi": "किल लाइन",
            "ar": "خط القتل",
            "zh": "压井管线",
            "es": "Línea de ahogo (Kill Line)",
            "fr": "Ligne de neutralisation (Kill line)",
            "pt": "Linha de amortecimento (Kill line)",
            "de": "Tötungsleitung (Kill line)",
            "ja": "キルライン",
            "id": "Jalur Kill",
            "ko": "킬 라인"
        }, "Conduit for pumping kill fluid"),
        ("Marine Riser", {
            "ru": "Морской райзер (водоотделитель)",
            "hi": "मरीन राइजर",
            "ar": "الأنبوب الصاعد البحري (الرايزر)",
            "zh": "隔水管 (Marine Riser)",
            "es": "Tubo elevador marino (Riser)",
            "fr": "Tube prolongateur marin (Riser)",
            "pt": "Riser marítimo",
            "de": "Marine Riser / Steigrohr",
            "ja": "マリンライザー",
            "id": "Riser Lepas Pantai (Marine Riser)",
            "ko": "해양 라이저"
        }, "Conduit connecting subsea BOP to drilling vessel"),
        ("Riserless", {
            "ru": "Безрайзерное бурение",
            "hi": "राइजरलेस (बिना राइजर)",
            "ar": "بدون رايزر",
            "zh": "无隔水管作业",
            "es": "Sin riser (Riserless)",
            "fr": "Sans riser",
            "pt": "Sem riser (Riserless)",
            "de": "Ohne Riser (Riserless)",
            "ja": "ライザーレス",
            "id": "Tanpa Riser (Riserless)",
            "ko": "라이저리스 (무라이저)"
        }, "Tophole drilling directly to seabed without marine riser"),
        ("Air Gap", {
            "ru": "Воздушный зазор (Air Gap)",
            "hi": "एयर गैप",
            "ar": "الفجوة الهوائية (Air Gap)",
            "zh": "气隙高度 (Air Gap)",
            "es": "Espacio de aire (Air Gap)",
            "fr": "Tirant d'air (Air gap)",
            "pt": "Distância vertical livre (Air gap)",
            "de": "Luftspalt (Air Gap)",
            "ja": "エアギャップ (気空間)",
            "id": "Celah Udara (Air Gap)",
            "ko": "에어 갭 (해수면 고도차)"
        }, "Distance from drill floor (RKB) to sea level"),
        ("Water Depth", {
            "ru": "Глубина воды",
            "hi": "जल गहराई (वॉटर डेप्थ)",
            "ar": "عمق المياه",
            "zh": "水深",
            "es": "Tirante de agua / Profundidad de agua",
            "fr": "Profondeur d'eau",
            "pt": "Lâmina d'água",
            "de": "Wassertiefe",
            "ja": "水深",
            "id": "Kedalaman Air",
            "ko": "수심"
        }, "Distance from sea level to seabed"),
        ("Mudline / Seabed", {
            "ru": "Морское дно (линия дна / Mudline)",
            "hi": "मडलाइन / समुद्र तल",
            "ar": "قاع البحر (Mudline)",
            "zh": "泥线 / 海床 (Mudline)",
            "es": "Línea de lodo / Lecho marino (Mudline)",
            "fr": "Fond marin (Mudline)",
            "pt": "Linha de lama / Leito marinho (Mudline)",
            "de": "Meeresboden (Mudline)",
            "ja": "泥面 / 海底 (マッドライン)",
            "id": "Dasar Laut (Mudline)",
            "ko": "해저면 (머드라인)"
        }, "Seafloor sediment reference datum")
    ]),

    # Section 2: Tubulars & Casing Strings
    ("Tubulars & Casing Strings", [
        ("Tubular / Tubulars", {
            "ru": "Трубы / Трубные элементы",
            "hi": "ट्यूबलर / पाइप",
            "ar": "أنابيب الحفر والتغليف",
            "zh": "管材 / 管柱",
            "es": "Tubulares",
            "fr": "Tubulaires",
            "pt": "Tubulares",
            "de": "Rohrkomponenten (Tubulars)",
            "ja": "管材 (チューブラ)",
            "id": "Pipa Tubuler",
            "ko": "튜블러 (관재)"
        }, "Oil country tubular goods (OCTG)"),
        ("Casing", {
            "ru": "Обсадная колонна",
            "hi": "केसिंग (आवरण नलिका)",
            "ar": "أنابيب التغليف",
            "zh": "套管",
            "es": "Tubería de revestimiento (Casing)",
            "fr": "Colonne de tubage (Casing)",
            "pt": "Revestimento (Casing)",
            "de": "Futterrohr / Verrohrung (Casing)",
            "ja": "ケーシング",
            "id": "Casing (Pipa Selubung)",
            "ko": "케이싱 (보호관)"
        }, "Steel casing string protecting borehole"),
        ("Conductor / Conductor Pipe", {
            "ru": "Направляющая колонна (кондуктор)",
            "hi": "कंडक्टर पाइप",
            "ar": "أنبوب التوجيه (الكوندكتور)",
            "zh": "导管 (Conductor)",
            "es": "Tubería conductora (Conductor)",
            "fr": "Tube conducteur (Conductor)",
            "pt": "Tubo condutor (Conductor)",
            "de": "Leitrohr (Conductor)",
            "ja": "コンダクターパイプ",
            "id": "Pipa Konduktor",
            "ko": "도관 (컨덕터 파이프)"
        }, "30\" to 36\" large structural casing"),
        ("Surface Casing", {
            "ru": "Кондукторная колонна",
            "hi": "सरफेस केसिंग",
            "ar": "أنبوب التغليف السطحي",
            "zh": "表层套管",
            "es": "Revestimiento superficial",
            "fr": "Tubage de surface",
            "pt": "Revestimento de superfície",
            "de": "Standrohrtour (Surface Casing)",
            "ja": "サーフェスケーシング",
            "id": "Casing Permukaan",
            "ko": "표층 케이싱"
        }, "20\" shallow groundwater barrier casing"),
        ("Intermediate Casing", {
            "ru": "Промежуточная обсадная колонна",
            "hi": "इंटरमीडिएट केसिंग",
            "ar": "أنبوب التغليف الوسيط",
            "zh": "技术套管",
            "es": "Revestimiento intermedio",
            "fr": "Tubage intermédiaire",
            "pt": "Revestimento intermediário",
            "de": "Zwischenverrohrung",
            "ja": "中間ケーシング",
            "id": "Casing Perantara",
            "ko": "중간 케이싱"
        }, "13-3/8\" / 9-5/8\" casing isolating unstable formations"),
        ("Production Casing", {
            "ru": "Эксплуатационная колонна",
            "hi": "प्रोडक्शन केसिंग",
            "ar": "أنبوب التغليف الإنتاجي",
            "zh": "油层套管 / 生产套管",
            "es": "Revestimiento de producción",
            "fr": "Tubage de production",
            "pt": "Revestimento de produção",
            "de": "Produktionsverrohrung",
            "ja": "生産ケーシング",
            "id": "Casing Produksi",
            "ko": "생산용 케이싱"
        }, "Casing isolating target hydrocarbon reservoir"),
        ("Liner", {
            "ru": "Хвостовик (лайнер)",
            "hi": "लाइनर",
            "ar": "بطانة التغليف (اللاينر)",
            "zh": "尾管 / 衬管 (Liner)",
            "es": "Tubería corta (Liner)",
            "fr": "Colonne perdue (Liner)",
            "pt": "Liner (Coluna perdida)",
            "de": "Liner (Verlorene Rohrtour)",
            "ja": "ライナー",
            "id": "Liner",
            "ko": "라이너"
        }, "Casing string suspended from previous shoe without extending to surface"),
        ("Casing Shoe", {
            "ru": "Башмак обсадной колонны",
            "hi": "केसिंग शू",
            "ar": "حذاء أنبوب التغليف",
            "zh": "套管鞋",
            "es": "Zapata de revestimiento (Shoe)",
            "fr": "Sabot de tubage (Shoe)",
            "pt": "Sapata de revestimento",
            "de": "Bohrschuh / Rohrschuh",
            "ja": "ケーシングシュー",
            "id": "Sepatu Casing (Casing Shoe)",
            "ko": "케이싱 슈 (하단 가이드)"
        }, "Reinforced lower guide terminal of casing string"),
        ("Shoe Track", {
            "ru": "Башмачный патрубок (зумпф)",
            "hi": "शू ट्रैक",
            "ar": "مسار الحذاء (بين الصمام والحذاء)",
            "zh": "套管鞋段 (Shoe Track)",
            "es": "Tramo de zapata (Shoe Track)",
            "fr": "Espace sabot-collier (Shoe track)",
            "pt": "Trecho da sapata (Shoe track)",
            "de": "Schuhtrack (Strecke Schuh-Ventil)",
            "ja": "シュートラック",
            "id": "Ruang Sepatu (Shoe Track)",
            "ko": "슈 트랙 (플로트 칼라와 슈 사이)"
        }, "Internal casing section between float collar and shoe"),
        ("Float Collar", {
            "ru": "Обратный клапан (муфта со встроенным клапаном)",
            "hi": "फ्लोट कॉलर",
            "ar": "طوق الصمام الراجع (Float Collar)",
            "zh": "浮箍 (Float Collar)",
            "es": "Cuello flotador (Float Collar)",
            "fr": "Collier à clapet (Float collar)",
            "pt": "Colar flutuador (Float collar)",
            "de": "Rückschlagventil-Muffe (Float Collar)",
            "ja": "フロートカラー",
            "id": "Float Collar",
            "ko": "플로트 칼라 (역류방지 밸브 칼라)"
        }, "Check-valve casing coupling retaining wiper plugs"),
        ("Drill Pipe (DP)", {
            "ru": "Бурильная труба (СБТ)",
            "hi": "ड्रिल पाइप (DP)",
            "ar": "أنبوب الحفر (DP)",
            "zh": "钻杆 (DP)",
            "es": "Tubería de perforación (DP)",
            "fr": "Tige de forage (DP)",
            "pt": "Tubo de perfuração (DP)",
            "de": "Bohrgestänge (Drill Pipe)",
            "ja": "ドリルパイプ (DP)",
            "id": "Pipa Bor (Drill Pipe)",
            "ko": "드릴 파이프 (시추 파이프)"
        }, "Standard seamless drill pipe conveying rotary torque and fluid"),
        ("Heavy Weight Drill Pipe (HWDP)", {
            "ru": "Утяжеленная бурильная труба (УБТ / толстостенная)",
            "hi": "हैवी वेट ड्रिल पाइप (HWDP)",
            "ar": "أنابيب الحفر الثقيلة (HWDP)",
            "zh": "加重钻杆 (HWDP)",
            "es": "Tubería de perforación pesada (HWDP)",
            "fr": "Tiges lourdes (HWDP)",
            "pt": "Tubos pesados de perfuração (HWDP)",
            "de": "Schwergestänge (HWDP)",
            "ja": "ヘビーウェイトドリルパイプ (HWDP)",
            "id": "Pipa Bor Berat (HWDP)",
            "ko": "헤비웨이트 드릴 파이프 (HWDP)"
        }, "Thick-walled intermediate drillstring transition section"),
        ("Drill Collar (DC)", {
            "ru": "Утяжеленная бурильная труба (УБТ)",
            "hi": "ड्रिल कॉलर (DC)",
            "ar": "أطواق الحفر الثقيلة (DC)",
            "zh": "钻铤 (Drill Collar)",
            "es": "Portamechas / Lastrabarrenas (DC)",
            "fr": "Masse-tiges (DC)",
            "pt": "Comandos de perfuração (DC)",
            "de": "Schwerstange (Drill Collar)",
            "ja": "ドリルカラー (DC)",
            "id": "Drill Collar (DC)",
            "ko": "드릴 칼라 (중량 시추관)"
        }, "Heavy thick-walled collars providing weight on bit (WOB)"),
        ("Open Hole", {
            "ru": "Открытый ствол скважины",
            "hi": "ओपन होल",
            "ar": "القطاع المفتوح من البئر",
            "zh": "裸眼井段 (Open Hole)",
            "es": "Hueco abierto / Agujero descubierto",
            "fr": "Trou découvert (Open hole)",
            "pt": "Poço aberto (Open hole)",
            "de": "Offenes Bohrloch (Open Hole)",
            "ja": "裸坑 (オープンホール)",
            "id": "Lubang Terbuka (Open Hole)",
            "ko": "오픈 홀 (나공 구간)"
        }, "Uncased rock borehole section below casing shoe"),
        ("Burst Pressure / Rating", {
            "ru": "Сопротивление внутреннему давлению (давление разрыва)",
            "hi": "बर्स्ट प्रेशर / रेटिंग",
            "ar": "ضغط الانفجار الداخلي للأنابيب",
            "zh": "抗内压强度 (Burst Rating)",
            "es": "Resistencia a la presión interna (Burst)",
            "fr": "Pression d'éclatement (Burst)",
            "pt": "Resistência à pressão interna (Burst)",
            "de": "Innendruck-Berstgrenze (Burst)",
            "ja": "破裂圧力 (バースト耐圧)",
            "id": "Tekanan Pecah (Burst Pressure)",
            "ko": "파열 압력 (내압 강도)"
        }, "API internal pressure yield capability"),
        ("Collapse Pressure / Rating", {
            "ru": "Сопротивление внешнему давлению (давление смятия)",
            "hi": "कोलैप्स प्रेशर / रेटिंग",
            "ar": "مقاومة الانبعاج الخارجي (Collapse)",
            "zh": "抗外挤强度 (Collapse Rating)",
            "es": "Resistencia al colapso externo",
            "fr": "Pression d'écrasement (Collapse)",
            "pt": "Resistência ao colapso externo",
            "de": "Außendruck-Kollapsgrenze",
            "ja": "圧壊圧力 (コラプス耐圧)",
            "id": "Tekanan Kolaps (Collapse Pressure)",
            "ko": "압궤 압력 (외압 붕괴 강도)"
        }, "API external pressure crushing resistance")
    ]),

    # Section 3: Well Cementing
    ("Well Cementing", [
        ("Cementing", {
            "ru": "Цементирование скважины",
            "hi": "सीमेंटिंग (कूप सीमेंटिकरण)",
            "ar": "عمليات تسميت الآبار",
            "zh": "固井作业",
            "es": "Cementación de pozos",
            "fr": "Cimentation de puits",
            "pt": "Cimentação de poços",
            "de": "Zementation / Bohrlochzementierung",
            "ja": "セメンティング (セメント作業)",
            "id": "Sementasi Sumur",
            "ko": "시멘팅 (유정 시멘트 작업)"
        }, "Well casing cementing operation"),
        ("Cement Job Planner", {
            "ru": "Планировщик цементирования",
            "hi": "सीमेंटिंग जॉब प्लानर",
            "ar": "مخطط عمليات التسميت",
            "zh": "固井方案设计器",
            "es": "Planificador de cementación",
            "fr": "Planificateur de cimentation",
            "pt": "Planejador de cimentação",
            "de": "Zementier-Arbeitsplaner",
            "ja": "セメンティング作業プランナー",
            "id": "Perencana Pekerjaan Sementasi",
            "ko": "시멘팅 작업 플래너"
        }, "Subsea / surface casing cement design module"),
        ("Cement Slurry", {
            "ru": "Цементный раствор",
            "hi": "सीमेंट स्लरी (मिश्रण)",
            "ar": "ملاط الأسمنت",
            "zh": "水泥浆",
            "es": "Lechada de cemento",
            "fr": "Laitier de ciment (Slurry)",
            "pt": "Pasta de cimento",
            "de": "Zementsuspension (Slurry)",
            "ja": "セメントスラリー",
            "id": "Slurry Semen",
            "ko": "시멘트 슬러리 (배합액)"
        }, "Hydraulic cement mixed with water and chemical additives"),
        ("Lead Slurry", {
            "ru": "Головной (облегченный) цементный раствор",
            "hi": "लीड स्लरी",
            "ar": "ملاط الأسمنت التمهيدي الخفيف (Lead)",
            "zh": "领浆 / 低密度水泥浆 (Lead Slurry)",
            "es": "Lechada de llenado / liviana (Lead)",
            "fr": "Laitier de tête / allégé (Lead)",
            "pt": "Pasta de preenchimento (Lead)",
            "de": "Vorlauf-Zementsuspension (Lead)",
            "ja": "リードスラリー (低比重スラリー)",
            "id": "Lead Slurry (Slurry Pengisi)",
            "ko": "리드 슬러리 (저비중 선행 시멘트)"
        }, "Low density filler cement slurry placed high in annulus"),
        ("Tail Slurry", {
            "ru": "Хвостовой (тяжелый) цементный раствор",
            "hi": "टेल स्लरी",
            "ar": "ملاط الأسمنت النهائي عالي الكثافة (Tail)",
            "zh": "尾浆 / 高强度水泥浆 (Tail Slurry)",
            "es": "Lechada de cola / pesada (Tail)",
            "fr": "Laitier de queue / dense (Tail)",
            "pt": "Pasta de cauda (Tail)",
            "de": "Nachlauf-Zementsuspension (Tail)",
            "ja": "テイルスラリー (高強度スラリー)",
            "id": "Tail Slurry (Slurry Penutup)",
            "ko": "테일 슬러리 (고비중 고강도 후행 시멘트)"
        }, "High density high compressive strength cement slurry across shoe"),
        ("Spacer", {
            "ru": "Буферная жидкость (спейсер)",
            "hi": "स्पेसर",
            "ar": "سائل المباعدة الفاصل (Spacer)",
            "zh": "隔离液 (Spacer)",
            "es": "Espaciador (Spacer)",
            "fr": "Fluide tampon (Spacer)",
            "pt": "Fluido espaçador (Spacer)",
            "de": "Abstandshalter-Flüssigkeit (Spacer)",
            "ja": "スペーサー (分離液)",
            "id": "Cairan Spacer",
            "ko": "스페이서 (완충 분리액)"
        }, "Weighted rheologically tuned fluid separating mud and cement"),
        ("Displacement Fluid", {
            "ru": "Продавочная жидкость",
            "hi": "विस्थापन द्रव (डिस्प्लेसमेंट फ्लूइड)",
            "ar": "سائل الإزاحة",
            "zh": "顶替液 (Displacement Fluid)",
            "es": "Fluido de desplazamiento",
            "fr": "Fluide de déplacement",
            "pt": "Fluido de deslocamento",
            "de": "Verdrängungsflüssigkeit",
            "ja": "置換流体 (ディスプレースメント流体)",
            "id": "Fluida Pendorong (Displacement)",
            "ko": "치환 유체 (밀어내기 액)"
        }, "Drilling mud or brine pumped behind plugs to displace slurry into annulus"),
        ("Annular Rise", {
            "ru": "Высота подъема в затрубье",
            "hi": "एनुलर राइज (वलयाकार वृद्धि)",
            "ar": "ارتفاع السائل في الحيز الحلقي",
            "zh": "环空上返高度",
            "es": "Ascenso anular / Altura en el anular",
            "fr": "Montée dans l'annulaire",
            "pt": "Altura de subida no anular",
            "de": "Ringraum-Aufstiegshöhe",
            "ja": "環状部上昇高",
            "id": "Kenaikan Annular",
            "ko": "환상 공간 상승 높이 (애뉴러스 라이즈)"
        }, "Vertical height of fluid column in annulus"),
        ("Top of Cement (TOC)", {
            "ru": "Верхняя граница цемента (TOC)",
            "hi": "टॉप ऑफ सीमेंट (TOC)",
            "ar": "قمة عمود الأسمنت (TOC)",
            "zh": "水泥顶面高度 (TOC)",
            "es": "Tope del cemento (TOC)",
            "fr": "Sommet du ciment (TOC)",
            "pt": "Topo do cimento (TOC)",
            "de": "Zementobergrenze (TOC)",
            "ja": "セメント上面 (TOC)",
            "id": "Puncak Semen (TOC)",
            "ko": "시멘트 최상단 깊이 (TOC)"
        }, "Measured depth or TVD of uppermost annular cement column")
    ]),

    # Section 4: Fluids, Pressures & Hydraulics
    ("Fluids, Pressures & Hydraulics", [
        ("Mud Weight (MW)", {
            "ru": "Плотность бурового раствора (MW)",
            "hi": "मड वेट (MW / घोल घनत्व)",
            "ar": "كثافة طين الحفر (MW)",
            "zh": "泥浆密度 (MW)",
            "es": "Densidad del lodo (MW)",
            "fr": "Densité de la boue (MW)",
            "pt": "Massa específica da lama (MW)",
            "de": "Spülungsdichte (MW)",
            "ja": "泥水比重 (MW)",
            "id": "Berat Lumpur (MW)",
            "ko": "이수 비중 (머드 웨이트 MW)"
        }, "Drilling fluid specific gravity / density (ppg, SG, kg/m³)"),
        ("Equivalent Circulating Density (ECD)", {
            "ru": "Эквивалентная циркуляционная плотность (ECD)",
            "hi": "समतुल्य परिसंचारी घनत्व (ECD)",
            "ar": "الكثافة المكافئة أثناء الدوران (ECD)",
            "zh": "当量循环密度 (ECD)",
            "es": "Densidad equivalente de circulación (ECD)",
            "fr": "Densité équivalente en circulation (ECD)",
            "pt": "Densidade equivalente de circulação (ECD)",
            "de": "Äquivalente Zirkulationsdichte (ECD)",
            "ja": "等価循環密度 (ECD)",
            "id": "Kerapatan Sirkulasi Setara (ECD)",
            "ko": "등가 순환 밀도 (ECD)"
        }, "Static mud density plus annular hydraulic pressure loss"),
        ("Hydrostatic Pressure", {
            "ru": "Гидростатическое давление",
            "hi": "हाइड्रोस्टैटिक दबाव",
            "ar": "الضغط الهيدروستاتيكي",
            "zh": "静液压力",
            "es": "Presión hidrostática",
            "fr": "Pression hydrostatique",
            "pt": "Pressão hidrostática",
            "de": "Hydrostatischer Druck",
            "ja": "静水圧",
            "id": "Tekanan Hidrostatis",
            "ko": "정수압 (유체 정압)"
        }, "Static pressure exerted by column of liquid (psi = 0.052 * MW * TVD)"),
        ("Shut-In Drill Pipe Pressure (SIDPP)", {
            "ru": "Давление в бурильных трубах при закрытом устье (SIDPP)",
            "hi": "शट-इन ड्रिल पाइप प्रेशर (SIDPP)",
            "ar": "ضغط أنابيب الحفر عند الإغلاق (SIDPP)",
            "zh": "关井钻杆压力 (SIDPP)",
            "es": "Presión de cierre en tubería de perforación (SIDPP)",
            "fr": "Pression en tiges fermées (SIDPP)",
            "pt": "Pressão de fechamento no tubo de perfuração (SIDPP)",
            "de": "Eingeschlossener Bohrgestängedruck (SIDPP)",
            "ja": "閉口時ドリルパイプ圧 (SIDPP)",
            "id": "Tekanan Pipa Bor Tertutup (SIDPP)",
            "ko": "폐쇄 드릴 파이프 압력 (SIDPP)"
        }, "Gauge pressure on drillpipe after shutting in well on kick"),
        ("Shut-In Casing Pressure (SICP)", {
            "ru": "Давление в затрубье при закрытом устье (SICP)",
            "hi": "शट-इन केसिंग प्रेशर (SICP)",
            "ar": "ضغط أنبوب التغليف عند الإغلاق (SICP)",
            "zh": "关井套管压力 (SICP)",
            "es": "Presión de cierre en revestimiento (SICP)",
            "fr": "Pression en tête d'annulaire fermé (SICP)",
            "pt": "Pressão de fechamento no revestimento (SICP)",
            "de": "Eingeschlossener Futterrohrdruck (SICP)",
            "ja": "閉口時ケーシング圧 (SICP)",
            "id": "Tekanan Casing Tertutup (SICP)",
            "ko": "폐쇄 케이싱 압력 (SICP)"
        }, "Gauge pressure on casing annulus after shutting in well on kick"),
        ("Kill Mud Weight (KMW)", {
            "ru": "Плотность раствора глушения (KMW)",
            "hi": "किल मड वेट (KMW)",
            "ar": "كثافة طين القتل اللازمة (KMW)",
            "zh": "压井泥浆密度 (KMW)",
            "es": "Densidad del lodo de ahogo (KMW)",
            "fr": "Densité de boue de neutralisation (KMW)",
            "pt": "Densidade de lama de amortecimento (KMW)",
            "de": "Tötungsschlammdichte (KMW)",
            "ja": "キル泥水比重 (KMW)",
            "id": "Berat Lumpur Matian (KMW)",
            "ko": "킬 머드 비중 (유정 제어 이수 밀도 KMW)"
        }, "Calculated fluid density to balance formation pore pressure"),
        ("Leak Off Test (LOT)", {
            "ru": "Испытание на гидроразрыв пласта (LOT)",
            "hi": "लीक-ऑफ टेस्ट (LOT)",
            "ar": "اختبار تسريب التكوين (LOT)",
            "zh": "地层漏失试验 (LOT)",
            "es": "Prueba de goteo / admisión (LOT)",
            "fr": "Test de fuite de formation (LOT)",
            "pt": "Teste de absorção (LOT)",
            "de": "Druckaufnahmetest (Leak-Off Test LOT)",
            "ja": "リークオフテスト (地層耐圧試験 LOT)",
            "id": "Uji Kebocoran Formasi (LOT)",
            "ko": "누출 시험 (지층 파쇄 압력 시험 LOT)"
        }, "Formation fracture pressure test immediately below shoe")
    ]),

    # Section 5: Drilling Bits & Dull Grading (IADC)
    ("Drilling Bits & Dull Grading (IADC)", [
        ("Bit Dull Grading", {
            "ru": "Оценка износа долота (IADC)",
            "hi": "बिट डल ग्रेडिंग (घिसाव मूल्यांकन)",
            "ar": "تقييم تآكل رأس الحفر (IADC)",
            "zh": "钻头磨损分级 (IADC)",
            "es": "Evaluación de desgaste de brocas (IADC)",
            "fr": "Évaluation d'usure de trépan (IADC)",
            "pt": "Avaliação de desgaste de brocas (IADC)",
            "de": "Meißelverschleißbewertung (IADC)",
            "ja": "ビット摩耗評価 (IADC ダルグレーディング)",
            "id": "Penilaian Keausan Bit (IADC)",
            "ko": "시추 비트 마모 등급 평가 (IADC)"
        }, "Standard 8-character IADC bit wear classification system"),
        ("Roller Cone Bit", {
            "ru": "Шарошечное долото",
            "hi": "रोलर कोन बिट",
            "ar": "رأس حفر مخروطي دوار (Tricone)",
            "zh": "牙轮钻头",
            "es": "Broca de conos rotativos (Tricónica)",
            "fr": "Trépan à molettes (Tricône)",
            "pt": "Broca de cones dentados (Tricônica)",
            "de": "Rollenmeißel / Warzenmeißel",
            "ja": "ローラーコーンビット",
            "id": "Bit Kerucut Rol (Roller Cone)",
            "ko": "롤러 콘 비트 (치형 콘 비트)"
        }, "Tricone rock drill bit"),
        ("PDC Bit", {
            "ru": "Долото PDC (алмазное долото)",
            "hi": "PDC बिट",
            "ar": "رأس حفر بولي كريستالين ماسي (PDC)",
            "zh": "金刚石复合片钻头 (PDC 钻头)",
            "es": "Broca PDC (Diamante policristalino)",
            "fr": "Trépan PDC (Diamant polycristallin)",
            "pt": "Broca PDC (Diamante policristalino)",
            "de": "PDC-Meißel (Polykristalliner Diamant)",
            "ja": "PDCビット (多結晶ダイヤモンドビット)",
            "id": "Bit PDC",
            "ko": "PDC 비트 (다결정 다이아몬드 비트)"
        }, "Polycrystalline Diamond Compact shear bit"),
        ("Inner Wear (I)", {
            "ru": "Внутренний износ (I)",
            "hi": "आंतरिक घिसाव (I)",
            "ar": "تآكل الصفوف الداخلية (I)",
            "zh": "内排齿磨损 (I)",
            "es": "Desgaste interior (I)",
            "fr": "Usure intérieure (I)",
            "pt": "Desgaste interno (I)",
            "de": "Innerer Verschleiß (I)",
            "ja": "内側摩耗 (I)",
            "id": "Keausan Bagian Dalam (I)",
            "ko": "내부 마모 (I)"
        }, "IADC wear rating of inner 2/3 cutting structure"),
        ("Outer Wear (O)", {
            "ru": "Внешний износ (O)",
            "hi": "बाहरी घिसाव (O)",
            "ar": "تآكل الصفوف الخارجية (O)",
            "zh": "外排齿磨损 (O)",
            "es": "Desgaste exterior (O)",
            "fr": "Usure extérieure (O)",
            "pt": "Desgaste externo (O)",
            "de": "Äußerer Verschleiß (O)",
            "ja": "外側摩耗 (O)",
            "id": "Keausan Bagian Luar (O)",
            "ko": "외부 마모 (O)"
        }, "IADC wear rating of outer 1/3 cutting structure"),
        ("Bearing / Seals (B)", {
            "ru": "Опора / Уплотнения (B)",
            "hi": "बेयरिंग / सील (B)",
            "ar": "المحامل ومانعات التسرب (B)",
            "zh": "轴承与密封 (B)",
            "es": "Cojinete / Sellos (B)",
            "fr": "Roulement / Garniture (B)",
            "pt": "Rolamentos / Selos (B)",
            "de": "Lager / Dichtung (B)",
            "ja": "ベアリング / シール (B)",
            "id": "Bearing / Segel (B)",
            "ko": "베어링 / 씰 밀봉 (B)"
        }, "Roller cone bearing life expended (0 to 8)")
    ]),

    # Section 6: Well Control & Stuck Pipe
    ("Well Control & Stuck Pipe", [
        ("Well Control", {
            "ru": "Контроль скважины и глушение (ГНВП)",
            "hi": "वेल कंट्रोल (कूप नियंत्रण)",
            "ar": "التحكم في الآبار وضبط الضغط",
            "zh": "井控作业",
            "es": "Control de pozos",
            "fr": "Contrôle de puits",
            "pt": "Controle de poço",
            "de": "Bohrlochkontrolle (Well Control)",
            "ja": "ウェルコントロール (噴出防止制御)",
            "id": "Kontrol Sumur (Well Control)",
            "ko": "유정 제어 (웰 컨트롤)"
        }, "Prevention and mitigation of formation influxes"),
        ("Kill Sheet", {
            "ru": "Лист глушения скважины (Kill Sheet)",
            "hi": "किल शीट (दबाव नियंत्रण प्रपत्र)",
            "ar": "ورقة حسابات قتل البئر (Kill Sheet)",
            "zh": "压井计算单 (Kill Sheet)",
            "es": "Hoja de cálculo de ahogo (Kill Sheet)",
            "fr": "Feuille de contrôle de venue (Kill sheet)",
            "pt": "Folha de controle de poço (Kill sheet)",
            "de": "Tötungsarbeitsblatt (Kill Sheet)",
            "ja": "キルシート (圧井計算表)",
            "id": "Lembar Kontrol Sumur (Kill Sheet)",
            "ko": "킬 시트 (유정 압력 제어 계산서)"
        }, "Worksheet computing pressures and volumes to kill well kick"),
        ("Kick", {
            "ru": "Проявление пласта (ГНВП / приток)",
            "hi": "किक (गैस या तरल अंतर्वाह)",
            "ar": "اندفاع مائع التكوين (Kick)",
            "zh": "井涌 / 地层流体侵入 (Kick)",
            "es": "Amago de reventón / Invasión (Kick)",
            "fr": "Venue de fluide (Kick)",
            "pt": "Kick (Influxo de fluido)",
            "de": "Kick (Formationsfluideinbruch)",
            "ja": "キック (地層流体流入)",
            "id": "Kick (Masuknya Fluida Formasi)",
            "ko": "킥 (지층 유체 침입 현상)"
        }, "Unplanned influx of formation gas/oil/water into wellbore"),
        ("Blowout", {
            "ru": "Открытый фонтан (выброс)",
            "hi": "ब्लोआउट (विस्फोटक रिसाव)",
            "ar": "انفجار البئر غير المنضبط",
            "zh": "井喷 (Blowout)",
            "es": "Reventón incontrolado (Blowout)",
            "fr": "Éruption incontrôlée (Blowout)",
            "pt": "Erupção de poço (Blowout)",
            "de": "Blowout (Unkontrollierter Ausbruch)",
            "ja": "ブローアウト (暴噴)",
            "id": "Semburan Liar (Blowout)",
            "ko": "블로우아웃 (통제 불능 폭발 분출)"
        }, "Uncontrolled surface release of wellbore fluids"),
        ("Differential Sticking", {
            "ru": "Дифференциальный прихват",
            "hi": "डिफरेंशियल स्टिकिंग",
            "ar": "استعصاء الأنابيب بفرق الضغط",
            "zh": "压差卡钻",
            "es": "Pegadura por presión diferencial",
            "fr": "Coincement par pression différentielle",
            "pt": "Prisão diferencial da coluna",
            "de": "Differenzdruckkleben (Differential Sticking)",
            "ja": "差圧膠着 (ディファレンシャルスティッキング)",
            "id": "Pipa Terjepit Tekanan Diferensial",
            "ko": "차압 점착 파이프 고착 (디퍼렌셜 스티킹)"
        }, "Pipe stuck against permeable mudcake due to overbalanced hydrostatic pressure"),
        ("Mechanical Sticking", {
            "ru": "Механический прихват",
            "hi": "मैकेनिकल स्टिकिंग",
            "ar": "استعصاء ميكانيكي للأنابيب",
            "zh": "机械卡钻",
            "es": "Pegadura mecánica",
            "fr": "Coincement mécanique",
            "pt": "Prisão mecânica",
            "de": "Mechanisches Feststecken",
            "ja": "機械的膠着",
            "id": "Pipa Terjepit Mekanis",
            "ko": "기계적 파이프 고착 (메커니컬 스티킹)"
        }, "Pipe stuck in keyseat or packed cuttings bridge")
    ]),

    # Section 7: UI & Navigation
    ("UI & Navigation", [
        ("Dark Mode", {
            "ru": "Темный режим",
            "hi": "डार्क मोड",
            "ar": "الوضع الداكن",
            "zh": "深色模式",
            "es": "Modo oscuro",
            "fr": "Mode sombre",
            "pt": "Modo escuro",
            "de": "Dunkelmodus",
            "ja": "ダークモード",
            "id": "Mode Gelap",
            "ko": "다크 모드"
        }, "App night theme toggle"),
        ("Light Mode", {
            "ru": "Светлый режим",
            "hi": "लाइट मोड",
            "ar": "الوضع الفاتح",
            "zh": "浅色模式",
            "es": "Modo claro",
            "fr": "Mode clair",
            "pt": "Modo claro",
            "de": "Hellmodus",
            "ja": "ライトモード",
            "id": "Mode Terang",
            "ko": "라이트 모드"
        }, "App day theme toggle"),
        ("Menu", {
            "ru": "Меню",
            "hi": "मेनू",
            "ar": "القائمة",
            "zh": "菜单",
            "es": "Menú",
            "fr": "Menu",
            "pt": "Menu",
            "de": "Menü",
            "ja": "メニュー",
            "id": "Menu",
            "ko": "메뉴"
        }, "Drawer navigation menu"),
        ("Settings", {
            "ru": "Настройки",
            "hi": "सेटिंग्स",
            "ar": "الإعدادات",
            "zh": "设置",
            "es": "Ajustes",
            "fr": "Paramètres",
            "pt": "Configurações",
            "de": "Einstellungen",
            "ja": "設定",
            "id": "Pengaturan",
            "ko": "설정"
        }, "Settings screen"),
        ("Rate Us", {
            "ru": "Оценить приложение",
            "hi": "हमें रेट करें",
            "ar": "قيّمنا",
            "zh": "给应用评分",
            "es": "Califícanos",
            "fr": "Noter l'application",
            "pt": "Avalie-nos",
            "de": "App bewerten",
            "ja": "アプリを評価",
            "id": "Beri Nilai Kami",
            "ko": "앱 평가하기"
        }, "App store rating button"),
        ("Share Us", {
            "ru": "Поделиться приложением",
            "hi": "ऐप साझा करें",
            "ar": "مشاركة التطبيق",
            "zh": "分享应用",
            "es": "Compartir app",
            "fr": "Partager l'application",
            "pt": "Compartilhar app",
            "de": "App teilen",
            "ja": "アプリを共有",
            "id": "Bagikan Aplikasi",
            "ko": "앱 공유하기"
        }, "Share link button"),
        ("Default Capacity Unit", {
            "ru": "Единица вместимости по умолчанию",
            "hi": "डिफ़ॉल्ट क्षमता इकाई",
            "ar": "وحدة السعة الافتراضية",
            "zh": "默认容积单位",
            "es": "Unidad de capacidad predeterminada",
            "fr": "Unité de capacité par défaut",
            "pt": "Unidade de capacidade padrão",
            "de": "Standard-Volumeneinheit",
            "ja": "標準容量単位",
            "id": "Satuan Kapasitas Default",
            "ko": "기본 파이프 용적 단위"
        }, "Settings option for L/m, bbl/m, bbl/ft"),
        ("Accent Color Theme", {
            "ru": "Тема цвета акцента",
            "hi": "एक्सेंट रंग थीम",
            "ar": "سمة لون التمييز",
            "zh": "强调色主题",
            "es": "Tema de color de énfasis",
            "fr": "Thème de couleur d'accentuation",
            "pt": "Tema de cor de destaque",
            "de": "Akzentfarben-Design",
            "ja": "アクセントカラーテーマ",
            "id": "Tema Warna Aksen",
            "ko": "강조 색상 테마"
        }, "Settings accent palette selector"),
        ("Background Theme", {
            "ru": "Тема фонового цвета",
            "hi": "पृष्ठभूमि थीम",
            "ar": "سمة الخلفية",
            "zh": "背景主题",
            "es": "Tema de fondo",
            "fr": "Thème d'arrière-plan",
            "pt": "Tema de fundo",
            "de": "Hintergrund-Design",
            "ja": "背景テーマ",
            "id": "Tema Latar Belakang",
            "ko": "배경 화면 테마"
        }, "Settings background palette selector")
    ])
]

LANG_NAMES = {
    "ru": ("Russian", "Русский"),
    "hi": ("Hindi", "हिन्दी"),
    "ar": ("Arabic", "العربية"),
    "zh": ("Simplified Chinese", "简体中文"),
    "es": ("Spanish", "Español"),
    "fr": ("French", "Français"),
    "pt": ("Portuguese", "Português"),
    "de": ("German", "Deutsch"),
    "ja": ("Japanese", "日本語"),
    "id": ("Indonesian", "Bahasa Indonesia"),
    "ko": ("Korean", "한국어")
}

def generate_glossary(lang_code):
    en_title, native_title = LANG_NAMES[lang_code]
    lines = []
    lines.append(f"# {en_title} ({native_title}) Oil & Gas Drilling Terminology Glossary (`glossary-{lang_code}.md`)")
    lines.append("")
    lines.append(f"This glossary establishes the standard {en_title} terminology used across the **Drilling Toolkit** application. Every term is selected based on standard professional drilling engineering practice and industry nomenclature rather than literal machine translation.")
    lines.append("")
    lines.append("---")
    lines.append("")

    for sec_idx, (sec_title, items) in enumerate(TERMS, 1):
        lines.append(f"## {sec_idx}. {sec_title}")
        lines.append(f"| English Term | Chosen {en_title} Term | Context / Notes |")
        lines.append("| :--- | :--- | :--- |")
        for en_term, lang_map, notes in items:
            val = lang_map.get(lang_code, en_term)
            lines.append(f"| **{en_term}** | **{val}** | {notes} |")
        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)

def main():
    for lang_code in LANG_NAMES:
        filepath = os.path.join(ROOT_DIR, f"glossary-{lang_code}.md")
        content = generate_glossary(lang_code)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Generated {filepath} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
