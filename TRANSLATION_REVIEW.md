# Translation Review Document: Stuck Pipe Assistant

This document lists all strings requiring verification by native-speaking drilling engineers across the **13 supported languages**:
- **EN** (English)
- **ES** (Español)
- **FR** (Français)
- **PT** (Português)
- **DE** (Deutsch)
- **RU** (Русский)
- **UK** (Українська)
- **ID** (Bahasa Indonesia)
- **HI** (हिन्दी)
- **AR** (العربية - RTL)
- **ZH** (简体中文)
- **JA** (日本語)
- **KO** (한국어)

---

## 1. Core Drilling Engineering Glossary Adherence

| Concept | EN | ES | FR | PT | DE | RU | UK | ID | HI | AR | ZH | JA | KO |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Stuck pipe** | Stuck pipe | Tubería atascada | Coincement de la garniture | Prisão de coluna | Festsitzendes Gestänge | Прихват бурильной колонны | Прихват бурильної колони | Pipa terjepit (stuck pipe) | फँसा हुआ पाइप (स्टक पाइप) | انحشار أنبوب الحفر | 卡钻 | パイプ固着（スタックパイプ） | 파이프 고착 |
| **Differential sticking** | Differential sticking | Aprisionamiento diferencial | Coincement différentiel | Prisão diferencial | Differenzdruck-Festsitzen | Дифференциальный прихват | Диференційний прихват | Terjepit diferensial | डिफरेंशियल स्टिकिंग (दाब-अंतर से फँसना) | الانحشار التفاضلي (بفارق الضغط) | 压差卡钻 | 差圧固着 | 차압 고착 |
| **Pack-off** | Pack-off | Empaquetamiento (pack-off) | Pack-off (bouchon annulaire) | Pack-off (obstrução do anular) | Pack-off (Ringraumverstopfung) | Пробка в затрубье (pack-off) | Пробка в затрубному просторі (pack-off) | Pack-off (penyumbatan annulus) | पैक-ऑफ | انسداد الحلقي (باك أوف) | 环空堵塞（pack-off） | パックオフ（環状部閉塞） | 팩오프(환형 공간 막힘) |
| **Key seat** | Key seat | Ojo de llave (key seat) | Rainure de clavette (key seat) | Chaveta (key seat) | Key-Seat | Желобная выработка (желоб) | Жолобна виробка | Key seat | की-सीट | مقعد المفتاح (Key seat) | 键槽 | キーシート | 키시트 |
| **Hookload** | Hookload | Carga al gancho | Charge au crochet | Carga no gancho | Hakenlast | Нагрузка на крюке | Навантаження на гак | Beban hook (hookload) | हुकलोड | حمل الخطاف | 大钩载荷 | フック荷重 | 후크 하중 |
| **Overbalance** | Overbalance | Sobrebalance | Surpression (overbalance) | Sobrebalanço | Überdruck (Overbalance) | Репрессия | Репресія | Overbalance (tekanan lebih) | ओवरबैलेंस | فرق الضغط الزائد (Overbalance) | 过平衡（正压差） | オーバーバランス | 과균형(오버밸런스) |
| **Jar** | Jar | Martillo (jar) | Coulisse (jar) | Martelo (jar) | Schlagschere (Jar) | Яс | Яс | Jar | जार | المطرقة (Jar) | 震击器 | ジャー | 자(Jar) |
| **Free point** | Free point | Punto libre | Point libre | Ponto livre | Freier Punkt | Точка прихвата | Точка прихвату | Titik bebas | फ्री पॉइंट | نقطة الحرية (Free point) | 卡点深度（自由点） | フリーポイント | 프리포인트(자유점) |
| **Mud weight** | Mud weight | Densidad del lodo | Densité de la boue | Peso da lama | Spülungsdichte | Плотность бурового раствора | Густина бурового розчину | Berat lumpur | मड वेट (कीचड़ घनत्व) | كثافة الطين | 钻井液密度 | 泥水比重 | 머드 비중 |
| **Filter cake** | Filter cake | Revoque | Cake de filtration | Reboco | Filterkuchen | Фильтрационная корка | Фільтраційна кірка | Kerak filtrasi | फ़िल्टर केक | قشرة الترشيح | 滤饼 | フィルターケーキ | 필터 케이크 |
| **Hole cleaning** | Hole cleaning | Limpieza del pozo | Nettoyage du puits | Limpeza do poço | Bohrlochreinigung | Очистка ствола скважины | Очищення стовбура свердловини | Pembersihan lubang | होल क्लीनिंग | تنظيف البئر | 井眼清洁 | 坑井洗浄（ホールクリーニング） | 공벽 청소(홀 클리닝) |

---

## 2. Critical Safety Warnings & Invariants

Reviewers must verify that safety instructions retain full operational urgency:
1. **Never pressure up against a pack-off**: Bleed off trapped pump pressure immediately before working pipe.
2. **Never jar up against a pack-off**: Always jar down away from cuttings beds or cavings.
3. **Kick risk during differential reduction**: Confirm pore pressure and well control kick margin before reducing hydrostatic pressure or spotting lighter pills.
4. **Circulation loss with well control check**: Flow check and pit monitoring to ensure no subterranean flow or gas kick is masked.

---

## 3. Playbook Action Steps Under Review

The following table samples the primary operational action playbooks across English, Spanish, Russian, Arabic, and Chinese:

| Key | English | Español | Русский | العربية (RTL) | 简体中文 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `playbook.diff.now.1` | Keep circulating at the highest rate the hole allows. | Mantenga la circulación al caudal más alto que permita el pozo. | Поддерживайте циркуляцию с максимально допустимым расходом. | حافظ على استمرار التدوير بأعلى معدل تدفق يسمح به البئر. | 保持井眼允许的最大排量持续循环。 |
| `playbook.diff.now.2` | Slack off to set down weight, apply right-hand torque and jar down at maximum safe trip load. | Descargue peso sobre la sarta, aplique torque a la derecha y martille hacia abajo con la máxima carga segura. | Разгрузите вес, приложите правый крутящий момент и бейте ясом вниз с максимально безопасной нагрузкой. | فرغ الوزن، وطبق عزم الدوران لليمين واطرق بالمطرقة لأسفل بأقصى حمل آمن. | 下放钻具下压，施加右旋扭矩，并在最大安全允许负荷下下击震击。 |
| `playbook.pack_cut.now.1` | Bleed off trapped pump pressure immediately. Do not pressure up against the pack-off. | Alivie inmediatamente la presión de bomba atrapada. NO intente bombear con presión contra el empaquetamiento. | Немедленно стравите запертое давление насоса. НЕ качайте под давлением против пробки. | نزّس الضغط المحتبس فوراً. لا تضخ ضد الانسداد مطلقاً. | 立即泄掉憋停的泵压。严禁盲目憋压冲击堵塞环空。 |
| `playbook.key.now.1` | Stop pulling. Do not keep overpulling: the BHA wedges deeper into the slot. | Detenga la tracción de inmediato. NO continúe sobretensionando: la BHA se acuña aún más dentro de la ranura. | Немедленно прекратите подъем. НЕ натягивайте: КНБК еще сильнее заклинивает в желобе. | توقف عن السحب فوراً. لا تواصل الشد الزائد: يتسبب ذلك في انحشار مجموعة قاع البئر بشكل أعمق. | 立即停止上提。严禁继续过拉上提：否则会导致底部钻具组合在键槽中越卡越死。 |
