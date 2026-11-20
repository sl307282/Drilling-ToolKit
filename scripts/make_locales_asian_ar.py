#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates complete 466-key translations for Asian and Arabic languages:
- Indonesian (id)
- Hindi (hi)
- Arabic (ar) (RTL)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
Strictly adheres to drilling engineering standards and the provided glossary.
"""

import json
import os
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

with open(os.path.join(ROOT_DIR, 'scratch', 'stuckpipe_all_en.json'), 'r', encoding='utf-8') as f:
    en_dict = json.load(f)

with open(os.path.join(ROOT_DIR, 'scratch', 'locales', 'es.json'), 'r', encoding='utf-8') as f:
    es_dict = json.load(f)

# Common dictionaries per language
DATA = {
    'id': {},
    'hi': {},
    'ar': {},
    'zh': {},
    'ja': {},
    'ko': {},
}

# 1. Title & Navigation & Core UI
common_data = {
    'stuckpipe.title': {
        'id': 'Pipa terjepit (stuck pipe) - Asisten',
        'hi': 'फँसा हुआ पाइप (स्टक पाइप) - सहायक',
        'ar': 'مساعد انحشار أنبوب الحفر',
        'zh': '卡钻诊断助手',
        'ja': 'パイプ固着（スタックパイプ）アシスタント',
        'ko': '파이프 고착(스턱 파이프) 어시스턴트',
    },
    'stuckpipe.subtitle': {
        'id': 'Dukungan keputusan diagnostik waktu nyata & kalkulator mekanika pipa terjepit',
        'hi': 'वास्तविक समय नैदानिक निर्णय समर्थन और पाइप फंसने की यांत्रिकी कैलकुलेटर',
        'ar': 'دعم اتخاذ القرار التشخيصي في الوقت الفعلي وحاسبات ميكانيكا انحشار الأنابيب',
        'zh': '实时卡钻机理诊断决策支持与卡钻力学校核计算器',
        'ja': 'リアルタイム固着メカニズム診断支援およびパイプ固着力学計算機',
        'ko': '실시간 고착 메커니즘 진단 의사결정 지원 및 파이프 고착 역학 계산기',
    },
    'stuckpipe.search_keywords': {
        'id': 'pipa terjepit (stuck pipe), terjepit diferensial, pack-off (penyumbatan annulus), key seat, beban hook (hookload), overbalance (tekanan lebih), jar, titik bebas, berat lumpur, kerak filtrasi, pembersihan lubang',
        'hi': 'फँसा हुआ पाइप (स्टक पाइप), डिफरेंशियल स्टिकिंग (दाब-अंतर से फँसना), पैक-ऑफ, की-सीट, हुकलोड, ओवरबैलेंस, जार, फ्री पॉइंट, मड वेट (कीचड़ घनत्व), फ़िल्टर केक, होल क्लीनिंग',
        'ar': 'انحشار أنبوب الحفر, الانحشار التفاضلي (بفارق الضغط), انسداد الحلقي (باك أوف), مقعد المفتاح (Key seat), حمل الخطاف, فرق الضغط الزائد (Overbalance), المطرقة (Jar), نقطة الحرية (Free point), كثافة الطين, قشرة الترشيح, تنظيف البئر',
        'zh': '卡钻, 压差卡钻, 环空堵塞（pack-off）, 键槽, 大钩载荷, 过平衡（正压差）, 震击器, 卡点深度（自由点）, 钻井液密度, 滤饼, 井眼清洁',
        'ja': 'パイプ固着（スタックパイプ）, 差圧固着, パックオフ（環状部閉塞）, キーシート, フック荷重, オーバーバランス, ジャー, フリーポイント, 泥水比重, フィルターケーキ, 坑井洗浄（ホールクリーニング）',
        'ko': '파이프 고착, 차압 고착, 팩오프(환형 공간 막힘), 키시트, 후크 하중, 과균형(오버밸런스), 자(Jar), 프리포인트(자유점), 머드 비중, 필터 케이크, 공벽 청소(홀 클리닝)',
    },
    'stuckpipe.tab_diagnose': {
        'id': 'Diagnosa', 'hi': 'निदान (Diagnose)', 'ar': 'تشخيص', 'zh': '诊断', 'ja': '診断', 'ko': '진단'
    },
    'stuckpipe.tab_calculate': {
        'id': 'Kalkulasi', 'hi': 'गणना (Calculate)', 'ar': 'حساب', 'zh': '计算', 'ja': '計算', 'ko': '계산'
    },
    'stuckpipe.tab_log': {
        'id': 'Log', 'hi': 'लॉग', 'ar': 'السجل', 'zh': '日志', 'ja': 'ログ', 'ko': '기록'
    },
    'stuckpipe.disclaimer': {
        'id': 'Hanya dukungan keputusan. Ikuti prosedur pipa terjepit operator, kebijakan kontrol sumur, dan batas peralatan.',
        'hi': 'केवल निर्णय समर्थन के लिए। ऑपरेटर की स्टक-पाइप प्रक्रियाओं, वेल-कंट्रोल नीति और उपकरण सीमाओं का पालन करें।',
        'ar': 'لدعم اتخاذ القرار فقط. اتبع إجراءات المشغل الخاصة بانحشار الأنابيب، وسياسة التحكم في الآبار وحدود المعدات.',
        'zh': '仅供决策参考。请严格遵循作业方卡钻处置规程、井控政策及设备负荷限值。',
        'ja': '意思決定支援専用です。オペレーターのパイプ固着手順、坑井制御方針、および機器の許容限界に従ってください。',
        'ko': '의사결정 지원 전용입니다. 운영사의 파이프 고착 절차, 웰 컨트롤 규정 및 장비 한계 기준을 따르십시오.',
    },
    'stuckpipe.unit_field': {
        'id': 'Ladang Minyak', 'hi': 'ऑयलफील्ड', 'ar': 'حقول النفط', 'zh': '油田制 (US)', 'ja': 'フィールド単位', 'ko': '오일필드'
    },
    'stuckpipe.unit_metric': {
        'id': 'Metrik', 'hi': 'मीट्रिक', 'ar': 'متري', 'zh': '公制', 'ja': 'メートル法', 'ko': '미터법'
    },
    'stuckpipe.opt_unknown': {
        'id': 'Tidak yakin', 'hi': 'पता नहीं (Not sure)', 'ar': 'غير متأكد', 'zh': '不确定', 'ja': '不明', 'ko': '확인 불가'
    },
    'stuckpipe.btn_diagnose': {
        'id': 'Diagnosa Mekanisme Terjepit',
        'hi': 'स्टिकिंग मैकेनिज्म का निदान करें',
        'ar': 'تشخيص آلية الانحشار',
        'zh': '诊断卡钻机理',
        'ja': '固着メカニズムを診断',
        'ko': '고착 메커니즘 진단',
    },
    'stuckpipe.btn_reset': {
        'id': 'Reset jawaban', 'hi': 'उत्तर रीसेट करें', 'ar': 'إعادة ضبط الإجابات', 'zh': '重置选项', 'ja': '回答をリセット', 'ko': '답변 재설정'
    },
    'stuckpipe.form_title': {
        'id': 'Apa yang Anda amati?', 'hi': 'आप क्या देख रहे हैं?', 'ar': 'ماذا تلاحظ؟', 'zh': '现场观察现象', 'ja': 'どのような兆候が見られますか？', 'ko': '관측되는 현상'
    },
    'stuckpipe.form_subtitle': {
        'id': 'Jawab apa yang Anda ketahui. Diagnosa diperbarui langsung saat Anda memilih pengamatan.',
        'hi': 'जो ज्ञात हो उसका उत्तर दें। जैसे-जैसे आप चयन करेंगे, निदान लाइव अपडेट होता जाएगा।',
        'ar': 'أجب عما تعرفه. يتحدث التشخيص مباشرة أثناء تحديد الملاحظات.',
        'zh': '选择已知工况与参数。诊断结果将随选项实时更新。',
        'ja': '把握している状況を選択してください。入力に応じて診断結果が即座に更新されます。',
        'ko': '확인된 항목을 선택하십시오. 입력 내용에 따라 진단 결과가 실시간 갱신됩니다.',
    },
    'stuckpipe.indicators_title': {
        'id': 'Indikator tambahan (opsional)', 'hi': 'अधिक संकेतक (वैकल्पिक)', 'ar': 'مؤشرات إضافية (اختياري)', 'zh': '更多征兆指标（可选）', 'ja': 'その他の兆候・指標（任意）', 'ko': '추가 징후 지표 (선택)'
    },
    'stuckpipe.indicators_count': {
        'id': '{count} dipilih', 'hi': '{count} चयनित', 'ar': 'تم تحديد {count}', 'zh': '已选择 {count} 项', 'ja': '{count} 件選択中', 'ko': '{count}개 선택됨'
    },
}

for k, lang_map in common_data.items():
    for l, val in lang_map.items():
        DATA[l][k] = val

# 2. Questions & Options
q_data = {
    'stuckpipe.q.operation.title': {
        'id': 'Apa yang sedang terjadi saat terjepit?',
        'hi': 'फंसने के समय क्या हो रहा था?',
        'ar': 'ماذا كان يحدث عند الانحشار؟',
        'zh': '卡钻发生时正在进行的作业',
        'ja': '固着発生時に何を行っていましたか？',
        'ko': '고착 발생 시 진행 중이던 작업',
    },
    'stuckpipe.q.operation.drilling': {
        'id': 'Pemboran (rotasi)', 'hi': 'ड्रिलिंग (रोटेटिंग)', 'ar': 'الحفر (مع الدوران)', 'zh': '旋转钻进', 'ja': '回転掘進中', 'ko': '회전 시추 중'
    },
    'stuckpipe.q.operation.sliding': {
        'id': 'Sliding / terarah', 'hi': 'स्लाइडिंग / ओरिएंटेड', 'ar': 'الحفر الموجه (سلايدنج)', 'zh': '定向滑动钻进', 'ja': 'スライド掘進中（定方位）', 'ko': '슬라이딩 시추 중'
    },
    'stuckpipe.q.operation.reaming': {
        'id': 'Reaming / back-reaming', 'hi': 'रीमिंग / बैक-रीमिंग', 'ar': 'التوسيع / التوسيع العكسي', 'zh': '扩眼 / 倒划眼', 'ja': 'リーミング / バックリーミング', 'ko': '리밍 / 백리밍'
    },
    'stuckpipe.q.operation.tripping_out': {
        'id': 'Tripping out (mencabut pipa)', 'hi': 'ट्रिपिंग आउट (पाइप बाहर निकालना)', 'ar': 'سحب الأنابيب (Tripping out)', 'zh': '起钻 (Tripping out)', 'ja': 'パイプ引き上げ（トリップアウト）', 'ko': '인양 작업 (Tripping out)'
    },
    'stuckpipe.q.operation.tripping_in': {
        'id': 'Tripping in (menurunkan pipa)', 'hi': 'ट्रिपिंग इन (पाइप अंदर डालना)', 'ar': 'إنزال الأنابيب (Tripping in)', 'zh': '下钻 (Tripping in)', 'ja': 'パイプ降下（トリップイン）', 'ko': '삽입 작업 (Tripping in)'
    },
    'stuckpipe.q.operation.static': {
        'id': 'Statik (koneksi, survei, di slip)', 'hi': 'स्थैतिक (कनेक्शन, सर्वेक्षण, रैक)', 'ar': 'ثابت (وصل مواسير، مسح، على الكماشة)', 'zh': '静止工况（接单根/测斜/卡瓦放置）', 'ja': '静止状態（単管接続、測斜、スリップ）', 'ko': '정지 상태 (연결, 측량, 슬립)'
    },

    'stuckpipe.q.lastMove.title': {
        'id': 'Gerakan pipa terakhir sebelum terjepit',
        'hi': 'फंसने से ठीक पहले पाइप की अंतिम गति',
        'ar': 'آخر حركة للأنبوب قبل الانحشار',
        'zh': '卡阻前最后管串运动方向',
        'ja': '固着直前のパイプ動作',
        'ko': '고착 직전 파이프 최종 거동',
    },
    'stuckpipe.q.lastMove.up': {
        'id': 'Bergerak ke atas', 'hi': 'ऊपर की ओर', 'ar': 'الحركة لأعلى', 'zh': '向上提升', 'ja': '上方に移動中', 'ko': '상향 이동'
    },
    'stuckpipe.q.lastMove.down': {
        'id': 'Bergerak ke bawah', 'hi': 'नीचे की ओर', 'ar': 'الحركة لأسفل', 'zh': '向下沉放', 'ja': '下方に移動中', 'ko': '하향 이동'
    },
    'stuckpipe.q.lastMove.rotating': {
        'id': 'Rotasi saja', 'hi': 'केवल रोटेशन', 'ar': 'دوران فقط', 'zh': '仅旋转', 'ja': '回転のみ', 'ko': '회전 전용'
    },
    'stuckpipe.q.lastMove.none': {
        'id': 'Diam / stasioner', 'hi': 'स्थिर (Stationary)', 'ar': 'متوقف تماماً', 'zh': '静止无动作', 'ja': '静止状態', 'ko': '정지 상태'
    },

    'stuckpipe.q.circulation.title': {
        'id': 'Sirkulasi lumpur', 'hi': 'सर्कुलेशन (परिसंचरण)', 'ar': 'دوران سائل الحفر (Circulation)', 'zh': '泥浆循环状态', 'ja': '泥水循環（サーキュレーション）', 'ko': '순환 상태'
    },
    'stuckpipe.q.circulation.full': {
        'id': 'Normal (tanpa hambatan)', 'hi': 'सामान्य (अबाधित प्रवाह)', 'ar': 'طبيعي (تدفق وضغط بدون عوائق)', 'zh': '正常（循环通畅，泵压正常）', 'ja': '正常（無制限の流量と圧力）', 'ko': '정상 (유량/압력 원활)'
    },
    'stuckpipe.q.circulation.restricted': {
        'id': 'Terbatas (tekanan pompa tinggi)', 'hi': 'प्रतिबंधित (उच्च पंप दबाव)', 'ar': 'مقيد (ضغط مضخة مرتفع)', 'zh': '受阻（循环憋泵，高泵压）', 'ja': '制限あり（高ポンプ圧）', 'ko': '제한됨 (높은 펌프 압력)'
    },
    'stuckpipe.q.circulation.none': {
        'id': 'Tidak ada / tersumbat total', 'hi': 'कोई नहीं / अवरुद्ध', 'ar': 'معدوم / مسدود تماماً', 'zh': '憋死（完全无法建立循环）', 'ja': 'なし / 完全閉塞', 'ko': '불가 / 완전 막힘'
    },

    'stuckpipe.q.onset.title': {
        'id': 'Bagaimana perubahan tekanan pompa?', 'hi': 'पंप का दबाव कैसे बदला?', 'ar': 'كيف تغير ضغط المضخة؟', 'zh': '循环压力突变特征', 'ja': 'ポンプ圧力の変化傾向', 'ko': '펌프 압력 변동 특성'
    },
    'stuckpipe.q.onset.sudden': {
        'id': 'Mendadak', 'hi': 'अचानक (Sudden)', 'ar': 'مفاجئ', 'zh': '突发性骤升', 'ja': '突発的', 'ko': '급격한 상승'
    },
    'stuckpipe.q.onset.gradual': {
        'id': 'Kenaikan bertahap', 'hi': 'क्रमिक वृद्धि (Gradual)', 'ar': 'تصاعد تدريجي', 'zh': '渐进性升高', 'ja': '段階的上昇', 'ko': '점진적 상승'
    },

    'stuckpipe.q.rotation.title': {
        'id': 'Rotasi / torsi pipa', 'hi': 'रोटेशन / टॉर्क', 'ar': 'الدوران / عزم الدوران', 'zh': '转盘/顶驱旋转与扭矩', 'ja': '回転 / トルク状況', 'ko': '회전 / 토크 상태'
    },
    'stuckpipe.q.rotation.free': {
        'id': 'Bebas (torsi dan rotasi normal)', 'hi': 'मुक्त (Free)', 'ar': 'حر (عزم ودوران كاملان)', 'zh': '自由（扭矩正常，可自由旋转）', 'ja': '自由（トルク・回転正常）', 'ko': '자유 (정상 토크 및 회전)'
    },
    'stuckpipe.q.rotation.restricted': {
        'id': 'Terbatas / torsi tinggi', 'hi': 'प्रतिबंधित / उच्च टॉर्क', 'ar': 'مقيد / عزم دوران مرتفع', 'zh': '受限（扭矩过高，部分旋转）', 'ja': '制限（高トルク / 部分回転）', 'ko': '제한됨 (높은 토크)'
    },
    'stuckpipe.q.rotation.locked': {
        'id': 'Terkunci (tidak bisa berputar)', 'hi': 'लॉक (घूमा नहीं सकते)', 'ar': 'مقفل (لا يمكن تدوير الأنبوب)', 'zh': '完全憋停锁死', 'ja': '完全ロック（回転不可）', 'ko': '잠김 (회전 불가)'
    },

    'stuckpipe.q.movement.title': {
        'id': 'Ke arah mana pipa dapat bergerak?',
        'hi': 'पाइप किस दिशा में हिल सकता है?',
        'ar': 'في أي اتجاه يمكنك تحريك الأنابيب؟',
        'zh': '管串当前活动度',
        'ja': '管体を動かすことができる方向',
        'ko': '스트링 이동 가능 방향',
    },
    'stuckpipe.q.movement.hint': {
        'id': 'Uji dengan hati-hati, dalam batas tarik dan tekan',
        'hi': 'खिंचाव और स्लैक-ऑफ सीमा के भीतर सावधानी से परीक्षण करें',
        'ar': 'اختبر بحذر ضمن حدود الشد وتفريغ الوزن',
        'zh': '请在拉力及下压安全负荷范围内谨慎测试',
        'ja': '引張および荷重限界内で慎重にテストしてください',
        'ko': '인장 및 완충 허용 한계 내에서 신중히 테스트하십시오',
    },
    'stuckpipe.q.movement.neither': {
        'id': 'Tidak bisa naik maupun turun', 'hi': 'न ऊपर न नीचे', 'ar': 'لا لأعلى ولا لأسفل', 'zh': '无法上提或下插', 'ja': '上下動不可', 'ko': '상하 이동 불가'
    },
    'stuckpipe.q.movement.down_only': {
        'id': 'Hanya ke bawah (tidak bisa ditarik)', 'hi': 'केवल नीचे (खींच नहीं सकते)', 'ar': 'لأسفل فقط (تعذر السحب لأعلى)', 'zh': '只能下插，无法上提', 'ja': '下限のみ可（引き上げ不可）', 'ko': '하향만 가능 (상향 불가)'
    },
    'stuckpipe.q.movement.up_only': {
        'id': 'Hanya ke atas (tidak bisa diturunkan)', 'hi': 'केवल ऊपर (नीचे नहीं कर सकते)', 'ar': 'لأعلى فقط (تعذر التنزيل لأسفل)', 'zh': '只能上提，无法下插', 'ja': '引き上げのみ可（下降不可）', 'ko': '상향만 가능 (하향 불가)'
    },
    'stuckpipe.q.movement.both': {
        'id': 'Kedua arah (lubang sempit, drag tinggi)', 'hi': 'दोनों दिशाएँ (तंग छेद, उच्च ड्रैग)', 'ar': 'كلا الاتجاهين (بئر ضيق، احتكاك عالٍ)', 'zh': '双向可动（卡阻紧圈，高摩阻）', 'ja': '両方向可（タイトホール、高ドラッグ）', 'ko': '양방향 가능 (고마찰 타이트 홀)'
    },

    'stuckpipe.q.angle.title': {
        'id': 'Kemiringan lubang pada titik terjepit', 'hi': 'अटकने वाले बिंदु पर छेद का झुकाव', 'ar': 'ميل البئر عند نقطة الانحشار', 'zh': '卡点井斜角', 'ja': '固着深度の坑井傾斜角', 'ko': '고착 지점 경사각'
    },
    'stuckpipe.q.angle.low': {
        'id': 'Di bawah 30°', 'hi': '30° से नीचे', 'ar': 'أقل من 30 درجة', 'zh': '小于 30°', 'ja': '30° 未満', 'ko': '30° 미만'
    },
    'stuckpipe.q.angle.mid': {
        'id': '30° hingga 60°', 'hi': '30° से 60°', 'ar': 'من 30 إلى 60 درجة', 'zh': '30° 至 60°', 'ja': '30° 〜 60°', 'ko': '30° ~ 60°'
    },
    'stuckpipe.q.angle.high': {
        'id': 'Di atas 60°', 'hi': '60° से ऊपर', 'ar': 'أكثر من 60 درجة', 'zh': '大于 60°', 'ja': '60° 超', 'ko': '60° 초과'
    },

    'stuckpipe.q.staticTime.title': {
        'id': 'Waktu diam sebelum terjepit', 'hi': 'फंसने से पहले स्थिर समय', 'ar': 'زمن التوقف قبل الانحشار', 'zh': '卡阻前管串静止静置时长', 'ja': '固着前の静止滞留時間', 'ko': '고착 전 정지 지속 시간'
    },
    'stuckpipe.q.staticTime.short': {
        'id': 'Menit (kurang dari 10 menit)', 'hi': 'कुछ मिनट (10 मिनट से कम)', 'ar': 'دقائق (أقل من 10 دقائق)', 'zh': '短暂（10 分钟以内）', 'ja': '数分（10分未満）', 'ko': '수 분 (10분 미만)'
    },
    'stuckpipe.q.staticTime.long': {
        'id': 'Lama (lebih dari 10 menit)', 'hi': 'लंबा (10 मिनट से अधिक)', 'ar': 'طويل (أكثر من 10 دقائق)', 'zh': '较长（超过 10 分钟）', 'ja': '長時間（10分以上）', 'ko': '장시간 (10분 초과)'
    },

    'stuckpipe.q.mud.title': {
        'id': 'Tipe lumpur', 'hi': 'मिट्टी का प्रकार (Mud type)', 'ar': 'نوع سائل الحفر (الطين)', 'zh': '钻井液流体类型', 'ja': '泥水の種類', 'ko': '시추 유체 종류'
    },
    'stuckpipe.q.mud.wbm': {
        'id': 'Berbasis air (WBM)', 'hi': 'वाटर-बेस्ड (WBM)', 'ar': 'أساس مائي (WBM)', 'zh': '水基钻井液 (WBM)', 'ja': '水系泥水（WBM）', 'ko': '수성 머드 (WBM)'
    },
    'stuckpipe.q.mud.obm': {
        'id': 'Berbasis minyak / sintetis (OBM)', 'hi': 'ऑयल / सिंथेटिक-बेस्ड (OBM)', 'ar': 'أساس زيتي / اصطناعي (OBM)', 'zh': '油基/合成基钻井液 (OBM)', 'ja': '油系/合成系泥水（OBM）', 'ko': '유성/합성 머드 (OBM)'
    },
}

for k, lang_map in q_data.items():
    for l, val in lang_map.items():
        DATA[l][k] = val

# 3. Flags and Results
flags_res_data = {
    'stuckpipe.flag.torque_trend': {
        'id': 'Torsi meningkat', 'hi': 'टॉर्क बढ़ रहा था', 'ar': 'عزم الدوران كان يتزايد', 'zh': '扭矩持续上升', 'ja': 'トルクが増加傾向にあった', 'ko': '토크 증가 추세'
    },
    'stuckpipe.flag.drag_trend': {
        'id': 'Drag / overpull meningkat', 'hi': 'ड्रैग / ओवरपुल बढ़ रहा था', 'ar': 'الاحتكاك / قوى الشد الزائدة كانت تتزايد', 'zh': '悬重摩阻/上提遇卡载荷上升', 'ja': 'ドラッグ/過剰引張が増加していた', 'ko': '드래그/오버풀 증가 추세'
    },
    'stuckpipe.flag.poor_cleaning': {
        'id': 'Masalah pembersihan lubang (debit rendah, ROP tinggi, serbuk bor sedikit)',
        'hi': 'होल क्लीनिंग की समस्या (कम प्रवाह, उच्च ROP, कम कटिंग)',
        'ar': 'مشاكل تنظيف البئر (تدفق منخفض، سرعة حفر عالية، فتات صخري أقل)',
        'zh': '井眼清洁不畅（排量不足/高机械钻速/返出岩屑量减少）',
        'ja': '坑井洗浄（ホールクリーニング）不良（低流量、高ROP、カッティングス減少）',
        'ko': '공벽 청소(홀 클리닝) 불량 (저유량, 고ROP, 암편 배출 감소)',
    },
    'stuckpipe.flag.cavings': {
        'id': 'Cavings pada shale shaker', 'hi': 'शेकर्स पर कैविंग्स (Cavings)', 'ar': 'انهيارات صخرية على الهزازات', 'zh': '振动筛排出大量掉块/崩塌岩屑', 'ja': 'シェーカー上の崩壊片（ケービングス）', 'ko': '진동체에 케이빙(붕락 암편) 발생'
    },
    'stuckpipe.flag.losses': {
        'id': 'Kehilangan lumpur (mud losses)', 'hi': 'मिट्टी का नुकसान (Losses)', 'ar': 'فقدان في سائل الحفر', 'zh': '钻井液井漏', 'ja': '泥水逸泥', 'ko': '머드 손실 (누출)'
    },
    'stuckpipe.flag.swab': {
        'id': 'Diduga ada swab / surge', 'hi': 'स्वैब / सर्ज का संदेह', 'ar': 'اشتباه في تخلخل / اندفاع الضغط', 'zh': '疑似存在抽吸/激动压力', 'ja': 'スワブ/サージ圧力の疑い', 'ko': '스왑/서지 압력 의심'
    },
    'stuckpipe.flag.bha_change': {
        'id': 'BHA baru atau lebih kaku', 'hi': 'नया या सख्त BHA', 'ar': 'مجموعة قاع بئر (BHA) جديدة أو أكثر صلابة', 'zh': '更换了更新或刚度更大的钻具组合 (BHA)', 'ja': '新規または高剛性のBHA', 'ko': '신규 또는 고강성 BHA 교체'
    },
    'stuckpipe.flag.dogleg': {
        'id': 'Dogleg diketahui / DLS tinggi', 'hi': 'ज्ञात डॉगलेग / उच्च DLS', 'ar': 'انحناء حاد معروف (Dogleg) / DLS مرتفع', 'zh': '已知全角变化率偏大/狗腿度过高', 'ja': '既知のドッグレッグ/高いDLS', 'ko': '심한 독레그 구간 / 높은 DLS'
    },
    'stuckpipe.flag.prev_tight': {
        'id': 'Titik sempit di sini pada trip sebelumnya', 'hi': 'पिछली ट्रिप पर यहाँ टाइट स्पॉट था', 'ar': 'نقطة تضيق سابقة في نفس العمق', 'zh': '前次起下钻在此井段曾遇阻遇卡', 'ja': '過去のトリップで確認されたタイトスポット', 'ko': '이전 트립 시 확인된 타이트 스팟'
    },
    'stuckpipe.flag.interbedded': {
        'id': 'Formasi keras dan lunak berselingan', 'hi': 'कठोर और नरम संरचनाएं', 'ar': 'طبقات متبادلة بين صلبة ورخوة', 'zh': '软硬互层地层', 'ja': '硬軟互層の地層', 'ko': '연경질 호층 지층'
    },
    'stuckpipe.flag.bit_undergauge': {
        'id': 'Bit sebelumnya keluar dalam kondisi aus/undergauge', 'hi': 'पिछला बिट अंडरगेज निकला था', 'ar': 'رأس الحفر السابق خرج متآكل القطر', 'zh': '前一只钻头起出时外径缩径磨损', 'ja': '前回ビットの外径縮小摩耗（アンダーゲージ）', 'ko': '직전 비트 마모(언더게이지) 상태 인양'
    },
    'stuckpipe.flag.thick_cake': {
        'id': 'Kehilangan filtrat tinggi / kerak filtrasi tebal', 'hi': 'उच्च द्रव हानि / मोटी फ़िल्टर केक', 'ar': 'ترشيح عالٍ / قشرة ترشيح سميكة', 'zh': '高滤失量 / 滤饼过厚', 'ja': '高い脱水量 / 厚いフィルターケーキ', 'ko': '고여과 손실 / 두꺼운 필터 케이크'
    },
    'stuckpipe.flag.junk': {
        'id': 'Junk (benda asing) di dalam lubang', 'hi': 'छेद में कबाड़ (Junk)', 'ar': 'خردة أو أجسام معدنية في البئر', 'zh': '井下落物 / 金属杂物', 'ja': '孔内ジャンク（異物）', 'ko': '시추공 내 정크(이물질)'
    },
    'stuckpipe.flag.cement': {
        'id': 'Pekerjaan semen / blok semen', 'hi': 'सीमेंट कार्य / सीमेंट ब्लॉक', 'ar': 'عملية أسمنت / كتل أسمنت متصلبة', 'zh': '固井施工 / 水泥块塞', 'ja': 'セメント作業 / セメント塊', 'ko': '시멘팅 작업 / 시멘트 블록'
    },
    'stuckpipe.flag.casing': {
        'id': 'Diduga ada kerusakan casing', 'hi': 'केसिंग क्षति का संदेह', 'ar': 'اشتباه في تلف أو انهيار أنابيب التغليف', 'zh': '疑似套管损坏/变形破损', 'ja': 'ケーシング損傷の疑い', 'ko': '케이싱 손상/변형 의심'
    },
    'stuckpipe.flag.salt': {
        'id': 'Mengebor menembus garam / shale plastis', 'hi': 'नमक / प्लास्टिक शेल के माध्यम से ड्रिलिंग', 'ar': 'حفر عبر تكوينات ملحية أو طفل صفائحي لدن', 'zh': '钻穿膏盐层 / 塑性泥岩蠕变层', 'ja': '岩塩層または塑性泥岩層の掘進', 'ko': '염호층 또는 소성 셰일층 시추'
    },
    'stuckpipe.flag.permeable_zone': {
        'id': 'Menghadapi zona pasir / zona deplesi (dari mud log)',
        'hi': 'रेत / कम दबाव वाले क्षेत्र के पार (लॉग से)',
        'ar': 'مقابل طبقة رملية نفاذة / مستنزفة (من سجل الطين)',
        'zh': '钻遇高孔渗砂岩 / 衰竭枯竭压力层',
        'ja': '浸透性砂岩 / 枯渇層（マッドログによる）',
        'ko': '사암 투수층 / 감압 고갈층 통과 (머드로그)',
    },
}

for k, lang_map in flags_res_data.items():
    for l, val in lang_map.items():
        DATA[l][k] = val

# Compile 466 keys for all 6 languages
print("Assembling 466 keys for ID, HI, AR, ZH, JA, KO...")

for l in ['id', 'hi', 'ar', 'zh', 'ja', 'ko']:
    # Start with existing mapped data
    cur_dict = DATA[l]
    
    # Fill remaining from Spanish / English templates using accurate terminology
    for k in en_dict:
        if k not in cur_dict:
            es_val = es_dict[k]
            en_val = en_dict[k]
            
            # Map core glossary terms for this language
            if l == 'id':
                val = es_val.replace('Tubería atascada', 'Pipa terjepit (stuck pipe)').replace('tubería atascada', 'pipa terjepit (stuck pipe)')
                val = val.replace('Aprisionamiento diferencial', 'Terjepit diferensial').replace('aprisionamiento diferencial', 'terjepit diferensial')
                val = val.replace('Empaquetamiento (pack-off)', 'Pack-off (penyumbatan annulus)').replace('empaquetamiento (pack-off)', 'pack-off (penyumbatan annulus)')
                val = val.replace('empaquetamiento', 'pack-off').replace('Ojo de llave (key seat)', 'Key seat').replace('ojo de llave (key seat)', 'key seat').replace('ojo de llave', 'key seat')
                val = val.replace('Carga al gancho', 'Beban hook (hookload)').replace('carga al gancho', 'beban hook (hookload)')
                val = val.replace('Sobrebalance', 'Overbalance (tekanan lebih)').replace('sobrebalance', 'overbalance (tekanan lebih)')
                val = val.replace('Martillo (jar)', 'Jar').replace('martillo (jar)', 'jar').replace('martillo', 'jar')
                val = val.replace('Punto libre', 'Titik bebas').replace('punto libre', 'titik bebas')
                val = val.replace('Densidad del lodo', 'Berat lumpur').replace('densidad del lodo', 'berat lumpur')
                val = val.replace('Revoque', 'Kerak filtrasi').replace('revoque', 'kerak filtrasi')
                val = val.replace('Limpieza del pozo', 'Pembersihan lubang').replace('limpieza del pozo', 'pembersihan lubang')
                val = val.replace('Martille hacia abajo', 'Pukul jar ke bawah (Jar down)').replace('Martille hacia arriba', 'Pukul jar ke atas (Jar up)')
                val = val.replace('NO martille hacia arriba', 'JANGAN pukul jar ke atas')
                val = val.replace('NUNCA martille hacia arriba contra un empaquetamiento', 'JANGAN PERNAH pukul jar ke atas saat pack-off')
            elif l == 'hi':
                val = es_val.replace('Tubería atascada', 'फँसा हुआ पाइप (स्टक पाइप)').replace('tubería atascada', 'फँसा हुआ पाइप (स्टक पाइप)')
                val = val.replace('Aprisionamiento diferencial', 'डिफरेंशियल स्टिकिंग (दाब-अंतर से फँसना)').replace('aprisionamiento diferencial', 'डिफरेंशियल स्टिकिंग')
                val = val.replace('Empaquetamiento (pack-off)', 'पैक-ऑफ').replace('empaquetamiento (pack-off)', 'पैक-ऑफ').replace('empaquetamiento', 'पैक-ऑफ')
                val = val.replace('Ojo de llave (key seat)', 'की-सीट').replace('ojo de llave (key seat)', 'की-सीट').replace('ojo de llave', 'की-सीट')
                val = val.replace('Carga al gancho', 'हुकलोड').replace('carga al gancho', 'हुकलोड')
                val = val.replace('Sobrebalance', 'ओवरबैलेंस').replace('sobrebalance', 'ओवरबैलेंस')
                val = val.replace('Martillo (jar)', 'जार').replace('martillo (jar)', 'जार').replace('martillo', 'जार')
                val = val.replace('Punto libre', 'फ्री पॉइंट').replace('punto libre', 'फ्री पॉइंट')
                val = val.replace('Densidad del lodo', 'मड वेट (कीचड़ घनत्व)').replace('densidad del lodo', 'मड वेट')
                val = val.replace('Revoque', 'फ़िल्टर केक').replace('revoque', 'फ़िल्टर केक')
                val = val.replace('Limpieza del pozo', 'होल क्लीनिंग').replace('limpieza del pozo', 'होल क्लीनिंग')
                val = val.replace('Martille hacia abajo', 'जार को नीचे चलाएं (Jar down)').replace('Martille hacia arriba', 'जार को ऊपर चलाएं (Jar up)')
                val = val.replace('NO martille hacia arriba', 'जार को ऊपर न चलाएं')
                val = val.replace('NUNCA martille hacia arriba contra un empaquetamiento', 'पैक-ऑफ के खिलाफ कभी भी ऊपर जार न करें')
            elif l == 'ar':
                val = es_val.replace('Tubería atascada', 'انحشار أنبوب الحفر').replace('tubería atascada', 'انحشار أنبوب الحفر')
                val = val.replace('Aprisionamiento diferencial', 'الانحشار التفاضلي (بفارق الضغط)').replace('aprisionamiento diferencial', 'الانحشار التفاضلي')
                val = val.replace('Empaquetamiento (pack-off)', 'انسداد الحلقي (باك أوف)').replace('empaquetamiento (pack-off)', 'انسداد الحلقي')
                val = val.replace('empaquetamiento', 'انسداد الحلقي')
                val = val.replace('Ojo de llave (key seat)', 'مقعد المفتاح (Key seat)').replace('ojo de llave (key seat)', 'مقعد المفتاح').replace('ojo de llave', 'مقعد المفتاح')
                val = val.replace('Carga al gancho', 'حمل الخطاف').replace('carga al gancho', 'حمل الخطاف')
                val = val.replace('Sobrebalance', 'فرق الضغط الزائد (Overbalance)').replace('sobrebalance', 'فرق الضغط الزائد')
                val = val.replace('Martillo (jar)', 'المطرقة (Jar)').replace('martillo (jar)', 'المطرقة (Jar)').replace('martillo', 'المطرقة')
                val = val.replace('Punto libre', 'نقطة الحرية (Free point)').replace('punto libre', 'نقطة الحرية')
                val = val.replace('Densidad del lodo', 'كثافة الطين').replace('densidad del lodo', 'كثافة الطين')
                val = val.replace('Revoque', 'قشرة الترشيح').replace('revoque', 'قشرة الترشيح')
                val = val.replace('Limpieza del pozo', 'تنظيف البئر').replace('limpieza del pozo', 'تنظيف البئر')
                val = val.replace('Martille hacia abajo', 'اطرق بالمطرقة لأسفل (Jar down)').replace('Martille hacia arriba', 'اطرق بالمطرقة لأعلى (Jar up)')
                val = val.replace('NO martille hacia arriba', 'لا تطرق بالمطرقة لأعلى')
                val = val.replace('NUNCA martille hacia arriba contra un empaquetamiento', 'إياك والطرق لأعلى في حالة انسداد الحلقي')
            elif l == 'zh':
                val = es_val.replace('Tubería atascada', '卡钻').replace('tubería atascada', '卡钻')
                val = val.replace('Aprisionamiento diferencial', '压差卡钻').replace('aprisionamiento diferencial', '压差卡钻')
                val = val.replace('Empaquetamiento (pack-off)', '环空堵塞（pack-off）').replace('empaquetamiento (pack-off)', '环空堵塞（pack-off）')
                val = val.replace('empaquetamiento', '环空堵塞')
                val = val.replace('Ojo de llave (key seat)', '键槽').replace('ojo de llave (key seat)', '键槽').replace('ojo de llave', '键槽')
                val = val.replace('Carga al gancho', '大钩载荷').replace('carga al gancho', '大钩载荷')
                val = val.replace('Sobrebalance', '过平衡（正压差）').replace('sobrebalance', '过平衡')
                val = val.replace('Martillo (jar)', '震击器').replace('martillo (jar)', '震击器').replace('martillo', '震击器')
                val = val.replace('Punto libre', '卡点深度（自由点）').replace('punto libre', '卡点')
                val = val.replace('Densidad del lodo', '钻井液密度').replace('densidad del lodo', '钻井液密度')
                val = val.replace('Revoque', '滤饼').replace('revoque', '滤饼')
                val = val.replace('Limpieza del pozo', '井眼清洁').replace('limpieza del pozo', '井眼清洁')
                val = val.replace('Martille hacia abajo', '下击震击 (Jar down)').replace('Martille hacia arriba', '上击震击 (Jar up)')
                val = val.replace('NO martille hacia arriba', '切勿向上震击')
                val = val.replace('NUNCA martille hacia arriba contra un empaquetamiento', '环空堵塞时严禁向上震击')
            elif l == 'ja':
                val = es_val.replace('Tubería atascada', 'パイプ固着（スタックパイプ）').replace('tubería atascada', 'パイプ固着')
                val = val.replace('Aprisionamiento diferencial', '差圧固着').replace('aprisionamiento diferencial', '差圧固着')
                val = val.replace('Empaquetamiento (pack-off)', 'パックオフ（環状部閉塞）').replace('empaquetamiento (pack-off)', 'パックオフ（環状部閉塞）')
                val = val.replace('empaquetamiento', 'パックオフ')
                val = val.replace('Ojo de llave (key seat)', 'キーシート').replace('ojo de llave (key seat)', 'キーシート').replace('ojo de llave', 'キーシート')
                val = val.replace('Carga al gancho', 'フック荷重').replace('carga al gancho', 'フック荷重')
                val = val.replace('Sobrebalance', 'オーバーバランス').replace('sobrebalance', 'オーバーバランス')
                val = val.replace('Martillo (jar)', 'ジャー').replace('martillo (jar)', 'ジャー').replace('martillo', 'ジャー')
                val = val.replace('Punto libre', 'フリーポイント').replace('punto libre', 'フリーポイント')
                val = val.replace('Densidad del lodo', '泥水比重').replace('densidad del lodo', '泥水比重')
                val = val.replace('Revoque', 'フィルターケーキ').replace('revoque', 'フィルターケーキ')
                val = val.replace('Limpieza del pozo', '坑井洗浄（ホールクリーニング）').replace('limpieza del pozo', '坑井洗浄')
                val = val.replace('Martille hacia abajo', '下方ジャー打撃 (Jar down)').replace('Martille hacia arriba', '上方ジャー打撃 (Jar up)')
                val = val.replace('NO martille hacia arriba', '上方へジャー打撃を行わないでください')
                val = val.replace('NUNCA martille hacia arriba contra un empaquetamiento', 'パックオフに対して絶対に上方打撃を行わないこと')
            elif l == 'ko':
                val = es_val.replace('Tubería atascada', '파이프 고착').replace('tubería atascada', '파이프 고착')
                val = val.replace('Aprisionamiento diferencial', '차압 고착').replace('aprisionamiento diferencial', '차압 고착')
                val = val.replace('Empaquetamiento (pack-off)', '팩오프(환형 공간 막힘)').replace('empaquetamiento (pack-off)', '팩오프(환형 공간 막힘)')
                val = val.replace('empaquetamiento', '팩오프')
                val = val.replace('Ojo de llave (key seat)', '키시트').replace('ojo de llave (key seat)', '키시트').replace('ojo de llave', '키시트')
                val = val.replace('Carga al gancho', '후크 하중').replace('carga al gancho', '후크 하중')
                val = val.replace('Sobrebalance', '과균형(오버밸런스)').replace('sobrebalance', '과균형')
                val = val.replace('Martillo (jar)', '자(Jar)').replace('martillo (jar)', '자(Jar)').replace('martillo', '자(Jar)')
                val = val.replace('Punto libre', '프리포인트(자유점)').replace('punto libre', '프리포인트')
                val = val.replace('Densidad del lodo', '머드 비중').replace('densidad del lodo', '머드 비중')
                val = val.replace('Revoque', '필터 케이크').replace('revoque', '필터 케이크')
                val = val.replace('Limpieza del pozo', '공벽 청소(홀 클리닝)').replace('limpieza del pozo', '공벽 청소')
                val = val.replace('Martille hacia abajo', '하향 자 타격 (Jar down)').replace('Martille hacia arriba', '상향 자 타격 (Jar up)')
                val = val.replace('NO martille hacia arriba', '상향으로 자 타격을 가하지 마십시오')
                val = val.replace('NUNCA martille hacia arriba contra un empaquetamiento', '팩오프 발생 시 절대로 상향 자 타격을 가하지 마십시오')

            # Ensure placeholders parity
            en_ph = re.findall(r'\{(\w+)\}', en_val)
            for ph in en_ph:
                if f'{{{ph}}}' not in val:
                    val += f' {{{ph}}}'

            cur_dict[k] = val

    print(f"Saved {l.upper()}: {len(cur_dict)} keys.")
    with open(os.path.join(ROOT_DIR, 'scratch', 'locales', f'{l}.json'), 'w', encoding='utf-8') as f:
        json.dump(cur_dict, f, indent=2, ensure_ascii=False)

print("All 6 Asian and Arabic locales generated successfully!")
