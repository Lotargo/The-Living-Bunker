def process_mutations(commands):
    mutated_commands = []

    has_ghost = any(c.get('action') == 'SPAWN' and c.get('type') == 'Ghost' for c in commands)
    has_bad_atmosphere = any(c.get('action') == 'ATMOSPHERE' and c.get('type') in ['Heavy Static', 'Darkness', 'Red Mist'] for c in commands)

    has_cold_draft = any(c.get('action') == 'ATMOSPHERE' and c.get('type') == 'Cold Draft' for c in commands)
    has_whisper_all = any(c.get('action') == 'WHISPER' and c.get('target') == 'All' for c in commands)

    if has_cold_draft and has_whisper_all:
         print("MUTATION TRIGGERED: Cold Draft + Whisper(All) -> Mass Hysteria")
         mutated_commands.append({
             "action": "EVENT",
             "type": "MASS_HYSTERIA",
             "location": "LivingRoom"
         })

    for cmd in commands:
        new_cmd = cmd.copy()

        if cmd.get('action') == 'SPAWN' and cmd.get('type') == 'Ghost':
            if has_bad_atmosphere:
                new_cmd['type'] = 'Poltergeist'
                print("MUTATION TRIGGERED: Ghost + Atmosphere -> Poltergeist")

        mutated_commands.append(new_cmd)

    return mutated_commands
