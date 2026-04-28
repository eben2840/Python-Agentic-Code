def format_context(retrieved_data: dict, plan) -> dict:
    sections = {key: value for key, value in retrieved_data.items() if _keep_section(key, value)}
    sections['_retrieval'] = plan.to_dict()
    print(f"[CONTEXT-FORMATTER] Context keys: {list(sections.keys())}", flush=True)
    return sections


def _keep_section(key: str, value) -> bool:
    if key == 'patient':
        return True
    if key == 'patients':
        return isinstance(value, list)
    if not isinstance(value, dict):
        return False
    return bool(value.get('resources') or value.get('summary') or value.get('count'))
