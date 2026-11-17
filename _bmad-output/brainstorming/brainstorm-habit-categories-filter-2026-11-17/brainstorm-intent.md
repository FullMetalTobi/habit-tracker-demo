# Brainstorm-Intent: Kategorien für Habits mit Filter (Issue #1)

Quelle: `.memlog.md` im selben Ordner. Zweck: Input für `bmad-spec` / `bmad-build`.

## Empfohlene Richtung
Pro Habit **keine oder genau eine Kategorie**, referenziert per **ID** auf eine **in den Settings pflegbare Liste**. Der Filter lebt in der **URL** (`?category=<id>`).

## Die 5 wichtigsten Entscheidungen und Risiken

1. **Schema-Änderung ist nie still.**
   - `schemaVersion` 2 → 3, neues ADR, Eintrag in der Migrations-Registry (ADR-0006, ADR-0022).
   - Migration ergänzt nur und löscht nichts. Habits ohne Kategorie bleiben unverändert.
   - Alte Backups (v1/v2) müssen importierbar bleiben. Test mit einem Fixture eines alten Backups.
   - Offen fürs ADR: Kategorienliste als `categories` am `AppData` mit IDs, oder nur ein `category`-Feld am Habit.
   - Empfehlung: IDs. Das kostet mehr Migration, vermeidet aber die Fehler 3 und 5 unten.
   - Verworfen: nur UI-State (überlebt kein Backup).

2. **Kategorie-Modell.**
   - Verworfen: Freitext ohne Vorschläge (Tippfehler ergeben zwei Kategorien).
   - Offen: feste Liste im Code (einfach, aber UI-Texte müssen lokalisiert werden, sonst steht "health" im UI) gegen pflegbare Liste in den Settings (flexibel, braucht Pflege-UI und Löschregel).
   - Emoji oder Farbe als Kategorie sind eher Zusatz als Ersatz. Erst später.
   - Mehrfach-Tags und Hauptkategorie plus Tags sind Won't-this-time.

3. **URL ist die Wahrheit für den Filter, aber nicht vertrauenswürdig.**
   - `?category=` wird gegen die bekannte Liste validiert, nie ungeprüft in den Store geschrieben oder als HTML gerendert (XSS-Test mit `<script>`).
   - Unbekannte ID: Filter ignorieren und einen Hinweis zeigen, nicht abstürzen.
   - Der Filter gilt auf Today und in der Habit-Liste konsistent und überlebt Neuladen und Teilen des Links.
   - Ein localStorage-"letzter Filter" ist optional. Wenn vorhanden, gewinnt die URL.
   - Mehrfachauswahl (`a,b`) ist Won't-this-time.

4. **Ehrlicher Leerzustand.**
   - Bei aktivem Filter ohne fällige oder offene Habits: "Keine Habits in Kategorie X fällig" plus Button "Filter zurücksetzen".
   - Nie "Alles erledigt", solange in anderen Kategorien noch etwas offen ist. Ein Zähler "3 offen in anderen Kategorien" ist Should.
   - Zu trennen sind drei Zustände: Kategorie leer, nichts fällig, alles erledigt.

5. **Konsistenz bei Umbenennen, Löschen und mehreren Tabs.**
   - Kategorie umbenennen: Habits folgen automatisch (durch ID-Referenz).
   - Kategorie löschen: Habits werden kategorielos, nicht gelöscht. Ein aktiver Filter auf diese ID fällt wie bei einer unbekannten ID zurück.
   - Zwei Tabs: Das Feld `category` muss beim Cross-Tab-Merge nicht überschrieben werden (ADR-0024). Der Filter selbst ist pro Tab/URL und wird nicht gespeichert.

## Test-Hinweise (aus den schlimmsten Ideen)
- Unit: Migration v2→v3 behält alle Habits; Import eines alten Backups; unbekannte und bösartige Filterwerte; Umbenennen und Löschen.
- E2E: Kategorie zuweisen, Neuladen, Filter-URL direkt öffnen, Leerzustand mit offenen Habits in anderen Kategorien, Link teilen (neuer Kontext). Port 3110 nutzen.

## Won't-this-time
Mehrfach-Tags, Hauptkategorie plus Tags, Mehrfachfilter, Emoji/Farbe als Ersatz für den Namen.
