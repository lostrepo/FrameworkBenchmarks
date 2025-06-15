import './srv/modify.module.loader.js';

const { getenv } = lo

import(+getenv('CHILD') === 1 ? './srv/http.js' : './srv/start.children.js')
