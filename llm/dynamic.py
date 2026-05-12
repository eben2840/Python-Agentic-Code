from typing import Dict, List, Optional
from anthropic import Anthropic
from openai import OpenAI
import google.generativeai as genai


Message = Dict[str, str]


class BaseLLM:
    def __init__(self, provider: str, api_key: Optional[str], model: str):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self.client = self._create_client()

    def _create_client(self):
        if self.provider == "anthropic":
            return Anthropic(api_key=self.api_key)
        elif self.provider == "openai":
            return OpenAI(api_key=self.api_key)
        elif self.provider == "gemini":
            genai.configure(api_key=self.api_key)
            return genai
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    def complete(
        self,
        *,
        messages: List[Message],
        system: Optional[str],
        model: Optional[str],
        max_tokens: int,
        temperature: Optional[float],
    ) -> str:
        raise NotImplementedError
