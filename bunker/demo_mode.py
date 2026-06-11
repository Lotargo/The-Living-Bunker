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

    if name == "Red":
        return {"thought": "I should check the perimeter again.", "action": "INSPECT", "target": "Radio"}
    if name == "Blue":
        return {"thought": "The equipment is picking up odd noise.", "action": "USE", "target": "Computer"}
    if name == "Green":
        return {"thought": "Everyone is being dramatic. I need to sit down.", "action": "SIT", "target": "Sofa"}

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
