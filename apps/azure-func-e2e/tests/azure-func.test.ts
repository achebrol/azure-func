import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq
} from '@nrwl/nx-plugin/testing';

describe('azure-func e2e', () => {
  it('should create azure-func', async done => {
    const pluginHttp = 'http-service';
    const pluginPubsub = 'pubsub-service';
    // const lib = "my-lib";
    // const lib2 = "my-lib2";
    ensureNxProject('@joelcode/azure-func', 'dist/libs/azure-func');

    await Promise.all([
      // await runNxCommandAsync(`generate @nrwl/node:lib ${lib}  --buildable`),
      // await runNxCommandAsync(`generate @nrwl/node:lib ${lib2}  --buildable`),
      await runNxCommandAsync(
        `generate @joelcode/azure-func:http ${pluginHttp}`
      ),
      await runNxCommandAsync(
        `generate @joelcode/azure-func:pubsub ${pluginPubsub}`
      )
    ]);

    await Promise.all([
      // await runNxCommandAsync(`build ${lib}`),
      // await runNxCommandAsync(`build ${lib2}`)
    ]);

    await runNxCommandAsync(`build ${pluginHttp}`);
    await runNxCommandAsync(`build ${pluginPubsub}`);

    // expect(() => checkFilesExist(`apps/${plugin}/src/index.ts`)).not.toThrow();
    // expect(() => checkFilesExist(`apps/${plugin}/src/index.spec.ts`)).not.toThrow();
    // expect(() => checkFilesExist(`apps/${plugin}/src/index.e2e.ts`)).not.toThrow();
    // expect(() => checkFilesExist(`jest.config.js`)).not.toThrow();
    // expect(() => checkFilesExist(`tsconfig.json`)).not.toThrow();

    done();
  }, 60000);

  describe.skip('--tags', () => {
    it('should add tags to nx.json', async done => {
      const plugin = uniq('azure-func');
      ensureNxProject('@joelcode/azure-func', 'dist/libs/azure-func');
      await runNxCommandAsync(
        `generate @joelcode/azure-func:gcpFunction ${plugin} --tags e2etag,e2ePackage`
      );
      const nxJson = readJson('nx.json');
      expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
      done();
    });
  });
});
