import { db } from "@/db/index.js";
import { count } from "drizzle-orm";
import { SQLiteSelect } from "drizzle-orm/sqlite-core";
import z from "zod";

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 25;
const MIN_PAGE_LIMIT = 1;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().min(1).catch(1),
  perPage: z.coerce
    .number()
    .int()
    .positive()
    .min(MIN_PAGE_LIMIT)
    .max(MAX_PAGE_LIMIT)
    .catch(DEFAULT_PAGE_LIMIT),
  // orderBy: z.enum(ORDER).catch(ORDER.new),
});
type PaginationInput = z.input<typeof paginationQuerySchema>;

export const paginate = async <T extends SQLiteSelect>(
  selection: T,
  query: Partial<PaginationInput>,
): Promise<PaginationResponse<T>> => {
  const { page, perPage } = paginationQuerySchema.parse(query);
  const countSelection = selection.as("count_selection");
  const [row] = await db.select({ count: count() }).from(countSelection);
  const total = row?.count ?? 0;
  const totalPages = Math.ceil(total / perPage);
  const data = await selection.limit(perPage).offset((page - 1) * perPage);
  return {
    page,
    perPage,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    data,
  };
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
