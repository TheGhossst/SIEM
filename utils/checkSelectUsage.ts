import fs from 'fs';
import path from 'path';

function checkSelectUsage(dir: string) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      checkSelectUsage(filePath);
    } else if (stats.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('<Select') || content.includes('<SelectItem')) {
        console.log(`Select or SelectItem found in: ${filePath}`);
        // You can add more detailed checks here if needed
      }
    }
  });
}

checkSelectUsage('./app');

