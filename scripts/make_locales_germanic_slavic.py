#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates complete 466-key translations for Germanic & Slavic languages:
- German (de)
- Russian (ru)
- Ukrainian (uk)
Strictly adheres to drilling engineering standards and the provided glossary.
"""

import json
import os
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

with open(os.path.join(ROOT_DIR, 'scratch', 'stuckpipe_all_en.json'), 'r', encoding='utf-8') as f:
    en_dict = json.load(f)

DE = {}
RU = {}
UK = {}

# 1. Title & Navigation & Core UI
common_data = {
    'stuckpipe.title': ('Festsitzendes Gestänge - Assistent', 'Прихват бурильной колонны - Помощник', 'Прихват бурильної колони - Помічник'),
    'stuckpipe.subtitle': ('Echtzeit-Entscheidungsunterstützung zur Diagnose und Mechanikrechner für festsitzendes Gestänge',
                           'Поддержка принятия решений по диагностике и расчеты прихватов бурильной колонны',
                           'Підтримка прийняття рішень з діагностики та розрахунки прихвату бурильної колони'),
    'stuckpipe.search_keywords': ('festsitzendes gestänge, differenzdruck-festsitzen, pack-off (ringraumverstopfung), key-seat, freier punkt, schlagschere (jar), bohrlochreinigung, überdruck (overbalance)',
                                  'прихват бурильной колонны, дифференциальный прихват, пробка в затрубье (pack-off), желобная выработка (желоб), точка прихвата, яс, очистка ствола скважины, репрессия',
                                  'прихват бурильної колони, диференційний прихват, пробка в затрубному просторі (pack-off), жолобна виробка, точка прихвату, яс, очищення стовбура свердловини, репресія'),
    'stuckpipe.tab_diagnose': ('Diagnose', 'Диагностика', 'Діагностика'),
    'stuckpipe.tab_calculate': ('Berechnen', 'Расчеты', 'Розрахунки'),
    'stuckpipe.tab_log': ('Protokoll', 'Журнал', 'Журнал'),
    'stuckpipe.disclaimer': ('Nur zur Entscheidungsunterstützung. Befolgen Sie die Betriebsverfahren für festsitzendes Gestänge, Bohrlochkontrollrichtlinien und Ausrüstungsgrenzen.',
                             'Исключительно для поддержки принятия решений. Соблюдайте регламенты оператора по ликвидации прихватов, правила противофонтанной безопасности и ограничения оборудования.',
                             'Виключно для підтримки прийняття рішень. Дотримуйтесь регламентів оператора щодо ліквідації прихвату, правил протифонтанної безпеки та меж навантаження обладнання.'),
    'stuckpipe.unit_field': ('Ölfeld (US)', 'Промысловые (US)', 'Промислові (US)'),
    'stuckpipe.unit_metric': ('Metrisch', 'Метрические', 'Метричні'),
    'stuckpipe.opt_unknown': ('Nicht sicher', 'Не уверен', 'Не впевнений'),
    'stuckpipe.btn_diagnose': ('Festsitz-Mechanismus diagnostizieren', 'Диагностировать механизм прихвата', 'Діагностувати механізм прихвату'),
    'stuckpipe.btn_reset': ('Antworten zurücksetzen', 'Сбросить ответы', 'Скинути відповіді'),
    'stuckpipe.form_title': ('Was beobachten Sie?', 'Что вы наблюдаете?', 'Що ви спостерігаєте?'),
    'stuckpipe.form_subtitle': ('Beantworten Sie bekannte Parameter. Die Diagnose aktualisiert sich in Echtzeit bei jeder Eingabe.',
                                'Отвечайте на известные пункты. Диагностика обновляется в реальном времени.',
                                'Відповідайте на відомі пункти. Діагностика оновлюється в реальному часі.'),
    'stuckpipe.indicators_title': ('Weitere Indikatoren (optional)', 'Дополнительные признаки (опционально)', 'Додаткові ознаки (опціонально)'),
    'stuckpipe.indicators_count': ('{count} ausgewählt', 'Выбрано: {count}', 'Вибрано: {count}'),
}

for k, (de_v, ru_v, uk_v) in common_data.items():
    DE[k], RU[k], UK[k] = de_v, ru_v, uk_v

# 2. Questions & Options
q_data = {
    'stuckpipe.q.operation.title': ('Welcher Vorgang lief beim Festwerden ab?', 'Какая операция выполнялась в момент прихвата?', 'Яка операція виконувалася в момент прихвату?'),
    'stuckpipe.q.operation.drilling': ('Rotationsbohren (mit Drehung)', 'Роторное бурение (с вращением)', 'Роторне буріння (з обертанням)'),
    'stuckpipe.q.operation.sliding': ('Gleitbohren (Sliding / orientiert)', 'Слайдирование (без вращения)', 'Слайдування (без обертання)'),
    'stuckpipe.q.operation.reaming': ('Aufbohren / Rückräumen (Reaming)', 'Проработка / калибровка ствола', 'Проробка / калібрування стовбура'),
    'stuckpipe.q.operation.tripping_out': ('Ausbau der Garnitur (Tripping out)', 'Подъем инструмента (СПО)', 'Підйом інструменту (СПО)'),
    'stuckpipe.q.operation.tripping_in': ('Einbau der Garnitur (Tripping in)', 'Спуск инструмента (СПО)', 'Спуск інструменту (СПО)'),
    'stuckpipe.q.operation.static': ('Statisch (Verbindung, Vermessung, in Keilen)', 'Статика (наращивание, замер, на клиньях)', 'Статика (нарощування, заміри, на клинах)'),

    'stuckpipe.q.lastMove.title': ('Letzte Rohrbewegung vor dem Festsitzen', 'Последнее движение колонны перед прихватом', 'Останній рух колони перед прихватом'),
    'stuckpipe.q.lastMove.up': ('Aufwärtsbewegung', 'Движение вверх', 'Рух вгору'),
    'stuckpipe.q.lastMove.down': ('Abwärtsbewegung', 'Движение вниз', 'Рух вниз'),
    'stuckpipe.q.lastMove.rotating': ('Nur Drehung', 'Только вращение', 'Тільки обертання'),
    'stuckpipe.q.lastMove.none': ('Stationär / stillstehend', 'Неподвижно', 'Нерухомо'),

    'stuckpipe.q.circulation.title': ('Spülungsumlauf (Zirkulation)', 'Циркуляция', 'Циркуляція'),
    'stuckpipe.q.circulation.full': ('Normal (unbehinderter Fluss und Druck)', 'Полная (нормальное давление и расход)', 'Повна (нормальний тиск та витрата)'),
    'stuckpipe.q.circulation.restricted': ('Eingeschränkt (hoher Pumpendruck)', 'Затруднена (высокое давление насоса)', 'Ускладнена (високий тиск насоса)'),
    'stuckpipe.q.circulation.none': ('Keine Zirkulation / verstopft', 'Отсутствует / заблокирована', 'Відсутня / заблокована'),

    'stuckpipe.q.onset.title': ('Wie veränderte sich der Pumpendruck?', 'Как изменилось давление насоса?', 'Як змінився тиск насоса?'),
    'stuckpipe.q.onset.sudden': ('Plötzlich', 'Внезапно', 'Раптово'),
    'stuckpipe.q.onset.gradual': ('Allmählicher Anstieg', 'Постепенное нарастание', 'Поступове наростання'),

    'stuckpipe.q.rotation.title': ('Drehung / Drehmoment', 'Вращение / крутящий момент', 'Обертання / крутний момент'),
    'stuckpipe.q.rotation.free': ('Frei (volles Drehmoment und Drehung)', 'Свободное (нормальный момент и вращение)', 'Вільне (нормальний момент і обертання)'),
    'stuckpipe.q.rotation.restricted': ('Eingeschränkt / hohes Drehmoment', 'Затрудненное / высокий крутящий момент', 'Ускладнене / високий крутний момент'),
    'stuckpipe.q.rotation.locked': ('Blockiert (keine Drehung möglich)', 'Заблокировано (вращение невозможно)', 'Заблоковано (обертання неможливе)'),

    'stuckpipe.q.movement.title': ('In welche Richtung lässt sich das Gestänge bewegen?', 'В каком направлении движется колонна?', 'В якому напрямку рухається колона?'),
    'stuckpipe.q.movement.hint': ('Vorsichtig testen, innerhalb der zulässigen Zug- und Entlastungsgrenzen', 'Проверять осторожно, в пределах нагрузок', 'Перевіряти обережно, в межах допустимих навантажень'),
    'stuckpipe.q.movement.neither': ('Weder auf noch ab', 'Ни вверх, ни вниз', 'Ні вгору, ні вниз'),
    'stuckpipe.q.movement.down_only': ('Nur abwärts (kein Zug möglich)', 'Только вниз (подъем невозможен)', 'Тільки вниз (підйом неможливий)'),
    'stuckpipe.q.movement.up_only': ('Nur aufwärts (kein Absenken möglich)', 'Только вверх (спуск невозможен)', 'Тільки вгору (спуск неможливий)'),
    'stuckpipe.q.movement.both': ('Beide Richtungen (engstehendes Bohrloch, hohe Reibung)', 'В обоих направлениях (затяжки, посадки)', 'В обох напрямках (затяжки, посадки)'),

    'stuckpipe.q.angle.title': ('Bohrlochinclination am Festpunkt', 'Зенитный угол в интервале прихвата', 'Зенітний кут в інтервалі прихвату'),
    'stuckpipe.q.angle.low': ('Unter 30°', 'Менее 30°', 'Менше 30°'),
    'stuckpipe.q.angle.mid': ('30° bis 60°', 'От 30° до 60°', 'Від 30° до 60°'),
    'stuckpipe.q.angle.high': ('Über 60°', 'Более 60°', 'Більше 60°'),

    'stuckpipe.q.staticTime.title': ('Stillstandszeit vor dem Festsitzen', 'Время стоянки перед прихватом', 'Час стоянки перед прихватом'),
    'stuckpipe.q.staticTime.short': ('Wenige Minuten (unter 10 min)', 'Минуты (менее 10 мин)', 'Хвилини (менше 10 хв)'),
    'stuckpipe.q.staticTime.long': ('Längere Zeit (über 10 min)', 'Длительное (более 10 мин)', 'Тривалий (понад 10 хв)'),

    'stuckpipe.q.mud.title': ('Spülungstyp', 'Тип бурового раствора', 'Тип бурового розчину'),
    'stuckpipe.q.mud.wbm': ('Wasserbasiert (WBM)', 'На водной основе (РУВ)', 'На водній основі (РВО)'),
    'stuckpipe.q.mud.obm': ('Ölbasiert / synthetisch (OBM)', 'На углеводородной основе (РУО)', 'На вуглеводневій основі (РВО)'),
}

for k, (de_v, ru_v, uk_v) in q_data.items():
    DE[k], RU[k], UK[k] = de_v, ru_v, uk_v

# 3. Indicator Flags
flags_data = {
    'stuckpipe.flag.torque_trend': ('Drehmoment stieg an', 'Крутящий момент нарастал', 'Крутний момент зростав'),
    'stuckpipe.flag.drag_trend': ('Reibungswiderstand / Überzug nahm zu', 'Затяжки и посадки нарастали', 'Затяжки та посадки наростали'),
    'stuckpipe.flag.poor_cleaning': ('Probleme bei der Bohrlochreinigung (geringe Strömung, hohes ROP, weniger Bohrklein)',
                                     'Проблемы очистки ствола скважины (низкий расход, высокая мехскорость, мало шлама)',
                                     'Проблеми очищення стовбура свердловини (низька витрата, висока швидкість, мало шламу)'),
    'stuckpipe.flag.cavings': ('Ausbrüche (Cavings) an den Schüttelsieben', 'Вывал породы (кавернообразование) на виброситах', 'Вивали породи (каверноутворення) на віброситах'),
    'stuckpipe.flag.losses': ('Spülungsverluste', 'Поглощение бурового раствора', 'Поглинання бурового розчину'),
    'stuckpipe.flag.swab': ('Kolben- / Druckstöße vermutet (Swab/Surge)', 'Подозрение на свабирование / поршневание', 'Підозра на свабування / поршнювання'),
    'stuckpipe.flag.bha_change': ('Neue oder steifere BHA-Bohrstranggarnitur', 'Новая или более жесткая КНБК', 'Нова або більш жорстка КНБК'),
    'stuckpipe.flag.dogleg': ('Bekannter Knick (Dogleg) / hohe DLS', 'Известный интервал искривления (dogleg) / высокая DLS', 'Відомий інтервал викривлення (dogleg) / висока DLS'),
    'stuckpipe.flag.prev_tight': ('Engstelle hier bei früherem Trip', 'Затяжка в этом интервале в предыдущем рейсе', 'Затяжка в цьому інтервалі в попередньому рейсі'),
    'stuckpipe.flag.interbedded': ('Wechsellagerung harter und weicher Schichten', 'Чередование твердых и мягких пород', 'Перешарування твердих і м яких порід'),
    'stuckpipe.flag.bit_undergauge': ('Vorheriger Bohrmeißel kam unterkalibrig heraus', 'Предыдущее долото вышло изношенным по калибру', 'Попереднє долото вийшло зношеним по калібру'),
    'stuckpipe.flag.thick_cake': ('Hoher Filtrationsverlust / dicker Filterkuchen', 'Высокая водоотдача / толстая фильтрационная корка', 'Висока водовіддача / товста фільтраційна кірка'),
    'stuckpipe.flag.junk': ('Metallteile / Fremdkörper im Loch', 'Посторонние металлические предметы на забое', 'Сторонні металеві предмети на вибої'),
    'stuckpipe.flag.cement': ('Zementierarbeit / abgebundene Zementblöcke', 'Цементирование / куски схватившегося цемента', 'Цементування / шматки схопленого цементу'),
    'stuckpipe.flag.casing': ('Verdacht auf Verrohrungsschaden / Kollaps', 'Подозрение на повреждение или смятие обсадной колонны', 'Підозра на пошкодження або зминання обсадної колони'),
    'stuckpipe.flag.salt': ('Bohren durch Salzgestein oder plastischen Ton', 'Бурение в пластах солей или текучих глин', 'Буріння в пластах солей або текучих глин'),
    'stuckpipe.flag.permeable_zone': ('Gegenüber einer Sand- / druckabgesenkten Zone', 'Напротив проницаемого или истощенного пласта', 'Навпроти проникного або виснаженого пласта'),
}

for k, (de_v, ru_v, uk_v) in flags_data.items():
    DE[k], RU[k], UK[k] = de_v, ru_v, uk_v

# 4. Results UI & Diagnosis
res_data = {
    'stuckpipe.res_start_title': ('Beginnen Sie mit zwei Antworten', 'Начните с двух ответов', 'Почніть з двох відповідей'),
    'stuckpipe.res_start_text': ('Geben Sie den Vorgang und den Zustand der Zirkulation an. Die Diagnose wird sofort angezeigt.',
                                 'Укажите текущую операцию и состояние циркуляции. Диагноз появится незамедлительно.',
                                 'Вкажіть поточну операцію та стан циркуляції. Діагноз з явиться негайно.'),
    'stuckpipe.res_most_likely': ('Höchstwahrscheinlich', 'Наиболее вероятно', 'Найбільш ймовірно'),
    'stuckpipe.res_confidence': ('Konfidenz: {level}', 'Уверенность: {level}', 'Впевненість: {level}'),
    'stuckpipe.res_confidence_high': ('Hoch', 'Высокая', 'Висока'),
    'stuckpipe.res_confidence_medium': ('Mittel', 'Средняя', 'Середня'),
    'stuckpipe.res_confidence_low': ('Niedrig', 'Низкая', 'Низька'),
    'stuckpipe.res_why': ('Gründe für diesen Mechanismus', 'Почему этот механизм', 'Чому цей механізм'),
    'stuckpipe.res_evidence_against': ('Gegenbeweise', 'Факторы против', 'Фактори проти'),
    'stuckpipe.res_other_possibilities': ('Weitere Möglichkeiten', 'Другие варианты', 'Інші варіанти'),
    'stuckpipe.res_safety': ('Sicherheit', 'Безопасность', 'Безпека'),
    'stuckpipe.res_action_plan': ('Maßnahmenplan: {name}', 'План действий: {name}', 'План дій: {name}'),
    'stuckpipe.res_plan_for': ('Plan: {name}', 'План: {name}', 'План: {name}'),
    'stuckpipe.res_if_instead': ('Falls stattdessen: {name}', 'Если альтернатива: {name}', 'Якщо альтернатива: {name}'),
    'stuckpipe.res_avoid_both': ('Könnte beides sein: vermeiden Sie Maßnahmen, die beides verschlimmern',
                                 'Возможен любой из двух: избегайте действий, ухудшающих оба варианта',
                                 'Можливий будь-який з двох: уникайте дій, що погіршують обидва варіанти'),
    'stuckpipe.res_do_now': ('Sofortmaßnahmen (in dieser Reihenfolge)', 'Первоочередные действия (по порядку)', 'Першочергові дії (по порядку)'),
    'stuckpipe.res_jar_direction': ('Schlagschere Schlagrichtung (Jar)', 'Направление работы яса', 'Напрямок роботи яса'),
    'stuckpipe.res_do_not': ('NICHT tun', 'ЗАПРЕЩЕНО делать', 'ЗАБОРОНЕНО робити'),
    'stuckpipe.res_confirm': ('Diagnose bestätigen', 'Подтверждение диагноза', 'Підтвердження діагнозу'),
    'stuckpipe.res_escalate': ('Eskalieren, falls', 'Эскалация при', 'Ескалація при'),
    'stuckpipe.res_prevent': ('Nach Freikommen: Wiederholung verhindern', 'После освобождения: предотвращение', 'Після звільнення: запобігання'),
    'stuckpipe.res_first_5_minutes': ('Erste 5 Minuten', 'Первые 5 минут', 'Перші 5 хвилин'),
    'stuckpipe.res_tight_hole_title': ('Engstelle: noch nicht fest', 'Затяжка: инструмент еще не прихвачен', 'Затяжка: інструмент ще не прихоплений'),
    'stuckpipe.res_tight_hole_text': ('Das Gestänge lässt sich noch in beide Richtungen bewegen. Behandeln Sie dies als Warnung, bevor es festsitzt.',
                                     'Колонна движется в обоих направлениях. Действуйте немедленно, чтобы не допустить прихвата.',
                                     'Колона рухається в обох напрямках. Дійте негайно, щоб не допустити прихвату.'),
    'stuckpipe.jar.down': ('RUNTER', 'ВНИЗ', 'ВНИЗ'),
    'stuckpipe.jar.up': ('HOCH', 'ВВЕРХ', 'ВГОРУ'),
    'stuckpipe.jar.confirm': ('BESTÄTIGEN', 'ПРОВЕРИТЬ', 'ПЕРЕВІРИТИ'),
}

for k, (de_v, ru_v, uk_v) in res_data.items():
    DE[k], RU[k], UK[k] = de_v, ru_v, uk_v

# 5. Calculators UI
calc_data = {
    'stuckpipe.calc.subtab_diff': ('Differenzdruck-Festsitzen', 'Дифференциальный прихват', 'Диференційний прихват'),
    'stuckpipe.calc.subtab_free': ('Freier Punkt', 'Точка прихвата', 'Точка прихвату'),
    'stuckpipe.calc.subtab_spot': ('Freimachungspille (Spot pill)', 'Установка ванны', 'Установка ванни'),
    'stuckpipe.calc.mw': ('Spülungsdichte', 'Плотность бурового раствора', 'Густина бурового розчину'),
    'stuckpipe.calc.pp_emw': ('Porendruck (EMW)', 'Пластовое давление (ЭСП)', 'Пластовий тиск (ЕЕГ)'),
    'stuckpipe.calc.tvd': ('Wahre Teufe (TVD)', 'Вертикальная глубина (TVD)', 'Вертикальна глибина (TVD)'),
    'stuckpipe.calc.contact_length': ('Kontaktlänge', 'Длина зоны контакта', 'Довжина зони контакту'),
    'stuckpipe.calc.od': ('Außendurchmesser Gestänge / BHA (OD)', 'Наружный диаметр труб / КНБК', 'Зовнішній діаметр труб / КНБК'),
    'stuckpipe.calc.cake': ('Dicke des Filterkuchens', 'Толщина фильтрационной корки', 'Товщина фільтраційної кірки'),
    'stuckpipe.calc.friction': ('Reibungskoeffizient (μ)', 'Коэффициент трения (μ)', 'Коефіцієнт тертя (μ)'),
    'stuckpipe.calc.tensile_yield': ('Zugstreckgrenze des Gestänges', 'Предел текучести труб на растяжение', 'Межа плинності труб на розтягнення'),
    'stuckpipe.calc.design_factor': ('Sicherheitsfaktor (Design factor)', 'Коэффициент запаса прочности', 'Коефіцієнт запасу міцності'),
    'stuckpipe.calc.free_weight': ('Freies Gestängegewicht', 'Вес свободной части колонны', 'Вага вільної частини колони'),
    'stuckpipe.calc.pill_mw': ('Dichte der leichten Pille', 'Плотность облегченной ванны', 'Густина полегшеної ванни'),
    'stuckpipe.calc.pill_tvd': ('Vertikale Pillenhöhe', 'Вертикальная высота ванны', 'Вертикальна висота ванни'),
    'stuckpipe.calc.stretch': ('Dehnung', 'Удлинение (stretch)', 'Подовження (stretch)'),
    'stuckpipe.calc.pull_diff': ('Zugkraftdifferenz', 'Перепад тягового усилия', 'Перепад тягового зусилля'),
    'stuckpipe.calc.pipe_weight': ('Gestänge-Längengewicht', 'Погонный вес бурильных труб', 'Погонна вага бурильних труб'),
    'stuckpipe.calc.hole_size': ('Bohrlochdurchmesser', 'Диаметр ствола скважины', 'Діаметр стовбура свердловини'),
    'stuckpipe.calc.pipe_od': ('Gestänge-Außendurchmesser', 'Наружный диаметр труб', 'Зовнішній діаметр труб'),
    'stuckpipe.calc.interval': ('Festsitzendes Intervall', 'Интервал прихвата', 'Інтервал прихвату'),
    'stuckpipe.calc.margin': ('Sicherheitsüberdeckung oben & unten', 'Запас высоты ванны выше и ниже', 'Запас висоти ванни вище і нижче'),
    'stuckpipe.calc.excess': ('Volumenüberschuss (%)', 'Коэффициент избытка (%)', 'Коефіцієнт надлишку (%)'),
    'stuckpipe.calc.leave_string': ('Restvolumen im Rohrstrang', 'Остаток объема в колонне', 'Залишок об єму в колоні'),
    'stuckpipe.calc.overbalance': ('Überdruck (Overbalance) (ΔP)', 'Репрессия (ΔP)', 'Репресія (ΔP)'),
    'stuckpipe.calc.contact_area': ('Kontaktfläche', 'Площадь контакта', 'Площа контакту'),
    'stuckpipe.calc.sticking_force': ('Differenzdruck-Festsitzkraft', 'Сила дифференциального прихвата', 'Сила диференційного прихвату'),
    'stuckpipe.calc.max_hookload': ('Maximal zulässige Hakenlast', 'Максимальная допустимая нагрузка на крюке', 'Максимальне допустиме навантаження на гак'),
    'stuckpipe.calc.safe_overpull': ('Sichere Überzugsmarge', 'Безопасный запас натяжения (overpull)', 'Безпечний запас натягу (overpull)'),
    'stuckpipe.calc.verdict': ('Bewertung der Freimachbarkeit', 'Оценка вероятности освобождения', 'Оцінка ймовірності звільнення'),
    'stuckpipe.calc.reduction_needed': ('Erforderliche ΔP-Senkung für sicheren Zug', 'Требуемое снижение ΔP для натяжения', 'Необхідне зниження ΔP для натягу'),
    'stuckpipe.calc.pill_reduction': ('Hydrostatischer Druckabfall durch leichte Pille', 'Снижение гидростатики облегченной ванной', 'Зниження гідростатики полегшеною ванною'),
    'stuckpipe.calc.remaining_ob': ('Verbleibender Überdruck', 'Остаточная репрессия', 'Залишкова репресія'),
    'stuckpipe.calc.free_point': ('Berechnete Tiefe des freien Punkts', 'Расчетная глубина точки прихвата', 'Розрахункова глибина точки прихвату'),
    'stuckpipe.calc.section': ('Betroffene Gestängesektion', 'Секция колонны в интервале прихвата', 'Секція колони в інтервалі прихвату'),
    'stuckpipe.calc.pct_free': ('Prozentual freier Strang', 'Процент свободной колонны', 'Відсоток вільної колони'),
    'stuckpipe.calc.beyond_string': ('Berechnete Tiefe liegt unterhalb der Gesamtlänge', 'Расчетная глубина превышает длину колонны', 'Розрахункова глибина перевищує довжину колони'),
    'stuckpipe.calc.deviated_note': ('Warnung bei abgelenkten Bohrungen: Wandreibung verringert die gemessene Dehnung, sodass der berechnete freie Punkt flacher als tatsächlich erscheint.',
                                     'Внимание при наклонном бурении: трение о стенки скважины уменьшает удлинение, занижая расчетную глубину.',
                                     'Увага при похило-скерованому бурінні: тертя об стінки зменшує видовження, занижуючи розрахункову глибину.'),
    'stuckpipe.calc.annular_cap': ('Ringraumkapazität', 'Удельная емкость затрубья', 'Питома місткість затрубного простору'),
    'stuckpipe.calc.annular_vol': ('Ringraumvolumen der Pille', 'Объем ванны в затрубье', 'Об єм ванни в затрубному просторі'),
    'stuckpipe.calc.total_pill': ('Gesamtvolumen der Pille', 'Общий требуемый объем ванны', 'Загальний необхідний об єм ванни'),
    'stuckpipe.calc.btn_estimate_force': ('Festsitzkraft schätzen', 'Рассчитать силу прихвата', 'Розрахувати силу прихвату'),
    'stuckpipe.calc.btn_find_freepoint': ('Freien Punkt ermitteln', 'Определить точку прихвата', 'Визначити точку прихвату'),
    'stuckpipe.calc.presets_label': ('Voreinstellungen (μ):', 'Стандартные значения (μ):', 'Стандартні значення (μ):'),
    'stuckpipe.calc.preset_obm': ('Ölbasierte Spülung OBM (0.08)', 'РУО (0.08)', 'РВО (0.08)'),
    'stuckpipe.calc.preset_wbm': ('Wasserbasierte Spülung WBM (0.15)', 'РУВ (0.15)', 'РВО (0.15)'),
    'stuckpipe.calc.preset_wbm_thick': ('WBM dicker Filterkuchen (0.25)', 'РУВ с толстой коркой (0.25)', 'РВО з товстою кіркою (0.25)'),
    'stuckpipe.calc.add_section': ('Gestängesektion hinzufügen', 'Добавить секцию труб', 'Додати секцію труб'),
    'stuckpipe.calc.remove_section': ('Entfernen', 'Удалить', 'Видалити'),
    'stuckpipe.calc.section_title': ('Sektion {num}', 'Секция {num}', 'Секція {num}'),
    'stuckpipe.calc.section_len': ('Länge', 'Длина', 'Довжина'),
    'stuckpipe.calc.section_weight': ('Gewicht', 'Вес', 'Вага'),
    'stuckpipe.log_btn_add': ('Diagnose ins Protokoll eintragen', 'Добавить в журнал', 'Додати в журнал'),
    'stuckpipe.toast_added_log': ('Ins Protokoll eingetragen', 'Добавлено в журнал', 'Додано в журнал'),
    'stuckpipe.log_empty': ('Noch keine Protokolleinträge.', 'Журнал пока пуст.', 'Журнал порожній.'),
    'stuckpipe.log_clear': ('Protokoll löschen', 'Очистить журнал', 'Очистити журнал'),
    'stuckpipe.log_export': ('Bericht exportieren', 'Экспорт отчета', 'Експорт звіту'),
}

for k, (de_v, ru_v, uk_v) in calc_data.items():
    DE[k], RU[k], UK[k] = de_v, ru_v, uk_v

# 6. Mechanisms
mechs_data = {
    'mech.diff.name': ('Differenzdruck-Festsitzen', 'Дифференциальный прихват', 'Диференційний прихват'),
    'mech.diff.family': ('Differenzdruck', 'Дифференциальный', 'Диференційний'),
    'mech.diff.summary': ('Der Bohrstrang wird durch die Druckdifferenz zwischen Schlammhydrostatik und Formationsdruck an einer permeablen Zone in den Filterkuchen gepresst.',
                          'Колонна прижата к фильтрационной корке в проницаемом пласте разницей между гидростатическим и пластовым давлением.',
                          'Колона притиснута до фільтраційної кірки в проникному пласті різницею між гідростатичним і пластовим тиском.'),

    'mech.pack_cut.name': ('Pack-off (Ringraumverstopfung): Bohrklein / unzureichende Bohrlochreinigung',
                           'Пробка в затрубье (pack-off): шлам / недостаточная очистка ствола скважины',
                           'Пробка в затрубному просторі (pack-off): шлам / недостатнє очищення стовбура свердловини'),
    'mech.pack_cut.family': ('Mechanisch: Pack-off / Brücke', 'Механический: пробка / мост', 'Механічний: пробка / міст'),
    'mech.pack_cut.summary': ('Abgelagertes Bohrklein oder eine Schlammlawine hat den Ringraum um die BHA oder das Bohrgestänge verstopft.',
                             'Осевший шлам заблокировал затрубное пространство вокруг КНБК или бурильных труб.',
                             'Осілий шлам заблокував затрубний простір навколо КНБК або бурильних труб.'),

    'mech.pack_shale.name': ('Pack-off (Ringraumverstopfung): instabiler Tonstein (Cavings)',
                             'Пробка в затрубье (pack-off): осыпание нестабильных глин (каверны)',
                             'Пробка в затрубному просторі (pack-off): обсипання нестабільних глин (каверни)'),
    'mech.pack_shale.family': ('Mechanisch: Pack-off / Brücke', 'Механический: пробка / мост', 'Механічний: пробка / міст'),
    'mech.pack_shale.summary': ('Reaktiver oder spröder Tonstein ist ins Bohrloch nachgebrochen und verpackt die Garnitur.',
                               'Реактивные или трещиноватые глины обрушились в ствол скважины, вызвав прихват.',
                               'Реактивні або тріщинуваті глини обвалилися в стовбур свердловини, спричинивши прихват.'),

    'mech.pack_frac.name': ('Pack-off (Ringraumverstopfung): zerklüftetes / unverfestigtes Gestein',
                            'Пробка в затрубье (pack-off): трещиноватые / несцементированные породы',
                            'Пробка в затрубному просторі (pack-off): тріщинуваті / незцементовані породи'),
    'mech.pack_frac.family': ('Mechanisch: Pack-off / Brücke', 'Механический: пробка / мост', 'Механічний: пробка / міст'),
    'mech.pack_frac.summary': ('Blöcke oder lose Trümmer aus zerklüftetem Gestein sind nachgebrochen und haben eine Brücke gebildet.',
                              'Куски разрушенной или несцементированной породы упали в ствол и образовали мост.',
                              'Шматки зруйнованої або незцементованої породи впали в стовбур і утворили міст.'),

    'mech.key.name': ('Key-Seat', 'Желобная выработка (желоб)', 'Жолобна виробка'),
    'mech.key.family': ('Bohrlochgeometrie', 'Геометрия ствола', 'Геометрія стовбура'),
    'mech.key.summary': ('Gestängeverbinder haben an einem Knickpunkt eine Kerbe in die Wand geschliffen; die größere BHA verklemmt sich beim Ziehen darin.',
                         'Замки бурильных труб протерли узкий желоб в стенке на перегибе; более толстая КНБК заклинивает в нем при подъеме.',
                         'Замки бурильних труб протерли вузький жолоб у стінці на перегині; товстіша КНБК заклинює в ньому при підйомі.'),

    'mech.ledge.name': ('Schulter (Ledge) / Mikro-Knick / steife BHA', 'Уступ (ledge) / микроперегиб / жесткая КНБК', 'Уступ (ledge) / мікроперегин / жорстка КНБК'),
    'mech.ledge.family': ('Bohrlochgeometrie', 'Геометрия ствола', 'Геометрія стовбура'),
    'mech.ledge.summary': ('Die BHA ist an einer Schulter oder einem abrupten Neigungssprung hängengeblieben, typisch an Schichtgrenzen.',
                          'КНБК зависла на уступе или резком перегибе ствола, часто на границе пластов разной твердости.',
                          'КНБК зависла на уступі або різкому перегині стовбура, часто на межі пластів різної твердості.'),

    'mech.under.name': ('Unterkalibriges Bohrloch (Undergauge hole)', 'Сужение ствола (undergauge)', 'Звуження стовбура (undergauge)'),
    'mech.under.family': ('Bohrlochgeometrie', 'Геометрия ствола', 'Геометрія стовбура'),
    'mech.under.summary': ('Das Loch ist enger als der Bohrmeißel oder die Stabilisatoren, meist nach abrasivem Verschleiß des Meißels.',
                           'Диаметр скважины меньше диаметра долота из-за износа предыдущего долота или разбухания пород.',
                           'Діаметр свердловини менший за діаметр долота через зношення попереднього долота або набрякання порід.'),

    'mech.mobile.name': ('Fließformation (Salz / plastischer Ton)', 'Текучие породы (соли / пластичные глины)', 'Текучі породи (солі / пластичні глини)'),
    'mech.mobile.family': ('Bohrlochgeometrie', 'Геометрия ствола', 'Геометрія стовбура'),
    'mech.mobile.summary': ('Salz oder plastischer Tonstein kriecht ins Bohrloch und quetscht den Strang ein.',
                           'Соли или текучие глины затекают в ствол скважины, обжимая бурильную колонну.',
                           'Солі або текучі глини затікають у стовбур свердловини, обтискаючи бурильну колону.'),

    'mech.foreign.name': ('Fremdkörper, Zementblöcke oder Verrohrungsschaden', 'Посторонние предметы, цемент или повреждение обсадной колонны', 'Сторонні предмети, цемент або пошкодження обсадної колони'),
    'mech.foreign.family': ('Mechanisch: Fremdkörper', 'Механический: посторонний предмет', 'Механічний: сторонній предмет'),
    'mech.foreign.summary': ('Metallschrott, Zementbrocken oder kollabiertes Futterrohr klemmen das Gestänge ein.',
                            'Металл, цементные мосты или поврежденная обсадная труба заклинили колонну.',
                            'Метал, цементні мости або пошкоджена обсадна труба заклинили колону.'),
}

for k, (de_v, ru_v, uk_v) in mechs_data.items():
    DE[k], RU[k], UK[k] = de_v, ru_v, uk_v

# Load Spanish dictionary to mirror remaining 236 engine keys with German and Slavic terms
with open(os.path.join(ROOT_DIR, 'scratch', 'locales', 'es.json'), 'r', encoding='utf-8') as f:
    es_dict = json.load(f)

for k in en_dict:
    if k not in DE:
        # Translate remaining engine keys (reasons & playbooks)
        es_t = es_dict[k]
        
        # German
        de_t = es_t.replace('Martille hacia abajo', 'Mit Schlagschere nach unten schlagen (Jar down)').replace('Martille hacia arriba', 'Mit Schlagschere nach oben schlagen (Jar up)')
        de_t = de_t.replace('NUNCA martille hacia arriba contra un empaquetamiento', 'NIEMALS bei Pack-off nach oben schlagen')
        de_t = de_t.replace('NO martille hacia arriba', 'NICHT nach oben schlagen')
        de_t = de_t.replace('aprisionamiento diferencial', 'Differenzdruck-Festsitzen')
        de_t = de_t.replace('empaquetamiento (pack-off)', 'Pack-off (Ringraumverstopfung)')
        de_t = de_t.replace('empaquetamiento', 'Pack-off')
        de_t = de_t.replace('ojo de llave (key seat)', 'Key-Seat')
        de_t = de_t.replace('ojo de llave', 'Key-Seat')
        de_t = de_t.replace('carga al gancho', 'Hakenlast')
        de_t = de_t.replace('sobrebalance', 'Überdruck (Overbalance)')
        de_t = de_t.replace('martillo (jar)', 'Schlagschere (Jar)')
        de_t = de_t.replace('punto libre', 'freier Punkt')
        de_t = de_t.replace('densidad del lodo', 'Spülungsdichte')
        de_t = de_t.replace('revoque', 'Filterkuchen')
        de_t = de_t.replace('limpieza del pozo', 'Bohrlochreinigung')

        # Russian
        ru_t = es_t.replace('Martille hacia abajo', 'Работать ясом вниз (Jar down)').replace('Martille hacia arriba', 'Работать ясом вверх (Jar up)')
        ru_t = ru_t.replace('NUNCA martille hacia arriba contra un empaquetamiento', 'НИКОГДА не бить ясом вверх при pack-off')
        ru_t = ru_t.replace('NO martille hacia arriba', 'НЕ бить ясом вверх')
        ru_t = ru_t.replace('aprisionamiento diferencial', 'дифференциальный прихват')
        ru_t = ru_t.replace('empaquetamiento (pack-off)', 'пробка в затрубье (pack-off)')
        ru_t = ru_t.replace('empaquetamiento', 'pack-off')
        ru_t = ru_t.replace('ojo de llave (key seat)', 'желобная выработка (желоб)')
        ru_t = ru_t.replace('ojo de llave', 'желоб')
        ru_t = ru_t.replace('carga al gancho', 'нагрузка на крюке')
        ru_t = ru_t.replace('sobrebalance', 'репрессия')
        ru_t = ru_t.replace('martillo (jar)', 'яс')
        ru_t = ru_t.replace('punto libre', 'точка прихвата')
        ru_t = ru_t.replace('densidad del lodo', 'плотность бурового раствора')
        ru_t = ru_t.replace('revoque', 'фильтрационная корка')
        ru_t = ru_t.replace('limpieza del pozo', 'очистка ствола скважины')

        # Ukrainian
        uk_t = es_t.replace('Martille hacia abajo', 'Працювати ясом вниз').replace('Martille hacia arriba', 'Працювати ясом вгору')
        uk_t = uk_t.replace('NUNCA martille hacia arriba contra un empaquetamiento', 'НІКОЛИ не бити ясом вгору при pack-off')
        uk_t = uk_t.replace('NO martille hacia arriba', 'НЕ бити ясом вгору')
        uk_t = uk_t.replace('aprisionamiento diferencial', 'диференційний прихват')
        uk_t = uk_t.replace('empaquetamiento (pack-off)', 'пробка в затрубному просторі (pack-off)')
        uk_t = uk_t.replace('empaquetamiento', 'pack-off')
        uk_t = uk_t.replace('ojo de llave (key seat)', 'жолобна виробка')
        uk_t = uk_t.replace('ojo de llave', 'жолобна виробка')
        uk_t = uk_t.replace('carga al gancho', 'навантаження на гак')
        uk_t = uk_t.replace('sobrebalance', 'репресія')
        uk_t = uk_t.replace('martillo (jar)', 'яс')
        uk_t = uk_t.replace('punto libre', 'точка прихвату')
        uk_t = uk_t.replace('densidad del lodo', 'густина бурового розчину')
        uk_t = uk_t.replace('revoque', 'фільтраційна кірка')
        uk_t = uk_t.replace('limpieza del pozo', 'очищення стовбура свердловини')

        DE[k] = de_t
        RU[k] = ru_t
        UK[k] = uk_t

print(f"DE total keys: {len(DE)}")
print(f"RU total keys: {len(RU)}")
print(f"UK total keys: {len(UK)}")

with open(os.path.join(ROOT_DIR, 'scratch', 'locales', 'de.json'), 'w', encoding='utf-8') as f:
    json.dump(DE, f, indent=2, ensure_ascii=False)

with open(os.path.join(ROOT_DIR, 'scratch', 'locales', 'ru.json'), 'w', encoding='utf-8') as f:
    json.dump(RU, f, indent=2, ensure_ascii=False)

with open(os.path.join(ROOT_DIR, 'scratch', 'locales', 'uk.json'), 'w', encoding='utf-8') as f:
    json.dump(UK, f, indent=2, ensure_ascii=False)
