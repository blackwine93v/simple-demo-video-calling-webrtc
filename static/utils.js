function trace() {
  const now = (window.performance.now() / 1000).toFixed(3);
  const log = console.log;
  log.apply(this, [`%c ${now} `, 'font-style: italic;', ...arguments]);
}

function errorHandler() {
  const log = console.log;
  const [msg, ...args] = arguments;
  log.apply(this, [`%c ${msg} `, 'background: red; color: white; font-weight: 600', ...args]);
  throw new Error(args[0]);
}

function successHandler() {
  const log = console.log;
  const [msg, ...args] = arguments;
  log.apply(this, [`%c ${msg} `, 'background: green; color: white; font-weight: 600', ...args]);
}