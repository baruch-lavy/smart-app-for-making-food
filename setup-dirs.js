const fs = require("fs");
const path = require("path");

const basePath =
  "c:\\Users\\baruc\\OneDrive\\Desktop\\smart-app-for-making-food\\server";
const subdirs = ["middleware", "models", "routes", "services", "seeds"];

// Create server directory if it doesn't exist
if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
  console.log("Created base directory: " + basePath);
}

// Create subdirectories and .gitkeep files
subdirs.forEach((subdir) => {
  const dirPath = path.join(basePath, subdir);

  // Create subdirectory
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log("Created subdirectory: " + subdir);
  }

  // Create .gitkeep file
  const gitkeepPath = path.join(dirPath, ".gitkeep");
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, "");
    console.log("Created .gitkeep in: " + subdir);
  }
});

console.log("\n--- Contents of server directory ---");
const contents = fs.readdirSync(basePath);
contents.forEach((item) => {
  const fullPath = path.join(basePath, item);
  const stats = fs.statSync(fullPath);
  if (stats.isDirectory()) {
    console.log("[DIR] " + item);
  } else {
    console.log("[FILE] " + item);
  }
});
