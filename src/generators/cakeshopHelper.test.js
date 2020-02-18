import { join } from 'path'
import { createQuickstartConfig, createReplica7NodesConfig } from '../model/NetworkConfig'
import {
  copyFile,
  createFolder,
  cwd, libRootDir,
  writeJsonFile,
} from '../utils/fileUtils'
import { buildCakeshopDir } from './cakeshopHelper'
import { anything } from 'expect'
import { TEST_CWD, TEST_LIB_ROOT_DIR } from '../utils/testHelper'

jest.mock('../utils/fileUtils')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)

describe('creates a cakeshop directory structure for bash', () => {
  const baseNetwork = {
    numberNodes: '5',
    consensus: 'raft',
    quorumVersion: '2.4.0',
    transactionManager: '0.10.2',
    cakeshop: true,
    deployment: 'bash'
  }
  
  it('creates directory structure for cakeshop files and moves them in', () => {
    let config = createReplica7NodesConfig(baseNetwork)

    buildCakeshopDir(config, createNetPath(config, 'qdata'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/cakeshop/local'), true)
    expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'qdata/cakeshop/local'), 'cakeshop.json', anything())
    expect(copyFile).toBeCalledWith(createLibPath('lib', 'cakeshop_application.properties.template'), createNetPath(config, 'qdata/cakeshop/local','application.properties'))
  })
})

function createLibPath(...relativePaths) {
  return join(libRootDir(), ...relativePaths)
}

function createNetPath(config, ...relativePaths) {
  return join(cwd(), 'network', config.network.name, ...relativePaths)
}
