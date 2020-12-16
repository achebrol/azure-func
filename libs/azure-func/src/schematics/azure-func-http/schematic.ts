import {
  chain,
  externalSchematic,
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { formatFiles } from '@nrwl/workspace';
import { Options, UserOptions } from '../schema';
import ProjectTools from '../utilities/projectTools';
import generateFiles from '../utilities/generateFiles';
import updateNxJson from '../utilities/updateNxJson';

function updateMain(options: Options): Rule {
  return (host: Tree) => {
    const mainPath = `/${options.projectRoot}/${options.projectName}/src/main.ts`;
    const content = [];
    content.push(`export * from './app/http-trigger/index';`);
    host.overwrite(mainPath, content.join('\n'));
    return host;
  };
}
// noinspection JSUnusedGlobalSymbols
export default function(_UserOptions: UserOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    _UserOptions.includeApollo = false;
    const tools = new ProjectTools(_UserOptions, context);
    const options = tools.options;
    tools.log('Start template creation');

    return chain([
      externalSchematic('@nrwl/node', 'application', {
        name: options.projectName,
        directory: options.projectDirectory,
        skipFormat: true,
        skipPackageJson: true,

        tags: options.name,
        unitTestRunner: 'jest'
      }),
      //addPackageWithInit('@azure/functions'),
      //addPackageWithInit('copyfiles'),
      generateFiles(options),
      updateNxJson(options),
      tools.updateWorkspaceJson(options),
      tools.addDependenciesAndScripts(options),
      updateMain(options),
      formatFiles(options),
      tools.installPackages()
    ])(tree, context);
  };
}
