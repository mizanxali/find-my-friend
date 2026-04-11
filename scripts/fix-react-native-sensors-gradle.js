const fs = require("node:fs");
const path = require("node:path");

const gradleFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-sensors",
  "android",
  "build.gradle",
);

if (!fs.existsSync(gradleFile)) {
  process.exit(0);
}

const original = fs.readFileSync(gradleFile, "utf8");
let updated = original.replace(/^\s*jcenter\(\)\s*[\r\n]*/gm, "");

if (!updated.includes("buildscript {\n    repositories {\n        mavenCentral()")) {
  updated = updated.replace(
    "buildscript {\n    repositories {\n",
    "buildscript {\n    repositories {\n        mavenCentral()\n",
  );
}

if (updated !== original) {
  fs.writeFileSync(gradleFile, updated);
  process.stdout.write(
    "Patched react-native-sensors Android Gradle config for modern repositories.\n",
  );
}
