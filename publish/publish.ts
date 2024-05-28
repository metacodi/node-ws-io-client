import chalk from 'chalk';
import Prompt from 'commander';

import { incrementPackageVersion, Resource, Terminal, Git, upgradeDependency } from '@metacodi/node-utils';

/**
 * **Usage**
 *
 * ```bash
 * npx ts-node publish/publish.ts
 * ```
 */

Terminal.title('PUBLISH');
 
/** {@link https://www.npmjs.com/package/commander#common-option-types-boolean-and-value } */
Prompt.program
  // .requiredOption('-f, --folder <folder>', 'Ruta absoluta de la carpeta i nom del component.')
  // .option('-c, --commit <dir>', 'Descripció pel commit')
  .option('-v, --verbose', 'Log verbose')
;
Prompt.program.parse(process.argv);

const options = Prompt.program.opts();

if (options.verbose) { console.log('Arguments: ', options); }

(async () => {

  incrementPackageVersion();
  
  if (Resource.exists(`dist`)) {
    Terminal.log(`Eliminant la carpeta de distribució ${chalk.bold(`dist`)}.`);
    Resource.removeSync(`dist`);
  }

  Terminal.log(`Actualitzant dependències de ${chalk.bold(`@metacodi`)}`);  
  await upgradeDependency(`@metacodi/node-api-client`, '--save-peer');
  await upgradeDependency(`@metacodi/node-utils`, '--save-peer');

  Terminal.log(chalk.bold(`Compilant projecte typescript`));
  await Terminal.run(`tsc`);

  const ok = await Git.publish({ branch: 'main', commit: options.commit });
  if (ok) { Terminal.log(`Git published successfully!`); }
  
  Terminal.log(`npm publish`);
  await Terminal.run(`npm publish`);

})();
