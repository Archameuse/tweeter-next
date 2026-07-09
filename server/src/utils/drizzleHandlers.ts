import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { and, count, gt, gte, lt, lte, or, sql, SQL } from "drizzle-orm";
import { SQLiteColumn, SQLiteSelect } from "drizzle-orm/sqlite-core";
import z from "zod";

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 25;
const MIN_PAGE_LIMIT = 1;

export const paginationQuerySchema = z.object({
  perPage: z.coerce
    .number()
    .int()
    .positive()
    .min(MIN_PAGE_LIMIT)
    .max(MAX_PAGE_LIMIT)
    .catch(DEFAULT_PAGE_LIMIT),
  cursor: z
    .preprocess(
      (val) => {
        if (typeof val === "string") {
          const [sortVal, id] = val.split("|").map(Number);
          return { sortVal, id };
        }
        return val;
      },
      z
        .object({
          sortVal: z.number().int(),
          id: z.number().int(),
        })
        .nullish()
        .catch(null),
    )
    .nullish()
    .catch(null),
  isAsc: z.coerce.boolean().nullish(),
  sortColName: z.string(),
  idColName: z.string(),
  // orderBy: z.enum(ORDER).catch(ORDER.new),
});
type PaginationInput = z.input<typeof paginationQuerySchema>;

/**
 *
 * IsAsc false = desc
 */
export const paginate = async <T extends SQLiteSelect>(
  selection: T,
  query: Partial<PaginationInput>,
): Promise<PaginationResponse<T>> => {
  const { perPage, cursor, isAsc, sortColName, idColName } =
    paginationQuerySchema.parse(query);
  let selectionSQ = selection.as("pagination_sq");
  let paginated = db.select().from(selectionSQ).$dynamic();
  if (cursor) {
    const sortCol = sql.identifier(sortColName);
    const idCol = sql.identifier(idColName);
    if (isAsc) {
      paginated = paginated.where(
        or(
          gt(sortCol, cursor.sortVal),
          and(gte(sortCol, cursor.sortVal), gt(idCol, cursor.id)),
        ),
      );
    } else {
      paginated = paginated.where(
        or(
          lt(sortCol, cursor.sortVal),
          and(lte(sortCol, cursor.sortVal), lt(idCol, cursor.id)),
        ),
      );
    }
  }

  let nextCursor: string | null = null;
  const data = await paginated.limit(perPage + 1);
  if (data.length === perPage + 1) {
    const last =
      data.length >= 2 ? data[data.length - 2] : data[data.length - 1];
    if (last) {
      if (last.hasOwnProperty(sortColName) && last.hasOwnProperty(idColName)) {
        const sortVal = last[sortColName];
        const idVal = last[idColName];
        nextCursor = `${sortVal}|${idVal}`;
      }
    }
  }
  return {
    perPage,
    nextCursor,
    hasNextPage: !!nextCursor,
    data: data.slice(0, perPage) as Awaited<T>,
  };
  // if ()
  // const countSelection = selection.as("count_selection");
  // const [row] = await db.select({ count: count() }).from(countSelection);
  // const total = row?.count ?? 0;
  // const totalPages = Math.ceil(total / perPage);
  // const data = await selection.limit(perPage).offset((page - 1) * perPage);
  // return {
  //   perPage,
  //   total,
  //   totalPages,
  //   hasNextPage: page < totalPages,
  //   data,
  // };
};

// const pagination = <T extends SQLiteSelect>(
//   db: T,
//   query: Partial<PaginationInput> = {},
// ) => {
//   const { page, perPage, orderBy } = paginationQuerySchema.parse(query);
//   return db
//     .orderBy(
//       orderBy === ORDER.top
//         ? desc(sql`likes_count`)
//         : orderBy === ORDER.old
//           ? asc(tweets.created_at)
//           : desc(tweets.created_at),
//     )
//     .limit(perPage)
//     .offset((page - 1) * perPage);
// };
