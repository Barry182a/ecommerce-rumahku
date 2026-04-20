'use server';

import { prisma } from '@/src/lib/prisma';
import { Prisma } from '@prisma/client';

type GenderIntent = 'wanita' | 'pria' | null;
type RootIntent = keyof typeof ROOT_FAMILY_TERMS | null;

type SearchIntent = {
  normalizedKeyword: string;
  rawTokens: string[];
  textTokens: string[];
  genderIntent: GenderIntent;
  warnaFilter: string | null;
  ukuranFilter: string | null;
  rootIntent: RootIntent;
};

const PRODUCT_SEARCH_FIELDS: Prisma.Sql[] = [
  Prisma.sql`LOWER(p.nama)`,
  Prisma.sql`LOWER(COALESCE(p.keywords, ''))`,
  Prisma.sql`LOWER(c.nama)`,
];

const VARIANT_COLOR_FIELD = Prisma.sql`LOWER(COALESCE(v.warna, ''))`;
const VARIANT_SIZE_FIELD = Prisma.sql`LOWER(COALESCE(v.ukuran, ''))`;

const STOPWORDS = new Set([
  'warna',
  'ukuran',
  'size',
  'model',
  'untuk',
  'dan',
  'yang',
  'dengan',
  'buat',
  'cari',
  'produk',
]);

const COLOR_ALIASES: Record<string, string> = {
  hitam: 'hitam',
  black: 'hitam',
  putih: 'putih',
  white: 'putih',
  merah: 'merah',
  red: 'merah',
  biru: 'biru',
  blue: 'biru',
  hijau: 'hijau',
  green: 'hijau',
  abu: 'abu',
  grey: 'abu',
  gray: 'abu',
  coklat: 'coklat',
  brown: 'coklat',
  krem: 'krem',
  cream: 'krem',
  navy: 'navy',
  beige: 'beige',
};

const SIZE_ALIASES: Record<string, string> = {
  xs: 'xs',
  s: 's',
  m: 'm',
  l: 'l',
  xl: 'xl',
  xxl: 'xxl',
  xxxl: 'xxxl',
  '36': '36',
  '37': '37',
  '38': '38',
  '39': '39',
  '40': '40',
  '41': '41',
  '42': '42',
  '43': '43',
  '44': '44',
  '45': '45',
};

const ROOT_TRIGGER_TOKENS = {
  pakaian: ['pakaian', 'baju', 'busana'],
  sepatu: ['sepatu', 'footwear'],
  tas: ['tas', 'bag'],
} as const;

const ROOT_FAMILY_TERMS = {
  pakaian: [
    'pakaian',
    'baju',
    'kaos',
    'kemeja',
    'blus',
    'blouse',
    'tunik',
    'dress',
    'gamis',
    'rok',
    'celana',
    'jaket',
    'hoodie',
    'sweater',
    'cardigan',
    'outer',
    'abaya',
    'legging',
    'kulot',
    'atasan',
    'bawahan',
    'setelan',
    'rompi',
    'tshirt',
    'shirt',
  ],
  sepatu: [
    'sepatu',
    'sandal',
    'sneaker',
    'sneakers',
    'heels',
    'boot',
    'boots',
    'loafer',
    'flat',
    'running',
  ],
  tas: [
    'tas',
    'handbag',
    'tote',
    'totebag',
    'sling',
    'slingbag',
    'backpack',
    'ransel',
    'clutch',
    'shoulder bag',
  ],
} as const;

const DB_GENDER_TERMS = {
  wanita: ['wanita', 'perempuan', 'cewek', 'ladies', 'female', 'women'],
  pria: ['pria', 'laki laki', 'laki-laki', 'lakilaki', 'cowok', 'male', 'men'],
} as const;

function normalizeKeyword(keyword: string) {
  return keyword
    .toLowerCase()
    .replace(/[\/_-]+/g, ' ')
    .replace(/\b(perempuan|cewek|wanita|ladies|women|female)\b/g, 'wanita')
    .replace(/\b(laki laki|laki-laki|lakilaki|cowok|pria|male|men)\b/g, 'pria')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findRootIntent(token: string): RootIntent {
  for (const [intent, aliases] of Object.entries(ROOT_TRIGGER_TOKENS) as [
    keyof typeof ROOT_TRIGGER_TOKENS,
    readonly string[],
  ][]) {
    if (aliases.includes(token)) {
      return intent;
    }
  }

  return null;
}

function parseSearchIntent(keyword: string): SearchIntent {
  const normalizedKeyword = normalizeKeyword(keyword);
  const rawTokens = normalizedKeyword.split(' ').filter(Boolean).slice(0, 8);

  const hasWanita = rawTokens.includes('wanita');
  const hasPria = rawTokens.includes('pria');

  let genderIntent: GenderIntent = null;
  if (hasWanita && !hasPria) genderIntent = 'wanita';
  if (hasPria && !hasWanita) genderIntent = 'pria';

  let warnaFilter: string | null = null;
  let ukuranFilter: string | null = null;
  let rootIntent: RootIntent = null;

  const textTokens: string[] = [];

  for (const token of rawTokens) {
    if (token === 'wanita' || token === 'pria') continue;

    const normalizedColor = COLOR_ALIASES[token];
    if (!warnaFilter && normalizedColor) {
      warnaFilter = normalizedColor;
      continue;
    }

    const normalizedSize = SIZE_ALIASES[token];
    if (!ukuranFilter && normalizedSize) {
      ukuranFilter = normalizedSize;
      continue;
    }

    const matchedRoot = findRootIntent(token);
    if (!rootIntent && matchedRoot) {
      rootIntent = matchedRoot;
      continue;
    }

    if (STOPWORDS.has(token)) continue;

    textTokens.push(token);
  }

  return {
    normalizedKeyword,
    rawTokens,
    textTokens: Array.from(new Set(textTokens)),
    genderIntent,
    warnaFilter,
    ukuranFilter,
    rootIntent,
  };
}

function buildLikeAnyFieldSql(fields: Prisma.Sql[], term: string): Prisma.Sql {
  const likeValue = `%${term}%`;
  const clauses = fields.map((field) => Prisma.sql`${field} LIKE ${likeValue}`);
  return Prisma.sql`(${Prisma.join(clauses, ' OR ')})`;
}

function escapeRegexLiteral(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegexAnyFieldSql(fields: Prisma.Sql[], terms: readonly string[]): Prisma.Sql {
  const clauses = terms.map((term) => {
    const pattern = `(^|[^a-z0-9])${escapeRegexLiteral(term)}([^a-z0-9]|$)`;
    const fieldClauses = fields.map((field) => Prisma.sql`${field} ~ ${pattern}`);
    return Prisma.sql`(${Prisma.join(fieldClauses, ' OR ')})`;
  });

  return clauses.length > 0
    ? Prisma.sql`(${Prisma.join(clauses, ' OR ')})`
    : Prisma.sql`FALSE`;
}

function buildMatchAnyTermsSql(fields: Prisma.Sql[], terms: readonly string[]): Prisma.Sql {
  const clauses = terms.map((term) => buildLikeAnyFieldSql(fields, term));
  return clauses.length > 0
    ? Prisma.sql`(${Prisma.join(clauses, ' OR ')})`
    : Prisma.sql`FALSE`;
}

function buildTextTokenMatchSql(token: string): Prisma.Sql {
  return buildLikeAnyFieldSql(PRODUCT_SEARCH_FIELDS, token);
}
function buildNameLikeSql(term: string): Prisma.Sql {
  return Prisma.sql`LOWER(p.nama) LIKE ${`%${term}%`}`;
}

function buildNameRegexSql(term: string): Prisma.Sql {
  const pattern = `(^|[^a-z0-9])${escapeRegexLiteral(term)}([^a-z0-9]|$)`;
  return Prisma.sql`LOWER(p.nama) ~ ${pattern}`;
}
function buildWholeTokenSql(field: Prisma.Sql, term: string): Prisma.Sql {
  const pattern = `(^|[^a-z0-9])${escapeRegexLiteral(term)}([^a-z0-9]|$)`;
  return Prisma.sql`${field} ~ ${pattern}`;
}

function buildWholeTokenAnyFieldSql(fields: Prisma.Sql[], term: string): Prisma.Sql {
  const clauses = fields.map((field) => buildWholeTokenSql(field, term));
  return Prisma.sql`(${Prisma.join(clauses, ' OR ')})`;
}

function buildNameMatchCountSql(tokens: string[]): Prisma.Sql {
  if (tokens.length === 0) return Prisma.sql`0`;

  const parts = tokens.map((token) => Prisma.sql`
    CASE WHEN ${buildNameLikeSql(token)} THEN 1 ELSE 0 END
  `);

  return Prisma.sql`(${Prisma.join(parts, ' + ')})`;
}

function buildNameAllTokensSql(tokens: string[]): Prisma.Sql {
  if (tokens.length === 0) return Prisma.sql`FALSE`;

  const clauses = tokens.map((token) => buildNameLikeSql(token));
  return Prisma.sql`(${Prisma.join(clauses, ' AND ')})`;
}

function buildNameScoreSql(tokens: string[]): Prisma.Sql {
  if (tokens.length === 0) return Prisma.sql`0`;

  const parts = tokens.map((token) => Prisma.sql`
    (
      CASE WHEN LOWER(p.nama) = ${token} THEN 40 ELSE 0 END +
      CASE WHEN ${buildNameRegexSql(token)} THEN 28 ELSE 0 END +
      CASE WHEN ${buildNameLikeSql(token)} THEN 22 ELSE 0 END
    )
  `);

  return Prisma.sql`(${Prisma.join(parts, ' + ')})`;
}
function buildColorMismatchPenaltySql(warnaFilter: string | null): Prisma.Sql {
  if (!warnaFilter) return Prisma.sql`0`;

  const otherColors = Object.values(COLOR_ALIASES)
    .filter((color, index, arr) => color !== warnaFilter && arr.indexOf(color) === index);

  if (otherColors.length === 0) return Prisma.sql`0`;

  const targetInAnyField = Prisma.sql`(
    LOWER(p.nama) LIKE ${`%${warnaFilter}%`}
    OR LOWER(COALESCE(p.keywords, '')) LIKE ${`%${warnaFilter}%`}
    OR ${VARIANT_COLOR_FIELD} LIKE ${`%${warnaFilter}%`}
  )`;

  const otherColorInName = otherColors.map((color) =>
    Prisma.sql`LOWER(p.nama) LIKE ${`%${color}%`}`
  );

  return Prisma.sql`
    CASE
      WHEN NOT ${targetInAnyField} AND (${Prisma.join(otherColorInName, ' OR ')}) THEN -35
      ELSE 0
    END
  `;
}

function buildSizeMismatchPenaltySql(ukuranFilter: string | null): Prisma.Sql {
  if (!ukuranFilter) return Prisma.sql`0`;

  const targetInAnyField = Prisma.sql`(
    ${buildWholeTokenSql(Prisma.sql`LOWER(p.nama)`, ukuranFilter)}
    OR ${buildWholeTokenSql(Prisma.sql`LOWER(COALESCE(p.keywords, ''))`, ukuranFilter)}
    OR ${VARIANT_SIZE_FIELD} = ${ukuranFilter}
    OR ${VARIANT_SIZE_FIELD} LIKE ${`%${ukuranFilter}%`}
  )`;

  return Prisma.sql`
    CASE
      WHEN NOT ${targetInAnyField} THEN -28
      ELSE 0
    END
  `;
}

function buildTextMatchCountSql(tokens: string[]): Prisma.Sql {
  if (tokens.length === 0) {
    return Prisma.sql`0`;
  }

  const parts = tokens.map((token) => Prisma.sql`
    CASE WHEN ${buildTextTokenMatchSql(token)} THEN 1 ELSE 0 END
  `);

  return Prisma.sql`(${Prisma.join(parts, ' + ')})`;
}

function buildTextScoreSql(tokens: string[]): Prisma.Sql {
  if (tokens.length === 0) {
    return Prisma.sql`0`;
  }

  const parts = tokens.map((token) => {
    const likeValue = `%${token}%`;

    return Prisma.sql`
      (
        CASE WHEN LOWER(p.nama) LIKE ${likeValue} THEN 18 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(p.keywords, '')) LIKE ${likeValue} THEN 12 ELSE 0 END +
        CASE WHEN LOWER(c.nama) LIKE ${likeValue} THEN 8 ELSE 0 END
      )
    `;
  });

  return Prisma.sql`(${Prisma.join(parts, ' + ')})`;
}

function buildGenderSql(genderIntent: GenderIntent): {
  targetExpr: Prisma.Sql | null;
  oppositeExpr: Prisma.Sql | null;
  guardExpr: Prisma.Sql | null;
} {
  if (!genderIntent) {
    return {
      targetExpr: null,
      oppositeExpr: null,
      guardExpr: null,
    };
  }

  const oppositeGender = genderIntent === 'wanita' ? 'pria' : 'wanita';
  const targetExpr = buildRegexAnyFieldSql(PRODUCT_SEARCH_FIELDS, DB_GENDER_TERMS[genderIntent]);
  const oppositeExpr = buildRegexAnyFieldSql(PRODUCT_SEARCH_FIELDS, DB_GENDER_TERMS[oppositeGender]);

  return {
    targetExpr,
    oppositeExpr,
    guardExpr: Prisma.sql`(${targetExpr} OR NOT (${oppositeExpr}))`,
  };
}

function buildRootFamilySql(rootIntent: RootIntent): Prisma.Sql | null {
  if (!rootIntent) return null;
  return buildMatchAnyTermsSql(PRODUCT_SEARCH_FIELDS, ROOT_FAMILY_TERMS[rootIntent]);
}

function buildColorIntentSql(warnaFilter: string | null): Prisma.Sql | null {
  if (!warnaFilter) return null;

  return Prisma.sql`(
    ${VARIANT_COLOR_FIELD} = ${warnaFilter}
    OR ${VARIANT_COLOR_FIELD} LIKE ${`%${warnaFilter}%`}
    OR LOWER(p.nama) LIKE ${`%${warnaFilter}%`}
    OR LOWER(COALESCE(p.keywords, '')) LIKE ${`%${warnaFilter}%`}
  )`;
}

function buildSizeFilterSql(ukuranFilter: string | null): Prisma.Sql | null {
  if (!ukuranFilter) return null;

  return Prisma.sql`(
    ${VARIANT_SIZE_FIELD} = ${ukuranFilter}
    OR ${VARIANT_SIZE_FIELD} LIKE ${`%${ukuranFilter}%`}
    OR ${buildWholeTokenSql(Prisma.sql`LOWER(p.nama)`, ukuranFilter)}
    OR ${buildWholeTokenSql(Prisma.sql`LOWER(COALESCE(p.keywords, ''))`, ukuranFilter)}
  )`;
}

function getMinimumTextMatches(textTokens: string[]) {
  if (textTokens.length <= 1) return textTokens.length;
  if (textTokens.length === 2) return 2;
  return 2;
}

async function runMainSearch(intent: SearchIntent, minTextMatches: number, limit = 20) {
  const textMatchCountExpr = buildTextMatchCountSql(intent.textTokens);
  const textScoreExpr = buildTextScoreSql(intent.textTokens);
  const nameMatchCountExpr = buildNameMatchCountSql(intent.textTokens);
  const nameAllTokensExpr = buildNameAllTokensSql(intent.textTokens);
  const nameScoreExpr = buildNameScoreSql(intent.textTokens);
  const colorMismatchPenaltyExpr = buildColorMismatchPenaltySql(intent.warnaFilter);
  const sizeMismatchPenaltyExpr = buildSizeMismatchPenaltySql(intent.ukuranFilter);
  const genderSql = buildGenderSql(intent.genderIntent);
  const rootFamilyExpr = buildRootFamilySql(intent.rootIntent);
  const colorIntentExpr = buildColorIntentSql(intent.warnaFilter);
  const sizeFilterExpr = buildSizeFilterSql(intent.ukuranFilter);

  const filters: Prisma.Sql[] = [];

  if (intent.textTokens.length > 0) {
    filters.push(
      Prisma.sql`(
      ${nameMatchCountExpr} >= ${Math.max(1, Math.min(minTextMatches, 2))}
      OR ${textMatchCountExpr} >= ${minTextMatches}
    )`
    );
  }

  if (rootFamilyExpr) {
    filters.push(rootFamilyExpr);
  }

  if (genderSql.guardExpr) {
    filters.push(genderSql.guardExpr);
  }

  if (colorIntentExpr) {
    filters.push(colorIntentExpr);
  }

  if (sizeFilterExpr) {
    filters.push(sizeFilterExpr);
  }

  if (filters.length === 0) {
    return [];
  }

  const scoreParts: Prisma.Sql[] = [Prisma.sql`0`];

  if (intent.textTokens.length > 0) {
    scoreParts.push(nameScoreExpr);
    scoreParts.push(Prisma.sql`(${nameMatchCountExpr}) * 18`);
    scoreParts.push(textScoreExpr);
    scoreParts.push(Prisma.sql`(${textMatchCountExpr}) * 6`);
    scoreParts.push(
      Prisma.sql`CASE WHEN ${nameAllTokensExpr} THEN 45 ELSE 0 END`
    );
  }

  if (intent.normalizedKeyword) {
    scoreParts.push(
      Prisma.sql`CASE WHEN LOWER(p.nama) = ${intent.normalizedKeyword} THEN 50 ELSE 0 END`,
      Prisma.sql`CASE WHEN LOWER(p.nama) LIKE ${`%${intent.normalizedKeyword}%`} THEN 20 ELSE 0 END`,
    );
  }

  if (rootFamilyExpr) {
    scoreParts.push(Prisma.sql`CASE WHEN ${rootFamilyExpr} THEN 15 ELSE 0 END`);
  }

  if (genderSql.targetExpr) {
    scoreParts.push(Prisma.sql`CASE WHEN ${genderSql.targetExpr} THEN 25 ELSE 0 END`);
  }

  if (genderSql.oppositeExpr) {
    scoreParts.push(Prisma.sql`CASE WHEN ${genderSql.oppositeExpr} THEN -40 ELSE 0 END`);
  }

  if (intent.warnaFilter) {
    scoreParts.push(
      Prisma.sql`
      CASE
        WHEN LOWER(p.nama) LIKE ${`%${intent.warnaFilter}%`} THEN 30
        WHEN ${VARIANT_COLOR_FIELD} = ${intent.warnaFilter} THEN 22
        WHEN ${VARIANT_COLOR_FIELD} LIKE ${`%${intent.warnaFilter}%`} THEN 14
        WHEN LOWER(COALESCE(p.keywords, '')) LIKE ${`%${intent.warnaFilter}%`} THEN 10
        ELSE 0
      END
    `
    );
  }

  if (intent.ukuranFilter) {
    scoreParts.push(
      Prisma.sql`
      CASE
        WHEN ${buildWholeTokenSql(Prisma.sql`LOWER(p.nama)`, intent.ukuranFilter)} THEN 26
        WHEN ${VARIANT_SIZE_FIELD} = ${intent.ukuranFilter} THEN 15
        WHEN ${VARIANT_SIZE_FIELD} LIKE ${`%${intent.ukuranFilter}%`} THEN 8
        WHEN ${buildWholeTokenSql(Prisma.sql`LOWER(COALESCE(p.keywords, ''))`, intent.ukuranFilter)} THEN 6
        ELSE 0
      END
    `
    );
  }
  scoreParts.push(colorMismatchPenaltyExpr);
  scoreParts.push(sizeMismatchPenaltyExpr);

  const scoreExpr = Prisma.sql`GREATEST(0, ${Prisma.join(scoreParts, ' + ')})`;

  return prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      p.id,
      p."kodeUnik",
      p.nama,
      p."hargaDasar",
      p."fotoUtama",
      p."categoryId",
      MAX(${scoreExpr}) AS score
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    LEFT JOIN "ProductVariant" v ON v."productId" = p.id
    WHERE ${Prisma.join(filters, ' AND ')}
    GROUP BY p.id, p."kodeUnik", p.nama, p."hargaDasar", p."fotoUtama", p."categoryId"
    ORDER BY score DESC, p.nama ASC
    LIMIT ${limit}
  `);
}

async function runFuzzySearch(intent: SearchIntent, limit = 10) {
  const fuzzyNeedle =
    intent.textTokens.length > 0
      ? intent.textTokens.join(' ')
      : [intent.rootIntent, intent.genderIntent, intent.warnaFilter, intent.ukuranFilter]
        .filter(Boolean)
        .join(' ');

  if (!fuzzyNeedle) {
    return [];
  }
  const genderSql = buildGenderSql(intent.genderIntent);
  const rootFamilyExpr = buildRootFamilySql(intent.rootIntent);
  const colorIntentExpr = buildColorIntentSql(intent.warnaFilter);
  const sizeFilterExpr = buildSizeFilterSql(intent.ukuranFilter);

  const filters: Prisma.Sql[] = [
    Prisma.sql`(
      word_similarity(${fuzzyNeedle}, LOWER(p.nama)) > 0.35
      OR word_similarity(${fuzzyNeedle}, LOWER(COALESCE(p.keywords, ''))) > 0.35
      OR word_similarity(${fuzzyNeedle}, LOWER(c.nama)) > 0.35
    )`,
  ];

  if (rootFamilyExpr) {
    filters.push(rootFamilyExpr);
  }

  if (genderSql.guardExpr) {
    filters.push(genderSql.guardExpr);
  }

  if (colorIntentExpr) {
    filters.push(colorIntentExpr);
  }

  if (sizeFilterExpr) {
    filters.push(sizeFilterExpr);
  }

  const scoreParts: Prisma.Sql[] = [
    Prisma.sql`
      GREATEST(
        word_similarity(${fuzzyNeedle}, LOWER(p.nama)) * 40,
        word_similarity(${fuzzyNeedle}, LOWER(COALESCE(p.keywords, ''))) * 28,
        word_similarity(${fuzzyNeedle}, LOWER(c.nama)) * 22
      )
    `,
  ];

  if (genderSql.targetExpr) {
    scoreParts.push(Prisma.sql`CASE WHEN ${genderSql.targetExpr} THEN 20 ELSE 0 END`);
  }

  if (intent.warnaFilter) {
    scoreParts.push(
      Prisma.sql`
      CASE
        WHEN ${VARIANT_COLOR_FIELD} LIKE ${`%${intent.warnaFilter}%`} THEN 10
        WHEN LOWER(p.nama) LIKE ${`%${intent.warnaFilter}%`} THEN 8
        WHEN LOWER(COALESCE(p.keywords, '')) LIKE ${`%${intent.warnaFilter}%`} THEN 7
        ELSE 0
      END
    `,
    );
  }

  if (intent.ukuranFilter) {
    scoreParts.push(
      Prisma.sql`CASE WHEN ${VARIANT_SIZE_FIELD} LIKE ${`%${intent.ukuranFilter}%`} THEN 8 ELSE 0 END`,
    );
  }

  const scoreExpr = Prisma.sql`GREATEST(0, ${Prisma.join(scoreParts, ' + ')})`;

  return prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      p.id,
      p."kodeUnik",
      p.nama,
      p."hargaDasar",
      p."fotoUtama",
      p."categoryId",
      MAX(${scoreExpr}) AS score
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    LEFT JOIN "ProductVariant" v ON v."productId" = p.id
    WHERE ${Prisma.join(filters, ' AND ')}
    GROUP BY p.id, p."kodeUnik", p.nama, p."hargaDasar", p."fotoUtama", p."categoryId"
    ORDER BY score DESC, p.nama ASC
    LIMIT ${limit}
  `);
}

function dedupeProducts(products: any[]) {
  const uniqueMap = new Map<string, any>();

  for (const product of products) {
    if (!uniqueMap.has(product.id)) {
      uniqueMap.set(product.id, product);
      continue;
    }

    const existing = uniqueMap.get(product.id);
    if ((product.score ?? 0) > (existing.score ?? 0)) {
      uniqueMap.set(product.id, product);
    }
  }

  return Array.from(uniqueMap.values()).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export async function getSearchResults(keyword: string) {
  if (!keyword || keyword.trim() === '') return [];

  const intent = parseSearchIntent(keyword);

  const hasAnyIntent =
    intent.textTokens.length > 0 ||
    !!intent.warnaFilter ||
    !!intent.ukuranFilter ||
    !!intent.genderIntent ||
    !!intent.rootIntent;

  if (!hasAnyIntent) {
    return [];
  }

  const minTextMatches = getMinimumTextMatches(intent.textTokens);

  let finalProducts = await runMainSearch(intent, minTextMatches, 20);

  if (finalProducts.length === 0 && intent.textTokens.length >= 3) {
    finalProducts = await runMainSearch(intent, 1, 20);
  }

  const isHighlyStructuredQuery =
    !!intent.genderIntent ||
    !!intent.rootIntent ||
    !!intent.warnaFilter ||
    !!intent.ukuranFilter;

  if (finalProducts.length < 20 && !isHighlyStructuredQuery) {
    const fuzzyProducts = await runFuzzySearch(intent, 10);
    finalProducts = dedupeProducts([...finalProducts, ...fuzzyProducts]);
  } else {
    finalProducts = dedupeProducts(finalProducts);
  }

  const productIds = finalProducts.map((product: any) => product.id);

  if (productIds.length === 0) {
    return [];
  }

  const variants = await prisma.productVariant.findMany({
    where: { productId: { in: productIds } },
  });

  return finalProducts.map((product: any) => ({
    ...product,
    varian: variants.filter((variant: any) => variant.productId === product.id),
  }));
}

export async function getSearchSuggestions(keyword: string) {
  if (!keyword || keyword.trim() === '') return [];

  const intent = parseSearchIntent(keyword);
  const genderSql = buildGenderSql(intent.genderIntent);
  const rootFamilyExpr = buildRootFamilySql(intent.rootIntent);
  const colorIntentExpr = buildColorIntentSql(intent.warnaFilter);
  const sizeFilterExpr = buildSizeFilterSql(intent.ukuranFilter);
  const textMatchCountExpr = buildTextMatchCountSql(intent.textTokens);
  const textScoreExpr = buildTextScoreSql(intent.textTokens);

  const filters: Prisma.Sql[] = [];

  if (intent.textTokens.length > 0) {
    filters.push(Prisma.sql`${textMatchCountExpr} >= 1`);
  } else if (intent.normalizedKeyword) {
    filters.push(
      Prisma.sql`(
        LOWER(p.nama) LIKE ${`%${intent.normalizedKeyword}%`}
        OR LOWER(COALESCE(p.keywords, '')) LIKE ${`%${intent.normalizedKeyword}%`}
        OR LOWER(c.nama) LIKE ${`%${intent.normalizedKeyword}%`}
      )`,
    );
  }

  if (rootFamilyExpr) {
    filters.push(rootFamilyExpr);
  }

  if (genderSql.guardExpr) {
    filters.push(genderSql.guardExpr);
  }

  if (colorIntentExpr) {
    filters.push(colorIntentExpr);
  }

  if (sizeFilterExpr) {
    filters.push(sizeFilterExpr);
  }

  if (filters.length === 0) {
    return [];
  }

  const scoreParts: Prisma.Sql[] = [Prisma.sql`0`];

  if (intent.normalizedKeyword) {
    scoreParts.push(
      Prisma.sql`CASE WHEN LOWER(p.nama) LIKE ${intent.normalizedKeyword + '%'} THEN 60 ELSE 0 END`,
      Prisma.sql`CASE WHEN LOWER(p.nama) LIKE ${`%${intent.normalizedKeyword}%`} THEN 20 ELSE 0 END`,
    );
  }

  if (intent.textTokens.length > 0) {
    scoreParts.push(textScoreExpr);
    scoreParts.push(Prisma.sql`(${textMatchCountExpr}) * 10`);
  }

  if (genderSql.targetExpr) {
    scoreParts.push(Prisma.sql`CASE WHEN ${genderSql.targetExpr} THEN 20 ELSE 0 END`);
  }

  const scoreExpr = Prisma.sql`GREATEST(0, ${Prisma.join(scoreParts, ' + ')})`;

  const suggestions = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      p.id,
      p.nama,
      MAX(${scoreExpr}) AS score
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    LEFT JOIN "ProductVariant" v ON v."productId" = p.id
    WHERE ${Prisma.join(filters, ' AND ')}
    GROUP BY p.id, p.nama
    ORDER BY score DESC, p.nama ASC
    LIMIT 5
  `);

  return suggestions.map(({ id, nama }: { id: string; nama: string }) => ({ id, nama }));
}
