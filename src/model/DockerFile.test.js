import { buildDockerCompose } from '../generators/dockerHelper'
import { createConfigFromAnswers } from './NetworkConfig'

test('creates 3nodes raft dockerFile tessera no cakeshop', () => {
  const config = createConfigFromAnswers({
    numberNodes: '3',
    consensus: 'raft',
    quorumVersion: '2.5.0',
    transactionManager: '0.10.2',
    deployment: 'docker-compose',
    cakeshop: 'none',
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 5nodes istanbul dockerFile no tessera no cakeshop', () => {
  const config = createConfigFromAnswers({
    numberNodes: '5',
    consensus: 'istanbul',
    quorumVersion: '2.5.0',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: 'none',
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createConfigFromAnswers({
    numberNodes: '3',
    consensus: 'raft',
    quorumVersion: '2.5.0',
    transactionManager: '0.10.2',
    deployment: 'docker-compose',
    cakeshop: '0.11.0',
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 5nodes istanbul dockerFile no tessera cakeshop', () => {
  const config = createConfigFromAnswers({
    numberNodes: '5',
    consensus: 'istanbul',
    quorumVersion: '2.5.0',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: '0.11.0',
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 3nodes raft docker tessera custom', () => {
  const config = createConfigFromAnswers({
    numberNodes: '3',
    consensus: 'raft',
    transactionManager: '0.10.2',
    deployment: 'docker-compose',
    cakeshop: 'none',
    generateKeys: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: false,
    nodes: [],
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 2nodes raft docker tessera cakeshop custom ports', () => {
  const nodes = [
    {
      quorum: {
        ip: '172.16.239.11',
        devP2pPort: '55001',
        rpcPort: '56000',
        wsPort: '57000',
        raftPort: '80501',
      },
      tm: {
        ip: '172.16.239.101',
        thirdPartyPort: '5081',
        p2pPort: '5001',
      },
    },
    {
      quorum: {
        ip: '172.16.239.12',
        devP2pPort: '55001',
        rpcPort: '56001',
        wsPort: '57001',
        raftPort: '80502',
      },
      tm: {
        ip: '172.16.239.102',
        thirdPartyPort: '5082',
        p2pPort: '5002',
      },
    },
  ]

  const config = createConfigFromAnswers({
    numberNodes: '2',
    consensus: 'raft',
    transactionManager: '0.10.2',
    deployment: 'docker-compose',
    cakeshop: '0.11.0',
    generateKeys: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: true,
    cakeshopPort: '7999',
    nodes,
  })
  const bash = buildDockerCompose(config)
  expect(bash).toMatchSnapshot()
})
