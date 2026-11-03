/** Currency of every price in the catalog. Prices are whole NT$ (no minor units). */
export const CURRENCY = 'TWD';

/** Highest quantity allowed for a single cart line / checkout line. */
export const MAX_QUANTITY = 99;

/** Highest number of distinct lines allowed in one checkout request. */
export const MAX_CHECKOUT_LINES = 50;

/** Longest accepted product search string. */
export const MAX_SEARCH_LENGTH = 100;

export const ORDER_STATUS_SIMULATED = 'SIMULATED';

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
