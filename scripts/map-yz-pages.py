# -*- coding: utf-8 -*-
"""Apply French-manual PDF page numbers to yz-125-2007.json (1-based file pages)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "src" / "data" / "bikes" / "yz-125-2007.json"

# Réd. Yamaha YZ125 2007 : pages fichier PDF où la section FR commence (pied de page 3-x, 4-x, 5-x…).
PAGES = {
    "yz-ob-01": 249,  # piston — même chapitre que culasse/cylindre
    "yz-ob-02": 249,
    "yz-ob-03": 249,
    "yz-ob-04": 249,
    "yz-ob-05": 337,  # axe piston / bielle — carter & vilebrequin
    "yz-ob-06": 337,
    "yz-ob-07": 249,
    "yz-ob-08": 249,
    "yz-ob-09": 249,
    "yz-ob-10": 249,
    "yz-ob-11": 305,  # régulateur YPVS
    "yz-ob-12": 151,  # réglage embrayage (ch.3)
    "yz-ob-13": 275,  # remplacement — ch.4
    "yz-ob-14": 159,  # vidange huile boîte
    "yz-ob-15": 157,  # niveau huile boîte
    "yz-ob-16": 353,  # roulement / barillet / fourchette
    "yz-ob-17": 353,
    "yz-ob-18": 319,  # écrou rotor — magneto CDI
    "yz-ob-19": 221,
    "yz-ob-20": 221,
    "yz-ob-21": 221,
    "yz-ob-22": 337,
    "yz-ob-23": 229,
    "yz-ob-24": 210,  # 3-39 bougie — début section (211 = suite DE sans entête FR)
    "yz-ob-25": 210,
    "yz-ob-26": 183,  # chaîne : flèche / graissage (ch.3)
    "yz-ob-27": 181,
    "yz-ob-28": 143,
    "yz-ob-29": 147,
    "yz-ob-30": 145,
    "yz-ob-31": 151,  # tuyaux radiateur — même page 3-9 que l’embrayage (points 4 FR)
    "yz-ob-32": 61,  # couples de serrage (fr.)
    "yz-ob-33": 155,
    "yz-ob-34": 155,
    "yz-ob-35": 139,
    "yz-ob-36": 139,
    "yz-ob-37": 169,
    "yz-ob-38": 171,
    "yz-ob-39": 173,
    "yz-ob-40": 179,
    "yz-ob-41": 173,
    "yz-ob-42": 173,
    "yz-ob-43": 391,  # changement liquide de frein — ch.5 freins (vidange / points de dépose)
    "yz-ob-44": 185,
    "yz-ob-45": 421,
    "yz-ob-46": 423,
    "yz-ob-47": 186,
    "yz-ob-48": 181,  # guide / chaîne — vérification chaîne & pignons FR (3-24)
    "yz-ob-49": 191,
    "yz-ob-50": 209,
    "yz-ob-51": 489,
    "yz-ob-52": 191,
    "yz-ob-53": 181,
    "yz-ob-54": 473,
    "yz-ob-55": 473,
    "yz-ob-56": 203,
    "yz-ob-57": 205,
    "yz-ob-58": 463,
    "yz-ob-59": 201,
    "yz-ob-60": 201,
    "yz-ob-61": 365,
    "yz-ob-62": 365,
    "yz-ob-63": 365,
    "yz-ob-64": 153,
    "yz-ob-65": 153,
}

def main() -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    for t in data["tasks"]:
        tid = t["id"]
        if tid in PAGES:
            t["page"] = PAGES[tid]
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Updated", len(PAGES), "task pages ->", path)


if __name__ == "__main__":
    main()
