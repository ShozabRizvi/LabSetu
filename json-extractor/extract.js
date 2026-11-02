const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(__dirname, "extract.json");

const IGNORE = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "coverage",
    "json-extractor"
];

const EXTENSIONS = [
    ".js", ".jsx", ".ts", ".tsx",
    ".html", ".css", ".scss",
    ".py", ".sql", ".json",
    ".md", ".txt", ".prisma"
];

const files = [];

function scan(folder) {
    const items = fs.readdirSync(folder, {
        withFileTypes: true
    });

    for (const item of items) {
        const fullPath = path.join(folder, item.name);

        if (item.isDirectory()) {
            if (IGNORE.includes(item.name)) continue;
            scan(fullPath);
            continue;
        }

        if (!item.isFile()) continue;

        // Avoid environment files and common secrets
        if (
            item.name === ".env" ||
            item.name.startsWith(".env.") ||
            /\.(pem|key)$/i.test(item.name)
        ) continue;

        const ext = path.extname(item.name).toLowerCase();

        if (!EXTENSIONS.includes(ext)) continue;

        try {
            const stat = fs.statSync(fullPath);

            // Skip files larger than 1 MB
            if (stat.size > 1024 * 1024) continue;

            const content = fs.readFileSync(fullPath, "utf8");

            const relativePath = path
                .relative(ROOT, fullPath)
                .replace(/\\/g, "/");

            let category = "other";

            if (/frontend|client|src\/components/i.test(relativePath)) {
                category = "frontend";
            }

            if (/backend|server|api|controller|routes|models/i.test(relativePath)) {
                category = "backend";
            }

            files.push({
                id: files.length + 1,
                file_name: item.name,
                file_path: relativePath,
                file_type: ext,
                category: category,
                content: content
            });

            console.log("Extracted:", relativePath);

        } catch (error) {
            console.log("Skipped:", fullPath);
        }
    }
}

console.log("Starting extraction...");

scan(ROOT);

const result = {
    project: "LabSetu",
    generated_at: new Date().toISOString(),
    total_files: files.length,
    files: files
};

fs.writeFileSync(
    OUTPUT,
    JSON.stringify(result, null, 2),
    "utf8"
);

console.log("--------------------------------");
console.log("Extraction completed!");
console.log("Files extracted:", files.length);
console.log("JSON saved at:", OUTPUT);