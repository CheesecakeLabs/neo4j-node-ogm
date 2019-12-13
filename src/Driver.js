import neo4j from 'neo4j-driver'

let instance = null
const createConnection = () => {
  if (instance) {
    return instance
  }

  const { NEO4J_PROTOCOL, NEO4J_HOST, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_PORT } = process.env

  instance = neo4j.driver(
    `${NEO4J_PROTOCOL || 'bolt'}://${NEO4J_HOST || 'localhost'}:${NEO4J_PORT || '7687'}`,
    neo4j.auth.basic(NEO4J_USERNAME || 'neo4j', NEO4J_PASSWORD || 'letmein')
  )
  return instance
}

export { createConnection }
