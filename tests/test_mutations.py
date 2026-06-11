import sys
sys.path.insert(0, '.')

from bunker.mutations import process_mutations


def test_ghost_plus_bad_atmosphere_becomes_poltergeist():
    commands = [
        {"action": "SPAWN", "type": "Ghost", "location": "Kitchen"},
        {"action": "ATMOSPHERE", "type": "Heavy Static"}
    ]
    result = process_mutations(commands)
    spawns = [c for c in result if c['action'] == 'SPAWN']
    assert len(spawns) == 1
    assert spawns[0]['type'] == 'Poltergeist'


def test_ghost_without_bad_atmosphere_stays_ghost():
    commands = [
        {"action": "SPAWN", "type": "Ghost", "location": "Kitchen"},
        {"action": "ATMOSPHERE", "type": "Normal"}
    ]
    result = process_mutations(commands)
    spawns = [c for c in result if c['action'] == 'SPAWN']
    assert spawns[0]['type'] == 'Ghost'


def test_cold_draft_plus_whisper_all_triggers_mass_hysteria():
    commands = [
        {"action": "ATMOSPHERE", "type": "Cold Draft"},
        {"action": "WHISPER", "target": "All", "content": "Run"}
    ]
    result = process_mutations(commands)
    events = [c for c in result if c['action'] == 'EVENT']
    assert len(events) == 1
    assert events[0]['type'] == 'MASS_HYSTERIA'


def test_no_mutation_with_single_command():
    commands = [
        {"action": "SPAWN", "type": "Glitch", "location": "Lab"}
    ]
    result = process_mutations(commands)
    assert len(result) == 1
    assert result[0]['type'] == 'Glitch'


def test_poltergeist_without_extra_event():
    commands = [
        {"action": "SPAWN", "type": "Ghost", "location": "Kitchen"},
        {"action": "ATMOSPHERE", "type": "Darkness"}
    ]
    result = process_mutations(commands)
    spawns = [c for c in result if c['action'] == 'SPAWN']
    events = [c for c in result if c['action'] == 'EVENT']
    assert spawns[0]['type'] == 'Poltergeist'
    assert len(events) == 0


def test_empty_commands():
    assert process_mutations([]) == []
