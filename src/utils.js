export function dedent(str) {
  const lines = str.split("\n");

  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

  const indentLengths = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^ */)[0].length);
  const minIndent = Math.min(...indentLengths);

  return lines.map((line) => line.slice(minIndent)).join("\n");
}

export function getFilenameFromPath(path) {
  return path.split("/").pop().split("?")[0] || "Unknown";
}

export function sanitizeShaderSource(src) {
  return src.replace(/^\uFEFF/, "").trim();
}
