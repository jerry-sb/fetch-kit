export default {
  '(apps|packages|internal)/**/*.{js,ts,jsx,tsx}': (files) => {
    const commands = new Set();
    for (const f of files) {
      const [scope, name] = f.split('/');
      const dir = `${scope}/${name}`;
      commands.add(`cd ${dir} && pnpm exec eslint --fix`);
    }
    return [...commands];
  },
  '*.json': ['prettier --write'],
};
