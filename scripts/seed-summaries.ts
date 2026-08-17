import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_SUMMARIES } from "../shared/app-summaries.ts";
import {
  commonSectionsFor,
  sectionsWithProfileLast,
} from "../shared/common-template.ts";
import { sortByNavOrder } from "../shared/nav-order.ts";
import { dbSchema, type Db } from "../shared/schema.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(root, "../data/db.json");

function sectionKey(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function seed(): void {
  const db: Db = dbSchema.parse(JSON.parse(readFileSync(dbPath, "utf8")));
  const createdAt = new Date().toISOString();
  let added = 0;

  for (const def of APP_SUMMARIES) {
    if (db.apps.some((app) => app.slug === def.slug || app.id === def.id)) {
      continue;
    }

    db.apps.push({
      id: def.id,
      name: def.name,
      slug: def.slug,
      folder: def.folder,
      figmaUrl: "",
      notes: def.notes ?? "",
      labels: [],
      createdAt,
    });

    const sections = sectionsWithProfileLast(
      commonSectionsFor(def.profileRoute),
      sortByNavOrder(def.id, def.specific),
    );

    sections.forEach((tpl, order) => {
      const sectionId = `${def.id}-${sectionKey(tpl.title)}`;
      db.sections.push({
        id: sectionId,
        appId: def.id,
        title: tpl.title,
        route: tpl.route,
        kind: tpl.kind,
        order,
      });
      for (const story of tpl.stories) {
        db.stories.push({
          id: `${sectionId}-${story.code}`,
          sectionId,
          code: story.code,
          text: story.text,
          status: "pending",
          notes: "",
        });
      }
    });
    added += 1;
  }

  writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  console.log(`Sumários: ${added} app(s) novo(s). Total: ${db.apps.length}.`);
}

seed();
