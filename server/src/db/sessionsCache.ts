import NodeCache from "node-cache";

const sessionsCache = new NodeCache({
  stdTTL: 30 * 60, // 30 minutes,
  useClones: false,
  checkperiod: 60, // 1 minute
  deleteOnExpire: true,
  maxKeys: -1,
  errorOnMissing: false,
});

export default sessionsCache;
