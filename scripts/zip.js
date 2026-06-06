import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const output = "patrimoine-bankin-exporter.zip";

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
