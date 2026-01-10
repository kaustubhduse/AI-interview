import time

class CodeStore:
    def __init__(self):
        self.latest_code = "// No code written yet"
        self.last_update = time.time()

    def update(self, code: str):
        self.latest_code = code
        self.last_update = time.time()

    def get(self) -> str:
        return self.latest_code
