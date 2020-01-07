FROM neo4j:3.5

ENV NEO4J_AUTH=neo4j/letmein

ENV APOC_VERSION 3.5.0.1
ENV APOC_URI https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/${APOC_VERSION}/apoc-${APOC_VERSION}-all.jar
RUN wget -P /var/lib/neo4j/plugins ${APOC_URI}

EXPOSE 7474 7473 7687

CMD ["neo4j"]
