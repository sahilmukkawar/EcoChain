# EcoChain Project Structure

```
EcoChain/
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   ├── users-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   ├── collections-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   ├── vision-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── README.md
│   ├── matching-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── README.md
│   ├── routing-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── README.md
│   ├── wallet-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   ├── marketplace-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   ├── orders-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   ├── factories-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   ├── analytics-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   └── admin-service/
│       ├── src/
│       ├── tests/
│       ├── Dockerfile
│       ├── package.json
│       └── README.md
├── apps/
│   ├── user-app/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   ├── collector-app/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   ├── factory-dashboard/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   └── admin-dashboard/
│       ├── src/
│       ├── tests/
│       ├── package.json
│       └── README.md
├── infrastructure/
│   ├── api-gateway/
│   │   ├── nginx.conf
│   │   └── Dockerfile
│   ├── database/
│   │   ├── init-scripts/
│   │   └── README.md
│   ├── queue/
│   │   ├── redis.conf
│   │   └── Dockerfile
│   ├── monitoring/
│   │   ├── prometheus/
│   │   ├── grafana/
│   │   └── README.md
│   ├── logging/
│   │   ├── elasticsearch/
│   │   ├── logstash/
│   │   ├── kibana/
│   │   └── README.md
│   └── ci-cd/
│       ├── github-actions/
│       ├── terraform/
│       ├── kubernetes/
│       └── README.md
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── deployment/
│   └── user-guides/
├── scripts/
│   ├── setup.sh
│   ├── build.sh
│   ├── deploy.sh
│   └── test.sh
├── .github/
│   └── workflows/
├── docker-compose.yml
├── package.json
└── README.md
```