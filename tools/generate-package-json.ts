import * as fs from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';
import * as yargs from 'yargs';

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const root = resolve(__dirname, '..', '..');
const distRoot = resolve(root, 'dist');

interface PackageJson {
  dependencies: Record<string, string>;
}

interface ProjectDependency {
  type: 'static' | 'implicit';
  target: string;
}

interface NxDeps {
  projectGraph: {
    dependencies: Record<string, Array<ProjectDependency>>;
  };
}

const generatePackageJson = (
  name: string,
  dependencies: Record<string, string>
): string =>
  JSON.stringify({
    name,
    version: '1.0.0',
    dependencies
  });

const getDependencies = (
  rootPackage: PackageJson,
  deps: NxDeps,
  pack: string
): Record<string, string> => {
  const dependencies = deps.projectGraph.dependencies[pack];

  const directDependencies = dependencies.reduce<Record<string, string>>(
    (depsAcc: Record<string, string>, dep) => {
      const version = rootPackage.dependencies[dep.target];
      if (dep.type === 'static') {
        if (version) {
          depsAcc[dep.target] = version;
        } else {
          return {
            ...depsAcc,
            ...getDependencies(rootPackage, deps, dep.target)
          };
        }
      }
      return depsAcc;
    },
    {}
  );

  return directDependencies;
};

const run = async (appFolder: string) => {
  const app = appFolder.split('/').join('-');
  const rootPackageBuffer = await readFile(resolve(root, 'package.json'));
  const rootPackage = JSON.parse(rootPackageBuffer.toString('utf-8'));

  const depsBuffer = await readFile(resolve(distRoot, 'nxdeps.json'));
  const deps = JSON.parse(depsBuffer.toString('utf-8')) as NxDeps;

  console.log(`Checking ${appFolder}`);
  const doesExist = await exists(resolve(distRoot, 'apps', appFolder));

  if (doesExist && Reflect.has(deps.projectGraph.dependencies, app)) {
    console.log(`Generating ${appFolder}/package.json`);
    const dependencies = getDependencies(rootPackage, deps, app);
    const appPackageJson = generatePackageJson(app, dependencies);
    await writeFile(
      resolve(distRoot, 'apps', appFolder, 'package.json'),
      appPackageJson
    );
    console.log('Done');
  } else {
    console.log('App not found');
  }
};

if (yargs.argv.app) {
  run(yargs.argv.app as string).then(() => process.exit(0));
}
