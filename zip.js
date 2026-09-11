const fs = require('fs');
const archiver = require('archiver');
const output = fs.createWriteStream('public/abeerx-website.zip');
const archive = archiver('zip', { zlib: { level: 9 } });
output.on('close', function() { console.log(archive.pointer() + ' total bytes'); });
archive.pipe(output);
archive.glob('**/*', {
  cwd: __dirname,
  ignore: ['node_modules/**', '.next/**', '.git/**', 'abeerx-website.zip', 'public/abeerx-website.zip']
});
archive.finalize();
