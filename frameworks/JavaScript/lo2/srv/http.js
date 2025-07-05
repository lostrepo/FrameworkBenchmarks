import { App } from './apps/app.js'
import { CHILD_INDEX, CPUS } from './env/env.js'

console.log('SERVER_ID: '+ CHILD_INDEX +', TOTAL_SERVERS: '+ CPUS)


const { message, json } = require('tfb.config.js')
const { sjs, attr } = require('stringify.js')



const contentTypesStr = {
  text: 'text/plain',
  css: 'text/css',
  utf8: 'text/plain; charset=utf-8',
  json: 'application/json',
  html: 'text/html; charset=utf-8',
  octet: 'application/octet-stream',
  ico: 'application/favicon',
  png: 'application/png',
  xml: 'application/xml; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  wasm: 'application/wasm'
}
const { text: textCT, json: jsonCT } = contentTypesStr

const sJSON = sjs({ message: attr('string') })



new App()
  .get('/plaintext', socket => {
    socket.push_http_frame({
      status_code: 200,
      headers: `server: lo2\r\ncontent-type: ${textCT}\r\n\r\n`,
      body: message
    })
    return 0
  })
  .get('/json', socket => {
    socket.push_http_frame({
      status_code: 200,
      headers: `server: lo2\r\ncontent-type: ${jsonCT}\r\n\r\n`,
      body: sJSON(json)
    })
    return 0
  })
  .listen(8080, '0.0.0.0', console.error)
  .start()
  .clear()
