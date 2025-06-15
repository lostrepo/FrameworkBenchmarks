export const log = (o) => console
  .log(Object.getOwnPropertyNames(o).map(v => `${v}: ${o[v]}`).join('\n'))
