const { getenv } = lo

export const PWD = getenv('PWD')
export const SERVER_ROOT_DIR = getenv('SERVER_ROOT_DIR')
export const CPUS = +getenv('CPUS')
export const CHILD_INDEX = +getenv('CHILD_INDEX')
