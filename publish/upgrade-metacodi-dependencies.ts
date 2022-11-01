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

Terminal.title('UPGRADE METACODI');
 
Prompt
  // .requiredOption('-f, --folder <folder>', 'Ruta absoluta de la carpeta i nom del component.')
  // .option('-c, --commit <dir>', 'Descripció pel commit')
  .option('-v, --verbose', 'Log verbose')
;
Prompt.parse(process.argv);

if (Prompt.verbose) { console.log('Arguments: ', Prompt.opts()); }

(async () => {

  try {
  
    Terminal.log(`Actualitzant dependències de ${chalk.bold(`@metacodi`)}`);
  
    await upgradeDependency(`@metacodi/node-api-client`, '--save-peer');
    await upgradeDependency(`@metacodi/node-utils`, '--save-dev');
  
    Terminal.log(`Dependències actualitzades correctament!`);

  } catch (error) {
    Terminal.error(error);
  }

})();
