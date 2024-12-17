import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const TEMPLATE_PATH = join(
  __dirname,
  "..",
  "..",
  "templates",
  "invoiceTemplate.html"
);
export const UPLOAD_PATH = join(__dirname, "..", "..", "uploads");
