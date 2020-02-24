import { join } from 'path'
import { generateKeys } from './keyGen'
import {
  pathToQuorumBinary,
  pathToBootnode,
  pathToTesseraJar,
} from './binaryHelper'
import { executeSync } from '../utils/execUtils'
import {
  createFolder,
  writeFile,
  cwd,
} from '../utils/fileUtils'
import {
  TEST_CWD,
  createNetPath,
} from '../utils/testHelper'

jest.mock('./binaryHelper')
jest.mock('../utils/execUtils')
jest.mock('../utils/fileUtils')
cwd.mockReturnValue(TEST_CWD)

describe('generates keys', () => {
  it('generates quorum keys', () => {
    const config = {
      network: {
        transactionManager: 'none',
        name: 'test',
      },
      nodes: ['nodes'],
    }
    pathToQuorumBinary.mockReturnValueOnce('quorumPath')
    pathToBootnode.mockReturnValue('bootnodePath')
    generateKeys(config, join(createNetPath(config), 'keyPath'))
    const keyNum = config.nodes.length

    const expected = `cd ${join(createNetPath(config), 'keyPath')}/key${keyNum} && quorumPath account new --keystore ${join(createNetPath(config), 'keyPath')}/key${keyNum} --password password.txt 2>&1
  bootnodePath -genkey=nodekey
  bootnodePath --nodekey=nodekey --writeaddress > enode
  find . -type f -name 'UTC*' -execdir mv {} key ';'
  `
    expect(createFolder).toBeCalledWith(join(createNetPath(config), 'keyPath', `key${keyNum}`), true)
    expect(writeFile).toBeCalledWith(join(createNetPath(config), 'keyPath', `key${keyNum}`, 'password.txt'), '')
    expect(executeSync).toHaveBeenCalledWith(expected)
  })

  it('generates quorum and tessera keys', () => {
    const config = {
      network: {
        transactionManager: 'tessera',
        name: 'test',
      },
      nodes: ['nodes'],
    }
    pathToQuorumBinary.mockReturnValueOnce('quorumPath')
    pathToBootnode.mockReturnValueOnce('bootnodePath')
    pathToTesseraJar.mockReturnValueOnce('tesseraPath')
    generateKeys(config, join(createNetPath(config), 'keyPath'))
    const keyNum = config.nodes.length

    const withTessera = `cd ${join(createNetPath(config), 'keyPath')}/key${keyNum} && quorumPath account new --keystore ${join(createNetPath(config), 'keyPath')}/key${keyNum} --password password.txt 2>&1
  bootnodePath -genkey=nodekey
  bootnodePath --nodekey=nodekey --writeaddress > enode
  find . -type f -name 'UTC*' -execdir mv {} key ';'
  java -jar tesseraPath -keygen -filename tm`

    expect(createFolder).toBeCalledWith(join(createNetPath(config), 'keyPath', `key${keyNum}`), true)
    expect(writeFile).toBeCalledWith(join(createNetPath(config), 'keyPath', `key${keyNum}`, 'password.txt'), '')
    expect(executeSync).toHaveBeenCalledWith(withTessera)
  })
})
