import {
  chain,
  externalSchematic,
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { addPackageWithInit, formatFiles } from '@nrwl/workspace';
import { UserOptions } from '../schema';
import ProjectTools from '../utilities/projectTools';
import generateFiles from '../utilities/generateFiles';
import updateNxJson from '../utilities/updateNxJson';

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
        skipPackageJson: false,

        tags: options.name,
        unitTestRunner: 'jest'
      }),
      //addPackageWithInit('@azure/functions'),
      //addPackageWithInit('copyfiles'),
      generateFiles(options),
      updateNxJson(options),
      tools.updateWorkspaceJson(options),
      tools.addDependenciesAndScripts(options),
      formatFiles(options)
    ])(tree, context);
  };
}
