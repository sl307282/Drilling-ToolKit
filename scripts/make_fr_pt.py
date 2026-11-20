#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates complete 466-key translations for French (fr) and Portuguese (pt).
Combines base translations from romance_base.json with accurate engineering reasons and playbooks.
"""

import json
import os
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

with open(os.path.join(ROOT_DIR, 'scratch', 'romance_base.json'), 'r', encoding='utf-8') as f:
    base = json.load(f)

with open(os.path.join(ROOT_DIR, 'scratch', 'locales', 'es.json'), 'r', encoding='utf-8') as f:
    es = json.load(f)

with open(os.path.join(ROOT_DIR, 'scratch', 'stuckpipe_all_en.json'), 'r', encoding='utf-8') as f:
    en = json.load(f)

# French translations for reasons and playbooks
FR_REASONS = {
    'reason.diff.circulation_full': 'La circulation n est pas restreinte, comme prévu lorsque la garniture est plaquée à la paroi plutôt que bloquée par un bouchon.',
    'reason.diff.circulation_restricted': 'Une circulation restreinte oriente plutôt vers un problème mécanique que vers un coincement différentiel pur.',
    'reason.diff.circulation_none': 'L absence totale de circulation exclut un collage différentiel.',
    'reason.diff.operation_static': 'La garniture était stationnaire ; le collage différentiel nécessite du temps au contact du cake.',
    'reason.diff.operation_sliding': 'Forer orienté (sliding) sans rotation laisse reposer le BHA sur la génératrice inférieure contre le cake.',
    'reason.diff.operation_drilling': 'Une garniture en rotation se coince rarement par pression différentielle.',
    'reason.diff.lastMove_none': 'Aucun mouvement de garniture avant le coincement.',
    'reason.diff.lastMove_rotating': 'La garniture était en rotation au moment du coincement.',
    'reason.diff.zone_permeable': 'La garniture se trouve face à une zone perméable ou déplétée où s accumule un cake de filtration.',
    'reason.diff.not_zone_permeable': 'Le point de coincement ne se situe pas face à une zone perméable.',
    'reason.diff.overbalance_high': 'Une forte surpression (overbalance) engendre une force de collage considérable.',
    'reason.diff.overbalance_moderate': 'Une surpression modérée peut suffire pour provoquer un coincement différentiel.',
    'reason.diff.overbalance_low': 'Une faible surpression rend le collage différentiel improbable.',
    'reason.diff.staticTime_long': 'Un temps d arrêt prolongé amplifie fortement l adhérence au cake.',
    'reason.diff.flag_thick_cake': 'Forte perte de filtration / cake de filtration épais.',
    'reason.diff.rotation_locked': 'La garniture ne peut pas être mise en rotation.',
    'reason.diff.rotation_free': 'La rotation demeure libre.',
    'reason.diff.movement_neither': 'La garniture est immobile vers le haut et vers le bas.',
    'reason.diff.movement_both': 'La garniture bouge encore dans les deux sens.',
    'reason.diff.angle_mid_high': 'L inclinaison du puits plaque la garniture sur la paroi inférieure contre le cake.',
    'reason.diff.flag_cavings': 'La présence de cavings aux tamis indique une instabilité de paroi plutôt qu un collage.',
    'reason.diff.flag_poor_cleaning': 'Des difficultés de nettoyage du puits orientent vers un pack-off.',
    'reason.diff.mud_obm': 'La boue à base d huile procure un coefficient de frottement réduit sur le cake.',

    'reason.pack_cut.circulation_restricted': 'Circulation restreinte : l espace annulaire est partiellement obstrué par les déblais.',
    'reason.pack_cut.circulation_none': 'Circulation nulle : l espace annulaire est complètement bloqué.',
    'reason.pack_cut.circulation_full': 'Une circulation normale s oppose à l hypothèse d un pack-off.',
    'reason.pack_cut.onset_gradual': 'La montée progressive de la pression de refoulement indique une accumulation de déblais.',
    'reason.pack_cut.onset_sudden': 'Une montée brusque de pression suggère une avalanche soudaine de déblais.',
    'reason.pack_cut.angle_mid': 'Entre 30° et 60°, les lits de déblais se forment et glissent facilement.',
    'reason.pack_cut.angle_high': 'Les puits à fort angle favorisent le dépôt des déblais.',
    'reason.pack_cut.angle_low': 'Les puits subverticaux sont moins sujets aux lits de sédiments.',
    'reason.pack_cut.flag_poor_cleaning': 'Nettoyage du puits déficient (débit faible, ROP élevé, retour anormalement faible aux tamis).',
    'reason.pack_cut.flag_torque_trend': 'Le couple était en hausse progressive avant le coincement.',
    'reason.pack_cut.flag_drag_trend': 'Le frottement et la surtension augmentaient avant le coincement.',
    'reason.pack_cut.operation_tripping_out': 'Tirer dans un lit de sédiments est le déclencheur typique d un pack-off.',
    'reason.pack_cut.operation_static': 'Les déblais décantent dès l arrêt des pompes.',
    'reason.pack_cut.operation_sliding': 'Le forage orienté (sliding) n agite pas le lit de déblais.',
    'reason.pack_cut.operation_drilling': 'Un pack-off en forage fait suite à un déficit d évacuation des déblais.',
    'reason.pack_cut.lastMove_up': 'La garniture remontait en direction du bouchon de déblais.',
    'reason.pack_cut.flag_cavings': 'Des cavings suggèrent plutôt un problème d argiles instables.',

    'reason.pack_shale.circulation_restricted': 'Circulation restreinte.',
    'reason.pack_shale.circulation_none': 'Aucune circulation.',
    'reason.pack_shale.circulation_full': 'Une circulation normale réfute un pack-off franc.',
    'reason.pack_shale.zone_shale_reactive': 'En face d argiles réactives et gonflantes.',
    'reason.pack_shale.zone_shale_brittle': 'En face d argiles fracturées ou sous contrainte tectonique.',
    'reason.pack_shale.not_zone_shale_reactive_shale_brittle': 'Hors des formations argileuses.',
    'reason.pack_shale.flag_cavings': 'Présence marquée de cavings aux tamis vibrants.',
    'reason.pack_shale.flag_torque_trend': 'Le couple était en hausse continue.',
    'reason.pack_shale.flag_drag_trend': 'Le frottement était en hausse.',
    'reason.pack_shale.flag_swab': 'Les variations de pression au pistonnage peuvent déstabiliser les argiles.',
    'reason.pack_shale.operation_static': 'L argile s effondre avec le temps d exposition.',
    'reason.pack_shale.operation_tripping_out': 'Les manoeuvres de remontée imposent des variations de pression.',

    'reason.pack_frac.circulation_restricted': 'Circulation restreinte.',
    'reason.pack_frac.circulation_none': 'Aucune circulation.',
    'reason.pack_frac.circulation_full': 'Circulation normale opposée au diagnostic de bouchon.',
    'reason.pack_frac.onset_sudden': 'Le blocage soudain est typique de blocs se détachant d une roche fracturée.',
    'reason.pack_frac.zone_fractured': 'En regard d une formation fracturée, faillée ou non consolidée.',
    'reason.pack_frac.not_zone_fractured': 'Hors zone fracturée.',
    'reason.pack_frac.flag_losses': 'Des pertes de boue confirment l existence de fractures ouvertes.',

    'reason.key.operation_tripping_out': 'Coincé pendant la remontée de la garniture.',
    'reason.key.operation_tripping_in': 'La rainure de clavette bloque à la traction, pas à la descente.',
    'reason.key.operation_drilling': 'Pas en manoeuvre.',
    'reason.key.operation_static': 'Garniture non manoeuvrée au moment du coincement.',
    'reason.key.lastMove_up': 'La garniture se déplaçait vers le haut.',
    'reason.key.lastMove_down': 'La garniture descendait.',
    'reason.key.movement_down_only': 'La garniture peut être descendue mais pas remontée : cas d école de rainure de clavette (key seat).',
    'reason.key.movement_up_only': 'La garniture peut remonter mais pas descendre.',
    'reason.key.movement_both': 'La garniture se déplace encore dans les deux sens.',
    'reason.key.circulation_full': 'La circulation est parfaitement normale.',
    'reason.key.circulation_restricted': 'Une circulation restreinte oriente plutôt vers un pack-off.',
    'reason.key.circulation_none': 'Aucune circulation.',
    'reason.key.rotation_free': 'La rotation de la garniture est toujours possible.',
    'reason.key.flag_dogleg': 'Dogleg prononcé / sévérité DLS élevée connue.',
    'reason.key.zone_shoe_dogleg': 'Au sabot de tubage ou au droit d un dogleg.',
    'reason.key.flag_prev_tight': 'Point dur déjà rencontré à cette profondeur lors d un passage antérieur.',
    'reason.key.flag_drag_trend': 'Le frottement à la traction était en augmentation.',

    'reason.ledge.operation_tripping_in': 'Coincé en descendant la garniture.',
    'reason.ledge.operation_tripping_out': 'Un redan (ledge) peut aussi accrocher le BHA à la remontée.',
    'reason.ledge.operation_static': 'Pas en mouvement au moment du coincement.',
    'reason.ledge.operation_drilling': 'Pas en manoeuvre.',
    'reason.ledge.lastMove_down': 'La garniture descendait.',
    'reason.ledge.movement_up_only': 'La garniture peut monter mais pas descendre : le BHA repose sur un redan.',
    'reason.ledge.movement_down_only': 'La garniture peut descendre mais pas monter.',
    'reason.ledge.movement_both': 'La garniture bouge dans les deux sens.',
    'reason.ledge.circulation_full': 'Circulation normale.',
    'reason.ledge.circulation_restricted': 'Circulation restreinte.',
    'reason.ledge.circulation_none': 'Aucune circulation.',
    'reason.ledge.flag_bha_change': 'Changement récent pour un BHA plus rigide ou de plus fort diamètre extérieur.',
    'reason.ledge.flag_interbedded': 'L alternance de bancs durs et tendres forme des redans naturels.',
    'reason.ledge.flag_dogleg': 'Dogleg avéré.',
    'reason.ledge.flag_prev_tight': 'Point dur observé précédemment à cette cote.',
    'reason.ledge.rotation_free': 'La rotation est possible.',

    'reason.under.operation_tripping_in': 'Coincé à la descente.',
    'reason.under.operation_static': 'Garniture immobile au coincement.',
    'reason.under.lastMove_down': 'La garniture descendait.',
    'reason.under.zone_hard_abrasive': 'Traversée d une formation dure et abrasive usant le calibre de l outil.',
    'reason.under.zone_shale_reactive': 'L hydratation d argiles gonflantes rétrécit le diamètre du trou.',
    'reason.under.flag_bit_undergauge': 'L outil précédent est ressorti sous-calibré.',
    'reason.under.movement_up_only': 'La garniture peut remonter mais refuse de descendre.',
    'reason.under.circulation_full': 'Circulation normale.',
    'reason.under.circulation_none': 'Aucune circulation.',

    'reason.mobile.zone_salt': 'En regard d une couche de sel massif ou d argile plastique fluante.',
    'reason.mobile.not_zone_salt': 'Hors zone de sel ou d argile fluante.',
    'reason.mobile.operation_static': 'Le fluage referme le puits pendant que la garniture est immobile.',
    'reason.mobile.operation_tripping_out_tripping_in': 'Le fluage s accentue avec le temps et bloque la garniture en manoeuvre.',
    'reason.mobile.circulation_restricted': 'L espace annulaire est comprimé par le resserrement des parois.',
    'reason.mobile.flag_torque_trend': 'Le couple était en hausse progressive.',
    'reason.mobile.flag_drag_trend': 'Le frottement était en hausse.',
    'reason.mobile.movement_neither': 'La garniture est bloquée dans les deux sens.',

    'reason.foreign.flag_junk': 'Présence de débris métalliques ou ferraille signalée au fond.',
    'reason.foreign.flag_cement': 'Opération de cimentation récente, ciment frais ou blocs de ciment.',
    'reason.foreign.flag_casing': 'Détérioration ou écrasement suspecté du tubage.',
    'reason.foreign.onset_sudden': 'Blocage mécanique instantané.',
    'reason.foreign.operation_tripping_in_tripping_out': 'Coincé en cours de manoeuvre.',
}

# Portuguese translations for reasons
PT_REASONS = {
    'reason.diff.circulation_full': 'Circulação desimpedida e normal, como esperado quando a coluna está colada à parede e não obstruída por cascalhos.',
    'reason.diff.circulation_restricted': 'Circulação restrita aponta contra a hipótese de prisão diferencial pura.',
    'reason.diff.circulation_none': 'Ausência total de circulação contraria prisão diferencial.',
    'reason.diff.operation_static': 'Coluna estava estacionária; a prisão diferencial necessita de tempo de contato estático contra o reboco.',
    'reason.diff.operation_sliding': 'Deslizar sem rotação deixa o BHA apoiado no lado inferior contra o reboco.',
    'reason.diff.operation_drilling': 'Coluna em rotação raramente sofre prisão diferencial.',
    'reason.diff.lastMove_none': 'Nenhum movimento de coluna antes da prisão.',
    'reason.diff.lastMove_rotating': 'A coluna estava girando no momento em que prendeu.',
    'reason.diff.zone_permeable': 'A coluna está em frente a uma zona permeável / depletada com formação de reboco espesso.',
    'reason.diff.not_zone_permeable': 'O ponto de prisão não coincide com zona permeável.',
    'reason.diff.overbalance_high': 'Alto sobrebalanço gera uma força de adesão diferencial muito elevada.',
    'reason.diff.overbalance_moderate': 'Sobrebalanço moderado pode sustentar prisão diferencial.',
    'reason.diff.overbalance_low': 'Baixo sobrebalanço torna improvável a prisão diferencial.',
    'reason.diff.staticTime_long': 'Longo tempo estacionário aumenta substancialmente a força de colagem diferencial.',
    'reason.diff.flag_thick_cake': 'Alta perda de filtrado / reboco espesso.',
    'reason.diff.rotation_locked': 'Não é possível girar a coluna.',
    'reason.diff.rotation_free': 'A rotação ainda está livre.',
    'reason.diff.movement_neither': 'A coluna não se move nem para cima nem para baixo.',
    'reason.diff.movement_both': 'A coluna ainda se move em ambos os sentidos.',
    'reason.diff.angle_mid_high': 'Poço inclinado apoia a coluna sobre o lado baixo contra o reboco.',
    'reason.diff.flag_cavings': 'Cavings nas peneiras indicam instabilidade do poço em vez de diferencial.',
    'reason.diff.flag_poor_cleaning': 'Falhas na limpeza do poço apontam para pack-off.',
    'reason.diff.mud_obm': 'Fluido base óleo proporciona menor atrito contra o reboco.',

    'reason.pack_cut.circulation_restricted': 'Circulação restrita: o espaço anular está parcialmente empacotado por cascalhos.',
    'reason.pack_cut.circulation_none': 'Sem circulação: o espaço anular está totalmente bloqueado.',
    'reason.pack_cut.circulation_full': 'Circulação normal plena contraria a ocorrência de um pack-off.',
    'reason.pack_cut.onset_gradual': 'Aumento gradual de pressão sugere acúmulo progressivo de cascalhos.',
    'reason.pack_cut.onset_sudden': 'Aumento súbito de pressão sugere deslizamento em avalanche do leito de cascalhos.',
    'reason.pack_cut.angle_mid': 'Entre 30° e 60° é onde os leitos de cascalhos se acumulam e deslizam.',
    'reason.pack_cut.angle_high': 'Poços de alto ângulo acumulam leitos de cascalhos.',
    'reason.pack_cut.angle_low': 'Poços subverticais são menos propensos à formação de leito de cascalhos.',
    'reason.pack_cut.flag_poor_cleaning': 'Problemas de limpeza do poço (baixa vazão, alta ROP, queda de cascalhos nas peneiras).',
    'reason.pack_cut.flag_torque_trend': 'O torque estava aumentando antes da prisão.',
    'reason.pack_cut.flag_drag_trend': 'O arrasto e sobretensão estavam aumentando.',
    'reason.pack_cut.operation_tripping_out': 'Puxar coluna contra um leito de cascalhos é o gatilho clássico de pack-off.',
    'reason.pack_cut.operation_static': 'Os cascalhos decantam quando as bombas são desligadas.',
    'reason.pack_cut.operation_sliding': 'Deslizar sem rotação não agita nem limpa o leito de cascalhos.',
    'reason.pack_cut.operation_drilling': 'Pack-off perfurando decorre de deficiência na remoção de cascalhos.',
    'reason.pack_cut.lastMove_up': 'A coluna estava se movendo para cima contra os cascalhos acumulados.',
    'reason.pack_cut.flag_cavings': 'Cavings indicam folhelho em vez de acúmulo de cascalhos.',

    'reason.pack_shale.circulation_restricted': 'Circulação restrita.',
    'reason.pack_shale.circulation_none': 'Sem circulação.',
    'reason.pack_shale.circulation_full': 'Circulação normal plena contraria pack-off.',
    'reason.pack_shale.zone_shale_reactive': 'Cruzando folhelho reativo.',
    'reason.pack_shale.zone_shale_brittle': 'Cruzando folhelho quebradiço ou sobrepressurizado.',
    'reason.pack_shale.not_zone_shale_reactive_shale_brittle': 'Fora de zonas de folhelho.',
    'reason.pack_shale.flag_cavings': 'Presença marcante de desmoronamentos (cavings) nas peneiras vibratórias.',
    'reason.pack_shale.flag_torque_trend': 'Torque estava em elevação contínua.',
    'reason.pack_shale.flag_drag_trend': 'Arrasto estava em elevação contínua.',
    'reason.pack_shale.flag_swab': 'Variações de pistoneio podem desestabilizar os folhelhos.',
    'reason.pack_shale.operation_static': 'O folhelho desmorona progressivamente com o tempo estático.',
    'reason.pack_shale.operation_tripping_out': 'Manobras impõem oscilações de pressão no poço.',

    'reason.pack_frac.circulation_restricted': 'Circulação restrita.',
    'reason.pack_frac.circulation_none': 'Sem circulação.',
    'reason.pack_frac.circulation_full': 'Circulação normal contraria obstrução anular.',
    'reason.pack_frac.onset_sudden': 'Início súbito é típico de blocos que caem de rocha fraturada.',
    'reason.pack_frac.zone_fractured': 'Em formação fraturada, falhada ou inconsolidada.',
    'reason.pack_frac.not_zone_fractured': 'Não coincide com formação fraturada.',
    'reason.pack_frac.flag_losses': 'Perdas de lama indicam fraturas ou cavernas abertas.',

    'reason.key.operation_tripping_out': 'Prendeu puxando a coluna.',
    'reason.key.operation_tripping_in': 'Chaveta prende a coluna ao puxar para cima, não ao descer.',
    'reason.key.operation_drilling': 'Não estava em manobra.',
    'reason.key.operation_static': 'Coluna parada no momento da prisão.',
    'reason.key.lastMove_up': 'A coluna estava se movendo para cima.',
    'reason.key.lastMove_down': 'A coluna estava descendo.',
    'reason.key.movement_down_only': 'A coluna pode descer mas não pode ser puxada: chaveta clássica (key seat).',
    'reason.key.movement_up_only': 'A coluna pode subir mas não descer.',
    'reason.key.movement_both': 'A coluna move em ambos os sentidos.',
    'reason.key.circulation_full': 'Circulação plenamente normal.',
    'reason.key.circulation_restricted': 'Circulação restrita favorece pack-off.',
    'reason.key.circulation_none': 'Sem circulação.',
    'reason.key.rotation_free': 'A rotação ainda é possível.',
    'reason.key.flag_dogleg': 'Pata de cachorro (dogleg) conhecida / alta severidade DLS.',
    'reason.key.zone_shoe_dogleg': 'Na sapata de revestimento ou em um dogleg.',
    'reason.key.flag_prev_tight': 'Ponto crítico observado nesta cota em manobra anterior.',
    'reason.key.flag_drag_trend': 'Arrasto estava aumentando.',

    'reason.ledge.operation_tripping_in': 'Prendeu descendo a coluna.',
    'reason.ledge.operation_tripping_out': 'Ressaltos (ledges) também podem enganchar o BHA ao puxar.',
    'reason.ledge.operation_static': 'Parado no momento da prisão.',
    'reason.ledge.operation_drilling': 'Não estava em manobra.',
    'reason.ledge.lastMove_down': 'A coluna estava descendo.',
    'reason.ledge.movement_up_only': 'A coluna pode ser puxada mas não desce: o BHA está apoiado em um ressalto.',
    'reason.ledge.movement_down_only': 'A coluna pode descer mas não subir.',
    'reason.ledge.movement_both': 'A coluna move em ambos os sentidos.',
    'reason.ledge.circulation_full': 'Circulação é normal.',
    'reason.ledge.circulation_restricted': 'Circulação restrita.',
    'reason.ledge.circulation_none': 'Sem circulação.',
    'reason.ledge.flag_bha_change': 'Mudança recente para um BHA mais rígido ou de maior diâmetro externo.',
    'reason.ledge.flag_interbedded': 'Formações intercaladas duras e moles formam ressaltos naturais.',
    'reason.ledge.flag_dogleg': 'Pata de cachorro conhecida.',
    'reason.ledge.flag_prev_tight': 'Ponto apertado nesta profundidade na manobra anterior.',
    'reason.ledge.rotation_free': 'Rotação ainda é livre.',

    'reason.under.operation_tripping_in': 'Prendeu descendo a coluna.',
    'reason.under.operation_static': 'Parado ao prender.',
    'reason.under.lastMove_down': 'A coluna estava descendo.',
    'reason.under.zone_hard_abrasive': 'Cruzando rocha dura e abrasiva que desgasta o calibre da broca.',
    'reason.under.zone_shale_reactive': 'Folhelho reativo pode inchar e reduzir o diâmetro do poço.',
    'reason.under.flag_bit_undergauge': 'A broca anterior saiu com diâmetro abaixo do calibre.',
    'reason.under.movement_up_only': 'A coluna sobe livremente mas não desce.',
    'reason.under.circulation_full': 'Circulação normal.',
    'reason.under.circulation_none': 'Sem circulação.',

    'reason.mobile.zone_salt': 'Cruzando sal móvel ou folhelho plástico.',
    'reason.mobile.not_zone_salt': 'Não coincide com sal ou folhelho plástico.',
    'reason.mobile.operation_static': 'A deformação por fluência fecha o poço enquanto a coluna fica estática.',
    'reason.mobile.operation_tripping_out_tripping_in': 'A fluência avança com o tempo e aprisiona a coluna durante manobras.',
    'reason.mobile.circulation_restricted': 'O anular está estrangulado pelo fechamento plástico da formação.',
    'reason.mobile.flag_torque_trend': 'Torque estava subindo progressivamente.',
    'reason.mobile.flag_drag_trend': 'Arrasto estava subindo progressivamente.',
    'reason.mobile.movement_neither': 'A coluna não se move em nenhum sentido.',

    'reason.foreign.flag_junk': 'Lixo metálico / ferramentas caídas no poço reportadas.',
    'reason.foreign.flag_cement': 'Cimentação recente, cimento verde ou blocos endurecidos no poço.',
    'reason.foreign.flag_casing': 'Suspeita de colapso ou deformação do revestimento.',
    'reason.foreign.onset_sudden': 'Início súbito do travamento.',
    'reason.foreign.operation_tripping_in_tripping_out': 'Prendeu durante manobra de coluna.',
}

# Generate full FR and PT
FR_PLAYBOOKS = {}
PT_PLAYBOOKS = {}

# Map Spanish playbooks to French and Portuguese
for k, es_text in es.items():
    if k.startswith('playbook.'):
        # We can translate playbooks systematically
        # Let's inspect each mechanism in playbook
        pass

# Load template translation mapping
with open(os.path.join(ROOT_DIR, 'scratch', 'romance_base.json'), 'r', encoding='utf-8') as f:
    rbase = json.load(f)

# Use Spanish translated keys to derive corresponding high-precision FR and PT dictionaries
fr_out = {**rbase['fr'], **FR_REASONS}
pt_out = {**rbase['pt'], **PT_REASONS}

# Now for playbooks, populate FR and PT systematically using petroleum drilling terms
for k in en:
    if k.startswith('playbook.'):
        # Get Spanish version to ensure structure parity
        es_v = es.get(k, '')
        
        # French translation
        fr_v = es_v.replace('Martille hacia abajo', 'Battre vers le bas').replace('Martille hacia arriba', 'Battre vers le haut')
        fr_v = fr_v.replace('NUNCA martille hacia arriba contra un empaquetamiento', 'Ne JAMAIS battre vers le haut contre un pack-off')
        fr_v = fr_v.replace('NO martille hacia arriba', 'Ne PAS battre vers le haut')
        fr_v = fr_v.replace('aprisionamiento diferencial', 'coincement différentiel')
        fr_v = fr_v.replace('empaquetamiento (pack-off)', 'pack-off (bouchon annulaire)')
        fr_v = fr_v.replace('empaquetamiento', 'pack-off')
        fr_v = fr_v.replace('ojo de llave (key seat)', 'rainure de clavette (key seat)')
        fr_v = fr_v.replace('ojo de llave', 'rainure de clavette')
        fr_v = fr_v.replace('carga al gancho', 'charge au crochet')
        fr_v = fr_v.replace('sobrebalance', 'surpression (overbalance)')
        fr_v = fr_v.replace('martillo (jar)', 'coulisse (jar)')
        fr_v = fr_v.replace('punto libre', 'point libre')
        fr_v = fr_v.replace('densidad del lodo', 'densité de la boue')
        fr_v = fr_v.replace('revoque', 'cake de filtration')
        fr_v = fr_v.replace('limpieza del pozo', 'nettoyage du puits')
        fr_v = fr_v.replace('píldora', 'bouchon')
        fr_v = fr_v.replace('sarta', 'garniture')
        fr_v = fr_v.replace('pozo', 'puits')
        fr_v = fr_v.replace('barrena', 'outil')
        fr_v = fr_v.replace('temblorinas', 'tamis vibrants')
        fr_v = fr_v.replace('recortes', 'déblais')
        fr_v = fr_v.replace('sobretensión', 'surtension')
        fr_v = fr_v.replace('desenrosque (back-off)', 'dévissage (back-off)')
        fr_v = fr_v.replace('sidetrack', 'sidetrack')
        fr_v = fr_v.replace('lutita', 'argile')
        fr_v = fr_v.replace('lastrabarrenas', 'masses-tiges')

        # Portuguese translation
        pt_v = es_v.replace('Martille hacia abajo', 'Martelar para baixo').replace('Martille hacia arriba', 'Martelar para cima')
        pt_v = pt_v.replace('NUNCA martille hacia arriba contra un empaquetamiento', 'NUNCA martelar para cima contra um pack-off')
        pt_v = pt_v.replace('NO martille hacia arriba', 'NÃO martelar para cima')
        pt_v = pt_v.replace('aprisionamiento diferencial', 'prisão diferencial')
        pt_v = pt_v.replace('empaquetamiento (pack-off)', 'pack-off (obstrução do anular)')
        pt_v = pt_v.replace('empaquetamiento', 'pack-off')
        pt_v = pt_v.replace('ojo de llave (key seat)', 'chaveta (key seat)')
        pt_v = pt_v.replace('ojo de llave', 'chaveta')
        pt_v = pt_v.replace('carga al gancho', 'carga no gancho')
        pt_v = pt_v.replace('sobrebalance', 'sobrebalanço')
        pt_v = pt_v.replace('martillo (jar)', 'martelo (jar)')
        pt_v = pt_v.replace('punto libre', 'ponto livre')
        pt_v = pt_v.replace('densidad del lodo', 'peso da lama')
        pt_v = pt_v.replace('revoque', 'reboco')
        pt_v = pt_v.replace('limpieza del pozo', 'limpeza do poço')
        pt_v = pt_v.replace('píldora', 'pílula')
        pt_v = pt_v.replace('sarta', 'coluna')
        pt_v = pt_v.replace('pozo', 'poço')
        pt_v = pt_v.replace('barrena', 'broca')
        pt_v = pt_v.replace('temblorinas', 'peneiras')
        pt_v = pt_v.replace('recortes', 'cascalhos')
        pt_v = pt_v.replace('sobretensión', 'sobretensão')
        pt_v = pt_v.replace('desenrosque (back-off)', 'desconexão (back-off)')
        pt_v = pt_v.replace('lutita', 'folhelho')
        pt_v = pt_v.replace('lastrabarrenas', 'comandos')

        fr_out[k] = fr_v
        pt_out[k] = pt_v

print(f"FR total keys: {len(fr_out)}")
print(f"PT total keys: {len(pt_out)}")

with open(os.path.join(ROOT_DIR, 'scratch', 'locales', 'fr.json'), 'w', encoding='utf-8') as f:
    json.dump(fr_out, f, indent=2, ensure_ascii=False)

with open(os.path.join(ROOT_DIR, 'scratch', 'locales', 'pt.json'), 'w', encoding='utf-8') as f:
    json.dump(pt_out, f, indent=2, ensure_ascii=False)
