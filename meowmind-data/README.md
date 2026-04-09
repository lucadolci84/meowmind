# MeowMind Dataset v1

Questa cartella contiene la struttura iniziale del dataset per l'addestramento futuro del modello AI.

## Obiettivo
Raccogliere eventi audio e video contestualizzati, non file sparsi.

## Unita base
L'unita base del dataset e l'evento.

Ogni evento contiene:
- audio grezzo
- eventuale video
- segmento audio processato
- contesto
- label umane o di sistema
- outcome osservato

## Classi iniziali consigliate
- food_request
- attention_request
- greeting
- play_arousal
- stress_discomfort
- affiliative_soft_contact
- recall_or_follow_me
- purr
- unknown_or_mixed

## Regole pratiche
- usare WAV mono 16kHz o 22.05kHz
- dividere train/val/test per gatto, non per file
- salvare sempre contesto e outcome quando possibile
- non addestrare il modello su file lunghi grezzi senza segmentazione

## Pipeline futura
1. raccolta eventi
2. segmentazione
3. labeling
4. training offline
5. esportazione modello
6. inferenza nella web app