import { join } from 'path'
import { createDirectory, createStaticNodes } from './networkCreator'
import {createConfig} from '../model/TesseraConfig'
import {
  generateNodeConfigs,
  createReplica7NodesConfig,
  createCustomConfig
} from '../model/NetworkConfig'
import {
  copyFile,
  createFolder,
  cwd,
  libRootDir,
  readFileToString,
  writeJsonFile
} from '../utils/fileUtils'
import { anything } from 'expect'
import { TEST_CWD, TEST_LIB_ROOT_DIR, createNetPath, createLibPath } from '../utils/testHelper'
import { generateConsensusConfig } from '../model/ConsensusConfig'

jest.mock('../utils/execUtils')
jest.mock('../utils/fileUtils')
jest.mock('../model/ConsensusConfig')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)

const baseNetwork = {
  numberNodes: '5',
  consensus: 'raft',
  quorumVersion: '2.4.0',
  transactionManager: '0.10.2',
  cakeshop: false,
  deployment: 'bash'
}

describe('creates a bash network', () => {
  it('rejects invalid network names', () => {
    const names = [ '', '.', '..', '\0', '/']
    let config = createReplica7NodesConfig(baseNetwork)
    names.forEach((name) => {
      config.network.name = name
      expect(() => createDirectory(config)).toThrow(Error)
    })
  })

  it('Creates the correct directory structure and moves files in', () => {
    let config = createReplica7NodesConfig(baseNetwork)
    createDirectory(config)
    expect(generateConsensusConfig).toHaveBeenCalled()
    expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/logs`), true)
    expect(writeJsonFile).toBeCalledWith(createNetPath(config), 'config.json', config)
    for (let i = 1; i < 6; i++) {
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}`))
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'static-nodes.json', anything())
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'permissioned-nodes.json', anything())
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/geth`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/keystore`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/c${i}`))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/key`), createNetPath(config, `qdata/dd${i}/keystore`, 'key'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/password.txt`), createNetPath(config, `qdata/dd${i}/keystore`, 'password.txt'))
      expect(copyFile).toBeCalledWith(createNetPath(config, 'generated', 'genesis.json'), createNetPath(config, `qdata/dd${i}`, 'genesis.json'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/nodekey`), createNetPath(config, `qdata/dd${i}/geth`, 'nodekey'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/tm.key`), createNetPath(config, `qdata/c${i}/tm.key`))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/tm.pub`), createNetPath(config, `qdata/c${i}/tm.pub`))
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/c${i}`), `tessera-config-09-${i}.json`, anything())
    }
  })
})

describe('creates a bash network without tessera', () => {
  it('rejects invalid network names', () => {
    const names = [ '', '.', '..', '\0', '/']
    let config = createReplica7NodesConfig({
      ...baseNetwork,
      transactionManager: 'none'
    })
    names.forEach((name) => {
      config.network.name = name
      expect(() => createDirectory(config)).toThrow(Error)
    })
  })

  it('Creates the correct directory structure and moves files in', () => {
    let config = createReplica7NodesConfig({
      ...baseNetwork,
      transactionManager: 'none'
    })
    createDirectory(config)
    expect(generateConsensusConfig).toHaveBeenCalled()
    expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/logs`), true)
    expect(writeJsonFile).toBeCalledWith(createNetPath(config), 'config.json', config)
    for (let i = 1; i < 6; i++) {
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}`))
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'static-nodes.json', anything())
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'permissioned-nodes.json', anything())
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/geth`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/keystore`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/c${i}`))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/key`), createNetPath(config, `qdata/dd${i}/keystore`, 'key'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/password.txt`), createNetPath(config, `qdata/dd${i}/keystore`, 'password.txt'))
      expect(copyFile).toBeCalledWith(createNetPath(config, 'generated', 'genesis.json'), createNetPath(config, `qdata/dd${i}`, 'genesis.json'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/nodekey`), createNetPath(config, `qdata/dd${i}/geth`, 'nodekey'))
    }
  })
})

describe('creates a docker network', () => {
  it('rejects invalid network names', () => {
    const names = [ '', '.', '..', '\0', '/']
    let config = createReplica7NodesConfig({
      ...baseNetwork,
      deployment: 'docker-compose'
    })
    names.forEach((name) => {
      config.network.name = name
      expect(() => createDirectory(config)).toThrow(Error)
    })
  })

  it('Creates the correct directory structure and moves files in', () => {
    let config = createReplica7NodesConfig({
      ...baseNetwork,
      deployment: 'docker-compose'
    })
    createDirectory(config)
    expect(generateConsensusConfig).toHaveBeenCalled()
    expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/logs`), true)
    expect(writeJsonFile).toBeCalledWith(createNetPath(config), 'config.json', config)
    for (let i = 1; i < 6; i++) {
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}`))
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'static-nodes.json', anything())
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'permissioned-nodes.json', anything())
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/geth`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/keystore`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/c${i}`))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/key`), createNetPath(config, `qdata/dd${i}/keystore`, 'key'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/password.txt`), createNetPath(config, `qdata/dd${i}/keystore`, 'password.txt'))
      expect(copyFile).toBeCalledWith(createNetPath(config, 'generated', 'genesis.json'), createNetPath(config, `qdata/dd${i}`, 'genesis.json'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/nodekey`), createNetPath(config, `qdata/dd${i}/geth`, 'nodekey'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/tm.key`), createNetPath(config, `qdata/c${i}/tm.key`))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/tm.pub`), createNetPath(config, `qdata/c${i}/tm.pub`))
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/c${i}`), `tessera-config-09-${i}.json`, anything())
    }
  })

  it('Creates the correct directory structure for custom config and moves files in', () => {
    let config = createCustomConfig({
      ...baseNetwork,
      deployment: 'docker-compose',
      generateKeys: true
    })

    createDirectory(config)
    expect(generateConsensusConfig).toHaveBeenCalled()
    expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/logs`), true)
    expect(writeJsonFile).toBeCalledWith(createNetPath(config), 'config.json', config)
    for (let i = 1; i < 6; i++) {
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}`))
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'static-nodes.json', anything())
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'permissioned-nodes.json', anything())
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/geth`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/keystore`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/c${i}`))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/key`), createNetPath(config, `qdata/dd${i}/keystore`, 'key'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/password.txt`), createNetPath(config, `qdata/dd${i}/keystore`, 'password.txt'))
      expect(copyFile).toBeCalledWith(createNetPath(config, 'generated', 'genesis.json'), createNetPath(config, `qdata/dd${i}`, 'genesis.json'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/nodekey`), createNetPath(config, `qdata/dd${i}/geth`, 'nodekey'))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/tm.key`), createNetPath(config, `qdata/c${i}/tm.key`))
      expect(copyFile).toBeCalledWith(createLibPath(`7nodes/key${i}/tm.pub`), createNetPath(config, `qdata/c${i}/tm.pub`))
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/c${i}`), `tessera-config-09-${i}.json`, anything())
    }
  })
})

describe('creates static nodes json', () => {
  it('Creates a raft static nodes json from enode ids', () => {
    const testDir = 'generated'
    const nodes = generateNodeConfigs(3)
    const expected = [
      "enode://abc@127.0.0.1:21000?discport=0&raftport=50401",
      "enode://def@127.0.0.1:21001?discport=0&raftport=50402",
      "enode://ghi@127.0.0.1:21002?discport=0&raftport=50403",
    ]
    readFileToString
    .mockReturnValueOnce('abc')
    .mockReturnValueOnce('def')
    .mockReturnValueOnce('ghi')
    expect(createStaticNodes(nodes, 'raft', testDir)).toEqual(expected)
  })

  it('Creates an istanbul static nodes json from enode ids', () => {
    const testDir = 'generated'
    const nodes = generateNodeConfigs(3)
    const expected = [
      "enode://abc@127.0.0.1:21000?discport=0",
      "enode://def@127.0.0.1:21001?discport=0",
      "enode://ghi@127.0.0.1:21002?discport=0",
    ]
    readFileToString
    .mockReturnValueOnce('abc')
    .mockReturnValueOnce('def')
    .mockReturnValueOnce('ghi')
    expect(createStaticNodes(nodes, 'istanbul', testDir)).toEqual(expected)
  })
})
