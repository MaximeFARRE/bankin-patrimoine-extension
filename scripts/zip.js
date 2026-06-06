import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const output = `patrimoine-bankin-exporter-${packageJson.version}.zip`;

if (!existsSync("dist")) {
  throw new Error("Le dossier dist/ est introuvable. Lance npm run build avant npm run zip.");
}

const zip = spawn("zip", ["-r", `../${output}`, "."], {
  cwd: "dist",
  stdio: "inherit"
});

zip.on("exit", (code) => {
  if (code !== 0) {
    throw new Error(`zip a echoue avec le code ${code}`);
  }
});
