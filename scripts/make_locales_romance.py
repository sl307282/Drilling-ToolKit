#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates complete 466-key translations for Romance languages:
- Spanish (es)
- French (fr)
- Portuguese (pt)
Uses exact drilling engineering glossary and terminology.
"""

import json
import os
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
with open(os.path.join(ROOT_DIR, 'scratch', 'stuckpipe_all_en.json'), 'r', encoding='utf-8') as f:
    en_dict = json.load(f)

# Base translations
ES = {}
FR = {}
PT = {}

# 1. Title & Navigation & Core UI
common_data = {
    'stuckpipe.title': ('Tubería atascada - Asistente', 'Coincement de la garniture - Assistant', 'Prisão de coluna - Assistente'),
    'stuckpipe.subtitle': ('Soporte de decisiones de diagnóstico en tiempo real y cálculos de tubería atascada', 'Support décisionnel de diagnostic en temps réel et calculateurs de coincement', 'Suporte à decisão de diagnóstico em tempo real e cálculos de prisão de coluna'),
    'stuckpipe.search_keywords': ('tubería atascada, aprisionamiento diferencial, empaquetamiento (pack-off), ojo de llave (key seat), punto libre, martillo (jar), limpieza del pozo, sobrebalance',
                                  'coincement de la garniture, coincement différentiel, pack-off (bouchon annulaire), rainure de clavette (key seat), point libre, coulisse (jar), nettoyage du puits, surpression (overbalance)',
                                  'prisão de coluna, prisão diferencial, pack-off (obstrução do anular), chaveta (key seat), ponto livre, martelo (jar), limpeza do poço, sobrebalanço'),
    'stuckpipe.tab_diagnose': ('Diagnosticar', 'Diagnostiquer', 'Diagnosticar'),
    'stuckpipe.tab_calculate': ('Calcular', 'Calculer', 'Calcular'),
    'stuckpipe.tab_log': ('Registro', 'Journal', 'Registro'),
    'stuckpipe.disclaimer': ('Solo para soporte de decisiones. Siga los procedimientos de tubería atascada del operador, política de control de pozos y límites de equipos.',
                             'Support décisionnel uniquement. Suivre les procédures opérateur, la politique de contrôle de puits et les limites de l équipement.',
                             'Apenas suporte à decisão. Siga os procedimentos de prisão de coluna do operador, política de controle de poço e limites do equipamento.'),
    'stuckpipe.unit_field': ('Campo petrolero', 'Champs pétroliers', 'Campo petrolífero'),
    'stuckpipe.unit_metric': ('Métrico', 'Métrique', 'Métrico'),
    'stuckpipe.opt_unknown': ('No estoy seguro', 'Pas sûr', 'Não tenho certeza'),
    'stuckpipe.btn_diagnose': ('Diagnosticar mecanismo de atascamiento', 'Diagnostiquer le mécanisme de coincement', 'Diagnosticar mecanismo de prisão'),
    'stuckpipe.btn_reset': ('Restablecer respuestas', 'Réinitialiser les réponses', 'Redefinir respostas'),
    'stuckpipe.form_title': ('¿Qué observa?', 'Qu observez-vous ?', 'O que você observa?'),
    'stuckpipe.form_subtitle': ('Responda lo que sepa. El diagnóstico se actualiza en vivo al seleccionar observaciones.',
                                'Répondez à ce que vous savez. Le diagnostic se met à jour en direct.',
                                'Responda o que você souber. O diagnóstico é atualizado em tempo real.'),
    'stuckpipe.indicators_title': ('Más indicadores (opcional)', 'Plus d indicateurs (optionnel)', 'Mais indicadores (opcional)'),
    'stuckpipe.indicators_count': ('{count} seleccionados', '{count} sélectionnés', '{count} selecionados'),
}

for k, (es_v, fr_v, pt_v) in common_data.items():
    ES[k], FR[k], PT[k] = es_v, fr_v, pt_v

# 2. Questions & Options
q_data = {
    'stuckpipe.q.operation.title': ('¿Qué estaba ocurriendo al atascarse?', 'Que se passait-il au moment du coincement ?', 'O que estava acontecendo quando prendeu?'),
    'stuckpipe.q.operation.drilling': ('Perforación rotatoria (rotando)', 'Forage rotatif (en rotation)', 'Perfuração rotativa (girando)'),
    'stuckpipe.q.operation.sliding': ('Deslizando / orientado', 'Forage orienté (sliding)', 'Deslizando / orientado'),
    'stuckpipe.q.operation.reaming': ('Ensanchando / repaso hacia arriba', 'Alésage / rétro-alésage', 'Alargando / repassando'),
    'stuckpipe.q.operation.tripping_out': ('Sacando tubería (viaje)', 'Manoeuvre de remontée (tripping out)', 'Puxando coluna (manobra de saída)'),
    'stuckpipe.q.operation.tripping_in': ('Bajando tubería (viaje)', 'Manoeuvre de descente (tripping in)', 'Descendo coluna (manobra de entrada)'),
    'stuckpipe.q.operation.static': ('Estático (conexión, registro, en cuñas)', 'Statique (connexion, diagraphie, sur cales)', 'Estático (conexão, perfilagem, nas cunhas)'),

    'stuckpipe.q.lastMove.title': ('Último movimiento de tubería antes de atascarse', 'Dernier mouvement de la garniture avant coincement', 'Último movimento da coluna antes da prisão'),
    'stuckpipe.q.lastMove.up': ('Moviendo hacia arriba', 'Vers le haut', 'Movendo para cima'),
    'stuckpipe.q.lastMove.down': ('Moviendo hacia abajo', 'Vers le bas', 'Movendo para baixo'),
    'stuckpipe.q.lastMove.rotating': ('Solo rotación', 'Rotation uniquement', 'Apenas girando'),
    'stuckpipe.q.lastMove.none': ('Estacionario', 'Stationnaire', 'Estacionário'),

    'stuckpipe.q.circulation.title': ('Circulación', 'Circulation', 'Circulação'),
    'stuckpipe.q.circulation.full': ('Normal (flujo y presión sin restricción)', 'Normale (sans restriction)', 'Normal (sem restrição)'),
    'stuckpipe.q.circulation.restricted': ('Restringida (alta presión de bomba)', 'Restreinte (forte pression de pompe)', 'Restrita (alta pressão de bomba)'),
    'stuckpipe.q.circulation.none': ('Ninguna / bloqueada', 'Nulle / bloquée', 'Nenhuma / bloqueada'),

    'stuckpipe.q.onset.title': ('¿Cómo cambió la presión de bombeo?', 'Comment la pression a-t-elle évolué ?', 'Como a pressão mudou?'),
    'stuckpipe.q.onset.sudden': ('Súbita', 'Soudaine', 'Súbita'),
    'stuckpipe.q.onset.gradual': ('Aumento gradual', 'Augmentation progressive', 'Aumento gradual'),

    'stuckpipe.q.rotation.title': ('Rotación / torque', 'Rotation / couple', 'Rotação / torque'),
    'stuckpipe.q.rotation.free': ('Libre (rotación y torque normales)', 'Libre', 'Livre (rotação e torque normais)'),
    'stuckpipe.q.rotation.restricted': ('Restringida / alto torque', 'Restreinte / couple élevé', 'Restrita / torque alto'),
    'stuckpipe.q.rotation.locked': ('Bloqueada (no se puede rotar)', 'Bloquée', 'Bloqueada (não é possível girar)'),

    'stuckpipe.q.movement.title': ('¿Hacia dónde se puede mover la sarta?', 'Dans quelle direction la garniture bouge-t-elle ?', 'Em qual direção a coluna se move?'),
    'stuckpipe.q.movement.hint': ('Pruebe con cuidado, dentro de límites de tensión y peso cargado', 'Tester prudemment, dans les limites admissibles', 'Teste com cuidado, dentro dos limites de tração e folga'),
    'stuckpipe.q.movement.neither': ('Ni arriba ni abajo', 'Ni vers le haut ni vers le bas', 'Nem para cima nem para baixo'),
    'stuckpipe.q.movement.down_only': ('Solo hacia abajo (no se puede tensionar)', 'Vers le bas uniquement (traction impossible)', 'Apenas para baixo (não pode puxar)'),
    'stuckpipe.q.movement.up_only': ('Solo hacia arriba (no se puede bajar)', 'Vers le haut uniquement (descente impossible)', 'Apenas para cima (não pode descer)'),
    'stuckpipe.q.movement.both': ('Ambos sentidos (pozo apretado, alto arrastre)', 'Les deux sens (trou serré, fort frottement)', 'Ambos os sentidos (poço apertado, alto arrasto)'),

    'stuckpipe.q.angle.title': ('Inclinación del pozo en el punto de atascamiento', 'Inclinaison du puits au point de coincement', 'Inclinação do poço no ponto de prisão'),
    'stuckpipe.q.angle.low': ('Menos de 30°', 'Inférieure à 30°', 'Abaixo de 30°'),
    'stuckpipe.q.angle.mid': ('30° a 60°', '30° à 60°', '30° a 60°'),
    'stuckpipe.q.angle.high': ('Más de 60°', 'Supérieure à 60°', 'Acima de 60°'),

    'stuckpipe.q.staticTime.title': ('Tiempo estacionario antes del atascamiento', 'Temps stationnaire avant coincement', 'Tempo estacionário antes da prisão'),
    'stuckpipe.q.staticTime.short': ('Minutos (menos de 10 min)', 'Minutes (moins de 10 min)', 'Minutos (menos de 10 min)'),
    'stuckpipe.q.staticTime.long': ('Prolongado (más de 10 min)', 'Long (plus de 10 min)', 'Longo (mais de 10 min)'),

    'stuckpipe.q.mud.title': ('Tipo de lodo', 'Type de boue', 'Tipo de fluido (lama)'),
    'stuckpipe.q.mud.wbm': ('Base agua (WBM)', 'Base eau (WBM)', 'Base água (WBM)'),
    'stuckpipe.q.mud.obm': ('Base aceite / sintético (OBM)', 'Base huile / synthétique (OBM)', 'Base óleo / sintético (OBM)'),
}

for k, (es_v, fr_v, pt_v) in q_data.items():
    ES[k], FR[k], PT[k] = es_v, fr_v, pt_v

# 3. Indicator Flags
flags_data = {
    'stuckpipe.flag.torque_trend': ('Torque en aumento', 'Couple en augmentation', 'Torque estava aumentando'),
    'stuckpipe.flag.drag_trend': ('Arrastre / sobretensión en aumento', 'Frottement / surtension en hausse', 'Arrasto / sobretensão aumentando'),
    'stuckpipe.flag.poor_cleaning': ('Problemas de limpieza del pozo (bajo flujo, alta ROP, pocos recortes)',
                                     'Problèmes de nettoyage du puits (faible débit, fort ROP, peu de déblais)',
                                     'Problemas de limpeza do poço (baixa vazão, alta ROP, menos cascalhos)'),
    'stuckpipe.flag.cavings': ('Derrumbes (cavings) en temblorinas', 'Cavings aux tamis vibrants', 'Desmoronamentos (cavings) nas peneiras'),
    'stuckpipe.flag.losses': ('Pérdidas de lodo', 'Pertes de boue', 'Perdas de lama'),
    'stuckpipe.flag.swab': ('Pistoneo / suaveo sospechado', 'Pistonnage (swab/surge) suspecté', 'Pistoneio / sobrepressão suspeitado'),
    'stuckpipe.flag.bha_change': ('BHA nueva o más rígida', 'BHA nouvellement assemblé ou plus rigide', 'BHA novo ou mais rígido'),
    'stuckpipe.flag.dogleg': ('Pata de perro (dogleg) conocida / alta severidad DLS', 'Dogleg connu / forte sévérité DLS', 'Pata de cachorro (dogleg) conhecida / alta DLS'),
    'stuckpipe.flag.prev_tight': ('Punto apretado en viaje anterior aquí', 'Point serré lors d un passage précédent', 'Ponto apertado nesta profundidade em manobra anterior'),
    'stuckpipe.flag.interbedded': ('Formaciones interestratificadas duras y blandas', 'Formations alternées dures et tendres', 'Formações intercaladas duras e macias'),
    'stuckpipe.flag.bit_undergauge': ('Barrena anterior salió bajo calibre', 'Outil précédent sorti sous-calibré', 'Broca anterior saiu abaixo do calibre'),
    'stuckpipe.flag.thick_cake': ('Alta pérdida de filtrado / revoque grueso', 'Forte perte de filtration / cake épais', 'Alta perda de filtrado / reboco espesso'),
    'stuckpipe.flag.junk': ('Chatarra en el pozo', 'Ferraille / débris au fond', 'Peça metálica / lixo no poço'),
    'stuckpipe.flag.cement': ('Trabajo de cementación / bloques de cemento', 'Cimentation / blocs de ciment', 'Cimentação / blocos de cimento'),
    'stuckpipe.flag.casing': ('Sospecha de revestimiento dañado', 'Endommagement suspecté du tubage', 'Suspeita de dano no revestimento'),
    'stuckpipe.flag.salt': ('Perforando sal / lutita plástica fluente', 'Forage de sel ou d argile plastique', 'Perfurando sal ou folhelho plástico'),
    'stuckpipe.flag.permeable_zone': ('Frente a zona permeable / agotada (según registro)', 'En face d une zone perméable / déplétée', 'Cruzando zona permeável / depletada (perfil)'),
}

for k, (es_v, fr_v, pt_v) in flags_data.items():
    ES[k], FR[k], PT[k] = es_v, fr_v, pt_v

# 4. Results UI & Diagnosis
res_data = {
    'stuckpipe.res_start_title': ('Comience con dos respuestas', 'Commencez par deux réponses', 'Comece com duas respostas'),
    'stuckpipe.res_start_text': ('Indique qué operación se realizaba y el estado de la circulación. El diagnóstico se mostrará de inmediato.',
                                 'Indiquez ce qui se passait et l état de la circulation. Un diagnostic s affiche aussitôt.',
                                 'Informe o que estava acontecendo e o estado da circulação. O diagnóstico aparece imediatamente.'),
    'stuckpipe.res_most_likely': ('Más probable', 'Le plus probable', 'Mais provável'),
    'stuckpipe.res_confidence': ('Confianza: {level}', 'Confiance : {level}', 'Confiança: {level}'),
    'stuckpipe.res_confidence_high': ('Alta', 'Élevée', 'Alta'),
    'stuckpipe.res_confidence_medium': ('Media', 'Moyenne', 'Média'),
    'stuckpipe.res_confidence_low': ('Baja', 'Faible', 'Baixa'),
    'stuckpipe.res_why': ('Por qué este mecanismo', 'Pourquoi ce mécanisme', 'Por que este mecanismo'),
    'stuckpipe.res_evidence_against': ('Evidencia en contra', 'Éléments contraires', 'Evidências contra'),
    'stuckpipe.res_other_possibilities': ('Otras posibilidades', 'Autres possibilités', 'Outras possibilidades'),
    'stuckpipe.res_safety': ('Seguridad', 'Sécurité', 'Segurança'),
    'stuckpipe.res_action_plan': ('Plan de acción: {name}', 'Plan d action : {name}', 'Plano de ação: {name}'),
    'stuckpipe.res_plan_for': ('Plan: {name}', 'Plan : {name}', 'Plano: {name}'),
    'stuckpipe.res_if_instead': ('Si en cambio es: {name}', 'Si plutôt : {name}', 'Se em vez disso for: {name}'),
    'stuckpipe.res_avoid_both': ('Podría ser cualquiera de los dos: evite lo que empeora ambos',
                                 'Pourrait être l un ou l autre : éviter ce qui aggrave les deux',
                                 'Pode ser qualquer um: evite ações que piorem ambos'),
    'stuckpipe.res_do_now': ('Hacer ahora (en este orden)', 'À faire immédiatement (dans cet ordre)', 'Fazer agora (nesta ordem)'),
    'stuckpipe.res_jar_direction': ('Dirección del martilleo (jar)', 'Sens de battage de la coulisse (jar)', 'Direção de martelamento (jar)'),
    'stuckpipe.res_do_not': ('NO hacer', 'À NE PAS FAIRE', 'NÃO fazer'),
    'stuckpipe.res_confirm': ('Confirmar el diagnóstico', 'Confirmer le diagnostic', 'Confirmar o diagnóstico'),
    'stuckpipe.res_escalate': ('Escalar si', 'Escalader si', 'Escalar se'),
    'stuckpipe.res_prevent': ('Una vez libre: prevenir recurrencia', 'Une fois libéré : prévenir la récidive', 'Uma vez livre: prevenir repetição'),
    'stuckpipe.res_first_5_minutes': ('Primeros 5 minutos', 'Premières 5 minutes', 'Primeiros 5 minutos'),
    'stuckpipe.res_tight_hole_title': ('Pozo apretado: aún no atascado', 'Trou serré : pas encore coincé', 'Poço apertado: ainda não preso'),
    'stuckpipe.res_tight_hole_text': ('La sarta todavía se mueve en ambos sentidos. Actúe de inmediato antes de que se convierta en tubería atascada.',
                                     'La garniture bouge encore dans les deux sens. Agir avant que cela ne devienne un coincement.',
                                     'A coluna ainda se move em ambos os sentidos. Trate como aviso e aja antes que vire prisão de coluna.'),
    'stuckpipe.jar.down': ('ABAJO', 'BAS', 'BAIXO'),
    'stuckpipe.jar.up': ('ARRIBA', 'HAUT', 'CIMA'),
    'stuckpipe.jar.confirm': ('CONFIRMAR', 'CONFIRMER', 'CONFIRMAR'),
}

for k, (es_v, fr_v, pt_v) in res_data.items():
    ES[k], FR[k], PT[k] = es_v, fr_v, pt_v

# 5. Calculators UI
calc_data = {
    'stuckpipe.calc.subtab_diff': ('Aprisionamiento diferencial', 'Différentiel', 'Prisão diferencial'),
    'stuckpipe.calc.subtab_free': ('Punto libre', 'Point libre', 'Ponto livre'),
    'stuckpipe.calc.subtab_spot': ('Píldora de liberación', 'Bouchon de dégagement', 'Pílula de liberação'),
    'stuckpipe.calc.mw': ('Densidad del lodo', 'Densité de la boue', 'Peso da lama'),
    'stuckpipe.calc.pp_emw': ('Presión de formación (EMW)', 'Pression de formation (EMW)', 'Pressão de formação (EMW)'),
    'stuckpipe.calc.tvd': ('Profundidad vertical verdadera (TVD)', 'Profondeur verticale vraie (TVD)', 'Profundidade vertical verdadeira (TVD)'),
    'stuckpipe.calc.contact_length': ('Longitud de contacto', 'Longueur de contact', 'Comprimento de contato'),
    'stuckpipe.calc.od': ('Diámetro exterior de tubería / BHA (OD)', 'Diamètre extérieur (OD)', 'Diâmetro externo da coluna (OD)'),
    'stuckpipe.calc.cake': ('Espesor del revoque', 'Épaisseur du cake', 'Espessura do reboco'),
    'stuckpipe.calc.friction': ('Coeficiente de fricción (μ)', 'Coefficient de frottement (μ)', 'Coeficiente de atrito (μ)'),
    'stuckpipe.calc.tensile_yield': ('Límite de fluencia a la tracción', 'Limite d élasticité en traction', 'Limite de escoamento à tração'),
    'stuckpipe.calc.design_factor': ('Factor de diseño', 'Facteur de conception', 'Fator de projeto'),
    'stuckpipe.calc.free_weight': ('Peso de la sarta libre', 'Poids de la garniture libre', 'Peso da coluna livre'),
    'stuckpipe.calc.pill_mw': ('Densidad de la píldora liviana', 'Densité du bouchon allégé', 'Densidade da pílula leve'),
    'stuckpipe.calc.pill_tvd': ('Altura vertical de la píldora', 'Hauteur verticale du bouchon', 'Altura vertical da pílula'),
    'stuckpipe.calc.stretch': ('Estiramiento', 'Étirage', 'Alongamento'),
    'stuckpipe.calc.pull_diff': ('Diferencia de tensión', 'Différence de traction', 'Diferencial de tração'),
    'stuckpipe.calc.pipe_weight': ('Peso nominal de tubería', 'Poids unitaire du tube', 'Peso linear do tubo'),
    'stuckpipe.calc.hole_size': ('Diámetro del pozo', 'Diamètre du trou', 'Diâmetro do poço'),
    'stuckpipe.calc.pipe_od': ('Diámetro exterior de tubería de perforación', 'Diamètre extérieur tige (OD)', 'Diâmetro externo do tubo (OD)'),
    'stuckpipe.calc.interval': ('Intervalo atascado', 'Intervalle coincé', 'Intervalo preso'),
    'stuckpipe.calc.margin': ('Margen superior e inferior', 'Marge de sécurité', 'Margem acima e abaixo'),
    'stuckpipe.calc.excess': ('Exceso volumétrico (%)', 'Excès (%)', 'Excesso de volume (%)'),
    'stuckpipe.calc.leave_string': ('Volumen dejado en la sarta', 'Volume restant dans la garniture', 'Volume retido na coluna'),
    'stuckpipe.calc.overbalance': ('Sobrebalance (ΔP)', 'Surpression (overbalance) (ΔP)', 'Sobrebalanço (ΔP)'),
    'stuckpipe.calc.contact_area': ('Área de contacto estimada', 'Surface de contact', 'Área de contato'),
    'stuckpipe.calc.sticking_force': ('Fuerza de aprisionamiento diferencial', 'Force de coincement différentiel', 'Força de prisão diferencial'),
    'stuckpipe.calc.max_hookload': ('Carga al gancho máxima segura', 'Charge au crochet maximale sécurisée', 'Carga no gancho máxima segura'),
    'stuckpipe.calc.safe_overpull': ('Margen de sobretensión seguro', 'Marge de surtension sécurisée', 'Margem de sobretensão segura'),
    'stuckpipe.calc.verdict': ('Evaluación de liberación', 'Verdict d évaluation', 'Avaliação de liberação'),
    'stuckpipe.calc.reduction_needed': ('Reducción de ΔP requerida para sobretensión segura', 'Réduction de ΔP nécessaire', 'Redução de ΔP necessária para tração segura'),
    'stuckpipe.calc.pill_reduction': ('Reducción hidrostática con píldora liviana', 'Réduction hydrostatique par bouchon allégé', 'Redução hidrostática com pílula leve'),
    'stuckpipe.calc.remaining_ob': ('Sobrebalance residual', 'Surpression résiduelle', 'Sobrebalanço residual'),
    'stuckpipe.calc.free_point': ('Profundidad estimada del punto libre', 'Profondeur estimée du point libre', 'Profundidade estimada do ponto livre'),
    'stuckpipe.calc.section': ('Sección de sarta correspondiente', 'Section de garniture concernée', 'Seção da coluna no ponto livre'),
    'stuckpipe.calc.pct_free': ('Porcentaje libre', 'Pourcentage libre', 'Porcentagem livre'),
    'stuckpipe.calc.beyond_string': ('La profundidad calculada excede la longitud de la sarta', 'La profondeur dépasse la longueur de garniture', 'A profundidade calculada excede a extensão da coluna'),
    'stuckpipe.calc.deviated_note': ('Precaución en pozos desviados: la fricción contra la pared reduce el estiramiento medido, haciendo que el punto libre calculado parezca más somero.',
                                     'Attention aux puits déviés : le frottement réduit l étirage mesuré, sous-estimant la profondeur.',
                                     'Atenção em poços desviados: o atrito nas paredes reduz o alongamento medido, indicando ponto livre mais raso que o real.'),
    'stuckpipe.calc.annular_cap': ('Capacidad anular', 'Capacité annulaire', 'Capacidade anular'),
    'stuckpipe.calc.annular_vol': ('Volumen anular de píldora', 'Volume annulaire du bouchon', 'Volume anular da pílula'),
    'stuckpipe.calc.total_pill': ('Volumen total de píldora requerido', 'Volume total de bouchon', 'Volume total da pílula'),
    'stuckpipe.calc.btn_estimate_force': ('Estimar fuerza de aprisionamiento', 'Estimer la force de coincement', 'Estimar força de prisão'),
    'stuckpipe.calc.btn_find_freepoint': ('Calcular punto libre', 'Calculer le point libre', 'Calcular ponto livre'),
    'stuckpipe.calc.presets_label': ('Valores típicos (μ):', 'Préréglages (μ) :', 'Valores de referência (μ):'),
    'stuckpipe.calc.preset_obm': ('Lodo base aceite / sintético OBM (0.08)', 'Boue base huile OBM (0.08)', 'Fluido base óleo OBM (0.08)'),
    'stuckpipe.calc.preset_wbm': ('Lodo base agua WBM (0.15)', 'Boue base eau WBM (0.15)', 'Fluido base água WBM (0.15)'),
    'stuckpipe.calc.preset_wbm_thick': ('Lodo base agua revoque grueso (0.25)', 'WBM à cake épais (0.25)', 'Base água com reboco espesso (0.25)'),
    'stuckpipe.calc.add_section': ('Agregar sección de sarta', 'Ajouter une section', 'Adicionar seção de coluna'),
    'stuckpipe.calc.remove_section': ('Eliminar', 'Supprimer', 'Remover'),
    'stuckpipe.calc.section_title': ('Sección {num}', 'Section {num}', 'Seção {num}'),
    'stuckpipe.calc.section_len': ('Longitud', 'Longueur', 'Comprimento'),
    'stuckpipe.calc.section_weight': ('Peso nominal', 'Poids', 'Peso nominal'),
    'stuckpipe.log_btn_add': ('Registrar diagnóstico en el log', 'Ajouter au journal', 'Adicionar diagnóstico ao registro'),
    'stuckpipe.toast_added_log': ('Agregado al registro', 'Ajouté au journal', 'Adicionado ao registro'),
    'stuckpipe.log_empty': ('No hay entradas en el registro. Registre eventos clave.', 'Aucune entrée dans le journal.', 'Nenhum registro ainda. Registre observações.'),
    'stuckpipe.log_clear': ('Borrar registro', 'Effacer le journal', 'Limpar registro'),
    'stuckpipe.log_export': ('Exportar informe', 'Exporter le rapport', 'Exportar relatório'),
}

for k, (es_v, fr_v, pt_v) in calc_data.items():
    ES[k], FR[k], PT[k] = es_v, fr_v, pt_v

# 6. Mechanisms
mechs_data = {
    'mech.diff.name': ('Aprisionamiento diferencial', 'Coincement différentiel', 'Prisão diferencial'),
    'mech.diff.family': ('Diferencial', 'Différentiel', 'Diferencial'),
    'mech.diff.summary': ('La sarta queda apretada contra el revoque frente a una zona permeable por la diferencia entre la presión hidrostática del lodo y la presión de formación.',
                          'La garniture est plaquée contre le cake de filtration face à une zone perméable par la surpression hydrostatique.',
                          'A coluna é prensada contra o reboco em uma zona permeável pela diferença entre a pressão hidrostática e a pressão dos poros.'),

    'mech.pack_cut.name': ('Empaquetamiento (pack-off): recortes / limpieza deficiente del pozo',
                           'Pack-off (bouchon annulaire) : déblais / nettoyage insuffisant',
                           'Pack-off (obstrução do anular): cascalhos / limpeza deficiente do poço'),
    'mech.pack_cut.family': ('Mecánico: empaquetamiento / puente', 'Mécanique : pack-off / pontage', 'Mecânico: pack-off / ponte'),
    'mech.pack_cut.summary': ('Recortes acumulados o una avalancha de recortes han empaquetado el espacio anular alrededor de la BHA o tubería.',
                             'Des déblais sédimentés ou une avalanche de sédiments ont comblé l espace annulaire autour du BHA.',
                             'Cascalhos decantados ou avalanche de cascalhos obstruíram o anular ao redor do BHA ou dos tubos.'),

    'mech.pack_shale.name': ('Empaquetamiento (pack-off): lutita inestable (derrumbes/cavings)',
                             'Pack-off (bouchon annulaire) : argile instable (cavings)',
                             'Pack-off (obstrução do anular): folhelho instável (desmoronamento/cavings)'),
    'mech.pack_shale.family': ('Mecánico: empaquetamiento / puente', 'Mécanique : pack-off / pontage', 'Mecânico: pack-off / ponte'),
    'mech.pack_shale.summary': ('Lutita reactiva o quebradiza se ha derrumbado dentro del pozo, empaquetando la sarta de perforación.',
                               'Des argiles réactives ou fracturées se sont effondrées dans le trou et bloquent la garniture.',
                               'Folhelho reativo ou quebradiço desmoronou no poço e formou um empacotamento ao redor da coluna.'),

    'mech.pack_frac.name': ('Empaquetamiento (pack-off): roca fracturada / no consolidada',
                            'Pack-off (bouchon annulaire) : roche fracturée / non consolidée',
                            'Pack-off (obstrução do anular): rocha fraturada / não consolidada'),
    'mech.pack_frac.family': ('Mecánico: empaquetamiento / puente', 'Mécanique : pack-off / pontage', 'Mecânico: pack-off / ponte'),
    'mech.pack_frac.summary': ('Bloques o granos sueltos de una formación fracturada o no consolidada han caído, puenteando el pozo.',
                              'Des blocs de roche fracturée ou non consolidée sont tombés et ont ponté le puits.',
                              'Blocos ou fragmentos soltos de formação fraturada ou inconsolidada caíram e criaram uma ponte no poço.'),

    'mech.key.name': ('Ojo de llave (key seat)', 'Rainure de clavette (key seat)', 'Chaveta (key seat)'),
    'mech.key.family': ('Geometría del pozo', 'Géométrie du puits', 'Geometria do poço'),
    'mech.key.summary': ('Las uniones de tubería desgastaron una ranura estrecha en la pared en una pata de perro (dogleg) y la BHA de mayor diámetro se acuña al subir.',
                         'Les tiges ont usé une rainure dans la paroi au niveau d un dogleg et le BHA plus large s y coince à la remontée.',
                         'As juntas dos tubos abriram um canal na parede em um dogleg e o BHA de maior diâmetro ficou entalado ao puxar.'),

    'mech.ledge.name': ('Escalón (ledge) / micro-dogleg / BHA rígida', 'Redan (ledge) / micro-dogleg / BHA rigide', 'Ressalto (ledge) / micro-dogleg / BHA rígido'),
    'mech.ledge.family': ('Geometría del pozo', 'Géométrie du puits', 'Geometria do poço'),
    'mech.ledge.summary': ('La BHA se ha trabado en un escalón o cambio abrupto de trayectoria, típicamente en un límite duro/blando o tras cambiar de BHA.',
                          'Le BHA s est accroché sur un redan ou une discontinuité géométrique, souvent à une transition de dureté de roche.',
                          'O BHA engatou em um ressalto ou variação abrupta de inclinação, tipicamente no contato entre camadas duras e macias.'),

    'mech.under.name': ('Pozo bajo calibre (undergauge hole)', 'Trou sous-calibré (undergauge)', 'Poço abaixo do calibre (undergauge)'),
    'mech.under.family': ('Geometría del pozo', 'Géométrie du puits', 'Geometria do poço'),
    'mech.under.summary': ('El diámetro del pozo es menor que la barrena o estabilizadores, por desgaste de la barrena previa en sección abrasiva o hinchamiento.',
                           'Le diamètre du trou est inférieur au diamètre de l outil, suite à l usure de l outil précédent ou au gonflement de parois.',
                           'O poço está com diâmetro menor que a broca ou estabilizadores, por desgaste da broca anterior ou inchaço da formação.'),

    'mech.mobile.name': ('Formación plástica móvil (sal / lutita fluyente)', 'Formation fluante (sel / argile plastique)', 'Formação móvel (sal / folhelho plástico)'),
    'mech.mobile.family': ('Geometría del pozo', 'Géométrie du puits', 'Geometria do poço'),
    'mech.mobile.summary': ('Sal o lutita plástica fluye lentamente hacia el pozo cerrando el espacio anular y aprisionando la tubería.',
                           'Le sel ou des argiles plastiques fluent dans le puits et enserrent la garniture.',
                           'Sal ou folhelho plástico está fluindo (creep) para o interior do poço, estrangulando a coluna.'),

    'mech.foreign.name': ('Objeto extraño: chatarra, cemento o daño de tubería de revestimiento',
                          'Corps étranger : ferraille, ciment ou tubage endommagé',
                          'Objeto estranho: lixo metálico, cimento ou dano no revestimento'),
    'mech.foreign.family': ('Mecánico: objeto extraño', 'Mécanique : objet étranger', 'Mecânico: objeto estranho'),
    'mech.foreign.summary': ('Chatarra, bloques de cemento fraguado / verde o colapso de revestimiento traban rígidamente la sarta.',
                            'De la ferraille, des blocs de ciment ou un tubage endommagé bloquent mécaniquement la garniture.',
                            'Peças metálicas, blocos de cimento ou revestimento amassado/colapsado estão prendendo a coluna.'),
}

for k, (es_v, fr_v, pt_v) in mechs_data.items():
    ES[k], FR[k], PT[k] = es_v, fr_v, pt_v

# 7. Confidence & Warnings & Checks & Tight Hole & Verdicts
alerts_data = {
    'conf.high': ('La evidencia apunta claramente a un mecanismo. Confirme con las verificaciones operativas a continuación.',
                  'Les indices convergent clairement vers un mécanisme unique. Confirmer néanmoins avec les vérifications.',
                  'As evidências apontam claramente para um mecanismo. Confirme com as checagens operacionais abaixo.'),
    'conf.medium': ('Probable, pero otro mecanismo sigue siendo posible. Realice las verificaciones de confirmación.',
                    'Probable, mais un second mécanisme demeure possible. Effectuer les vérifications recommandées.',
                    'Provável, mas outro mecanismo ainda é possível. Execute as checagens de confirmação.'),
    'conf.low_insufficient': ('Información limitada. Responda más preguntas o realice las verificaciones para afinar el diagnóstico.',
                             'Informations partielles. Répondre à davantage de critères pour affiner le résultat.',
                             'Informações limitadas. Responda a mais perguntas ou execute os testes para refinar o diagnóstico.'),
    'conf.low_mixed': ('Evidencia mixta. Trate los dos mecanismos principales como viables y aplique acciones seguras para ambos.',
                       'Indices contradictoires. Traiter les deux premiers mécanismes et choisir les actions sans risque pour les deux.',
                       'Evidências mistas. Considere os dois principais mecanismos e adote ações seguras para ambos.'),

    'warning.circulation_losses': ('Pérdida de circulación con pérdidas de lodo: monitoree de cerca el pozo (revisión de flujo y niveles de presas). El empaquetamiento puede enmascarar un influjo o flujo subterráneo.',
                                   'Perte de circulation avec pertes de boue : surveiller étroitement le puits (flux et bassins). Un pack-off peut masquer une venue.',
                                   'Perda de circulação acompanhada de perda de fluido: monitore o poço rigorosamente (teste de fluxo e tanques). Um pack-off pode mascarar um kick.'),
    'warning.packoff_pressure': ('NUNCA aplique sobrepresión de bombeo contra un empaquetamiento (pack-off). Alivie la presión atrapada antes de trabajar la sarta y mantenga la presión por debajo del límite de fractura del pozo abierto.',
                                 'Ne JAMAIS monter en pression contre un pack-off. Purger la pression piégée avant de manoeuvrer et respecter la limite de fracturation.',
                                 'NUNCA pressurize contra um pack-off. Purgue a pressão aprisionada antes de manobrar e mantenha a pressão abaixo do limite de fratura do poço.'),
    'warning.overbalance_high': ('Alto sobrebalance: revise la presión de poros y el margen de influjo antes de cualquier reducción hidrostática.',
                                 'Forte surpression (overbalance) : vérifier la pression de pore avant d alléger la colonne hydrostatique.',
                                 'Alto sobrebalanço: verifique a pressão de poros e a margem de kick antes de reduzir a hidrostática.'),
    'warning.diff_time': ('La fuerza de aprisionamiento diferencial aumenta con el tiempo. Actúe en los primeros minutos en lugar de esperar.',
                          'La force de collage différentiel augmente avec le temps. Agir immédiatement dans les premières minutes.',
                          'A força de prisão diferencial aumenta com o tempo. Aja nos primeiros minutos sem hesitar.'),

    'check.pair.diff_pack_cut': ('Intente circular a muy baja tasa dentro de los límites de presión. Retornos completos a presión normal indican aprisionamiento diferencial; alta presión o sin retorno indica empaquetamiento.',
                                 'Tenter une circulation à faible débit sous le seuil de pression. Un retour normal indique un collage différentiel ; une surpression indique un pack-off.',
                                 'Tente circulação em baixa vazão dentro dos limites de pressão. Retorno pleno com pressão normal favorece diferencial; alta pressão ou sem retorno indica pack-off.'),
    'check.pair.diff_pack_shale': ('Revise las temblorinas en busca de derrumbes y pruebe circulación a bajo caudal. Derrumbes y alta presión indican lutitas; retornos limpios indican aprisionamiento diferencial.',
                                   'Inspecter les tamis vibrants pour les cavings et tester la circulation. Des cavings et une forte pression indiquent des argiles ; un retour propre indique un collage différentiel.',
                                   'Verifique as peneiras quanto a cavings e teste circulação em baixa vazão. Cavings e alta pressão indicam folhelho; retorno normal indica diferencial.'),
    'check.pair.pack_cut_pack_shale': ('Observe las temblorinas: derrumbes angulares y astillados indican lutita inestable; recortes finos de perforación con disminución de retorno indican limpieza deficiente del pozo.',
                                       'Examiner les tamis : des cavings anguleux et éclatés indiquent une argile instable ; des déblais fins avec pertes indiquent un problème de nettoyage.',
                                       'Observe as peneiras: cavings angulares indicam folhelho instável; cascalhos finos com queda de retorno indicam falha de limpeza do poço.'),
    'check.pair.key_ledge': ('¿Hacia qué dirección puede moverse la sarta? Solo hacia abajo = ojo de llave (key seat); solo hacia arriba = escalón (ledge).',
                             'Dans quelle direction la garniture bouge-t-elle ? Vers le bas uniquement = rainure de clavette ; vers le haut uniquement = redan.',
                             'Em qual direção a coluna se move? Apenas para baixo = chaveta (key seat); apenas para cima = ressalto (ledge).'),
    'check.pair.ledge_under': ('Revise el calibre de la barrena anterior y la formación. Barrena desgastada indica pozo bajo calibre; cambio de BHA o transición geológica indica escalón.',
                               'Vérifier le calibre de l outil précédent et la formation. Un outil sous-calibré indique un trou rétréci ; un changement de BHA indique un redan.',
                               'Verifique o calibre da broca anterior. Broca gasta favorece poço sob calibre; troca de BHA ou transição de formação indica ressalto.'),
    'check.pair.key_pack_cut': ('Pruebe circulación: presión normal favorece ojo de llave (key seat); circulación restringida favorece empaquetamiento (pack-off).',
                                'Tester la circulation : pression normale = rainure de clavette ; circulation restreinte = pack-off.',
                                'Teste circulação: pressão normal favorece chaveta (key seat); pressão restrita favorece pack-off.'),
    'check.pair.mobile_pack_cut': ('Verifique la formación a la profundidad atascada y el tiempo transcurrido. Sal o lutita plástica indica formación móvil.',
                                   'Vérifier la lithologie et le temps d exposition. Sel ou argile plastique = formation fluante.',
                                   'Verifique a formação na profundidade presa. Sal ou folhelho plástico favorece formação móvel.'),
    'check.pair.diff_key': ('¿Se puede bajar la sarta? Se mueve solo hacia abajo = ojo de llave. No se mueve en ninguna dirección frente a zona permeable = aprisionamiento diferencial.',
                            'Peut-on descendre la garniture ? Descente possible = rainure de clavette. Immobile face à une zone perméable = coincement différentiel.',
                            'A coluna pode ser descida? Desce apenas para baixo = chaveta. Não se move em nenhum sentido contra zona permeável = diferencial.'),
    'check.pair.diff_mobile': ('Verifique la formación en el punto atascado: sal o lutita plástica = formación móvil; arena permeable con sobrebalance = aprisionamiento diferencial.',
                               'Identifier la formation : sel/argile plastique = formation fluante ; sable perméable avec surpression = coincement différentiel.',
                               'Verifique a formação: sal ou folhelho plástico = formação móvel; arenito permeável com sobrebalanço = prisão diferencial.'),

    'check.prompt.circulation': ('Establezca circulación a caudal muy bajo y observe la presión y los retornos.',
                                 'Établir la circulation à très faible débit et observer pression et retours.',
                                 'Estabeleça circulação em vazão muito baixa e anote a pressão e o retorno.'),
    'check.prompt.movement': ('Pruebe con cuidado en qué dirección se mueve la sarta (dentro de límites seguros de tensión y peso).',
                              'Tester avec précaution le sens de déplacement possible dans les limites mécaniques.',
                              'Teste cuidadosamente em qual direção a coluna se move (dentro dos limites de tração e folga).'),
    'check.prompt.lastMove': ('Confirme con el perforador la dirección del movimiento en el instante exacto del atascamiento.',
                              'Confirmer avec le sondeur le sens du mouvement au moment précis du coincement.',
                              'Confirme com o sondador qual era a direção do movimento no instante em que prendeu.'),
    'check.prompt.zone': ('Verifique la posición de la BHA contra registros geológicos o de lodo para identificar la formación.',
                          'Comparer la position du BHA aux diagraphies pour identifier la formation en regard.',
                          'Verifique a posição do BHA em relação aos perfis para identificar a formação no ponto preso.'),
    'check.prompt.overbalance': ('Calcule el sobrebalance en el punto de atascamiento a partir de la densidad del lodo y la presión de formación.',
                                 'Calculer la surpression (overbalance) à partir de la densité de boue et de la pression de pore.',
                                 'Calcule o sobrebalanço na profundidade presa a partir do peso da lama e da pressão dos poros.'),
    'check.prompt.rotation': ('Verifique si se puede aplicar y sostener torque, y si la sarta rota libremente.',
                              'Vérifier si un couple peut être appliqué et maintenu, et si la garniture tourne.',
                              'Verifique se o torque pode ser aplicado e mantido, e se a coluna gira.'),
    'check.prompt.angle': ('Verifique la inclinación del pozo a la profundidad de atascamiento.',
                           'Vérifier l inclinaison du puits à la profondeur coincée.',
                           'Verifique a inclinação do poço na profundidade da prisão.'),
    'check.prompt.operation': ('Confirme la operación exacta que se ejecutaba en el momento del atascamiento.',
                               'Confirmer l opération exacte en cours au moment du coincement.',
                               'Confirme a operação exata no momento da prisão.'),

    'playbook.first.1': ('Detenga la tensión o peso excesivo contra la resistencia. No fuerce mecánicamente la sarta.',
                         'Cesser immédiatement de tirer ou de peser contre la résistance. Ne pas forcer la garniture.',
                         'Pare de puxar ou folgar bruscamente contra a resistência. Não force a coluna.'),
    'playbook.first.2': ('Registre inmediatamente la carga al gancho (arriba, abajo, rotando), torque, presión de bombeo SPP, caudal, profundidad y hora.',
                         'Consigner immédiatement la charge au crochet (haut, bas, rotation), le couple, la SPP, le débit et l heure.',
                         'Registre imediatamente a carga no gancho (subindo, descendo, girando), torque, pressão de bomba SPP, vazão e hora.'),
    'playbook.first.3': ('Revise el pozo: haga revisión de flujo (flow check) y volúmenes en presas. Un empaquetamiento o pérdida puede ocultar un influjo (kick).',
                         'Contrôler le puits : flow check et volumes des bassins. Un pack-off ou des pertes peuvent masquer une venue.',
                         'Cheque o poço: realize flow check e verifique o volume dos tanques. Um pack-off ou perda pode ocultar um kick.'),
    'playbook.first.4': ('Aplique de inmediato la primera acción correctiva para el mecanismo diagnosticado. La mayoría de las liberaciones ocurren en los primeros minutos.',
                         'Appliquer sans délai la première action du mécanisme probable. La libération se produit souvent dans les premières minutes.',
                         'Aplique a primeira ação para o mecanismo provável imediatamente. A maioria das liberações ocorre nos primeiros minutos.'),
    'playbook.first.5': ('Permanezca dentro de los límites operativos: máxima sobretensión segura, torque de conexión y presiones de fractura del pozo.',
                         'Respecter impérativement les limites : traction maximale, couple et limites de pression du trou ouvert.',
                         'Permaneça rigorosamente dentro dos limites operacionais: tração máxima, torque de maquiagem e limites de pressão do poço.'),
    'playbook.first.6': ('Notifique de inmediato al supervisor / ingeniero de perforación e inicie la bitácora cronológica.',
                         'Avertir le superviseur / ingénieur forage et ouvrir la fiche d incident chronologique.',
                         'Notifique o supervisor / engenheiro de perfuração e inicie o registro cronológico de eventos.'),

    'playbook.prevent_pack.1': ('Mantenga velocidad anular y propiedades reológicas óptimas para el ángulo del pozo; bombee píldoras de limpieza y rote/reciprocque en conexiones.',
                                'Maintenir une vitesse annulaire et une rhéologie adaptées ; effectuer des balayages et faire tourner/manoeuvrer lors des connexions.',
                                'Mantenha velocidade anular e reologia adequadas para a inclinação; aplique píldoras e gire/reciproque nas conexões.'),
    'playbook.prevent_pack.2': ('Monitoree tendencias de torque, arrastre y retornos de recortes; deténgase a circular y limpiar el pozo cuando aumenten.',
                                'Surveiller les tendances de couple, frottement et déblais ; s arrêter pour nettoyer dès qu elles augmentent.',
                                'Monitore tendências de torque, arrasto e retorno de cascalhos; pare para circular e limpar o poço ao notar aumento.'),
    'playbook.prevent_pack.3': ('Realice viajes de calibración (wiper trips) y bombee tubería hacia afuera en secciones de alto ángulo en vez de sacar en seco.',
                                'Effectuer des passes de nettoyage (wiper trips) et pomper au démontage dans les puits fortement inclinés.',
                                'Realize manobras de limpeza (wiper trips) e circule bombeando nas seções de alta inclinação ao invés de puxar a seco.'),

    'playbook.jar.opposite_up': ('Martille hacia abajo (en sentido opuesto al último movimiento, que fue hacia arriba).',
                                 'Battre vers le bas (à l opposé du dernier déplacement vers le haut).',
                                 'Martelar para baixo (oposto ao último movimento, que foi para cima).'),
    'playbook.jar.opposite_down': ('Martille hacia arriba (en sentido opuesto al último movimiento, que fue hacia abajo).',
                                   'Battre vers le haut (à l opposé du dernier déplacement vers le bas).',
                                   'Martelar para cima (oposto ao último movimento, que foi para baixo).'),
    'playbook.jar.opposite_unknown': ('Martille en dirección opuesta al último movimiento. Se desconoce el último movimiento: confirme con el perforador antes de martillar.',
                                     'Battre à l opposé du mouvement initial. Sens inconnu : confirmer avec le sondeur avant de battre.',
                                     'Martelar em sentido oposto ao movimento no momento da prisão. Sentido desconhecido: confirme com o sondador antes de martelar.'),

    'tight_hole.now.1': ('La sarta todavía se mueve en ambos sentidos; es una advertencia, aún no está atascada. Deje de forzarla.',
                         'La garniture bouge dans les deux sens : c est une alerte préventive, pas un coincement. Ne pas forcer.',
                         'Você ainda pode mover a coluna em ambos os sentidos; isso é um alerta, não uma prisão. Não force a coluna.'),
    'tight_hole.now.2': ('Trabaje la sarta con suavidad: circule, rote y repase el intervalo apretado en ambas direcciones.',
                         'Manoeuvrer avec précaution : circuler, tourner et aléser lentement l intervalle serré dans les deux sens.',
                         'Trabalhe a coluna com cuidado: circule, gire e repasse o intervalo apertado em ambas as direções.'),
    'tight_hole.now.3': ('Registre con precisión la profundidad y los valores de sobretensión / arrastre en cada punto duro.',
                         'Noter précisément la cote et les valeurs de surtension / frottement à chaque point dur.',
                         'Registre a profundidade e os valores de arrasto e sobretensão em cada ponto crítico.'),
    'tight_hole.now.4': ('Aumente los esfuerzos de limpieza del pozo: píldoras viscosas, rotación y máximo caudal dentro de los límites.',
                         'Renforcer le nettoyage : balayages visqueux, rotation et débit maximal admissible.',
                         'Intensifique a limpeza do poço: píldoras viscosas, rotação e vazão máxima dentro dos limites operacionais.'),
    'tight_hole.avoid.1': ('NO intente pasar forzando con alta sobretensión ni descargando peso excesivo: forzar un pozo apretado es la causa más común de aprisionamiento.',
                           'Ne PAS forcer le passage avec une traction excessive ou un poids excessif sur l outil.',
                           'NÃO tente forçar a passagem com tração excessiva nem descarregue peso bruto: forçar um poço apertado causa prisão de coluna.'),

    'calc.verdict.no_overbalance': ('Sin sobrebalance positivo: la fuerza de aprisionamiento diferencial es cero con estos parámetros.',
                                    'Aucune surpression positive : la force de collage différentiel est nulle.',
                                    'Sem sobrebalanço positivo: a força de prisão diferencial é zero nestas condições.'),
    'calc.verdict.no_margin': ('Sin margen de sobretensión disponible. Reduzca la presión hidrostática y coloque una píldora liberadora; traccionar no funcionará.',
                               'Aucune marge de surtension restante. Alléger la colonne et placer un bouchon ; la traction seule est inopérante.',
                               'Sem margem de sobretensão. Reduza a hidrostática e coloque uma pílula liberadora; apenas puxar não libertará a coluna.'),
    'calc.verdict.good_margin': ('La sobretensión segura supera la fuerza de aprisionamiento estimada por un buen margen. El martilleo tiene alta probabilidad de éxito.',
                                 'La surtension admissible dépasse largement la force estimée. Le battage a de bonnes chances de succès.',
                                 'A sobretensão segura excede a força de prisão estimada por boa margem. O martelamento tem boas chances de sucesso.'),
    'calc.verdict.thin_margin': ('El margen de sobretensión es estrecho. Combine martilleo continuo con píldora liberadora y reducción hidrostática.',
                                 'Marge étroite. Combiner le battage avec un bouchon lubrifiant et une baisse de pression hydrostatique.',
                                 'Margem estreita. Combine martelamento com pílula de liberação e redução da hidrostática.'),
    'calc.verdict.overpull_below': ('La sobretensión segura es menor que la fuerza de aprisionamiento estimada. No dependa de la tracción: reduzca ΔP y coloque píldora.',
                                   'La traction sécurisée est inférieure à la force de collage. Ne pas compter sur la traction : réduire la surpression et placer un bouchon.',
                                   'A sobretensão segura é inferior à força de prisão estimada. Não confie apenas na tração: reduza ΔP e aplique pílula liberadora.'),
}

for k, (es_v, fr_v, pt_v) in alerts_data.items():
    ES[k], FR[k], PT[k] = es_v, fr_v, pt_v

print(f"Loaded {len(ES)} base keys across ES, FR, PT.")

# Save temporary base romance
with open(os.path.join(ROOT_DIR, 'scratch', 'romance_base.json'), 'w', encoding='utf-8') as f:
    json.dump({'es': ES, 'fr': FR, 'pt': PT}, f, indent=2, ensure_ascii=False)
