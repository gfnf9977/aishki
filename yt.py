import json
import os

# Папка, куди ти закинеш усі свої викачані JSON-файли
EXPORTS_DIR = "exports"

def extract_data_from_message(message):
    """Витягує повний текст та всі посилання з повідомлення."""
    full_text = ""
    links = []
    
    # Telegram зберігає структуру в text_entities
    entities = message.get("text_entities", [])
    
    for entity in entities:
        text_part = entity.get("text", "")
        full_text += text_part
        
        # Якщо це заховане посилання (text_link)
        if entity.get("type") == "text_link":
            links.append(entity.get("href"))
            
        # Якщо це пряме відкрите посилання (link)
        elif entity.get("type") == "link":
            links.append(text_part)
            
    return full_text.strip(), links

def process_files():
    all_candidates = []
    
    # Перебираємо всі файли у папці exports
    for filename in os.listdir(EXPORTS_DIR):
        if not filename.endswith(".json"):
            continue
            
        filepath = os.path.join(EXPORTS_DIR, filename)
        print(f"Обробка файлу: {filename}...")
        
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        messages = data.get("messages", [])
        
        for msg in messages:
            # Ігноруємо системні повідомлення, беремо лише звичайні пости
            if msg.get("type") != "message":
                continue
                
            text, links = extract_data_from_message(msg)
            
            # Якщо в пості є хоча б одне посилання і текст — це наш кандидат
            if text and links:
                all_candidates.append({
                    "channel": data.get("name", "Unknown Channel"),
                    "msg_id": msg.get("id"),
                    "text": text,
                    "links": links
                })
                
    return all_candidates

# Запуск
if __name__ == "__main__":
    # Створюємо папку, якщо її немає
    if not os.path.exists(EXPORTS_DIR):
        os.makedirs(EXPORTS_DIR)
        print(f"Створено папку '{EXPORTS_DIR}'. Поклади туди JSON-файли і запусти знову.")
    else:
        candidates = process_files()
        print(f"\nЗнайдено {len(candidates)} потенційних постів з посиланнями.")
        
        # Для тесту виведемо перші 3 знахідки
        for c in candidates[:3]:
            print("-" * 40)
            print(f"Канал: {c['channel']}")
            print(f"Ліфнки: {c['links']}")
            print(f"Текст (перші 100 символів): {c['text'][:100]}...")