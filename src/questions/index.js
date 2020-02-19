import {
  createQuickstartConfig,
  createReplica7NodesConfig,
  createCustomConfig,
  generateNodeConfigs,
  isTessera,
  isBash,
  isDocker
} from '../model/NetworkConfig'
import { buildBash } from '../generators/bashHelper'
import { createDockerCompose } from '../generators/dockerHelper'
import { getCustomizedBashNodes, getCustomizedDockerPorts } from './promptHelper'
import { generateAndCopyExampleScripts } from '../generators/examplesGenerator'
import {
  CONSENSUS_MODE,
  DEPLOYMENT_TYPE,
  NUMBER_NODES,
  TRANSACTION_MANAGER,
  CAKESHOP,
  QUORUM_VERSION,
  KEY_GENERATION,
  NETWORK_ID,
  GENESIS_LOCATION,
  CUSTOMIZE_PORTS
} from './questions'

import inquirer from 'inquirer'
import { cwd, readFileToString } from '../utils/fileUtils'
import { join } from "path"
import { createDirectory } from '../generators/networkCreator'

export async function quickstart() {
  const config = createQuickstartConfig()
  await buildNetwork(config, 'bash')
}

export async function replica7Nodes () {
  const answers = await inquirer.prompt([
    DEPLOYMENT_TYPE,
    CONSENSUS_MODE,
    NUMBER_NODES,
    QUORUM_VERSION,
    TRANSACTION_MANAGER,
    CAKESHOP
  ])
  const config = createReplica7NodesConfig(answers)
  await buildNetwork(config, answers.deployment)
}

export async function customize () {
  const commonAnswers = await inquirer.prompt([
    DEPLOYMENT_TYPE,
    CONSENSUS_MODE,
    NUMBER_NODES,
    QUORUM_VERSION,
    TRANSACTION_MANAGER,
    CAKESHOP
  ])

  const customAnswers = await inquirer.prompt([
    KEY_GENERATION,
    NETWORK_ID,
    // GENESIS_LOCATION,
    CUSTOMIZE_PORTS
  ])

  let nodes = (customAnswers.customizePorts && isBash(commonAnswers.deployment)) ?
    await getCustomizedBashNodes(commonAnswers.numberNodes, isTessera(commonAnswers.transactionManager)) : []

  let dockerCustom = (customAnswers.customizePorts && isDocker(commonAnswers.deployment)) ?
    await getCustomizedDockerPorts(isTessera(commonAnswers.transactionManager)) : undefined

    const answers = {
      ...commonAnswers,
      ...customAnswers,
      nodes,
      dockerCustom
    }
  const config = createCustomConfig(answers)

  await buildNetwork(config, answers.deployment)
}

async function buildNetwork(config, deployment) {
  console.log('')
  createDirectory(config)
  if (isBash(deployment)) {
    await buildBash(config)
  } else if (isDocker(deployment)) {
    await createDockerCompose(config)
  }
  console.log('Done')

  console.log('')
  const qdata = join(cwd(), 'network', config.network.name, 'qdata')
  const numNodes = config.nodes.length
  if(isTessera(config.network.transactionManager)) {
    console.log('--------------------------------------------------------------------------------')
    console.log('')
    config.nodes.forEach((node, i) => {
      const nodeNumber = i + 1
      console.log(`Tessera Node ${nodeNumber} public key:`)
      const pubKey = readFileToString(join(qdata, `c${nodeNumber}`, 'tm.pub'))
      console.log(`${pubKey}`)
      console.log('')
      if (nodeNumber == numNodes) {
        generateAndCopyExampleScripts(pubKey, qdata)
      }
    })
    console.log('--------------------------------------------------------------------------------')
  }
  console.log('')
  console.log('Quorum network created. Run the following commands to start your network:')
  console.log('')
  console.log(`cd network/${config.network.name}`)
  console.log('./start.sh')
  console.log('')
}
