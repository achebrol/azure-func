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
      addPackageWithInit('@azure/functions'),
      addPackageWithInit('apollo-server-azure-functions'),
      addPackageWithInit('graphql-middleware'),
      addPackageWithInit('graphql-shield'),
      addPackageWithInit('jsonwebtoken'),
      addPackageWithInit('copyfiles'),
      formatFiles(options),
      generateFiles(options),
      updateNxJson(options),
      tools.updateWorkspaceJson(options)
    ])(tree, context);
  };
}
