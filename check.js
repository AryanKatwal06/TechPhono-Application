const { exec } = require('child_process');
exec('npx tsc --noEmit', { shell: 'cmd.exe' }, (error, stdout, stderr) => {
  console.log('STDOUT:', stdout);
  console.log('STDERR:', stderr);
  if (error) console.error('ERROR:', error);
});
