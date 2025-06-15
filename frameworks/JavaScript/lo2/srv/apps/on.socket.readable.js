import { Loop } from 'lib/loop.js'

const { ptr, core: { memcpy } } = lo
const buffered = ptr(new Uint8Array(16 * 1024 * 1024))
let buffered_size = 0
const buffered_write = (ptr, size) => {
  memcpy(buffered.ptr + buffered_size, ptr, size)
  buffered_size += size
  return size
}

// TODO: generate handler with relevant steps
/**
 * @param {import('../sockets/socket.js').Socket} socket
 * @param {(socket: import('../sockets/socket.js').Socket, parsed_bytes: i32) => 0 | -1} on_request
 */
export function on_socket_readable (on_request, socket) {
  /** @type {0 | -1} */
  let rc = -1
  const read_bytes = socket.read()
  switch (read_bytes) {
    case 0:
    break
    case -1:
      rc = lo.errno === Loop.Blocked ? 0 : -1
    break
    default: {
      const { parser } = socket
      let bytes_to_parse = read_bytes
      const old_write = socket.write
      socket.write = buffered_write

      // TODO: replace with batch parsing
      // and maybe pass Request, Response pair into on_request handler
      do {
        const parsed_bytes = parser.parse()
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
            // TODO: and maybe replace on_request with batch routing + batch handler calling
            rc = on_request(socket, parsed_bytes)
          break
          }
        }
      } while(bytes_to_parse > 0)

      socket.write = old_write
      socket.write(buffered.ptr, buffered_size)
      buffered_size = 0
      break
    }
  }
  return rc
}
