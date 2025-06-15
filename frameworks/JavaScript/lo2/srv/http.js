import { App } from './apps/app.js'
import { Timer } from 'lib/timer.js'
import { CHILD_INDEX, CPUS } from './env/env.js'

console.log('SERVER_ID: '+ CHILD_INDEX +', TOTAL_SERVERS: '+ CPUS)


const { message, json } = require('tfb.config.js')
const { sjs, attr } = require('stringify.js')
const { ptr, utf8_encode_into_ptr } = lo



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





const send_buf = ptr(new Uint8Array(2*1024*1024))
const max_http_headers_size = 4096
const body_ptr = send_buf.ptr + max_http_headers_size

const sJSON = sjs({ message: attr('string') })

let date_str = (new Date()).toUTCString()
const app = new App()
// TODO: date header update should be internal to App
const timer = new Timer(app.loop, 1_000,() => {
  date_str = (new Date()).toUTCString()
})

const http_frame_header = (body_size = 0, content_type = textCT,
  status_code = 200) => {
    // TODO: status line should be internal to App
    return `HTTP/1.1 ${status_code}\r
server: lo2\r
date: ${date_str}\r
content-length: ${body_size}\r
content-type: ${content_type}\r
\r
`
}

const http_respond_with_string = (sock, str = '', content_type = textCT,
  status_code = 200) => {
    const body_size = utf8_encode_into_ptr(str, body_ptr)
    const hdr_size = utf8_encode_into_ptr(
      http_frame_header(body_size, content_type, status_code),
      send_buf.ptr)
    send_buf.copyWithin(hdr_size, max_http_headers_size,
      max_http_headers_size + body_size)

    return sock.write(send_buf.ptr, hdr_size + body_size)
}

app
  .get('/plaintext', sock => {
    http_respond_with_string(sock, message, textCT, 200)
    return 0
  })
  .get('/json', sock => {
    http_respond_with_string(sock, sJSON(json), jsonCT, 200)
    return 0
  })
  .listen(8080, '0.0.0.0', console.error)
  .start()
  .clear()

timer.close()
