import { Loop } from 'lib/loop.js'
// import { App } from './app.js'

// TODO: generate handler with relevant steps
/**
 * @param {import('../sockets/socket.js').Socket} socket
 * @param {(socket: import('../sockets/socket.js').Socket, parsed_bytes: i32) => 0 | -1} on_request
 */
export function on_socket_readable (on_request, socket) {
  /** @type {0 | -1} */
  let rc = -1
  // const start = lo.core.times(App.time)
  let bytes_to_parse = socket.read()
  switch (bytes_to_parse) {
    case 0:
    break
    case -1:
      rc = lo.errno === Loop.Blocked ? 0 : -1
    break
    default: {
      const { parser } = socket
      const parse = parser.parse.bind(parser)
      do {
        rc = -1
        const parsed_bytes = parse(bytes_to_parse)
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
            rc = on_request(socket, parsed_bytes)
          break
          }
        }
      } while(bytes_to_parse > 0)
      break
    }
  }
  // App.route_total_time += lo.core.times(App.time) - start
  // App.route_call_count++
  return rc
}
