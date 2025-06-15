const { ptr, latin1Decode } = lo
const { parse_request } = lo.load('pico').pico

const rx = /-/g

// based on output from pico.requestparser.template.js
// has modifications
export class RequestParser {
  /**@type {Ptr<Uint32Array>}*/
  #ab = /**@type {any}*/(null)
  /**@type {Ptr<Uint8Array>}*/
  rb = /**@type {any}*/(null)

  constructor (rb,n_headers=18) {
    this.rb = rb
    this.#ab = ptr(new Uint32Array(14+n_headers*8))
    this.#ab[12] = n_headers
  }

   parse(len=this.rb.size){
     this.#ab[10] =
     this.#ab[12]
     const ptr = this.#ab.ptr
     return parse_request(this.rb.ptr,len,ptr+0,ptr+8,ptr+16,ptr+24,ptr+32,ptr+56,ptr+40,0)
   }

   get method_u8_view () {
     const { rb } = this
     const offset = this.#ab[0] + 4294967296 * this.#ab[1] - rb.ptr
     return rb.subarray(offset,offset+this.#ab[2])
   }

   get path_u8_view () {
     const { rb } = this
     const offset = this.#ab[4] + 4294967296 * this.#ab[5] - rb.ptr
     return rb.subarray(offset,offset+this.#ab[6])
   }

   get method () {
     const method_address = this.#ab[0] + 4294967296 * this.#ab[1]
     return latin1Decode(method_address,this.#ab[2])
   }

   get path () {
     const path_address = this.#ab[4] + 4294967296 * this.#ab[5]
     return latin1Decode(path_address,this.#ab[6])
   }

   get minor_version () {
     return this.#ab[8]
   }

   get num_headers () {
     return this.#ab[10]
   }

   get headers () {
     const nhead = this.#ab[10]
     const raw_headers = this.#ab
     let n = 14
     const result = {}
     for (let i=0;i<nhead;i++) {
     const key_address = raw_headers[n] + 4294967296 * raw_headers[n+1]
     const key_len = raw_headers[n+2]
     const val_address = raw_headers[n+4] + 4294967296 * raw_headers[n+5]
     const val_len = raw_headers[n+6]
     const key_string = latin1Decode(key_address,key_len).toLowerCase().replace(rx,'_')
     const val_string = latin1Decode(val_address,val_len)
     result[key_string] = val_string
     n += 8
     }
     return result
   }
}