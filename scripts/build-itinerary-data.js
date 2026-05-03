const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dayDir = path.join(root, "data", "days");
const manifestPath = path.join(root, "data", "itinerary.json");
const hiddenProposalPath = path.join(root, "data", "hidden", "proposal-day-03.json");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`No se pudo leer JSON: ${path.relative(root, filePath)}\n${error.message}`);
  }
}

function loadDayFiles() {
  const files = fs.readdirSync(dayDir)
    .filter(file => /^day-\d{2}\.json$/.test(file))
    .sort();

  if (!files.length) {
    throw new Error("No hay archivos data/days/day-XX.json.");
  }

  return files;
}

function validateDay(file, day) {
  if (!day.title || !day.dateLabel || !Array.isArray(day.blocks)) {
    throw new Error(`${file} debe tener title, dateLabel y blocks.`);
  }
}

const dayFiles = loadDayFiles();
dayFiles.forEach(file => validateDay(file, readJson(path.join(dayDir, file))));

const proposalDay3 = readJson(hiddenProposalPath);
if (!proposalDay3.title || !Array.isArray(proposalDay3.blocks)) {
  throw new Error("data/hidden/proposal-day-03.json debe tener title y blocks.");
}

const manifest = {
  days: dayFiles.map(file => `data/days/${file}`),
  hidden: {
    proposalDay3: "data/hidden/proposal-day-03.json"
  }
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Manifiesto actualizado: ${dayFiles.length} dias publicos + dia oculto.`);
