import { readJsonFile, readNxJson, readWorkspaceJson } from '@nrwl/workspace';
import * as chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import * as yargs from 'yargs';
const NODE_DEPENDENCIES_REGEX = /^(?:module.exports\s*=\s*require\("([@\w/-]*)"\);)$/gm;

export function writePackageJson(projectName: string) {
  if (projectName) {
    try {
      const workspace = readWorkspaceJson();
      const { targets, projectType } = workspace.projects[projectName];

      if (projectType === 'application') {
        const { outputPath } = targets.build.options;

        try {
          const { npmScope } = readNxJson();
          const { peerDependencies } = targets.build.options;
          const [workspaceVersion, dependencies] = inferProjectDependencies(
            outputPath,
            peerDependencies
          );

          writeProjectPackageJson(
            projectName,
            npmScope,
            workspaceVersion,
            dependencies,
            outputPath
          );
        } catch (error) {
          console.error(error);
        }
      } else {
        console.error(
          chalk`The project {yellow ${projectName}} is not an application.`
        );
      }
    } catch (error) {
      console.error(
        chalk`No project named {yellow ${projectName}} found in the workspace.`
      );
    }
  } else {
    console.error('A valid workspace project was not specified.');
  }
}

function inferProjectDependencies(
  outputPath: string,
  peerDependencies: string[]
) {
  const packageJson = readJsonFile(resolve(process.cwd(), 'package.json'));
  const mainjs = readFileSync(resolve(outputPath, 'main.js'), 'utf8');
  const dependencies: { [key: string]: string } = {};
  let match: RegExpExecArray;

  const {
    dependencies: workspaceDeps,
    version: workspaceVersion
  } = packageJson;
  const projectDependencies: Array<string[]> = [];

  while ((match = NODE_DEPENDENCIES_REGEX.exec(mainjs))) {
    const packageName = match[1];
    const packageVersion = workspaceDeps[packageName];

    projectDependencies.push([packageName, packageVersion]);
  }

  // look through the peerDependencies array
  // split any entries by @ and push them to projectDependencies
  if (peerDependencies) {
    peerDependencies.forEach(dep => {
      const packageVersion = workspaceDeps[dep];
      if (!packageVersion) {
        throw new Error(
          `A peerDependency [${dep}] defined in workspace.json doesn't have a dependency defined in package.json.`
        );
      } else {
        projectDependencies.push([dep, packageVersion]);
      }
    });
  }

  projectDependencies
    .sort()
    .forEach(([name, version]) => (dependencies[name] = version));

  return [workspaceVersion, dependencies];
}

function writeProjectPackageJson(
  projectName: string,
  npmScope: string,
  workspaceVersion: any,
  dependencies: { [key: string]: string },
  outputPath: any
) {
  const path = resolve(outputPath, 'package.json');

  try {
    const json = {
      name: `@${npmScope}/${projectName}`,
      version: `${workspaceVersion}`,
      scripts: {
        start: 'node main.js'
      },
      dependencies: {
        ...dependencies
      },
      license: 'MIT',
      private: true
    };

    writeFileSync(path, JSON.stringify(json, undefined, 2));
  } catch (error) {
    console.error(`Unable to write to {yellow ${path}}: ${error}`);
  }
}
if (yargs.argv._[0]) {
  writePackageJson(yargs.argv._[0] as string);
}
