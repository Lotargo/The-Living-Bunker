from __future__ import annotations

from typing import Any

from bunker.mutations import process_mutations


def demo_decision(data: dict[str, Any]) -> dict[str, Any]:
    if data.get("type") == "anomaly":
        return _demo_anomaly_decision(data)
    return _demo_resident_decision(data)


def demo_architect_response(prompt: str) -> dict[str, Any]:
    text = prompt.lower()
    commands: list[dict[str, Any]] = []

    if any(word in text for word in ("ghost", "haunt", "scare", "страш", "призрак")):
        commands.append({"action": "SPAWN", "type": "Ghost", "location": "Kitchen"})
        commands.append({"action": "ATMOSPHERE", "type": "Cold Draft"})
    elif any(word in text for word in ("doppel", "cat", "luna", "кот", "луна")):
        commands.append({"action": "SPAWN", "type": "Doppelganger", "location": "LivingRoom"})
        commands.append({"action": "WHISPER", "target": "All", "content": "The cat is not alone."})
    elif any(word in text for word in ("build", "room", "library", "построй", "комнат")):
        commands.append({"action": "BUILD", "roomType": "Library", "near": "LivingRoom"})
    else:
        commands.append({"action": "ATMOSPHERE", "type": "Heavy Static"})
        commands.append({"action": "WHISPER", "target": "All", "content": "Something listens from the walls."})

    return {
        "response": "Demo Architect: the bunker accepts the suggestion and answers with a small omen.",
        "commands": process_mutations(commands),
    }


def _demo_resident_decision(data: dict[str, Any]) -> dict[str, Any]:
    name = data.get("name")
    anomalies = data.get("anomalies") or []
    needs = data.get("needs") or {}

    if name == "Luna":
        if anomalies:
            return {
                "thought": "MEEEOW!!",
                "real_intent": "I sense something forming nearby.",
                "action": "STARE",
                "target": "anomaly",
            }
        return {
            "thought": "Meow.",
            "real_intent": "Patrolling the bunker.",
            "action": "MOVE",
            "target": "random",
        }

    if needs.get("hunger", 0) > 70:
        return {"thought": "I need food before I can think straight.", "action": "EAT", "target": "Fridge"}

    if needs.get("energy", 100) < 30:
        return {"thought": "I can barely keep my eyes open...", "action": "SLEEP", "target": "Bed"}

    if needs.get("fun", 100) < 30:
        return {"thought": "I need to unwind a bit.", "action": "USE", "target": "Computer"}

    import random
    roll = random.random()

    if name == "Red":
        if anomalies:
            return {"thought": "Something's not right. I need to check the perimeter.", "action": "MOVE", "target": "random"}
        if roll < 0.4:
            return {"thought": "I should check the perimeter again.", "action": "MOVE", "target": "random"}
        return {"thought": "Radio's been quiet. Too quiet.", "action": "IDLE", "target": "self"}

    if name == "Blue":
        if anomalies:
            return {"thought": "Fascinating... the readings are off the charts.", "action": "MOVE", "target": "random"}
        if roll < 0.4:
            return {"thought": "I should run some more tests.", "action": "MOVE", "target": "random"}
        return {"thought": "The equipment is picking up odd noise.", "action": "IDLE", "target": "self"}

    if name == "Green":
        if anomalies:
            return {"thought": "Okay, that's definitely not normal. I'm going back to bed.", "action": "MOVE", "target": "random"}
        if roll < 0.3:
            return {"thought": "Everyone is being dramatic. I need to sit down.", "action": "MOVE", "target": "random"}
        return {"thought": "What a boring day...", "action": "IDLE", "target": "self"}

    if roll < 0.3:
        return {"thought": "Maybe I'll take a walk.", "action": "MOVE", "target": "random"}

    return {"thought": "The bunker hums quietly.", "action": "IDLE", "target": "self"}


def _demo_anomaly_decision(data: dict[str, Any]) -> dict[str, Any]:
    anomaly_type = data.get("anomalyType")

    if anomaly_type == "Doppelganger":
        if data.get("lunaDist", 999) < 5:
            return {"thought": "The original burns too brightly.", "action": "MIMIC", "target": "Luna", "reveal": True}
        return {"thought": "Meow?", "action": "MIMIC", "target": "nearest_resident", "reveal": False}

    if data.get("stage") == "GESTATING":
        return {"thought": "The air folds inward.", "action": "GESTATE", "target": "self"}

    if anomaly_type == "Glitch":
        return {"thought": "0101 / wrong room / wrong face", "action": "GLITCH", "target": "nearest_resident"}

    return {"thought": "A cold hand passes through the room.", "action": "HAUNT", "target": "nearest_resident"}
