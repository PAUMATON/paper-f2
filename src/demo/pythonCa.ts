import type { Lesson, Outline } from "../../shared/types";
import type { StoredTree } from "../storage";

// The hand-written tree from the first prototype. It works without the AI,
// so anyone can try the app before configuring a key.

export const DEMO_ID = "demo-python-ca";

const outline: Outline = {
  title: "Python des de zero",
  summary: "Escriure programes petits però complets en Python: dades, decisions, bucles, funcions i fitxers.",
  nodes: [
    { id: "n1", title: "Què és Python i com l'executes", goal: "Instal·lar Python i executar la teva primera instrucció.", minutes: 15, deps: [], project: false },
    { id: "n2", title: "Variables i tipus de dades", goal: "Guardar dades amb nom i saber de quin tipus són.", minutes: 20, deps: ["n1"], project: false },
    { id: "n3", title: "Operacions, input i f-strings", goal: "Fer càlculs i demanar dades a l'usuari.", minutes: 25, deps: ["n2"], project: false },
    { id: "n4", title: "Condicionals: if, elif, else", goal: "Fer que el programa prengui decisions.", minutes: 25, deps: ["n3"], project: false },
    { id: "n5", title: "Bucles: for i while", goal: "Repetir accions sense copiar codi.", minutes: 30, deps: ["n4"], project: false },
    { id: "n6", title: "Llistes", goal: "Guardar molts valors en una sola variable.", minutes: 25, deps: ["n5"], project: false },
    { id: "n7", title: "Diccionaris", goal: "Guardar dades per nom (clau) en lloc de per posició.", minutes: 25, deps: ["n6"], project: false },
    { id: "n8", title: "Funcions", goal: "Agrupar codi amb un nom per reutilitzar-lo.", minutes: 30, deps: ["n5"], project: false },
    { id: "n10", title: "Projecte: endevina el número", goal: "Fer un joc complet amb el que has après.", minutes: 45, deps: ["n8"], project: true },
    { id: "n9", title: "Fitxers i errors", goal: "Llegir i escriure fitxers sense que el programa peti.", minutes: 30, deps: ["n7", "n8"], project: false },
  ],
};

const tutorial = (page: string, label: string) => ({
  label,
  url: `https://docs.python.org/es/3/${page}`,
});

const lessons: Record<string, Lesson> = {
  n1: {
    explanation: [
      "Python llegeix les instruccions d'una en una, de dalt a baix. Les pots escriure en un fitxer .py o provar-les directament a l'intèrpret interactiu, que et mostra el símbol >>> quan espera una ordre.",
      "print() és la primera funció que faràs servir: mostra per pantalla allò que li passes entre parèntesis.",
    ],
    example: { kind: "code", language: "python", content: `>>> print("Hola, món")\nHola, món\n>>> print(2 + 3)\n5` },
    practice: "Instal·la Python, obre el terminal, escriu python i fes que mostri el teu nom amb print().",
    searchTerms: [],
    links: [
      { label: "Descarrega Python (python.org)", url: "https://www.python.org/downloads/" },
      tutorial("tutorial/interpreter.html", "Tutorial oficial en castellà: l'intèrpret"),
    ],
    quiz: [
      { question: 'Què fa print("Hola")?', options: ["Mostra Hola a la pantalla", "Desa Hola en un fitxer", "L'envia a la impressora", "Crea una variable que es diu Hola"], answer: 0, why: "print() només mostra el text per pantalla." },
      { question: "Quina extensió tenen els fitxers de Python?", options: [".py", ".pt", ".python", ".txt"], answer: 0, why: "Els programes de Python es desen amb l'extensió .py." },
      { question: "Què vol dir el símbol >>>?", options: ["Que l'intèrpret espera una instrucció", "Que hi ha un error", "Que és un comentari", "Que és una comparació"], answer: 0, why: ">>> és el prompt de l'intèrpret interactiu: t'està esperant." },
    ],
    checklist: [],
  },
  n2: {
    explanation: [
      "Una variable és un nom que apunta a un valor. Amb = li assignes un valor, i el pots canviar quan vulguis.",
      "Els tipus bàsics són int (enters), float (decimals), str (text, sempre entre cometes) i bool (True o False). type() et diu el tipus de qualsevol valor.",
    ],
    example: { kind: "code", language: "python", content: `nom = "Laia"\nedat = 19\naltura = 1.68\nestudia = True\n\nprint(type(edat))    # <class 'int'>\nprint(type(altura))  # <class 'float'>` },
    practice: "Crea variables amb el teu nom, la teva edat i si t'agrada programar (True o False), i mostra-les amb print().",
    searchTerms: [],
    links: [tutorial("tutorial/introduction.html", "Tutorial oficial en castellà: introducció informal")],
    quiz: [
      { question: "De quin tipus és 3.5?", options: ["float", "int", "str", "bool"], answer: 0, why: "Els números amb decimals són float." },
      { question: "Quant val x després de x = 5 i x = x + 2?", options: ["7", "5", "2", "Dona error"], answer: 0, why: "Primer x val 5; després li assignes 5 + 2." },
      { question: "Quin d'aquests valors és un text (str)?", options: ['"42"', "42", "4.2", "True"], answer: 0, why: "Qualsevol cosa entre cometes és un str, encara que siguin xifres." },
    ],
    checklist: [],
  },
  n3: {
    explanation: [
      "input() sempre retorna un text. Si vols fer-hi càlculs, l'has de convertir amb int() o float().",
      "Les f-strings (una f davant de les cometes) et deixen posar variables dins d'un text amb {claus}. Operadors útils: // és la divisió entera i % el residu.",
    ],
    example: { kind: "code", language: "python", content: `nom = input("Com et dius? ")\nany_naixement = int(input("Any de naixement? "))\n\nprint(f"Hola {nom}, enguany fas {2026 - any_naixement} anys")\nprint(7 // 2, 7 % 2)   # 3 1` },
    practice: "Fes un programa que demani dos números i mostri la suma, la resta i la mitjana en una sola f-string.",
    searchTerms: [],
    links: [tutorial("tutorial/inputoutput.html", "Tutorial oficial en castellà: entrada i sortida")],
    quiz: [
      { question: "Quin tipus retorna input()?", options: ["str", "int", "float", "Depèn del que escriguis"], answer: 0, why: "input() sempre retorna text, encara que l'usuari escrigui un número." },
      { question: "Quant val 7 // 2?", options: ["3", "3.5", "1", "4"], answer: 0, why: "// fa la divisió i descarta els decimals." },
      { question: "Quant val 7 % 2?", options: ["1", "3", "3.5", "0"], answer: 0, why: "% retorna el residu: 7 entre 2 és 3 i en sobra 1." },
    ],
    checklist: [],
  },
  n4: {
    explanation: [
      "if executa un bloc només si la condició és certa. elif prova una altra condició i else recull tota la resta.",
      "El sagnat (4 espais) no és decoració: indica quines línies pertanyen a cada bloc.",
    ],
    example: { kind: "code", language: "python", content: `nota = 6.5\n\nif nota >= 9:\n    print("Excel·lent")\nelif nota >= 5:\n    print("Aprovat")\nelse:\n    print("Suspès")` },
    practice: "Demana una temperatura i digues si fa fred (menys de 12), si s'hi està bé (de 12 a 25) o si fa calor.",
    searchTerms: [],
    links: [tutorial("tutorial/controlflow.html", "Tutorial oficial en castellà: control de flux")],
    quiz: [
      { question: "Què mostra el codi d'exemple amb nota = 6.5?", options: ["Aprovat", "Excel·lent", "Suspès", "No mostra res"], answer: 0, why: "6.5 no arriba a 9, però és més gran o igual que 5." },
      { question: "Per a què serveix el sagnat de 4 espais?", options: ["Marca quin codi pertany a cada bloc", "Només és estètic", "Fa que el codi vagi més ràpid", "Indica un comentari"], answer: 0, why: "A Python, el sagnat defineix els blocs. Si t'equivoques, dona error o fa una altra cosa." },
      { question: 'Quin operador vol dir "diferent de"?', options: ["!=", "<>", "=!", "~="], answer: 0, why: "!= compara si dos valors són diferents." },
    ],
    checklist: [],
  },
  n5: {
    explanation: [
      "for recorre una seqüència element a element; range(n) genera els números de 0 a n-1.",
      "while repeteix mentre una condició sigui certa. Assegura't que en algun moment deixi de ser-ho, o tindràs un bucle infinit. break en surt de cop.",
    ],
    example: { kind: "code", language: "python", content: `for i in range(3):\n    print(i)        # 0, 1, 2\n\ncompte = 3\nwhile compte > 0:\n    print(compte)   # 3, 2, 1\n    compte -= 1` },
    practice: "Mostra la taula de multiplicar del 7 (de 7 × 1 a 7 × 10) amb un bucle for.",
    searchTerms: [],
    links: [tutorial("tutorial/controlflow.html", "Tutorial oficial en castellà: for i range()")],
    quiz: [
      { question: "Quins números genera range(3)?", options: ["0, 1, 2", "1, 2, 3", "0, 1, 2, 3", "Només el 3"], answer: 0, why: "range(3) comença a 0 i s'atura abans del 3." },
      { question: "Què passa si la condició d'un while no deixa mai de ser certa?", options: ["Tens un bucle infinit", "Python l'atura després de 10 voltes", "Error de sintaxi", "S'executa un sol cop"], answer: 0, why: "El bucle no s'acaba mai. L'hauràs d'aturar amb Ctrl+C." },
      { question: "Què fa break dins d'un bucle?", options: ["Surt del bucle", "Salta a la volta següent", "Atura tot el programa", "Torna a començar el bucle"], answer: 0, why: "break surt del bucle. Saltar a la volta següent és continue." },
    ],
    checklist: [],
  },
  n6: {
    explanation: [
      "Una llista guarda valors en ordre entre claudàtors. El primer element té l'índex 0, i els índexs negatius compten des del final.",
      "append() afegeix un element al final i len() et diu quants n'hi ha. Les llistes es combinen molt bé amb for.",
    ],
    example: { kind: "code", language: "python", content: `fruites = ["poma", "pera", "plàtan"]\nfruites.append("kiwi")\n\nprint(fruites[0])    # poma\nprint(fruites[-1])   # kiwi\nprint(len(fruites))  # 4\n\nfor f in fruites:\n    print(f)` },
    practice: "Demana 5 notes, desa-les en una llista i mostra la més alta, la més baixa i la mitjana.",
    searchTerms: [],
    links: [tutorial("tutorial/datastructures.html", "Tutorial oficial en castellà: estructures de dades")],
    quiz: [
      { question: "Quin índex té el primer element d'una llista?", options: ["0", "1", "-1", "Depèn de la llista"], answer: 0, why: "A Python els índexs comencen a 0." },
      { question: "Què fa append()?", options: ["Afegeix un element al final", "Ordena la llista", "Esborra l'últim element", "Afegeix un element al principi"], answer: 0, why: "append() sempre afegeix al final." },
      { question: "Si l = [10, 20, 30], quant val l[-1]?", options: ["30", "10", "Dona error", "-1"], answer: 0, why: "-1 és l'últim element." },
    ],
    checklist: [],
  },
  n7: {
    explanation: [
      "Un diccionari relaciona claus amb valors. Hi accedeixes amb la clau entre claudàtors, i hi afegeixes dades assignant una clau nova.",
      "Si demanes una clau que no existeix, obtens un KeyError. get() és una alternativa que no falla.",
    ],
    example: { kind: "code", language: "python", content: `alumne = {"nom": "Pau", "nota": 8}\nalumne["curs"] = "1r"\n\nprint(alumne["nom"])          # Pau\nprint(alumne.get("edat", 0))  # 0\n\nfor clau, valor in alumne.items():\n    print(clau, valor)` },
    practice: 'Fes una agenda: un diccionari amb 3 noms i telèfons. Demana un nom i mostra el seu telèfon, o "no el tinc" si no hi és.',
    searchTerms: [],
    links: [tutorial("tutorial/datastructures.html", "Tutorial oficial en castellà: diccionaris")],
    quiz: [
      { question: "Com accedeixes a la nota de l'alumne?", options: ['alumne["nota"]', "alumne.nota", "alumne[1]", "alumne(nota)"], answer: 0, why: "Als diccionaris s'hi accedeix amb la clau entre claudàtors." },
      { question: "Què passa si demanes amb [] una clau que no existeix?", options: ["KeyError", "Retorna None", "Retorna 0", "Crea la clau buida"], answer: 0, why: "[] dona KeyError. Si no vols l'error, fes servir get()." },
      { question: "Quan és millor un diccionari que una llista?", options: ["Quan busques valors per nom", "Quan només importa l'ordre", "Mai", "Quan només tens números"], answer: 0, why: "Els diccionaris són ideals per trobar dades a partir d'una clau." },
    ],
    checklist: [],
  },
  n8: {
    explanation: [
      "Amb def crees una funció. Rep dades (paràmetres) i pot retornar un resultat amb return.",
      "return torna el valor a qui ha cridat la funció; print() només el mostra. No són el mateix.",
    ],
    example: { kind: "code", language: "python", content: `def mitjana(notes):\n    return sum(notes) / len(notes)\n\nresultat = mitjana([6, 8, 7])\nprint(resultat)   # 7.0` },
    practice: "Escriu una funció es_parell(n) que retorni True o False, i fes-la servir amb els números de l'1 al 10.",
    searchTerms: [],
    links: [tutorial("tutorial/controlflow.html", "Tutorial oficial en castellà: definir funcions")],
    quiz: [
      { question: "Quina paraula defineix una funció?", options: ["def", "function", "func", "define"], answer: 0, why: "A Python les funcions es creen amb def." },
      { question: "Què fa return?", options: ["Retorna un valor a qui crida la funció", "Mostra un valor per pantalla", "Atura Python", "Repeteix la funció"], answer: 0, why: "return torna el valor; mostrar-lo és feina de print()." },
      { question: "Què mostra print(mitjana([4, 6]))?", options: ["5.0", "5", "10", "Dona error"], answer: 0, why: "La divisió amb / sempre retorna un float: 10 / 2 = 5.0." },
    ],
    checklist: [],
  },
  n10: {
    explanation: [
      "El programa pensa un número de l'1 al 100 i l'usuari l'ha d'endevinar. A cada intent, li dius si ha de pujar o baixar.",
      "Fes servir bucles, condicionals i almenys una funció pròpia. Quan compleixis tots els requisits, marca'ls i supera el node.",
    ],
    example: { kind: "code", language: "python", content: `import random\n\nsecret = random.randint(1, 100)\nintents = 0\n\n# El teu codi aquí: demana números fins que l'encerti` },
    practice: "Afegeix-hi un límit de 7 intents i un missatge diferent si guanya o si perd.",
    searchTerms: [],
    links: [tutorial("library/random.html", "Documentació oficial en castellà: el mòdul random")],
    quiz: [],
    checklist: [
      "El programa tria un número aleatori entre 1 i 100",
      'A cada intent diu "més amunt" o "més avall"',
      "Compta els intents i els mostra en acabar",
      "Fa servir almenys una funció pròpia (def)",
    ],
  },
  n9: {
    explanation: [
      'with open(...) obre un fitxer i el tanca sol quan acabes. El mode "r" és per llegir, "w" per escriure de zero i "a" per afegir al final.',
      "try i except et deixen gestionar errors, com un fitxer que no existeix, en lloc que el programa s'aturi.",
    ],
    example: { kind: "code", language: "python", content: `try:\n    with open("notes.txt", encoding="utf-8") as f:\n        for linia in f:\n            print(linia.strip())\nexcept FileNotFoundError:\n    print("No trobo el fitxer notes.txt")` },
    practice: "Guarda l'agenda del node de diccionaris en un fitxer i torna-la a carregar quan el programa arrenqui.",
    searchTerms: [],
    links: [
      tutorial("tutorial/inputoutput.html", "Tutorial oficial en castellà: llegir i escriure fitxers"),
      tutorial("tutorial/errors.html", "Tutorial oficial en castellà: errors i excepcions"),
    ],
    quiz: [
      { question: "Per què fem servir with open(...)?", options: ["Tanca el fitxer automàticament", "Obre el fitxer més de pressa", "Només serveix per a fitxers grans", "És obligatori per escriure"], answer: 0, why: "with s'encarrega de tancar el fitxer encara que hi hagi un error." },
      { question: "Quin mode obre un fitxer per escriure'l de zero?", options: ['"w"', '"r"', '"a"', '"rb"'], answer: 0, why: '"w" esborra el contingut anterior i escriu de nou; "a" afegeix al final.' },
      { question: "Què fa el bloc except?", options: ["Gestiona l'error si passa", "Evita que hi hagi errors", "Esborra l'error del codi", "S'executa sempre"], answer: 0, why: "except només s'executa si el bloc try dona aquell error." },
    ],
    checklist: [],
  },
};

export function createDemoTree(): StoredTree {
  return {
    id: DEMO_ID,
    topic: "Python",
    lang: "ca",
    level: "beginner",
    createdAt: Date.now(),
    outline,
    lessons,
    done: [],
    selected: "n1",
    demo: true,
  };
}
