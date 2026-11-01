/**
 * In-memory stand-in for the Supabase client.
 *
 * Every util in src/utils requires './db' once at load time, so tests replace
 * that module in the require cache before loading anything else. Behaviour per
 * table is supplied by the test through `state.handlers`.
 */
const dbPath = require.resolve('../../src/utils/db.js');

function createMockSupabase() {
  const state = { handlers: {}, calls: [] };

  function resolve(table, ops) {
    const handler = state.handlers[table];
    let result = { data: null, error: null };
    if (typeof handler === 'function') {
      result = handler({ table, ops }) || result;
    }
    return Promise.resolve(result);
  }

  function makeBuilder(table) {
    const ops = [];
    const builder = {
      select(cols) { ops.push({ op: 'select', args: [cols] }); return builder; },
      insert(value) { ops.push({ op: 'insert', args: [value] }); return builder; },
      upsert(value, options) { ops.push({ op: 'upsert', args: [value, options] }); return builder; },
      update(value) { ops.push({ op: 'update', args: [value] }); return builder; },
      delete() { ops.push({ op: 'delete' }); return builder; },
      eq(column, value) { ops.push({ op: 'eq', args: [column, value] }); return builder; },
      neq(column, value) { ops.push({ op: 'neq', args: [column, value] }); return builder; },
      lte(column, value) { ops.push({ op: 'lte', args: [column, value] }); return builder; },
      gte(column, value) { ops.push({ op: 'gte', args: [column, value] }); return builder; },
      lt(column, value) { ops.push({ op: 'lt', args: [column, value] }); return builder; },
      order(column, options) { ops.push({ op: 'order', args: [column, options] }); return builder; },
      limit(count) { ops.push({ op: 'limit', args: [count] }); return builder; },
      maybeSingle() { ops.push({ op: 'maybeSingle' }); return resolve(table, ops); },
      single() { ops.push({ op: 'single' }); return resolve(table, ops); },
      then(onFulfilled, onRejected) { return resolve(table, ops).then(onFulfilled, onRejected); },
      catch(onRejected) { return resolve(table, ops).catch(onRejected); },
    };
    return builder;
  }

  const supabase = {
    from(table) {
      state.calls.push({ table });
      return makeBuilder(table);
    },
    rpc(name, args) {
      const ops = [{ op: 'rpc', args: [name, args] }];
      state.calls.push({ table: `rpc:${name}`, ops });
      return {
        then(onFulfilled, onRejected) { return resolve(`rpc:${name}`, ops).then(onFulfilled, onRejected); },
        catch(onRejected) { return resolve(`rpc:${name}`, ops).catch(onRejected); },
      };
    },
  };

  return { supabase, state };
}

const default_ = createMockSupabase();

/** Install the shared mock into the require cache (idempotent). */
function installMockDb() {
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: default_.supabase,
    children: [],
    paths: [],
  };
  return default_;
}

/** Reset handlers and recorded calls between tests. */
function resetMockDb() {
  default_.state.handlers = {};
  default_.state.calls = [];
  return default_;
}

module.exports = { installMockDb, resetMockDb, createMockSupabase, mockDb: default_ };
