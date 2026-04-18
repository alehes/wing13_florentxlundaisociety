def llm_extract(email_text: str):
    prompt = f"""
Extract structured JSON from this email:

{email_text}

Return format:
{{
  "patient": "",
  "address": "",
  "time_window_start": "",
  "time_window_end": ""
}}
"""