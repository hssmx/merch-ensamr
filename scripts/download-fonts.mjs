import { mkdir, writeFile } from 'node:fs/promises';

const fonts = {
  'anton-400.ttf': 'https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf',
  'josefin-sans-500.ttf': 'https://fonts.gstatic.com/s/josefinsans/v34/Qw3PZQNVED7rKGKxtqIqX5E-AVSJrOCfjY46_ArQXME.ttf',
  'josefin-sans-600.ttf': 'https://fonts.gstatic.com/s/josefinsans/v34/Qw3PZQNVED7rKGKxtqIqX5E-AVSJrOCfjY46_ObXXME.ttf',
  'josefin-sans-700.ttf': 'https://fonts.gstatic.com/s/josefinsans/v34/Qw3PZQNVED7rKGKxtqIqX5E-AVSJrOCfjY46_N_XXME.ttf',
  'jost-400.ttf': 'https://fonts.gstatic.com/s/jost/v20/92zPtBhPNqw79Ij1E865zBUv7myjJQVG.ttf',
  'jost-500.ttf': 'https://fonts.gstatic.com/s/jost/v20/92zPtBhPNqw79Ij1E865zBUv7myRJQVG.ttf',
  'jost-600.ttf': 'https://fonts.gstatic.com/s/jost/v20/92zPtBhPNqw79Ij1E865zBUv7mx9IgVG.ttf',
  'jost-700.ttf': 'https://fonts.gstatic.com/s/jost/v20/92zPtBhPNqw79Ij1E865zBUv7mxEIgVG.ttf',
  'outfit-400.ttf': 'https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4E.ttf',
  'outfit-500.ttf': 'https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4QK1C4E.ttf',
  'outfit-600.ttf': 'https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4e6yC4E.ttf',
  'outfit-700.ttf': 'https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4deyC4E.ttf',
};

await mkdir(new URL('../public/fonts/', import.meta.url), { recursive: true });

for (const [name, url] of Object.entries(fonts)) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${name}: ${response.status}`);
  await writeFile(new URL(`../public/fonts/${name}`, import.meta.url), Buffer.from(await response.arrayBuffer()));
}

console.log(`Downloaded ${Object.keys(fonts).length} font files.`);
