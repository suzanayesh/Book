import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs-extra";
import { Book, BookInput, ErrorResponse, PaginationOptions, SortingOptions } from "./types";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const dataFilePath = "./src/data.json";

const readData = async (): Promise<Book[]> => {
  const rawData = await fs.readFile(dataFilePath, "utf-8");
  return JSON.parse(rawData);
};

const writeData = async (data: Book[]): Promise<void> => {
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
};

const getPaginationAndSortingOptions = (req: Request): { pagination: PaginationOptions; sorting: SortingOptions } => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = req.query.sortBy as keyof Book || "id"; 
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
  
    return {
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    };
  };
  


app.get("/books", async (req: Request, res: Response) => {
    try {
      const { pagination, sorting } = getPaginationAndSortingOptions(req);
      const skip = (pagination.page - 1) * pagination.limit;
  
      const data = await readData();
      const totalItems = data.length;
  
      const sortedData = data.sort((a, b) =>
        sorting.sortOrder === "asc" ? a[sorting.sortBy].toString().localeCompare(b[sorting.sortBy].toString()) : b[sorting.sortBy].toString().localeCompare(a[sorting.sortBy].toString())
      );
  
      const paginatedData = sortedData.slice(skip, skip + pagination.limit);
  
      res.json({
        data: paginatedData,
        pagination: {
          ...pagination,
          totalItems,
          totalPages: Math.ceil(totalItems / pagination.limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

app.get("/books/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await readData();
    const book = data.find((item) => item.id === parseInt(id));
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.delete("/books/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await readData();
      const filteredData = data.filter((item) => item.id !== parseInt(id));
  
      if (data.length === filteredData.length) {
        res.status(404).json({ error: "Book not found" });
      } else {
        await writeData(filteredData);
        res.json({ message: "Book is deleted" });
      }
    } catch (error) {
      res.status(500).json({ error: "server error" });
    }
  });

app.post("/books", async (req: Request, res: Response) => {
  try {
    const bookInput: BookInput = req.body;
    if (!bookInput.title || !bookInput.author || !bookInput.publicationYear) {
      res.status(400).json({ error: "Title, author, and publicationYear are required" });
    } else {
      const data = await readData();
      const newBook: Book = {
        id: data.length + 1,
        ...bookInput,
      };
      data.push(newBook);
      await writeData(data);
      res.status(201).json(newBook);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/books/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookInput: BookInput = req.body;
    const data = await readData();
    const bookIndex = data.findIndex((item) => item.id === parseInt(id));

    if (bookIndex !== -1) {
      const updatedBook: Book = { id: parseInt(id), ...bookInput };
      data[bookIndex] = updatedBook;
      await writeData(data);
      res.json(updatedBook);
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});





app.get("/books/query/year", async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const data = await readData();
    const filteredBooks = data.filter((book) => book.publicationYear === parseInt(year as string));
    res.json(filteredBooks);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/books/query/name", async (req: Request, res: Response) => {
    try {
      const { name } = req.query;
      const data = await readData();
      const filteredBooks = data.filter((book) => book.title.toLowerCase().includes((name as string).toLowerCase()));
      res.json(filteredBooks);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
