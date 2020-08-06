#!/usr/bin/env node

const { execSync, spawn } = require('child_process')

let HOST
let IP
let PASSWORD

const SUBJ = '/C=MY/ST=IPOH/L=PERAK/O=ExampleCompany/OU=IT/CN=${HOST}/emailAddress=test@example.com'

process.argv.map((val, index) => {
  if (val === '--host') {
    if (!process.argv[index + 1]) {
      throw new Error('host are required!')
    }

    HOST = process.argv[index + 1]
  }

  if (val === '--ip') {
    if (!process.argv[index + 1]) {
      throw new Error('ip adress are required!')
    }

    IP = process.argv[index + 1]
  }

  if (val === '--password') {
    if (!process.argv[index + 1]) {
      throw new Error('password are required!')
    }

    PASSWORD = process.argv[index + 1]
  }
})

const CWD = IP

// create folder
execSync(`mkdir ${IP}`, { cwd: process.cwd() })

// server cert
execSync(`openssl genrsa -passout pass:${PASSWORD} -aes256 -out ca-key.pem 4096`, { cwd: CWD })
execSync(
  `openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem -passin pass:${PASSWORD} -subj ${SUBJ}`,
  {
    cwd: CWD
  }
)
execSync('openssl genrsa -out server-key.pem 4096', { cwd: CWD })
execSync(`openssl req -subj "/CN=${HOST}" -sha256 -new -key server-key.pem -out server.csr`, { cwd: CWD })
execSync(`echo subjectAltName = DNS:${HOST},IP:${IP},IP:127.0.0.1 >> extfile.cnf`, { cwd: CWD })
execSync('echo extendedKeyUsage = serverAuth >> extfile.cnf', { cwd: CWD })
execSync(
  `openssl x509 -req -days 365 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -extfile extfile.cnf -passin pass:${PASSWORD}`,
  { cwd: CWD }
)

// client authentication
execSync(`openssl genrsa -out key.pem 4096`, { cwd: CWD })
execSync(`openssl req -subj '/CN=client' -new -key key.pem -out client.csr`, { cwd: CWD })
execSync('echo extendedKeyUsage = clientAuth > extfile-client.cnf', { cwd: CWD })
execSync(
  `openssl x509 -req -days 365 -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out cert.pem -extfile extfile-client.cnf -passin pass:${PASSWORD}`,
  { cwd: CWD }
)
execSync('rm -v client.csr server.csr extfile.cnf extfile-client.cnf', { cwd: CWD })

// to read permission
execSync('chmod -v 0400 ca-key.pem key.pem server-key.pem', { cwd: CWD })
execSync('chmod -v 0444 ca.pem server-cert.pem cert.pem', { cwd: CWD })
