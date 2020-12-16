import { names, offsetFromRoot } from '@nrwl/workspace';
import { Options } from '../schema';
import {
  apply,
  applyTemplates,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url
} from '@angular-devkit/schematics';

export default function generateFiles(options: Options): Rule {
  return mergeWith(
    apply(url(`./files`), [
      applyTemplates({
        ...options,
        ...names(options.name),
        offsetFromRoot: offsetFromRoot(options.projectRoot)
      }),
      move(`${options.projectRoot}/${options.projectName}/src/app`)
    ])
  );
}
