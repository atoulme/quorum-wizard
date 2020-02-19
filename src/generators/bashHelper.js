import { createDirectory, getFullNetworkPath, includeCakeshop } from './networkCreator'
import {
  copyFile, createFolder, cwd,
  libRootDir, removeFolder,
  writeFile, writeJsonFile,
} from '../utils/fileUtils'
import { join } from 'path'
import { execute } from '../utils/execUtils'
import { buildCakeshopDir, generateCakeshopScript, waitForCakeshopCommand } from './cakeshopHelper'
import {
  downloadAndCopyBinaries,
  pathToCakeshop,
  pathToQuorumBinary,
  pathToTesseraJar,
} from './binaryHelper'
import { isTessera, isRaft } from '../model/NetworkConfig'

export function buildBashScript(config) {
  const commands = createCommands(config)

  const startScript = [
    setEnvironmentCommand(config),
    commands.tesseraStart,
    waitForTesseraNodesCommand(config),
    'echo "Starting Quorum nodes"',
    commands.gethStart,
    generateCakeshopScript(config),
    'echo "Successfully started Quorum network."',
  ]

  return {
    startScript: startScript.join('\n'),
    initCommands: commands.initStart
  }
}

export function createCommands (config) {
  const networkPath = getFullNetworkPath(config)
  const initCommands = []
  const startCommands = []
  const tmStartCommands = []

  config.nodes.forEach((node, i) => {
    const nodeNumber = i+1
    const quorumDir = join('qdata', `dd${nodeNumber}`)
    const tmDir = join('qdata', `c${nodeNumber}`)
    const genesisLocation = join(quorumDir, 'genesis.json')
    const keyDir = join(quorumDir, 'keystore')
    const passwordDestination = join(keyDir, 'password.txt')
    const logs = join('qdata', 'logs')
    const initCommand = `cd ${networkPath} && ${pathToQuorumBinary(config.network.quorumVersion)} --datadir ${quorumDir} init ${genesisLocation}`
    initCommands.push(initCommand)

    let tmIpcLocation = isTessera(config) ? join(tmDir, 'tm.ipc') : 'ignore'
    const startCommand = createGethStartCommand(config, node,
      passwordDestination, nodeNumber, tmIpcLocation)
    startCommands.push(startCommand)

    if (isTessera(config)) {
      const tmStartCommand = createTesseraStartCommand(config, node, nodeNumber,
        tmDir, logs)
      tmStartCommands.push(tmStartCommand)
    }
  })

  const obj = {
    tesseraStart:  tmStartCommands.join('\n'),
    gethStart: startCommands.join('\n'),
    initStart: initCommands,
  }
  return obj;
}


export async function buildBash(config) {

  console.log('Downloading dependencies...')
  await downloadAndCopyBinaries(config)

  console.log('Building network data directory...')
  const bashDetails = buildBashScript(config)
  const networkPath = getFullNetworkPath(config)

  if(includeCakeshop(config)) {
    buildCakeshopDir(config, join(networkPath, 'qdata'))
  }

  console.log('Writing start script...')
  writeFile(join(networkPath, 'start.sh'), bashDetails.startScript, true)
  copyFile(join(libRootDir(), 'lib/stop.sh'), join(networkPath, 'stop.sh'))

  copyFile(join(libRootDir(), 'lib/runscript.sh'), join(networkPath, 'runscript.sh'))
  copyFile(join(libRootDir(), 'lib/public-contract.js'), join(networkPath, 'public-contract.js'))
  copyFile(join(libRootDir(), 'lib/private-contract-3nodes.js'), join(networkPath, 'private-contract-3nodes.js'))
  copyFile(join(libRootDir(), 'lib/private-contract-7nodes.js'), join(networkPath, 'private-contract-7nodes.js'))

  console.log('Initializing quorum...')
  bashDetails.initCommands.forEach((command) => {
    // TODO figure out the safest way to run shell commands
    execute(command, (e, stdout, stderr) => {
      if (e instanceof Error) {
        console.error(e)
        throw e
      }
    })
  })
}

export function createGethStartCommand (config, node, passwordDestination, nodeNumber, tmIpcLocation) {
  const { verbosity, networkId, consensus } = config.network
  const { devP2pPort, rpcPort, wsPort, raftPort } = node.quorum

  const args = `--nodiscover --rpc --rpccorsdomain=* --rpcvhosts=* --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,${consensus},quorumPermission --emitcheckpoints --unlock 0 --password ${passwordDestination}`
  const consensusArgs = isRaft(consensus) ?
    `--raft --raftport ${raftPort}` :
    `--istanbul.blockperiod 5 --syncmode full --mine --minerthreads 1`

  return `PRIVATE_CONFIG=${tmIpcLocation} nohup $BIN_GETH --datadir qdata/dd${nodeNumber} ${args} ${consensusArgs} --permissioned --verbosity ${verbosity} --networkid ${networkId} --rpcport ${rpcPort} --port ${devP2pPort} 2>>qdata/logs/${nodeNumber}.log &`
}

export function createTesseraStartCommand (config, node, nodeNumber, tmDir, logDir) {
  // `rm -f ${tmDir}/tm.ipc`

  let DEBUG = ''
  if (config.network.remoteDebug) {
    DEBUG = '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=500$i -Xdebug'
  }

  const MEMORY = '-Xms128M -Xmx128M'
  const CMD = `java ${DEBUG} ${MEMORY} -jar $BIN_TESSERA -configfile ${tmDir}/tessera-config-09-${nodeNumber}.json >> ${logDir}/tessera${nodeNumber}.log 2>&1 &`
  return CMD
}

function checkTesseraUpcheck(nodes) {
  return nodes.map((node, i) => {
    return `
    result${i+1}=$(curl -s http://${node.tm.ip}:${node.tm.p2pPort}/upcheck)
    if [ ! "\${result${i+1}}" == "I'm up!" ]; then
        echo "Node ${i+1} is not yet listening on http"
        DOWN=true
    fi`
  })
}
export function setEnvironmentCommand (config) {
  const lines = []
  lines.push(`BIN_GETH=${pathToQuorumBinary(config.network.quorumVersion)}`)
  if(isTessera(config.network.transactionManager)) {
    lines.push(`BIN_TESSERA=${pathToTesseraJar(config.network.transactionManager)}`)
  }
  if(config.network.cakeshop) {
    lines.push(`BIN_CAKESHOP=${pathToCakeshop()}`)
  }
  lines.push('')
  return lines.join("\n")
}

export function waitForTesseraNodesCommand (config) {
  if(!isTessera(config.network.transactionManager)) {
    return ''
  }
  // TODO use config values for ip, port, data folder, etc.
  return `
echo "Waiting until all Tessera nodes are running..."
DOWN=true
k=10
while \${DOWN}; do
    sleep 1
    DOWN=false
    for i in \`seq 1 ${config.nodes.length}\`
    do
        if [ ! -S "qdata/c\${i}/tm.ipc" ]; then
            echo "Node \${i} is not yet listening on tm.ipc"
            DOWN=true
        fi
    done
    set +e
    #NOTE: if using https, change the scheme
    #NOTE: if using the IP whitelist, change the host to an allowed host
    ${checkTesseraUpcheck(config.nodes).join('')}

    k=$((k - 1))
    if [ \${k} -le 0 ]; then
        echo "Tessera is taking a long time to start.  Look at the Tessera logs in qdata/logs/ for help diagnosing the problem."
    fi
    echo "Waiting until all Tessera nodes are running..."

    sleep 5
done

echo "All Tessera nodes started"
`
}
