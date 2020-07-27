import neo4j from 'neo4j-driver'

/**
 * Singleton connection driver Neo4j
 *
 * @return {Neo4jDriver}
 */
let instance = null
const getConnection = () => {
  // its already instanced
  if (instance) {
    return instance
  }

  // get info from env
  const { connection_string, NEO4J_USERNAME, NEO4J_PASSWORD, config } = getEnv()

  // create instance
  instance = neo4j.driver(connection_string, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD), config)

  return instance
}

/**
 *
 * Generate Object config using .env configuration
 *
 * @return {Object}
 */
const getEnv = () => {
  const {
    NEO4J_PROTOCOL = 'bolt',
    NEO4J_HOST = 'localhost',
    NEO4J_PORT = '7687',
    NEO4J_USERNAME = 'neo4j',
    NEO4J_PASSWORD = 'letmein',
    NEO4J_ENTERPRISE,
    NEO4J_DATABASE = 'neo4j',
  } = process.env

  const connection_string = `${NEO4J_PROTOCOL}://${NEO4J_HOST}:${NEO4J_PORT}`
  const enterprise = NEO4J_ENTERPRISE === 'true'

  // Build additional config
  const config = {}

  const settings = {
    NEO4J_ENCRYPTION: 'encrypted',
    NEO4J_TRUST: 'trust',
    NEO4J_TRUSTED_CERTIFICATES: 'trustedCertificates',
    NEO4J_KNOWN_HOSTS: 'knownHosts',

    NEO4J_MAX_CONNECTION_POOLSIZE: 'maxConnectionPoolSize',
    NEO4J_MAX_TRANSACTION_RETRY_TIME: 'maxTransactionRetryTime',
    NEO4J_LOAD_BALANCING_STRATEGY: 'loadBalancingStrategy',
    NEO4J_MAX_CONNECTION_LIFETIME: 'maxConnectionLifetime',
    NEO4J_CONNECTION_TIMEOUT: 'connectionTimeout',
    NEO4J_DISABLE_LOSSLESS_INTEGERS: 'disableLosslessIntegers',
    NEO4J_LOGGING_LEVEL: 'logging',
  }

  Object.keys(settings).forEach(setting => {
    if (process.env.hasOwnProperty(setting)) {
      const key = settings[setting]
      let value = process.env[setting]

      if (key == 'trustedCertificates') {
        value = value.split(',')
      } else if (key == 'disableLosslessIntegers') {
        value = value === 'true'
      }

      config[key] = value
    }
  })

  return { connection_string, NEO4J_USERNAME, NEO4J_PASSWORD, enterprise, NEO4J_DATABASE, config }
}

const getInstance = () => {
  return neo4j
}

export { getConnection, getInstance }
