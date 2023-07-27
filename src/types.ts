export interface Book {
    id: number;
    title: string;
    author: string;
    publicationYear: number;
  }
  
  export interface BookInput {
    title: string;
    author: string;
    publicationYear: number;
  }
  
  export interface ErrorResponse {
    error: string;
  }
  
  export interface PaginationOptions {
    page: number;
    limit: number;
  }
  
  export interface SortingOptions {
    sortBy: "id" | "title" | "author" | "publicationYear"; 
    sortOrder: "asc" | "desc";
  }
  
  