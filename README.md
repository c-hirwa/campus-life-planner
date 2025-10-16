# Campus Life Planner

A minimal, responsive web app built with **vanilla HTML, CSS, and JavaScript**. It helps students plan and manage their campus life tasks and events with regex-powered search, smart validation, and local data persistence.

---

## 🌐 Demo
Open via GitHub Pages (replace with your repo URL once deployed):  
**https://github.com/c-hirwa/campus-life-planner/**

---

## 🧩 Features
- **Add, Edit, Delete Tasks** — Manage campus events, due dates, durations, and tags.
- **Regex Validation** — Input checks for clean and correct data entry.
- **Regex Search** — Live pattern-based search with highlighting.
- **Sorting** — Sort tasks by title, duration, or date.
- **Stats Dashboard** — Total records, total duration, top tag, and a 7-day trend.
- **LocalStorage Persistence** — All data saved automatically in your browser.
- **Import / Export JSON** — Backup or restore your planner data.
- **Accessibility (a11y)** — Keyboard navigation, aria-live regions, visible focus.
- **Mobile-First Design** — Works on phones, tablets, and desktops.
- **Dark Minimal UI** — Simple, modern, and distraction-free.

---

## 🧮 Data Model
```json
{
  "id": "task_0001",
  "title": "Group Meeting",
  "duration": 90,
  "tag": "Academics",
  "dueDate": "2025-09-25",
  "createdAt": "2025-09-20T12:00:00Z",
  "updatedAt": "2025-09-20T12:00:00Z"
}
```

---

## 🔎 Regex Catalog
| Field | Pattern | Description |
|-------|----------|--------------|
| Title | `^\S(?:.*\S)?$` | Forbids leading/trailing spaces |
| Duration | `^(0|[1-9]\d*)(\.\d{1,2})?$` | Allows integers or decimals (e.g., 1.5 hrs) |
| Date | `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$` | YYYY-MM-DD format |
| Tag | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Only letters, spaces, and hyphens |
| **Advanced** | `\b(\w+)\s+\1\b` | Detects duplicate consecutive words |

---

## ⚙️ Keyboard Map
| Action | Shortcut |
|--------|-----------|
| Add New Task | `Enter` in form |
| Edit Task | `Tab` to button → `Enter` |
| Delete Task | `Tab` to delete → `Enter` |
| Search | `/` or click search bar |
| Skip to Main | `Alt + S` |

---

## 🧠 Accessibility Notes
- Uses semantic HTML5 landmarks (`header`, `nav`, `main`, `section`, `footer`).
- Visible focus rings for all interactive elements.
- aria-live regions announce task updates and cap status.
- Fully operable with keyboard navigation.

---

## 📦 How to Run
1. Clone or download this repo.
2. Open `index.html` in your browser — no build or server needed.

---

## 🧪 Tests
A small `tests.html` file includes assertions for:
- Regex validation rules.
- Safe regex compilation.
- JSON validation before import.

---

## 📁 Files
```
index.html
README.md
seed.json
```

---

## 🪪 Author
**Chris Hirwa**  
📧 c.hirwa@alustudent.com  
💻 [GitHub](https://github.com/c-hirwa)

---

## 🧾 License
MIT License — free to use and modify for educational purposes.
