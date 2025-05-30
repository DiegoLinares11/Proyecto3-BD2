const neo4j = require('neo4j-driver');

class Neo4jConnection {
    constructor() {
        this.driver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic(
                process.env.NEO4J_USER,
                process.env.NEO4J_PASSWORD
            )
        );
    }

    async verifyConnection() {
        const session = this.driver.session();
        try {
            await session.run('RETURN 1');
            console.log('Conexión a Neo4j establecida con éxito');
            return true;
        } catch (error) {
            console.error('Error de conexión a Neo4j:', error.message);
            return false;
        } finally {
            await session.close();
        }
    }

    async executeQuery(query, params = {}) {
        const session = this.driver.session();
        try {
            const result = await session.run(query, params);
            return result.records.map(record => record.toObject());
        } catch (error) {
            console.error('Error en consulta Cypher:', error.message);
            throw new Error(`Database error: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async close() {
        await this.driver.close();
        console.log('Conexión a Neo4j cerrada');
    }
}

// Singleton para una única instancia de conexión
const neo4jConnection = new Neo4jConnection();

// Verificar conexión al iniciar
neo4jConnection.verifyConnection();

// Manejar cierre limpio al terminar la aplicación
process.on('SIGINT', async () => {
    await neo4jConnection.close();
    process.exit(0);
});

module.exports = neo4jConnection;