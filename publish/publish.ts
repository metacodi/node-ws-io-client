#!/usr/bin/env node
import chalk from 'chalk';
import * as Prompt from 'commander';

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
  .option('-u, --upgrade', 'Upgrade metacodi dependencies')
  .option('-v, --verbose', 'Log verbose')
;
Prompt.program.parse(process.argv);

const promptOpts = Prompt.program.opts();

if (promptOpts.verbose) { console.log('Arguments: ', promptOpts); }

(async () => {
  try {

    const version = incrementPackageVersion();
    
    if (Resource.exists(`dist`)) {
      Terminal.log(`Eliminant la carpeta de distribució ${chalk.bold(`dist`)}.`);
      Resource.removeSync(`dist`);
    }
  
    if (promptOpts.upgrade) {
      Terminal.log(`Actualitzant dependències de ${chalk.bold(`@metacodi`)}`);  
      await upgradeDependency(`@metacodi/node-api-client`, '--save-peer');
      await upgradeDependency(`@metacodi/node-utils`, '--save-dev');
    }
  
    Terminal.log(chalk.bold(`Compilant projecte typescript`));
    await Terminal.run(`tsc`);
  
    const ok = await Git.publish({ branch: 'main', commit: promptOpts.commit || `publish version ${version}` });
    if (ok) { Terminal.log(`Git published successfully!`); }
    
    Terminal.log(`npm publish`);
    await Terminal.run(`npm publish`);
  
    Terminal.log(chalk.blueBright(`Repositori publicat correctament!`));
    const pkg = Resource.open('package.json');
    Terminal.log(chalk.green(`npm install ` + chalk.bold(`${pkg.name}@${pkg.version}`) + ' --save-dev'));

  } catch (error) {
    Terminal.error(error);
  }
  Terminal.line();
})();
