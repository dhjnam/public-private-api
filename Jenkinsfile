pipeline {
  agent any
  stages {
    stage('Checkout Code') {
      steps {
        git(url: 'https://github.com/dhjnam/public-private-api', branch: 'jenkins')
      }
    }

    stage('npm install') {
      steps {
        sh 'npm install'
      }
    }

    stage('TypeScript Build') {
      steps {
        sh 'tsc --build src/tsconfig.json'
      }
    }

    stage('Create and Push Docker Image') {
      steps {
        sh '''docker image build -t public-private-api:latest .
docker tag public-private-api:latest dhjnam/public-private-api:latest
docker push dhjnam/public-private-api:latest
'''
      }
    }

  }
}
