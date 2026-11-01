const upstream = require('./electron-builder.config.cjs')

// Local source-built preview; keep upstream runtime/resource verification intact.
module.exports = {
  ...upstream,
  appId: 'local.orca.focus.dev',
  productName: 'Orca Focus Dev',
  protocols: [],
  publish: null,
  directories: { ...upstream.directories, output: 'dist/focus-dev' },
  mac: {
    ...upstream.mac,
    identity: '-',
    hardenedRuntime: false,
    notarize: false,
    fileAssociations: [],
    target: [{ target: 'dir', arch: ['arm64'] }]
  }
}
