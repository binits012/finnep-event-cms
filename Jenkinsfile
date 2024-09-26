pipeline {
    agent any
    stages {
        stage('Build') { 
            steps {
                script {
                    sh 'pnpm install' 
                    sh 'pnpm run build'  
                }  
            }
        }
        stage('Stop and Run Instance ') {
            steps {
                sh 'cd /opt/deployment/withCode/yellowbridge'
                sh "pm2 stop yellowbridge"
                sh 'pm2 start npm --name "yellowbridge" -- start'
            }
        }
    }
    post {
        always {
            deleteDir()
            dir("${env.WORKSPACE}@tmp") {
                deleteDir()
            }
            dir("${env.WORKSPACE}@script") {
                deleteDir()
            }
            dir("${env.WORKSPACE}@script@tmp") {
                deleteDir()
            }
        }
    }
}