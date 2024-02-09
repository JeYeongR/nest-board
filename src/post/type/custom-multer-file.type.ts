export interface CustomMulterFile extends Express.Multer.File {
  key: string;
  location: string;
}
