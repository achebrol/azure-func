import { Options, UserOptions } from '../schema';
import { join, normalize } from '@angular-devkit/core';
import { inspect } from 'util';
import { Rule, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  addPackageJsonDependency,
  NodeDependencyType
} from '@schematics/angular/utility/dependencies';
import {
  generateProjectLint,
  Linter,
  offsetFromRoot,
  projectRootDir,
  ProjectType,
  toClassName,
  toFileName,
  toPropertyName,
  updateWorkspaceInTree
} from '@nrwl/workspace';
import { parse, stringify } from 'comment-json';

export default class ProjectTools {
  userOptions: UserOptions;
  options: Options;
  project;
  context;

  constructor(userOptions, context) {
    this.context = context;
    this.userOptions = userOptions;
    this.options = this.normalizeOptions(userOptions);
    this.project = {
      root: this.options.appProjectRoot,
      sourceRoot: join(this.options.appProjectRoot, 'src'),
      projectType: 'application',
      prefix: this.options.name,
      schematics: {},
      architect: {}
    };
    return this;
  }

  normalizeOptions(userOptions: UserOptions): Options {
    const linter = userOptions.linter || Linter.EsLint;
    const projectType = ProjectType.Application;
    const name = toFileName(userOptions.name);
    const projectDirectory = userOptions.directory
      ? `${toFileName(userOptions.directory)}/${name}`
      : name;
    const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
    const projectRoot = `${projectRootDir(projectType)}/${projectDirectory}`;
    const parsedTags = userOptions.tags
      ? userOptions.tags.split(',').map(s => s.trim())
      : [];
    const className = toClassName(userOptions.name);
    const propertyName = toPropertyName(userOptions.name);

    const appDirectory = userOptions.directory
      ? `${toFileName(userOptions.directory)}/${toFileName(userOptions.name)}`
      : toFileName(userOptions.name);

    const appProjectRoot = join(normalize('apps'), appDirectory);
    const dot = '.';

    return {
      ...userOptions,
      linter,
      projectName,
      appDirectory,
      appProjectRoot,
      projectRoot,
      projectDirectory,
      parsedTags,
      className,
      propertyName,
      projectType,
      dot,
      offsetFromRoot: offsetFromRoot(projectRoot)
    };
  }

  createCommand(commands: { command: string }[]) {
    return {
      builder: '@nrwl/workspace:run-commands',
      options: {
        commands: commands
      }
    };
  }

  getServeConfig(options = this.options) {
    const commands = [
      {
        command: `nx build ${options.projectDirectory}-${options.projectName}`
      },
      {
        command: `copyfiles -f ./apps/${options.projectDirectory}/${options.projectName}/src/app/local.settings.json ./dist/apps/${options.projectDirectory}/${options.projectName}/`
      },
      {
        command: `func start --script-root dist/apps/${options.projectDirectory}/${options.projectName} --typescript`
      }
    ];
    return this.createCommand(commands);
  }

  getTestConfig(options = this.options) {
    return {
      builder: '@nrwl/jest:jest',
      options: {
        jestConfig: join(options.appProjectRoot, 'jest.config.js'),
        tsConfig: join(options.appProjectRoot, 'tsconfig.spec.json'),
        passWithNoTests: true
      }
    };
  }

  getBuildConfig(project = this.project, options = this.options) {
    return {
      builder: '@nrwl/node:build',
      options: {
        outputPath: join(normalize('dist'), options.appProjectRoot),
        main: join(project.sourceRoot, 'index.ts'),
        yamlConfig: join(project.sourceRoot, '/environments/.production.yaml'),
        tsConfig: join(options.appProjectRoot, 'tsconfig.app.json'),
        packageJson: join(options.appProjectRoot, 'package.json'),
        assets: [
          {
            glob: '**/host.json',
            input: `apps/${options.projectDirectory}/${options.projectName}/src/app`,
            output: '.'
          },
          {
            glob: '**/.funcignore',
            input: `apps/${options.projectDirectory}/${options.projectName}/src/app`,
            output: '.'
          },
          `apps/${options.projectDirectory}/${options.projectName}/src/assets`,
          {
            glob: '**/function.json',
            input: `apps/${options.projectDirectory}/${options.projectName}/src/app`,
            output: '.'
          }
        ]
      },
      configurations: {
        production: {
          optimization: true,
          extractLicenses: true,
          inspect: false,
          fileReplacements: [
            {
              replace: `apps/${options.projectDirectory}/${options.projectName}/src/environments/environment.ts`,
              with: `apps/${options.projectDirectory}/${options.projectName}/src/environments/environment.prod.ts`
            }
          ]
        }
      }
    };
  }

  getLintConfig(project = this.project) {
    return generateProjectLint(
      normalize(project.root),
      join(normalize(project.root), 'tsconfig.app.json'),
      Linter.EsLint
    );
  }

  getProjectArchitect() {
    this.project.architect.serve = this.getServeConfig();
    this.project.architect.lint = this.getLintConfig();
    this.project.architect.test = this.getTestConfig();
    this.project.architect.build = this.getBuildConfig();
    //this.project.architect.deploy = this.getDeployConfig();
    return this.project;
  }

  updateWorkspaceJson(options: Options): Rule {
    return updateWorkspaceInTree(workspaceJson => {
      workspaceJson.projects[options.name] = this.getProjectArchitect();
      workspaceJson.defaultProject =
        workspaceJson.defaultProject || options.name;
      return workspaceJson;
    });
  }

  addDependenciesAndScripts(options: Options): Rule {
    return (host: Tree) => {
      addPackageJsonDependency(host, {
        type: NodeDependencyType.Default,
        name: '@azure/functions',
        version: '*',
        overwrite: true
      });
      addPackageJsonDependency(host, {
        type: NodeDependencyType.Dev,
        name: 'copyfiles',
        version: '*',
        overwrite: true
      });

      if (options.includeApollo) {
        addPackageJsonDependency(host, {
          type: NodeDependencyType.Default,
          name: 'apollo-server-azure-functions',
          version: '*',
          overwrite: true
        });
        addPackageJsonDependency(host, {
          type: NodeDependencyType.Default,
          name: 'graphql-middleware',
          version: '*',
          overwrite: true
        });
        addPackageJsonDependency(host, {
          type: NodeDependencyType.Default,
          name: 'graphql-shield',
          version: '*',
          overwrite: true
        });
        addPackageJsonDependency(host, {
          type: NodeDependencyType.Default,
          name: 'jsonwebtoken',
          version: '*',
          overwrite: true
        });
      }
      addPackageJsonDependency(host, {
        type: NodeDependencyType.Dev,
        name: 'copyfiles',
        version: '^2.4.0',
        overwrite: true
      });
      const pkgPath = '/package.json';
      let buffer = host.read(pkgPath);
      if (buffer === null) {
        throw new SchematicsException('Could not find package.json');
      }

      const pkg = JSON.parse(buffer.toString());
      pkg.scripts[
        `${options.projectDirectory}-${options.projectName}:serve`
      ] = `nx run ${options.projectDirectory}-${options.projectName}:serve`;
      pkg.scripts[
        `${options.projectDirectory}-${options.projectName}:build`
      ] = `nx run ${options.projectDirectory}-${options.projectName}:build`;
      pkg.scripts[
        `${options.projectDirectory}-${options.projectName}:build:deploy`
      ] = `yarn run ${options.projectDirectory}:build && yarn run artifact:build ${options.projectDirectory}-${options.projectName}`;
      pkg.scripts[
        `${options.projectDirectory}-${options.projectName}:copy:localsettings`
      ] = `copyfiles -f ./apps/${options.projectDirectory}/${options.projectName}/src/app/local.settings.json ./dist/apps/${options.projectDirectory}/${options.projectName}/`;

      host.overwrite(pkgPath, JSON.stringify(pkg, null, 2));

      //Update `.vscode/extensions.json`
      const extensionsPath = '/.vscode/extensions.json';
      buffer = host.read(extensionsPath);
      if (buffer === null) {
        throw new SchematicsException(
          'Could not find /.vscode/extensions.json'
        );
      }
      const extensions = JSON.parse(buffer.toString());
      const recommendations: string[] = extensions['recommendations'];
      const azureRecommendation = 'ms-azuretools.vscode-azurefunctions';
      if (!recommendations.includes(azureRecommendation)) {
        recommendations.push(azureRecommendation);
      }
      extensions['recommendations'] = recommendations;
      host.overwrite(extensionsPath, JSON.stringify(extensions, null, 2));

      //Update /.vscode/settings.json
      const settingsPath = '/.vscode/settings.json';
      if (!host.exists(settingsPath)) {
        host.create(settingsPath, '{}');
      }
      buffer = host.read(settingsPath);
      const settings = JSON.parse(buffer.toString());
      settings['azureFunctions.projectLanguage'] = 'TypeScript';
      settings['azureFunctions.projectRuntime'] = '~3';
      settings['debug.internalConsoleOptions'] = 'neverOpen';
      host.overwrite(settingsPath, JSON.stringify(settings, null, 2));
      //Update /.vscode/tasks.json
      const tasksPath = '/.vscode/tasks.json';
      if (!host.exists(tasksPath)) {
        host.create(
          tasksPath,
          `
        {
          // See https://go.microsoft.com/fwlink/?LinkId=733558
          // for the documentation about the tasks.json format
          "version": "2.0.0",
          "tasks": []
        }
        `
        );
      }
      buffer = host.read(tasksPath);
      const tasks = parse(buffer.toString());
      (tasks.tasks as [unknown]).push(
        {
          type: 'func',
          command: 'host start',
          label: `${options.projectDirectory}-${options.projectName} host start`,
          problemMatcher: '$func-node-watch',
          isBackground: true,
          dependsOn: `copy ${options.projectDirectory}-${options.projectName} local.settings.json`,
          options: {
            cwd:
              '${workspaceFolder}/dist/apps/' +
              options.projectDirectory +
              '/' +
              options.projectName
          }
        },
        {
          type: 'shell',
          label: `copy ${options.projectDirectory}-${options.projectName} local.settings.json`,
          command: `yarn run ${options.projectDirectory}-${options.projectName}:copy:localsettings`,
          dependsOn: `${options.projectDirectory}-${options.projectName}:build`
        },
        {
          type: 'shell',
          label: `${options.projectDirectory}-${options.projectName}:build`,
          command: `yarn run ${options.projectDirectory}-${options.projectName}:build`,
          problemMatcher: [],
          group: {
            kind: 'build',
            isDefault: true
          }
        }
      );
      host.overwrite(tasksPath, stringify(tasks, null, 2));
      //Update /.vscode/launch.json
      const launchPath = '/.vscode/launch.json';
      if (!host.exists(launchPath)) {
        host.create(
          launchPath,
          `
        {
          "version": "0.2.0",
          "configurations": []
        }
        `
        );
      }
      buffer = host.read(launchPath);
      const launch = JSON.parse(buffer.toString());
      launch.configurations.push({
        name: `${options.projectDirectory}-${options.projectName}`,
        type: 'node',
        request: 'attach',
        port: 9229,
        preLaunchTask: `${options.projectDirectory}-${options.projectName} host start`
      });
      host.overwrite(launchPath, JSON.stringify(launch, null, 2));

      return host;
    };
  }

  log(message) {
    this.context.logger.info(inspect(message, false, null));
  }
}
