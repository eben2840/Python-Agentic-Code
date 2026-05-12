import os

from flask import current_app

from .dynamic import BaseLLM


PROVIDER_MODELS = {
    'anthropic': 'claude-sonnet-4',
    'openai': 'gpt-4.1',
    'gemini': 'gemini-pro',
}

PROVIDER_KEYS = {
    'anthropic': 'ANTHROPIC_API_KEY',
    'openai': 'OPENAI_API_KEY',
    'gemini': 'GEMINI_API_KEY',
}




def provider_from_settings():
    return current_app.config.get('LLM_PROVIDER', 'anthropic')


def model_from_settings():
    provider = provider_from_settings()
    return current_app.config.get('LLM_MODEL', PROVIDER_MODELS[provider])


def api_key(provider):
    return os.getenv(PROVIDER_KEYS[provider])


def get_selected_llm():
    provider = provider_from_settings()
    model = model_from_settings()
    key = api_key(provider)
    return BaseLLM(provider=provider, api_key=key, model=model)
