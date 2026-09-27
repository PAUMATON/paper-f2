# 🌳 Arrel

**Aprèn el que vulguis, node a node.** Escrius què vols aprendre, i la IA (Claude) et crea un arbre d'aprenentatge fet a mida. Cada node és una sessió d'estudi amb explicació, exemple, exercici i un mini test. Quan superes el test, s'obren els nodes següents.

Aquesta és la **v1 web**, en català, castellà i anglès. El bloquejador de distraccions per a Windows arribarà a la v2.

## Què fa ara mateix

- **Arbres generats per IA** sobre qualsevol tema i nivell: des de zero, amb nocions o avançat.
- **Lliçons sota demanda**: cada lliçó s'escriu la primera vegada que obres el node, així l'arbre surt de seguida i només pagues les lliçons que fas servir.
- **Desbloqueig per mèrit**: has d'encertar 2 de 3 preguntes, i les opcions es barregen perquè la resposta correcta no sigui sempre la mateixa.
- **Projecte final** amb una llista de requisits.
- **Mode focus** de 25 minuts, una barra de progrés i el teu «pas d'avui».
- **Arbre d'exemple** (Python des de zero), que funciona sense clau d'IA.
- El progrés es desa al navegador. De moment no hi ha comptes d'usuari.

## Com engegar-la a Windows

1. Instal·la **Node.js** (la versió LTS) des de [nodejs.org](https://nodejs.org).
2. Descarrega el projecte i obre una terminal a la seva carpeta:
   ```
   git clone https://github.com/PAUMATON/paper-f2.git
   cd paper-f2
   npm install
   ```
3. Crea el fitxer de configuració i posa-hi la teva clau d'Anthropic, que pots treure de [console.anthropic.com](https://console.anthropic.com/settings/keys):
   ```
   copy .env.example .env
   ```
   Obre `.env` amb el Bloc de notes i omple `ANTHROPIC_API_KEY=...`
4. Engega-la:
   ```
   npm run dev
   ```
5. Obre **http://localhost:5173** al navegador.

Sense clau també funciona, però només amb l'arbre d'exemple.

### Per publicar-la

```
npm run build
npm start
```

Amb això, el mateix servidor fa anar l'API i la web a **http://localhost:8787** (o al port que diguis a `PORT`).

## Configuració (`.env`)

| Variable | Per a què serveix | Per defecte |
|---|---|---|
| `ANTHROPIC_API_KEY` | La clau de l'API de Claude | (cal posar-la) |
| `ARREL_MODEL` | El model que escriu els arbres i les lliçons | `claude-opus-5` |
| `ARREL_EFFORT` | Com de fons pensa: `low`, `medium`, `high` | `medium` |
| `PORT` | El port del servidor | `8787` |

**Cost orientatiu:** cada arbre i cada lliçó és una crida a Claude. Si vols abaratir-ho, pots canviar `ARREL_MODEL` a `claude-sonnet-5`, que és més econòmic, i comparar la qualitat.

## Com està feta

```
server/   API (Hono + SDK d'Anthropic): /api/outline, /api/lesson, /api/health
shared/   Tipus, esquemes i lògica de l'arbre compartits entre servidor i web
src/      Web (React + Vite): pantalla d'inici, arbre, lliçons, tests
tests/    Proves automàtiques (Vitest)
```

- La IA respon amb **sortida estructurada** (JSON validat amb un esquema), i el servidor revisa i arregla l'arbre: ids en ordre d'estudi, dependències vàlides i sense cicles, preguntes amb una resposta correcta que existeix.
- La clau d'API només viu al servidor: la web no la veu mai.

Ordres útils:

```
npm test            # proves
npm run typecheck   # comprova els tipus
```

## Full de ruta

- [x] **v1 web**: arbres i lliçons amb IA, tests, 3 idiomes
- [ ] Comptes d'usuari i progrés al núvol
- [ ] **v2 app de Windows**: bloqueig de webs i apps lligat als nodes («YouTube bloquejat fins que superis Funcions»)
- [ ] **v3 B2B**: panell per a profes i acadèmies
- [ ] Pagaments i plans (Gratis / Pro / Equips)
