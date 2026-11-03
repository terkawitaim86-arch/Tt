
/**
 * ZMB Database Layer
 *
 * Uses Supabase when configured.
 * Falls back to in-memory storage otherwise.
 *
 * IMPORTANT:
 * In-memory data is lost when the bot restarts.
 */

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const hasSupabase =
  typeof supabaseUrl === 'string' &&
  typeof supabaseKey === 'string' &&
  supabaseUrl.startsWith('https://') &&
  supabaseKey.length > 0;

let supabase = null;

if (hasSupabase) {
  try {
    const { createClient } = require('@supabase/supabase-js');

    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('[DB] Using Supabase');
  } catch (error) {
    console.error('[DB] Supabase initialization failed:', error.message);
  }
}

if (!supabase) {
  console.log('[DB] Using in-memory database (data resets on restart)');
}

// --------------------------------------------------
// IN-MEMORY DATABASE
// --------------------------------------------------

const memory = new Map();

function ensureTable(name) {
  if (!memory.has(name)) {
    memory.set(name, []);
  }

  return memory.get(name);
}

function matchRow(row, filters) {
  return filters.every(([key, operator, value]) => {
    switch (operator) {
      case 'eq':
        return row[key] === value;

      case 'in':
        return Array.isArray(value) && value.includes(row[key]);

      case 'lte':
        return row[key] <= value;

      default:
        return false;
    }
  });
}

function projectColumns(row, columns) {
  if (!row || !columns || columns.trim() === '*') {
    return row;
  }

  const keys = columns.split(',').map((key) => key.trim());

  const result = {};

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      result[key] = row[key];
    }
  }

  return result;
}

function createMemoryQuery(table) {
  const state = {
    filters: [],
    orderBy: null,
    limitN: null,
    single: false,
    maybeSingle: false,
    selectCols: '*',
    payload: null,
    method: 'select',
    returning: false,
    onConflict: null,
  };

  const api = {
    select(columns = '*') {
      state.selectCols = columns;
      state.returning = state.method !== 'select';
      return api;
    },

    insert(payload) {
      state.method = 'insert';
      state.payload = payload;
      return api;
    },

    upsert(payload, options = {}) {
      state.method = 'upsert';
      state.payload = payload;
      state.onConflict = options.onConflict || null;
      return api;
    },

    update(payload) {
      state.method = 'update';
      state.payload = payload;
      return api;
    },

    delete() {
      state.method = 'delete';
      return api;
    },

    eq(key, value) {
      state.filters.push([key, 'eq', value]);
      return api;
    },

    in(key, values) {
      state.filters.push([key, 'in', values]);
      return api;
    },

    lte(key, value) {
      state.filters.push([key, 'lte', value]);
      return api;
    },

    order(column, options = {}) {
      state.orderBy = {
        column,
        ascending: options.ascending !== false,
      };

      return api;
    },

    limit(number) {
      state.limitN = Math.max(0, Number(number) || 0);
      return api;
    },

    single() {
      state.single = true;
      return api;
    },

    maybeSingle() {
      state.maybeSingle = true;
      return api;
    },

    then(resolve, reject) {
      return Promise.resolve()
        .then(run)
        .then(resolve, reject);
    },
  };

  function formatResult(rows, error = null) {
    if (error) {
      return { data: null, error };
    }

    const projected = rows.map((row) =>
      projectColumns(row, state.selectCols)
    );

    if (state.single || state.maybeSingle) {
      if (projected.length === 0 && state.single) {
        return {
          data: null,
          error: { message: 'No rows found' },
        };
      }

      if (projected.length > 1) {
        return {
          data: null,
          error: { message: 'Multiple rows returned' },
        };
      }

      return {
        data: projected[0] || null,
        error: null,
      };
    }

    return {
      data: projected,
      error: null,
    };
  }

  function run() {
    const rows = ensureTable(table);

    // SELECT
    if (state.method === 'select') {
      let result = rows.filter((row) =>
        matchRow(row, state.filters)
      );

      if (state.orderBy) {
        const { column, ascending } = state.orderBy;

        result = result.slice().sort((a, b) => {
          if (a[column] < b[column]) return ascending ? -1 : 1;
          if (a[column] > b[column]) return ascending ? 1 : -1;
          return 0;
        });
      }

      if (state.limitN !== null) {
        result = result.slice(0, state.limitN);
      }

      return formatResult(result);
    }

    // INSERT
    if (state.method === 'insert') {
      const list = Array.isArray(state.payload)
        ? state.payload
        : [state.payload];

      const inserted = list.map((item) => {
        const row = {
          id: item.id || createId(),
          created_at: item.created_at || new Date().toISOString(),
          ...item,
        };

        rows.push(row);
        return row;
      });

      return state.returning
        ? formatResult(inserted)
        : { data: null, error: null };
    }

    // UPSERT
    if (state.method === 'upsert') {
      const list = Array.isArray(state.payload)
        ? state.payload
        : [state.payload];

      const results = [];

      for (const item of list) {
        const conflictKeys = state.onConflict
          ? state.onConflict.split(',').map((key) => key.trim())
          : item.guild_id != null && item.user_id != null
            ? ['guild_id', 'user_id']
            : item.guild_id != null
              ? ['guild_id']
              : ['id'];

        const index = rows.findIndex((existing) =>
          conflictKeys.every((key) =>
            existing[key] === item[key]
          )
        );

        if (index >= 0) {
          rows[index] = {
            ...rows[index],
            ...item,
          };

          results.push(rows[index]);
        } else {
          const row = {
            id: item.id || createId(),
            created_at: item.created_at || new Date().toISOString(),
            ...item,
          };

          rows.push(row);
          results.push(row);
        }
      }

      return {
        data: state.returning
          ? results.map((row) => projectColumns(row, state.selectCols))
          : null,
        error: null,
      };
    }

    // UPDATE
    if (state.method === 'update') {
      const updated = [];

      for (let i = 0; i < rows.length; i++) {
        if (matchRow(rows[i], state.filters)) {
          rows[i] = {
            ...rows[i],
            ...state.payload,
          };

          updated.push(rows[i]);
        }
      }

      return state.returning
        ? formatResult(updated)
        : { data: null, error: null };
    }

    // DELETE
    if (state.method === 'delete') {
      const deleted = [];
      const kept = [];

      for (const row of rows) {
        if (matchRow(row, state.filters)) {
          deleted.push(row);
        } else {
          kept.push(row);
        }
      }

      memory.set(table, kept);

      return state.returning
        ? formatResult(deleted)
        : { data: null, error: null };
    }

    return {
      data: null,
      error: { message: 'Unknown database operation' },
    };
  }

  return api;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const memoryClient = {
  from(table) {
    if (typeof table !== 'string' || !table.trim()) {
      throw new Error('Invalid database table name');
    }

    return createMemoryQuery(table);
  },
};

module.exports = supabase || memoryClient;
