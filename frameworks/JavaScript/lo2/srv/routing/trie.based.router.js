import { Trie } from './trie.js'

const { get_address, latin1_decode } = lo

const encoder = new TextEncoder()

/**@typedef {{ status_code: number, headers: string, body: string }} RouteHandlerParams */
/**@typedef {(socket: import('../apps/app.js').AppSocket, params: Record<string, string>) => -1 | 0} RouteHandler */
/**@typedef {{ path: string, parts: string[], fns: RouteHandler[] }[]} WildcardPathObjects */
/**@typedef {(path: string, fn: RouteHandler) => void} AddStringRouteHandler */
/**@typedef {{ fns: RouteHandler[], parts: Record<string, string> }} FindRouteHandlerResponse */

export class TrieBasedRouter {
  trie = new Trie()
  GET = {
    /**@type {WildcardPathObjects}*/
    wildcardPathObjects: []
  }

  /** @type {AddStringRouteHandler} */
  get(path, fn){
    // console.log(path)
    if (path.includes('*')) {
      const { wildcardPathObjects } = this.GET
      const existingFns = wildcardPathObjects.find((v) => v.path === path)?.fns
      existingFns?.push(fn)
      !existingFns && wildcardPathObjects.push({
        path,
        parts: path.split('*'),
        fns: [fn],
      })
    } else {
      this.get_u8(path, fn)
    }
  }
  /** @type {AddStringRouteHandler} */
  get_u8(path, fn){
    this.get_u8_experimental(path, fn)

    const GET_u8 = encoder.encode('GET')
    this.trie.insert(GET_u8, [], true)
    const GET_node = this.trie.findNode(GET_u8)
    if (!GET_node) throw 'WTF! Trie is broken!'
    const path_u8 = encoder.encode(path)
    GET_node.insert(path_u8, [...GET_node.findNode(path_u8)?.value || [], fn], true)
  }
  /** @type {(method: Uint8Array, path: Uint8Array) => FindRouteHandlerResponse} */
  find_u8(method, path){
    const fns = this.trie.findNode(method)?.findNode(path)?.value
    if (!fns) {
      return this.find_in_wildcards(
        latin1_decode(get_address(method), method.byteLength),
        latin1_decode(get_address(path), path.byteLength))
    }
    return {
      fns: fns,
      parts: {}
    }
  }
  /** @type {AddStringRouteHandler} */
  get_u8_experimental(path, fn){
    const u8 = encoder.encode(`GET ${path}`)
    const node = this.trie.findNode(u8)
    this.trie.insert(u8, [...node?.value || [], fn], true)
  }
  /** @type {(method_n_path: Uint8Array) => FindRouteHandlerResponse} */
  find_u8_experimental(method_n_path){
    const fns = this.trie.findNode(method_n_path)?.value
    if (!fns) {
      const [method, path] = latin1_decode(get_address(method_n_path),
        method_n_path.byteLength).split(' ')
      return this.find_in_wildcards(method, path)
    }
    return {
      fns: fns,
      parts: {}
    }
  }
  /** @type {(method: string, path: string) => FindRouteHandlerResponse} */
  find_in_wildcards(method, path){
    const methodData = this[method]
    if (!methodData) return {
      fns: [],
      parts: {}
    }

    for (let i = 0, wildcardPathObjects = methodData.wildcardPathObjects;
        i < wildcardPathObjects.length; i++) {
      const { parts, fns } = wildcardPathObjects[i]
      const length = parts.length
      if (!length) continue
      if (path.startsWith(parts[0]) && path.endsWith(parts[length - 1])) {
        const startIndex = parts[0].length
        const endIndex = path.length - parts[length - 1].length
        if (length < 3) return {
          fns,
          parts: {
            '*0': path.substring(startIndex, endIndex)
          }
        }


        let index = startIndex
        /**@type {Record<string, string>}*/
        let starParts = {}
        let starPartsCount = 0
        for (let j = 1; j < length; i++) {
          const part = parts[i]
          const partStartIndex = path.indexOf(part)
          if (partStartIndex > index) {
            starParts['*'+ starPartsCount++] = path.substring(index, partStartIndex)
            index = partStartIndex + part.length
            continue
          }

          break;
        }
        if (starPartsCount + 1 == length) return {
          fns,
          parts: starParts
        }
      }
    }

    return {
      fns: [],
      parts: {}
    }
  }
}

export const trieBasedRouter = new TrieBasedRouter()