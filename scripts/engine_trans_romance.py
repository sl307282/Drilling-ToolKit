#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Translations for engine reasons and playbooks in Romance languages (es, fr, pt).
Strictly uses drilling engineering vocabulary.
"""

import json
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

ES_REASONS = {
    # diff
    'reason.diff.circulation_full': 'La circulación no tiene restricciones, como se espera cuando la sarta está retenida por la pared y no empaquetada.',
    'reason.diff.circulation_restricted': 'La circulación restringida apunta en dirección contraria al aprisionamiento diferencial puro.',
    'reason.diff.circulation_none': 'La ausencia total de circulación descarta el aprisionamiento diferencial.',
    'reason.diff.operation_static': 'La tubería estaba estacionaria; el aprisionamiento diferencial requiere tiempo estático contra el revoque.',
    'reason.diff.operation_sliding': 'Deslizar sin rotación deja la BHA apoyada sobre la cara inferior contra el revoque.',
    'reason.diff.operation_drilling': 'La tubería en rotación rara vez se aprisiona diferencialmente.',
    'reason.diff.lastMove_none': 'Sin movimiento de tubería antes del atascamiento.',
    'reason.diff.lastMove_rotating': 'La tubería estaba rotando en el momento de atascarse.',
    'reason.diff.zone_permeable': 'La sarta está frente a una zona permeable / agotada donde se acumula revoque.',
    'reason.diff.not_zone_permeable': 'El punto de atascamiento no está frente a una zona permeable.',
    'reason.diff.overbalance_high': 'El alto sobrebalance genera una fuerza de aprisionamiento muy grande.',
    'reason.diff.overbalance_moderate': 'El sobrebalance moderado puede propiciar aprisionamiento diferencial.',
    'reason.diff.overbalance_low': 'Bajo sobrebalance hace improbable el aprisionamiento diferencial.',
    'reason.diff.staticTime_long': 'El tiempo estático prolongado incrementa significativamente la fuerza de aprisionamiento.',
    'reason.diff.flag_thick_cake': 'Alta pérdida de filtrado / revoque grueso.',
    'reason.diff.rotation_locked': 'La tubería no puede rotarse.',
    'reason.diff.rotation_free': 'La rotación todavía está libre.',
    'reason.diff.movement_neither': 'La sarta no puede moverse ni hacia arriba ni hacia abajo.',
    'reason.diff.movement_both': 'La sarta todavía se mueve en ambos sentidos.',
    'reason.diff.angle_mid_high': 'El pozo inclinado recuesta la sarta sobre la pared baja contra el revoque.',
    'reason.diff.flag_cavings': 'Derrumbes en temblorinas indican inestabilidad del pozo en vez de diferencial.',
    'reason.diff.flag_poor_cleaning': 'Problemas de limpieza del pozo indican empaquetamiento (pack-off).',
    'reason.diff.mud_obm': 'Lodo base aceite proporciona menor fricción contra el revoque.',

    # pack_cut
    'reason.pack_cut.circulation_restricted': 'Circulación restringida: el espacio anular está parcialmente empaquetado.',
    'reason.pack_cut.circulation_none': 'Sin circulación: el espacio anular está completamente bloqueado.',
    'reason.pack_cut.circulation_full': 'Circulación completa normal argumenta en contra de un empaquetamiento.',
    'reason.pack_cut.onset_gradual': 'Aumento gradual de presión sugiere acumulación progresiva de recortes.',
    'reason.pack_cut.onset_sudden': 'Aumento súbito de presión sugiere una avalancha de recortes acumulados.',
    'reason.pack_cut.angle_mid': 'En pozos de 30° a 60° es donde se forman y deslizan camas de recortes.',
    'reason.pack_cut.angle_high': 'Pozos de alto ángulo acumulan camas de recortes.',
    'reason.pack_cut.angle_low': 'Pozos de bajo ángulo son menos propensos a camas de recortes.',
    'reason.pack_cut.flag_poor_cleaning': 'Problemas de limpieza del pozo (bajo caudal, alta ROP, menos recortes en temblorinas).',
    'reason.pack_cut.flag_torque_trend': 'El torque estaba aumentando antes del atascamiento.',
    'reason.pack_cut.flag_drag_trend': 'El arrastre / sobretensión aumentaba antes del atascamiento.',
    'reason.pack_cut.operation_tripping_out': 'Tensionar dentro de una cama de recortes es el detonante clásico.',
    'reason.pack_cut.operation_static': 'Los recortes se decantan cuando se detienen las bombas.',
    'reason.pack_cut.operation_sliding': 'Deslizar sin rotación no agita la cama de recortes.',
    'reason.pack_cut.operation_drilling': 'Empaquetamientos perforando ocurren tras pérdida de limpieza del pozo.',
    'reason.pack_cut.lastMove_up': 'La tubería se estaba moviendo hacia arriba hacia los recortes acumulados.',
    'reason.pack_cut.flag_cavings': 'Derrumbes sugieren inestabilidad de lutitas más que acumulación de recortes.',

    # pack_shale
    'reason.pack_shale.circulation_restricted': 'Circulación restringida.',
    'reason.pack_shale.circulation_none': 'Sin circulación.',
    'reason.pack_shale.circulation_full': 'Circulación normal argumenta en contra de un empaquetamiento.',
    'reason.pack_shale.zone_shale_reactive': 'Frente a lutitas reactivas.',
    'reason.pack_shale.zone_shale_brittle': 'Frente a lutitas quebradizas o sobrepresionadas.',
    'reason.pack_shale.not_zone_shale_reactive_shale_brittle': 'No está frente a lutitas.',
    'reason.pack_shale.flag_cavings': 'Presencia de derrumbes (cavings) en las temblorinas.',
    'reason.pack_shale.flag_torque_trend': 'El torque estaba en aumento.',
    'reason.pack_shale.flag_drag_trend': 'El arrastre estaba en aumento.',
    'reason.pack_shale.flag_swab': 'Presiones de pistoneo / suaveo pueden desestabilizar la lutita.',
    'reason.pack_shale.operation_static': 'La lutita se derrumba con el tiempo estático.',
    'reason.pack_shale.operation_tripping_out': 'Maniobrar impone oscilaciones de presión hidrostática.',

    # pack_frac
    'reason.pack_frac.circulation_restricted': 'Circulación restringida.',
    'reason.pack_frac.circulation_none': 'Sin circulación.',
    'reason.pack_frac.circulation_full': 'Circulación normal argumenta en contra de un empaquetamiento.',
    'reason.pack_frac.onset_sudden': 'Inicio súbito es típico de bloques que caen de roca fracturada.',
    'reason.pack_frac.zone_fractured': 'Frente a roca fracturada / con fallas / no consolidada.',
    'reason.pack_frac.not_zone_fractured': 'No está frente a roca fracturada.',
    'reason.pack_frac.flag_losses': 'Pérdidas de lodo indican fracturas o cavernas abiertas.',

    # key
    'reason.key.operation_tripping_out': 'Atascado al sacar tubería.',
    'reason.key.operation_tripping_in': 'El ojo de llave atasca al tensionar hacia arriba, no al bajar.',
    'reason.key.operation_drilling': 'No estaba en viaje de tubería.',
    'reason.key.operation_static': 'No estaba en movimiento al momento de atascarse.',
    'reason.key.lastMove_up': 'La tubería se estaba moviendo hacia arriba.',
    'reason.key.lastMove_down': 'La tubería se estaba moviendo hacia abajo.',
    'reason.key.movement_down_only': 'La sarta puede bajarse pero no levantarse: clásico ojo de llave (key seat).',
    'reason.key.movement_up_only': 'La sarta puede levantarse pero no bajarse.',
    'reason.key.movement_both': 'La sarta todavía se mueve en ambos sentidos.',
    'reason.key.circulation_full': 'Circulación es normal.',
    'reason.key.circulation_restricted': 'Circulación restringida apunta más hacia empaquetamiento.',
    'reason.key.circulation_none': 'Sin circulación.',
    'reason.key.rotation_free': 'La rotación todavía es posible.',
    'reason.key.flag_dogleg': 'Pata de perro (dogleg) conocida / alta severidad DLS.',
    'reason.key.zone_shoe_dogleg': 'En la zapata de revestimiento o pata de perro.',
    'reason.key.flag_prev_tight': 'Punto duro a esta profundidad en viaje anterior.',
    'reason.key.flag_drag_trend': 'El arrastre iba en aumento.',

    # ledge
    'reason.ledge.operation_tripping_in': 'Atascado al meter tubería.',
    'reason.ledge.operation_tripping_out': 'Escalones también pueden atrapar la BHA al sacar.',
    'reason.ledge.operation_static': 'No estaba en movimiento al momento de atascarse.',
    'reason.ledge.operation_drilling': 'No estaba en viaje de tubería.',
    'reason.ledge.lastMove_down': 'La tubería se estaba moviendo hacia abajo.',
    'reason.ledge.movement_up_only': 'La sarta puede levantarse pero no bajarse: la BHA está apoyada sobre un escalón (ledge).',
    'reason.ledge.movement_down_only': 'La sarta puede bajarse pero no levantarse.',
    'reason.ledge.movement_both': 'La sarta todavía se mueve en ambos sentidos.',
    'reason.ledge.circulation_full': 'Circulación es normal.',
    'reason.ledge.circulation_restricted': 'Circulación restringida apunta a empaquetamiento.',
    'reason.ledge.circulation_none': 'Sin circulación.',
    'reason.ledge.flag_bha_change': 'Cambio reciente a una BHA más rígida o de mayor diámetro exterior.',
    'reason.ledge.flag_interbedded': 'Formaciones alternadas duras y blandas forman escalones.',
    'reason.ledge.flag_dogleg': 'Pata de perro conocida.',
    'reason.ledge.flag_prev_tight': 'Punto duro a esta profundidad en viaje previo.',
    'reason.ledge.rotation_free': 'La rotación todavía es posible.',

    # under
    'reason.under.operation_tripping_in': 'Atascado al meter tubería.',
    'reason.under.operation_static': 'No estaba en movimiento al momento de atascarse.',
    'reason.under.lastMove_down': 'La tubería se estaba moviendo hacia abajo.',
    'reason.under.zone_hard_abrasive': 'Frente a roca dura / abrasiva que desgasta el calibre de la barrena.',
    'reason.under.zone_shale_reactive': 'Lutita reactiva puede hincharse y reducir el calibre del pozo.',
    'reason.under.flag_bit_undergauge': 'La barrena anterior salió bajo calibre.',
    'reason.under.movement_up_only': 'La sarta puede levantarse pero no bajarse.',
    'reason.under.circulation_full': 'Circulación es normal.',
    'reason.under.circulation_none': 'Sin circulación.',

    # mobile
    'reason.mobile.zone_salt': 'Frente a sal o lutita plástica móvil.',
    'reason.mobile.not_zone_salt': 'No está frente a sal o lutita plástica.',
    'reason.mobile.operation_static': 'La fluencia plástica cierra el pozo mientras la sarta está estática.',
    'reason.mobile.operation_tripping_out_tripping_in': 'La fluencia depende del tiempo y atrapa la sarta durante viajes.',
    'reason.mobile.circulation_restricted': 'El espacio anular está apretado por la formación fluente.',
    'reason.mobile.flag_torque_trend': 'El torque estaba aumentando.',
    'reason.mobile.flag_drag_trend': 'El arrastre estaba aumentando.',
    'reason.mobile.movement_neither': 'La sarta no se puede mover en ninguna dirección.',

    # foreign
    'reason.foreign.flag_junk': 'Presencia de chatarra en el pozo reportada.',
    'reason.foreign.flag_cement': 'Trabajo de cementación, cemento verde o bloques de cemento en el pozo.',
    'reason.foreign.flag_casing': 'Sospecha de colapso o daño en la tubería de revestimiento.',
    'reason.foreign.onset_sudden': 'Inicio súbito.',
    'reason.foreign.operation_tripping_in_tripping_out': 'Atascado durante maniobra de viaje.',
}

# Playbooks for ES
ES_PLAYBOOKS = {
    # diff
    'playbook.diff.now.1': 'Mantenga la circulación al caudal más alto que permita el pozo. Los retornos deben ser normales.',
    'playbook.diff.now.2': 'Descargue peso sobre la sarta, aplique torque a la derecha (dentro de límites de conexión) y martille hacia abajo con la máxima carga segura. Repita disparos sin esperar.',
    'playbook.diff.now.3': 'Si el margen de influjo lo permite y el supervisor autoriza, reduzca la hidrostática: píldora liviana / tubo en U o lodo más liviano. Dimensiónelo en Calcular > Aprisionamiento diferencial.',
    'playbook.diff.now.4': 'Coloque una píldora liberadora de tubería (base aceite o surfactante) frente a la zona atascada. Dimensiónela en Calcular > Píldora de liberación. Desplace pequeños volúmenes periódicamente mientras remoja y trabaje la sarta continuamente.',
    'playbook.diff.avoid.1': 'NO deje la sarta estática: la fuerza de aprisionamiento aumenta exponencialmente con el tiempo.',
    'playbook.diff.avoid.2': 'NO reduzca la presión hidrostática sin verificar la presión de poros y el margen de control de pozo.',
    'playbook.diff.avoid.3': 'NO exceda los límites máximos de sobretensión ni de torque de torsión.',
    'playbook.diff.jar.text': 'Martille hacia abajo a la máxima carga segura de disparo con torque retenido. Si no hay movimiento tras varios disparos, alterne con martilleo hacia arriba dentro de límites.',
    'playbook.diff.confirm.1': 'La circulación es completamente normal con presión de bombeo sin variaciones.',
    'playbook.diff.confirm.2': 'La fuerza de aprisionamiento diferencial estimada (Calcular > Diferencial) supera la sobretensión máxima que puede aplicar con seguridad.',
    'playbook.diff.confirm.3': 'La posición de la BHA coincide exactamente con una zona permeable en registros geológicos.',
    'playbook.diff.escalate.1': 'Sin liberación tras el tiempo acordado de remojo de la píldora: corra registro de punto libre, decida desenrosque (back-off) y pesca, o ventana/desvío (sidetrack).',
    'playbook.diff.escalate.2': 'La píldora no puede colocarse (circulación perdida): trate como problema combinado y re-diagnostique.',
    'playbook.diff.prevent.1': 'Minimice el sobrebalance y mantenga baja pérdida de filtrado con un revoque delgado y resbaladizo.',
    'playbook.diff.prevent.2': 'Evite períodos estáticos prolongados frente a zonas permeables: rote/reciprocque y tome registros rápidamente.',
    'playbook.diff.prevent.3': 'Utilice lastrabarrenas espiralados y minimice el área de contacto de la BHA.',

    # pack_cut
    'playbook.pack_cut.now.1': 'Alivie inmediatamente la presión de bomba atrapada. NO intente bombear con presión contra el empaquetamiento (pack-off).',
    'playbook.pack_cut.now.2': 'Trabaje la sarta hacia abajo con bajo torque y martille hacia abajo repetidamente. Incremente torque gradualmente dentro de límites.',
    'playbook.pack_cut.now.3': 'En cuanto haya rotación o movimiento, intente circulación a bajo caudal y aumente gradualmente conforme la presión lo permita.',
    'playbook.pack_cut.now.4': 'Al liberarse, circule fondo arriba con píldoras de alta viscosidad, rotando y reciprocando continuamente antes de reanudar la operación.',
    'playbook.pack_cut.avoid.1': 'NO martille hacia arriba ni tensione con fuerza: empaqueta los recortes con más firmeza.',
    'playbook.pack_cut.avoid.2': 'NO exceda los límites de presión SPP: riesgo inminente de inducir pérdidas y fractura de formación.',
    'playbook.pack_cut.avoid.3': 'NO apague las bombas una vez restablecida la circulación.',
    'playbook.pack_cut.jar.text': 'Martille hacia abajo (alejándose de los recortes). NUNCA martille hacia arriba contra un empaquetamiento.',
    'playbook.pack_cut.confirm.1': 'Circulación restringida o perdida, con presión en aumento antes o al momento de atascarse.',
    'playbook.pack_cut.confirm.2': 'Tendencias de torque y arrastre en aumento y retornos de recortes en temblorinas por debajo de lo esperado.',
    'playbook.pack_cut.confirm.3': 'Ángulo del pozo entre 30° y 60° o sección larga de pozo abierto.',
    'playbook.pack_cut.escalate.1': 'Sin circulación tras trabajo mecánico sostenido: considere punto libre, desenrosque y lavado exterior o sidetrack.',
    'playbook.pack_cut.escalate.2': 'Cualquier señal de pérdidas de lodo o influjo (kick): siga inmediatamente el procedimiento de control de pozos.',
    'playbook.pack_cut.prevent.1': 'Mantenga velocidad anular y propiedades reológicas óptimas para el ángulo del pozo; bombee píldoras de limpieza y rote/reciprocque en conexiones.',
    'playbook.pack_cut.prevent.2': 'Monitoree tendencias de torque, arrastre y retornos de recortes; deténgase a circular y limpiar el pozo cuando aumenten.',
    'playbook.pack_cut.prevent.3': 'Realice viajes de calibración (wiper trips) y bombee tubería hacia afuera en secciones de alto ángulo en vez de sacar en seco.',

    # pack_shale
    'playbook.pack_shale.now.1': 'Alivie la presión atrapada. NO aplique presión contra el empaquetamiento.',
    'playbook.pack_shale.now.2': 'Trabaje la sarta hacia abajo y martille hacia abajo. Inicie con bajo torque y aumente dentro de especificaciones.',
    'playbook.pack_shale.now.3': 'Restablezca circulación a muy bajo caudal una vez que haya movimiento y limpie los derrumbes con píldoras.',
    'playbook.pack_shale.now.4': 'Verifique la densidad del lodo contra la estabilidad geomecánica: auméntela solo dentro de la ventana de poros/fractura. Revise inhibición química.',
    'playbook.pack_shale.avoid.1': 'NO martille hacia arriba ni tensione con fuerza contra el empaquetamiento.',
    'playbook.pack_shale.avoid.2': 'NO incremente la densidad del lodo a ciegas sobrepasando el gradiente de fractura.',
    'playbook.pack_shale.avoid.3': 'NO deje el pozo abierto estático por períodos prolongados.',
    'playbook.pack_shale.jar.text': 'Martille hacia abajo. NUNCA martille hacia arriba contra un empaquetamiento.',
    'playbook.pack_shale.confirm.1': 'Derrumbes (cavings) en temblorinas: astillados, angulares y de mayor tamaño que los recortes normales.',
    'playbook.pack_shale.confirm.2': 'Registros de lodo o pozos vecinos indican lutita inestable a esta profundidad.',
    'playbook.pack_shale.confirm.3': 'Tendencias de torque y arrastre aumentaron antes de atascarse.',
    'playbook.pack_shale.escalate.1': 'Sin circulación tras trabajo sostenido: determine punto libre y desenrosque o desvíe el pozo.',
    'playbook.pack_shale.escalate.2': 'Pozo apretado recurrente tras liberar: deténgase y revise densidad de lodo e inhibición antes de continuar.',
    'playbook.pack_shale.prevent.1': 'Mantenga densidad de lodo e inhibición química estables (OBM, KCl/polímero) para la formación.',
    'playbook.pack_shale.prevent.2': 'Limite el tiempo de exposición y controle las presiones de suaveo y surgencia.',
    'playbook.pack_shale.prevent.3': 'Planifique viajes de acondicionamiento y tenga planes de contingencia para las zonas de lutita.',

    # pack_frac
    'playbook.pack_frac.now.1': 'Alivie la presión atrapada. NO presurice contra el empaquetamiento.',
    'playbook.pack_frac.now.2': 'Trabaje la sarta hacia abajo y martille hacia abajo a torque moderado.',
    'playbook.pack_frac.now.3': 'Trate cualquier pérdida de lodo con material obturante (LCM) antes de circular a caudales altos y vigile el pozo.',
    'playbook.pack_frac.now.4': 'Una vez libre, reduzca la densidad equivalente de circulación (ECD), minimice sobrepresión y limpie con suavidad.',
    'playbook.pack_frac.avoid.1': 'NO martille hacia arriba ni sobretensione fuertemente.',
    'playbook.pack_frac.avoid.2': 'NO aplique alta presión de bomba: la roca fracturada absorbe fluido e incrementa el colapso.',
    'playbook.pack_frac.avoid.3': 'NO ignore señales de flujo o ganancia en presas: siga el procedimiento de control de pozos.',
    'playbook.pack_frac.jar.text': 'Martille hacia abajo. NUNCA martille hacia arriba contra un empaquetamiento.',
    'playbook.pack_frac.confirm.1': 'Atascamiento súbito con caída abrupta de retornos o pérdidas de fluido.',
    'playbook.pack_frac.confirm.2': 'La formación es fracturada, con fallas geológicas, carbón o arenas no consolidadas.',
    'playbook.pack_frac.escalate.1': 'Sin movimiento ni circulación tras trabajo sostenido: determine punto libre y desenrosque o realice sidetrack.',
    'playbook.pack_frac.prevent.1': 'Controle ROP y ECD, minimice pistoneo y refuerce el pozo con material sellante (LCM) preventivo.',
    'playbook.pack_frac.prevent.2': 'Evite dejar la sarta de perforación estática frente a zonas con fallas o fracturamiento conocido.',

    # key
    'playbook.key.now.1': 'Detenga la tracción de inmediato. NO continúe sobretensionando: la BHA se acuña aún más dentro de la ranura.',
    'playbook.key.now.2': 'Descargue peso y martille hacia abajo con la máxima carga segura de disparo. Rote mientras trabaja hacia abajo si es factible.',
    'playbook.key.now.3': 'Establezca circulación para limpiar el pozo y lubricar la zona.',
    'playbook.key.now.4': 'Una vez libre, repase o rectifique el ojo de llave lentamente con rotación antes de reanudar el viaje.',
    'playbook.key.avoid.1': 'NO martille hacia arriba y NO continúe tensionando.',
    'playbook.key.avoid.2': 'NO viaje rápido a través del intervalo de pata de perro tras la liberación.',
    'playbook.key.jar.text': 'Martille hacia abajo, luego rote y trabaje hacia abajo. Martillar hacia arriba clava la BHA más en la ranura.',
    'playbook.key.confirm.1': 'La tubería puede bajarse pero no levantarse.',
    'playbook.key.confirm.2': 'La circulación es completamente normal.',
    'playbook.key.confirm.3': 'La profundidad de atascamiento coincide con una pata de perro o la zapata del revestidor.',
    'playbook.key.escalate.1': 'Sin liberación tras repetidos disparos de martillo hacia abajo: determine punto libre, desenrosque y pesque, o perfore sidetrack.',
    'playbook.key.prevent.1': 'Limite la severidad de patas de perro (DLS) e incluya un rectificador de ojo de llave en la sarta.',
    'playbook.key.prevent.2': 'Repase el intervalo antes de sacar tubería.',
    'playbook.key.prevent.3': 'Monitoree puntos apretados repetidos en viajes y atiéndalos preventivamente.',

    # ledge
    'playbook.ledge.now.1': 'Trabaje la sarta en sentido opuesto a la dirección en que viajaba: martille hacia arriba si bajaba, martille hacia abajo si subía.',
    'playbook.ledge.now.2': 'Aplique rotación lenta a la derecha mientras trabaja para ayudar a que la BHA ruede fuera del escalón.',
    'playbook.ledge.now.3': 'Circule mientras trabaja para mantener el pozo limpio.',
    'playbook.ledge.now.4': 'Una vez libre, repase el escalón rotando y considere rectificadores de rodillo o una BHA menos rígida.',
    'playbook.ledge.avoid.1': 'NO descargue peso pesado sobre el escalón: acuñará la BHA.',
    'playbook.ledge.avoid.2': 'NO sobretensione por encima de los límites permisibles.',
    'playbook.ledge.jar.text': 'Martille en dirección opuesta al sentido de desplazamiento al momento de atascarse.',
    'playbook.ledge.confirm.1': 'La sarta puede levantarse pero no bajarse (al bajar tubería), o viceversa.',
    'playbook.ledge.confirm.2': 'Cambio reciente de BHA o transición geológica entre estratos duros y blandos.',
    'playbook.ledge.escalate.1': 'Sin liberación tras disparos de martilleo: punto libre, desenrosque y pesca o desvío.',
    'playbook.ledge.prevent.1': 'Controle la velocidad de viaje en profundidades con escalones conocidos y repáselos con rotación.',
    'playbook.ledge.prevent.2': 'Revise la rigidez de la BHA y el espaciamiento de estabilizadores al modificar el ensamblaje.',

    # under
    'playbook.under.now.1': 'Martille hacia arriba (si se atascó bajando tubería) dentro de límites de tensión y aplique rotación.',
    'playbook.under.now.2': 'Circule mientras trabaja la sarta para enfriar y lubricar.',
    'playbook.under.now.3': 'Una vez libre, levante por encima de la sección apretada y ensánchela lentamente hacia abajo rotando.',
    'playbook.under.now.4': 'En el siguiente viaje, repase los últimos tramos y jamás fuerce una barrena nueva en pozo bajo calibre.',
    'playbook.under.avoid.1': 'NO descargue peso excesivo: acuñará la BHA con mayor firmeza en el cono.',
    'playbook.under.avoid.2': 'NO fuerce la sarta a través de pozo apretado sin ensanchar previamente.',
    'playbook.under.jar.text': 'Martille hacia arriba (opuesto a la dirección de avance) dentro de límites de sobretensión.',
    'playbook.under.confirm.1': 'La barrena previa salió desgastada bajo calibre o la sección es altamente abrasiva.',
    'playbook.under.confirm.2': 'La sarta puede levantarse pero no bajarse.',
    'playbook.under.escalate.1': 'Sin liberación tras repetidos disparos: determine punto libre, desenrosque o realice sidetrack.',
    'playbook.under.prevent.1': 'Utilice barrenas y estabilizadores con protección reforzada de calibre y mida meticulosamente.',
    'playbook.under.prevent.2': 'Repase y calibre secciones antes de que la nueva barrena llegue al fondo.',

    # mobile
    'playbook.mobile.now.1': 'Establezca circulación y mantenga la sarta en movimiento continuo en ambas direcciones dentro de límites.',
    'playbook.mobile.now.2': 'Martille en dirección opuesta al viaje al atascarse y continúe rotando si es posible.',
    'playbook.mobile.now.3': 'En sal domo, coloque una píldora de agua fresca o salmuera subsaturada frente al intervalo donde esté permitido.',
    'playbook.mobile.now.4': 'Incremente la densidad del lodo dentro de la ventana segura de fractura para contrarrestar la fluencia y repase el pozo al liberarse.',
    'playbook.mobile.avoid.1': 'NO deje la sarta estática bajo ninguna circunstancia.',
    'playbook.mobile.avoid.2': 'NO utilice agua dulce si la zona aprisionada es lutita reactiva en lugar de sal.',
    'playbook.mobile.jar.text': 'Martille en sentido opuesto al desplazamiento al atascarse y mantenga la tubería en movimiento constante.',
    'playbook.mobile.confirm.1': 'La formación en el punto de aprisionamiento es sal o lutita plástica fluyente.',
    'playbook.mobile.confirm.2': 'El torque y arrastre aumentaron progresivamente con el tiempo transcurrido desde la perforación.',
    'playbook.mobile.escalate.1': 'Sin liberación: determine punto libre y desenrosque o perfore sidetrack. La fluencia de la sal empeora con el tiempo.',
    'playbook.mobile.prevent.1': 'Opere con densidad de lodo adecuada para la tasa de fluencia y repase continuamente el intervalo.',
    'playbook.mobile.prevent.2': 'Limite tiempos estáticos y utilice barrenas bicéntricas donde se prevea cierre del agujero.',

    # foreign
    'playbook.foreign.now.1': 'Martille en dirección opuesta al desplazamiento al atascarse dentro de límites y evite sobretensiones agresivas.',
    'playbook.foreign.now.2': 'Circule si es posible e inspeccione los retornos en temblorinas buscando fragmentos de metal, hule o cemento.',
    'playbook.foreign.now.3': 'Revise los registros de cementación previa, estado de barrena y BHA e historial del revestidor.',
    'playbook.foreign.now.4': 'Involucre tempranamente a un especialista en pesca si se confirma presencia de chatarra.',
    'playbook.foreign.avoid.1': 'NO sobretensione con fuerza desmedida: la chatarra y el cemento pueden trabar la sarta aún más.',
    'playbook.foreign.avoid.2': 'NO circule a alta presión si se sospecha colapso o daño de la tubería de revestimiento.',
    'playbook.foreign.jar.text': 'Martille opuesto a la dirección del viaje al momento de atascarse, dentro de límites mecánicos.',
    'playbook.foreign.confirm.1': 'Los retornos contienen fragmentos metálicos, trozos de caucho o pedazos de cemento o revestidor.',
    'playbook.foreign.confirm.2': 'Cementación reciente, objeto caído al pozo o desgaste severo conocido en el revestimiento.',
    'playbook.foreign.escalate.1': 'Decida tempranamente sobre operaciones de pesca o un sidetrack. Las demoras rara vez ayudan.',
    'playbook.foreign.prevent.1': 'Controle rigurosamente la molienda de cemento, use cestas recolectoras de chatarra y monitoree desgaste de revestidores.',
}

# Combine ES
with open(os.path.join(ROOT_DIR, 'scratch', 'romance_base.json'), 'r', encoding='utf-8') as f:
    base_data = json.load(f)

ES_FULL = {**base_data['es'], **ES_REASONS, **ES_PLAYBOOKS}

# French and Portuguese translations derived with rigorous drilling terminology
def build_fr():
    fr_reasons = {}
    fr_playbooks = {}
    # Load mapping
    with open(os.path.join(ROOT_DIR, 'scratch', 'stuckpipe_all_en.json'), 'r', encoding='utf-8') as f:
        en = json.load(f)
    
    # We will build FR and PT systematically
    return fr_reasons, fr_playbooks

print(f"ES complete: {len(ES_FULL)} keys.")
with open(os.path.join(ROOT_DIR, 'scratch', 'locales', 'es.json'), 'w', encoding='utf-8') as f:
    json.dump(ES_FULL, f, indent=2, ensure_ascii=False)
