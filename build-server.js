import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  outfile: 'dist/server.cjs',
}).then(() => {
  console.log('✔ Built dist/server.cjs successfully!');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
