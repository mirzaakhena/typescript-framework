import { ActionHandler } from "../../core/type.js";
import { Payload } from "../model/model.js";

type GetAllBooksRequest = {
  /**
   * @RestApi {"type": "query"}
   */
  limit?: number;

  /**
   * @RestApi {"type": "query"}
   */
  offset?: number;

  // @hehe
  joni: string;

  /**
   * @RestApi {"type": "query"}
   */
  author?: string;

  /**
   * @RestApi {"type": "query"}
   */
  sort?: "asc" | "desc";
};

type GetAllBooksResponse = {};

export type GetAllBooks = ActionHandler<GetAllBooksRequest, GetAllBooksResponse>;

/**
 * @Action_
 * @Controller_ { "method": "get", "path": "/books", "tag": "book" }
 */
export function ImplGetAllBooks(): GetAllBooks {
  return async (ctx, req) => {
    return {};
  };
}

// export type Payload = {
//   title: string;
//   author: string;
//   publishedDate: Date;
// };

type CreateNewBookRequest = {
  /**
   * @RestApi {"type": "body"}
   */
  payload: Payload;

  /**
   * @RestApi {"type": "body"}
   */
  joni: string;

  /**
   * @RestApi {"type": "query"}
   */
  author?: string;

  /**
   * @RestApi {"type": "query"}
   */
  id: string;
};

type CreateNewBookResponse = {};

export type CreateNewBook = ActionHandler<CreateNewBookRequest, CreateNewBookResponse>;

/**
 * @Action_
 * @Controller_ { "method": "post", "path": "/books", "tag": "book" }
 */
export function ImplCreateNewBook(): CreateNewBook {
  return async (ctx, req) => {
    return {};
  };
}

type GetOneBookByIDRequest = {
  /**
   * @RestApi { "type": "param" }
   */
  id: string;
};

type GetOneBookByIDResponse = {};

export type GetOneBookByID = ActionHandler<GetOneBookByIDRequest, GetOneBookByIDResponse>;

/**
 * @Action_
 * @Controller_ { "method": "get", "path": "/books/:id", "tag": "book" }
 */
export function ImplGetOneBookByID(): GetOneBookByID {
  return async (ctx, req) => {
    return {};
  };
}

type UpdateBookByIDRequest = {
  /**
   * id of the updated book
   * @RestApi { "type": "param" }
   * @default S1234567890
   */
  id: string;
};

type UpdateBookByIDResponse = {};

export type UpdateBookByID = ActionHandler<UpdateBookByIDRequest, UpdateBookByIDResponse>;

/**
 * @Action_
 * @Controller_ { "method": "put", "path": "/books/:id", "tag": "book" }
 */
export function ImplUpdateBookByID(): UpdateBookByID {
  return async (ctx, req) => {
    return {};
  };
}

type DeleteBookByIDRequest = {
  /**
   * @RestApi { "type": "param" }
   */
  id: string;
};

type DeleteBookByIDResponse = {};

export type DeleteBookByID = ActionHandler<DeleteBookByIDRequest, DeleteBookByIDResponse>;

/**
 * @Action_
 * @Controller_ { "method": "delete", "path": "/books/:id", "tag": "book" }
 */
export function ImplDeleteBookByID(): DeleteBookByID {
  return async (ctx, req) => {
    return {};
  };
}
