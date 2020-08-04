#!/usr/bin/env node

import { argv } from 'yargs'
import { exec } from 'shelljs'

const HOST = argv.host
const IP = argv.ip
const PASSWORD = argv.password

const CWD = `${process.cwd()}/${IP}`

// create folder
exec(`mkdir ${IP}`, { cwd: process.cwd() })

// server cert
exec(`openssl genrsa -passout pass:${PASSWORD} -aes256 -out ca-key.pem 4096`, { cwd: CWD })
exec(
  `openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem -passin pass:${PASSWORD} -subj "/C=MY/ST=IPOH/L=PERAK/O=ExampleCompany/OU=IT/CN=${HOST}/emailAddress=test@example.com"`,
  { cwd: CWD }
)
exec('openssl genrsa -out server-key.pem 4096', { cwd: CWD })
exec(`openssl req -subj "/CN=${HOST}" -sha256 -new -key server-key.pem -out server.csr`, { cwd: CWD })
exec(`echo subjectAltName = DNS:${HOST},IP:${IP},IP:127.0.0.1 >> extfile.cnf`, { cwd: CWD })
exec('echo extendedKeyUsage = serverAuth >> extfile.cnf', { cwd: CWD })
exec(
  `openssl x509 -req -days 365 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -extfile extfile.cnf -passin pass:${PASSWORD}`,
  { cwd: CWD }
)

// client authentication
exec(`openssl genrsa -out key.pem 4096`, { cwd: CWD })
exec(`openssl req -subj '/CN=client' -new -key key.pem -out client.csr`, { cwd: CWD })
exec('echo extendedKeyUsage = clientAuth > extfile-client.cnf', { cwd: CWD })
exec(
  `openssl x509 -req -days 365 -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out cert.pem -extfile extfile-client.cnf -passin pass:${PASSWORD}`,
  { cwd: CWD }
)
exec('rm -v client.csr server.csr extfile.cnf extfile-client.cnf', { cwd: CWD })

// to read permission
exec('chmod -v 0400 ca-key.pem key.pem server-key.pem', { cwd: CWD })
exec('chmod -v 0444 ca.pem server-cert.pem cert.pem', { cwd: CWD })
