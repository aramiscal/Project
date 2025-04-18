from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class MyConfig(BaseSettings):
    connection_string: str
    secret_key: str

    model_config = SettingsConfigDict(env_file="./venv/.env")

@lru_cache
def get_setting():
    return MyConfig()
