// This file can be imported instead of srv/http.js in index.js
// It should perform a bit better than class based thing

import { net } from 'lib/net.js'
import { Loop } from 'lib/loop.js'
import { Timer } from 'lib/timer.js'

import { RequestParser } from './picohttpparser/pico.requestparser.js'
// import { CHILD_INDEX } from './env/env.js'

const { Blocked, Readable } = Loop
const { getenv, utf8_encode_into_ptr, get_address,
  assert, ptr, core: { fcntl, O_NONBLOCK, F_SETFL } } = lo
const { SOCK_STREAM, AF_INET, SOMAXCONN, SO_REUSEPORT, SOL_SOCKET, SOCKADDR_LEN,
  // IPPROTO_TCP,
  // TCP_NODELAY,
  // SO_INCOMING_CPU,
  on: net_on, types: { sockaddr_in },
  socket, bind, listen, accept, close, recv2, send2, setsockopt } = net

const SUCCESS_RC = 0
const BYPASS_RC = 1
const ERROR_RC = 2

const on_loop_fd_error = (fd) => {
  //console.log(fd)
}



/**@type {AddRouteHandler}*/
const get = (path, request_handler) => add_route_handler('get', path, request_handler)
/**@type {AddMethodNPathHandler}*/
const add_route_handler = (method, path, request_handler) =>
  add_u8_route_handler(encoder.encode(`${method.toUpperCase()} ${path}`), request_handler)

/**@type {AddU8MethodNPathHandler}*/
const add_u8_route_handler = (method_n_path_u8, request_handler) => {
  let node = router
  for (let i = 0, char_code = 0x20; i < method_n_path_u8.length; i++) {
    char_code = method_n_path_u8[i]
    node = node[char_code] = node[char_code] || create_router_node()
  }
  if (node === router) return ERROR_RC
  node.f = request_handler
  return SUCCESS_RC
}
/**@type {FindU8MethodNPathHandler}*/
const find_u8_route = (method_n_path_u8) => {
  let node = router
  for (let i = 0, char_code = 0x20; node && i < method_n_path_u8.length; i++) {
    char_code = method_n_path_u8[i]
    node = node[char_code]
  }

  return node.f
}
/**@type {Server[]}*/
const servers = []
/**@type {Socket[]}*/
const sockets = []
/**@returns {typeof default_router_node}*/
const create_router_node = () => Object.create(default_router_node)
/**@type {RouterNode['f']}*/
const default_router_node_fn = (_) => ERROR_RC
/**@type {RouterNode}*/
const default_router_node = Object.assign(Object.create(null), {  f: default_router_node_fn })
// for (let i = 0; i < 256; i++) default_router_node[i] = default_router_node
const router = create_router_node()
const encoder = new TextEncoder()
const loop = new Loop()
const poll = loop.poll.bind(loop)

const buf = ptr(new Uint8Array(8 * 1024 * 1024))

const on_socket_handle = (/**@type {Socket}*/socket) => {
  const { parser, fd, rb_ptr, rb_size, http_frames } = socket
  let rc = ERROR_RC
  let bytes_to_parse = recv2(fd, rb_ptr, rb_size, 0)
  switch (bytes_to_parse) {
    case 0:
    break
    case -1:
      rc = lo.errno === Blocked ? 0 : -1
    break
    default: {
      // parse => route => handle route
      do {
        rc = -1
        const parsed_bytes = parser.parse(bytes_to_parse)
        switch (parsed_bytes) {
          case -2:
            rc = 0
            bytes_to_parse = 0
          break
          case -1:
          case 0:
            bytes_to_parse = 0
          break
          default: {
            bytes_to_parse -= parsed_bytes
            rc = find_u8_route(parser.method_n_path_u8_view)(socket)
          break}
        }
      } while(bytes_to_parse > 0)

      // build buffer from http frames => send
      const length = http_frames.length
      let size = 0
      const buf_ptr = buf.ptr
      for (let i = 0; i < length; i++) {
        const [ status_code, headers, body ] = http_frames[i]
        utf8_encode_into_ptr(headers, buf_ptr + size + http_frame_header_prefix_size)
        const header_size = http_frame_header_prefix_size + headers.length
        const body_size = utf8_encode_into_ptr(body, buf_ptr + size + header_size)

        update_status_code_field(status_code)
        update_content_length_field(body_size)
        // TODO: provide fast way to remove static headers (probably TypedArray.copyWithin)
        set_header_prefix(size)

        size += body_size + header_size
      }
      http_frames.length = 0
      // TODO: if write fails/is partial store buffer in some array by fd as index
      // TODO: track fd buffered amount (probably close overoffending fds)
      // TODO: track total buffered amount (find and close overoffending fds)
      const sent = send2(fd, buf_ptr, size, 0)
      if (sent != size) rc = ERROR_RC
    break}
  }
  return rc
}
const on_socket_readable = (fd) => {
  const socket = sockets[fd]
  const rc = socket ? on_socket_handle(socket) : ERROR_RC
  if (rc == ERROR_RC) close(fd)
}

// const incoming_cpu = new Uint32Array([CHILD_INDEX])

const on_server_accept = (server) => {
  const { sockaddr_in, sockaddr_in_dv, sockaddr_in_len, //incoming_cpu,
    on_socket_readable, fd, loop, parser_buf_size, parser_max_headers,
    socks
    } = server
  const sock_fd = accept(fd, sockaddr_in.ptr, sockaddr_in_len.ptr)

  if (sock_fd > 0) {
    assert(fcntl(sock_fd, F_SETFL, O_NONBLOCK) === 0)
    assert(sockaddr_in_len[0] === sockaddr_in.byteLength)
    // assert(!setsockopt(sock_fd, SOL_SOCKET, SO_INCOMING_CPU, incoming_cpu, 32))
    // assert(!setsockopt(sock_fd, IPPROTO_TCP, TCP_NODELAY, net_on, 32))
    const port = sockaddr_in_dv.getUint16(2)
    const ip = sockaddr_in_dv.getUint32(4)
    assert(port + ip)
    const parser = new RequestParser(new Uint8Array(parser_buf_size), parser_max_headers)
    const { rb_ptr, rb_size } = parser
    socks[sock_fd] = sockets[sock_fd] = {
      server, fd: sock_fd, ip, port, http_frames: [],
      parser,
      rb_ptr,
      rb_size
    }
    assert(loop.add(sock_fd, on_socket_readable, Readable, on_loop_fd_error) === 0)
    return SUCCESS_RC
  }
  if (lo.errno === Blocked) return BYPASS_RC
  return ERROR_RC
}
const on_server_readable = (fd) => {
  const server = servers[fd]
  const rc = server ? on_server_accept(server) : ERROR_RC
  if (rc == ERROR_RC) close(fd)
}
const server_create = (addr, port, loop) => {
  const fd = socket(AF_INET, SOCK_STREAM, 0)
  assert(fd > 2)
  assert(fcntl(fd, F_SETFL, O_NONBLOCK) === 0)
  assert(!setsockopt(fd, SOL_SOCKET, SO_REUSEPORT, net_on, 32))
  // assert(!setsockopt(fd, SOL_SOCKET, SO_INCOMING_CPU, incoming_cpu, 32))
  assert(bind(fd, sockaddr_in(addr, port), SOCKADDR_LEN) === 0)
  assert(listen(fd, SOMAXCONN) === 0)

  const sockaddr_in_buf = ptr(new Uint8Array(16))
  const sockaddr_in_len = ptr(new Uint32Array([sockaddr_in_buf.byteLength]))
  const sockaddr_in_dv = new DataView(sockaddr_in_buf.buffer)
  /**@type {Server}*/
  const server = {
    fd, loop, addr, port, socks: [],
    sockaddr_in: sockaddr_in_buf,
    sockaddr_in_len,
    sockaddr_in_dv,
    parser_buf_size: 16 * 1024,
    parser_max_headers: 18,
    on_socket_readable
  }
  servers[fd] = server

  assert(loop.add(fd, on_server_readable, Readable, on_loop_fd_error) === 0)
  return server
}


const content_length_value_size = Number.MAX_SAFE_INTEGER.toString().length
const http_frame_header_prefix = new TextEncoder().encode(`HTTP/1.1 200\r
date: ${(new Date()).toUTCString()}\r
content-length: ${'0'.padEnd(content_length_value_size, ' ')}\r
`)
const http_frame_header_prefix_ptr = get_address(http_frame_header_prefix)
const http_frame_header_prefix_size = http_frame_header_prefix.byteLength
const status_code_field_ptr = http_frame_header_prefix_ptr + 9
const date_field_ptr = status_code_field_ptr + 3 + 8
const content_length_field_ptr = date_field_ptr + (new Date()).toUTCString().length + 18
const status_code_field_buf = new Uint8Array(http_frame_header_prefix.buffer,
  status_code_field_ptr - http_frame_header_prefix_ptr,
  3
)
const content_length_field_buf = new Uint8Array(http_frame_header_prefix.buffer,
  content_length_field_ptr - http_frame_header_prefix_ptr,
  content_length_value_size
)

const update_date_field = () =>
  utf8_encode_into_ptr((new Date()).toUTCString(), date_field_ptr)
const update_status_code_field = (status_code = 200) => {
  const buf = status_code_field_buf
  buf[0] = (status_code / 100 | 0) + 48;
  buf[1] = (status_code % 100 / 10 | 0) + 48;
  buf[2] = (status_code % 10) + 48;
}
let last_content_length_len = 1
const update_content_length_field = (content_length = 0) => {
  const buf = content_length_field_buf
  let n = content_length
  const len = n < 1e1 ? 1 : n < 1e2 ? 2 : n < 1e3 ? 3 : n < 1e4 ? 4 :
        n < 1e5 ? 5 : n < 1e6 ? 6 : n < 1e7 ? 7 : n < 1e8 ? 8 :
        n < 1e9 ? 9 : n < 1e10 ? 10 : n < 1e11 ? 11 : n < 1e12 ? 12 :
        n < 1e13 ? 13 : n < 1e14 ? 14 : n < 1e15 ? 15 : 16;
  for (let i = len - 1, floor = Math.floor; i >= 0; i--) {
      buf[i] = (n % 10) + 48;
      n = floor(n / 10);
  }
  for (let i = len; i < last_content_length_len; i++) {
    buf[i] = 0x20
  }
  last_content_length_len = len
}
const stimer_callbacks = [update_date_field]
const stimer_handler = () => {
  const fns = stimer_callbacks
  for (let i = 0; i < fns.length; i++) fns[i]()
}
const stimer = new Timer(loop, 1_000, stimer_handler)
const set_header_prefix = buf.set.bind(buf, http_frame_header_prefix)





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


server_create('0.0.0.0', 8080, loop)
assert(SUCCESS_RC === get('/plaintext', ({ http_frames }) => {
  http_frames.push([200, `server: lo2\r\ncontent-type: ${textCT}\r\n\r\n`, message])
  return SUCCESS_RC
}))
assert(SUCCESS_RC === get('/json', ({ http_frames }) => {
  http_frames.push([200, `server: lo2\r\ncontent-type: ${jsonCT}\r\n\r\n`, sJSON(json)])
  return SUCCESS_RC
}))



while(poll() > 0);
stimer.close()





/**@typedef {typeof ERROR_RC} ERROR_RC*/
/**@typedef {typeof SUCCESS_RC} SUCCESS_RC*/
/**@typedef {typeof BYPASS_RC} BYPASS_RC*/
/**@typedef {ERROR_RC | SUCCESS_RC | BYPASS_RC} RC*/
/**@typedef {(socket: Socket) => RC} RequestHandler*/
/**@typedef {(path: string, request_handler: RequestHandler) => RC} AddRouteHandler*/
/**@typedef {(method: string, path: string, request_handler: RequestHandler) => RC} AddMethodNPathHandler*/
/**@typedef {(method_n_path: Uint8Array, request_handler: RequestHandler) => RC} AddU8MethodNPathHandler*/
/**@typedef {(method_n_path: Uint8Array) => RequestHandler} FindU8MethodNPathHandler*/
/**@typedef {{ [k in number]: RouterNode } & { f: RequestHandler }} RouterNode*/
/**@typedef {[StatusCodeNumber, HeadersString, BodyString]} HttpFrame*/
/**@typedef {string & { body?: never }} BodyString*/
/**@typedef {string & { headers?: never }} HeadersString*/
/**@typedef {number & { status_code?: never }} StatusCodeNumber*/
/**
 * @typedef Server
 * @type {object}
 * @property {number} fd
 * @property {Loop} loop
 * @property {number} addr
 * @property {number} port
 * @property {number} parser_buf_size
 * @property {number} parser_max_headers
 * @property {Ptr<Uint8Array>} sockaddr_in
 * @property {Ptr<Uint32Array>} sockaddr_in_len
 * @property {DataView} sockaddr_in_dv
 * @property {Socket[]} socks
 * @property {(fd: number) => void} on_socket_readable
 */
/**
 * @typedef Socket
 * @type {object}
 * @property {number} fd
 * @property {number} ip
 * @property {number} port
 * @property {number} rb_ptr
 * @property {number} rb_size
 * @property {Server} server
 * @property {RequestParser} parser
 * @property {HttpFrame[]} http_frames
 */