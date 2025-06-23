import { Timer } from 'lib/timer.js'

import { Server } from '../servers/server.js'
import { on_socket_readable } from './on.socket.readable.js'
import { loop } from '../loop/loop.js'
import { noop } from '../utils/noop.js'
import { TrieBasedRouter } from '../routing/trie.based.router.js'
import { Socket } from '../sockets/socket.js'
// import { CHILD_INDEX } from '../env/env.js'
// import { log } from '../utils/log.js'

const { utf8_encode_into_ptr, get_address } = lo

export class App {
  // TODO: should try using something better for searching byte array matches
  #router = new TrieBasedRouter()
  #on_socket_readable = on_socket_readable.bind(null, (socket, parsed_bytes) => {
    /** @type {0 | -1} */
    let rc = -1
    const { method_n_path_u8_view} = socket.parser
    const { parts, fns: [fn] } = this.#router.find_u8_experimental(method_n_path_u8_view)
    switch (fn) {
      case undefined:
      break
      default:
      rc = fn(this.#append_http_frame.bind(this, socket.fd), parts)
      break
    }
    return rc
  })
  get on_socket_readable(){ return this.#on_socket_readable }
  set on_socket_readable(on_socket_readable){ this.#on_socket_readable = on_socket_readable }
  get router(){ return this.#router }
  /**@type {Map<string, Server>} */
  #servers = new Map()
  #loop = loop
  get loop(){ return this.#loop }
  #max_fds = 8 * 64 * 64
  /**@type {{ status_code: number, headers: string, body: string}[][]}*/
  #http_write_queue = Array.from({ length: this.#max_fds }).map(() => [])
  /**
   * @param {number} fd
   */
  #append_http_frame(fd, status_code = 200, headers = '', body = ''){
    // TODO: found out that fd is not a Smi for some reason
    // and this.#http_write_queue[fd] access is deoptimized
    // but it's not the most expensive part so maybe will take a look later
    this.#http_write_queue[fd].push({
      status_code,
      headers,
      body
    })
  }
  #max_frame_size = 8 * 1024 * 1024
  #buf = new Uint8Array(this.#max_frame_size)
  #buf_ptr = get_address(this.#buf)
  #loop_started = false
  #content_length_value_size = Number.MAX_SAFE_INTEGER.toString().length
  // TODO: provide separate class instance to build static http_frame_header_prefix buffer
  #http_frame_header_prefix = new TextEncoder().encode(`HTTP/1.1 200\r
date: ${(new Date()).toUTCString()}\r
content-length: ${'0'.padEnd(this.#content_length_value_size, ' ')}\r
`)
  #http_frame_header_prefix_ptr = get_address(this.#http_frame_header_prefix)
  #http_frame_header_prefix_size = this.#http_frame_header_prefix.byteLength
  #status_code_field_ptr = this.#http_frame_header_prefix_ptr + 9
  #date_field_ptr = this.#status_code_field_ptr + 3 + 8
  #content_length_field_ptr = this.#date_field_ptr + (new Date()).toUTCString().length + 18
  #status_code_field_buf = new Uint8Array(this.#http_frame_header_prefix.buffer,
    this.#status_code_field_ptr - this.#http_frame_header_prefix_ptr,
    3
  )
  #content_length_field_buf = new Uint8Array(this.#http_frame_header_prefix.buffer,
    this.#content_length_field_ptr - this.#http_frame_header_prefix_ptr,
    this.#content_length_value_size
  )

  #update_date_field = () =>
    utf8_encode_into_ptr((new Date()).toUTCString(), this.#date_field_ptr)
  // #last_status_code_value = 200
  #update_status_code_field = (status_code = 200) => {
    // if (status_code === this.#last_status_code_value) return
    // this.#last_status_code_value = status_code
    const buf = this.#status_code_field_buf
    buf[0] = (status_code / 100 | 0) + 48;
    buf[1] = (status_code % 100 / 10 | 0) + 48;
    buf[2] = (status_code % 10) + 48;
  }
  // #last_content_length_value = 0
  #last_content_length_len = 1
  #update_content_length_field = (content_length = 0) => {
    // if (content_length === this.#last_content_length_value) return
    // this.#last_content_length_value = content_length
    const buf = this.#content_length_field_buf
    let n = content_length
    const len = n < 1e1 ? 1 : n < 1e2 ? 2 : n < 1e3 ? 3 : n < 1e4 ? 4 :
          n < 1e5 ? 5 : n < 1e6 ? 6 : n < 1e7 ? 7 : n < 1e8 ? 8 :
          n < 1e9 ? 9 : n < 1e10 ? 10 : n < 1e11 ? 11 : n < 1e12 ? 12 :
          n < 1e13 ? 13 : n < 1e14 ? 14 : n < 1e15 ? 15 : 16;
    for (let i = len - 1, floor = Math.floor; i >= 0; i--) {
        buf[i] = (n % 10) + 48;
        n = floor(n / 10);
    }
    for (let i = len; i < this.#last_content_length_len; i++) {
      buf[i] = 0x20
    }
    this.#last_content_length_len = len
  }
  #stimer_callbacks = [this.#update_date_field]
  #stimer_handler = () => {
    const fns = this.#stimer_callbacks
    for (let i = 0; i < fns.length; i++) fns[i]()
//     console.log(`${CHILD_INDEX}:
// write_frames ${App.write_frames_call_count}_${App.write_frames_total_time}
// read ${App.read_call_count}_${App.read_total_time}
// parse ${App.parse_call_count}_${App.parse_total_time}
// route ${App.route_call_count}_${App.route_total_time}
// `)
//     App.write_frames_total_time = 0
//     App.write_frames_call_count = 0
//     App.read_call_count = 0
//     App.read_total_time = 0
//     App.parse_call_count = 0
//     App.parse_total_time = 0
//     App.route_call_count = 0
//     App.route_total_time = 0
  }
  #stimer = null
  // static time = new Uint32Array(9)
  // static write_frames_total_time = 0
  // static write_frames_call_count = 0
  // static read_total_time = 0
  // static read_call_count = 0
  // static parse_total_time = 0
  // static parse_call_count = 0
  // static route_total_time = 0
  // static route_call_count = 0
  #write_frames(){
    const sockets = Socket.sockets
    const max_fd = sockets.length
    const buf_ptr = this.#buf_ptr
    const write_queue = this.#http_write_queue
    const header_prefix_size = this.#http_frame_header_prefix_size
    const header_prefix_buf = this.#http_frame_header_prefix
    const buf = this.#buf

    // const start = lo.core.times(App.time)
    for (let fd = 0; fd < max_fd; fd++) {
      const arr = write_queue[fd]
      const length = arr.length
      switch(length){
        case 0:
        break
        default:{
          const socket = sockets[fd]
          let size = 0
          for (let i = 0; i < length; i++) {
            const { body, headers, status_code } = arr[i]
            const header_size = header_prefix_size +
              utf8_encode_into_ptr(headers, buf_ptr + size + header_prefix_size)
            const body_size = utf8_encode_into_ptr(body, buf_ptr + size + header_size)

            this.#update_status_code_field(status_code)
            this.#update_content_length_field(body_size)
            // TODO: provide fast way to remove static headers (probably TypedArray.copyWithin)
            buf.set(header_prefix_buf, size)

            size += body_size + header_size
          }
          arr.length = 0
          // TODO: if write fails/is partial store buffer in some array by fd as index
          // TODO: track fd buffered amount (probably close overoffending fds)
          // TODO: track total buffered amount (find and close overoffending fds)
          socket.write(buf_ptr, size)
        break}
      }
    }
    // App.write_frames_total_time += lo.core.times(App.time) - start
    // App.write_frames_call_count++
  }

  /**
   * @param {string} route
   * @param {import('../routing/trie.based.router.js').RouteHandler} handler
   */
  get(route, handler){
    this.router.get(route, handler)
    return this
  }

  /**
   * @param {number} port
   * @param {(fd: number) => void} [on_error]
   */
  listen(port, address = '127.0.0.1', on_error = noop){
    this.#servers.set(port + address,
      new Server(address, port, this.#loop, this.on_socket_readable, on_error))
    return this
  }
  /**
   * @param {number} port
   */
  unlisten(port, address = '127.0.0.1'){
    const server = this.#servers.get(port + address)
    if (!server) return
    server.close()
    this.#servers.delete(port + address)
    return this
  }

  start(){
    this.#loop_started = true
    this.#stimer = new Timer(this.#loop, 1_000, this.#stimer_handler)
    const poll = this.#loop.poll.bind(this.#loop)
    const write_frames = this.#write_frames.bind(this)
    while (this.#loop_started && poll() > 0) write_frames()
    this.#loop_started = false
    this.#stimer?.close()
    return this
  }
  stop(){
    this.#loop_started = false
    return this
  }
  clear(){
    this.stop()
    this.#servers.forEach(v => v.close())
    this.#servers.clear()
    return this
  }
}
